import 'dart:async';
import 'dart:math';
import 'dart:ui';
import 'package:flutter_background_service/flutter_background_service.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:geolocator/geolocator.dart';
import 'package:url_launcher/url_launcher.dart';
import '../data/sectors.dart';
import 'api_service.dart';

String? _currentSectorId;
DateTime? _sectorEnteredAt;
const int triggerSeconds = 10;
bool _alreadyNotified = false;

@pragma('vm:entry-point')
void onStart(ServiceInstance service) async {
  DartPluginRegistrant.ensureInitialized();

  final noti = FlutterLocalNotificationsPlugin();
  await noti.initialize(
    const InitializationSettings(
      android: AndroidInitializationSettings('@mipmap/ic_launcher'),
    ),
  );

  await noti.show(
    99,
    '서비스 시작됨',
    '백그라운드 GPS 체크 시작합니다',
    const NotificationDetails(
      android: AndroidNotificationDetails(
        'zi_bro_alert',
        '실종자 알림',
        importance: Importance.high,
        priority: Priority.high,
      ),
    ),
  );

  // 백엔드에서 섹터 동적 로드 (실패 시 하드코딩 데이터 사용)
  List<Sector> sectors = await ApiService.fetchSectors();

  Timer.periodic(const Duration(seconds: 5), (timer) async {
    try {
      Position pos = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
        ),
      );

      Sector? matched;
      for (var sector in sectors) {
        double dist = calculateDistance(
          pos.latitude,
          pos.longitude,
          sector.lat,
          sector.lng,
        );
        if (dist <= sector.radiusM) {
          matched = sector;
          break;
        }
      }

      if (matched != null) {
        if (_currentSectorId != matched.id) {
          _currentSectorId = matched.id;
          _sectorEnteredAt = DateTime.now();
          _alreadyNotified = false;
        }
        if (_sectorEnteredAt != null) {
          int elapsed = DateTime.now().difference(_sectorEnteredAt!).inSeconds;
          if (elapsed >= triggerSeconds && !_alreadyNotified) {
            _alreadyNotified = true;
            await noti.show(
              1,
              '주변에 실종자가 있습니다',
              '${matched.name} 지역 실종자 정보를 확인해주세요',
              const NotificationDetails(
                android: AndroidNotificationDetails(
                  'zi_bro_alert',
                  '실종자 알림',
                  importance: Importance.high,
                  priority: Priority.high,
                  icon: '@mipmap/ic_warning',
                ),
              ),
              payload: matched.flyerUrl,
            );
            final url = matched.dynamicUrl ?? matched.flyerUrl;
            final uri = Uri.parse(url);
            if (await canLaunchUrl(uri)) {
              await launchUrl(uri, mode: LaunchMode.externalApplication);
            }
            _sectorEnteredAt = null;
            _currentSectorId = null;
            timer.cancel();
            return;
          }
        }
      } else {
        _currentSectorId = null;
        _sectorEnteredAt = null;
      }

      service.invoke('update', {
        'lat': pos.latitude,
        'lng': pos.longitude,
        'sector': matched?.name ?? '섹터 밖',
        'sector_count': sectors.length,
      });
    } catch (e) {
      // 무시
    }
  });

  service.on('stop').listen((event) {
    service.stopSelf();
  });
}

double calculateDistance(double lat1, double lng1, double lat2, double lng2) {
  const double earthRadius = 6371000;
  double dLat = (lat2 - lat1) * pi / 180;
  double dLng = (lng2 - lng1) * pi / 180;
  double a =
      sin(dLat / 2) * sin(dLat / 2) +
      cos(lat1 * pi / 180) *
          cos(lat2 * pi / 180) *
          sin(dLng / 2) *
          sin(dLng / 2);
  double c = 2 * atan2(sqrt(a), sqrt(1 - a));
  return earthRadius * c;
}

class LocationService {
  static Future<void> initService() async {
    final notiPlugin = FlutterLocalNotificationsPlugin();
    final AndroidFlutterLocalNotificationsPlugin? androidNoti = notiPlugin
        .resolvePlatformSpecificImplementation<
          AndroidFlutterLocalNotificationsPlugin
        >();
    if (androidNoti != null) {
      await androidNoti.requestNotificationsPermission();
      await androidNoti.createNotificationChannel(
        const AndroidNotificationChannel(
          'zi_bro_bg',
          '집으로 백그라운드',
          description: 'GPS 모니터링 서비스',
          importance: Importance.low,
        ),
      );
      await androidNoti.createNotificationChannel(
        const AndroidNotificationChannel(
          'zi_bro_alert',
          '실종자 알림',
          description: '주변 실종자 알림',
          importance: Importance.high,
        ),
      );
    }

    final service = FlutterBackgroundService();
    await service.configure(
      androidConfiguration: AndroidConfiguration(
        onStart: onStart,
        autoStart: false,
        isForegroundMode: true,
        notificationChannelId: 'zi_bro_bg',
        initialNotificationTitle: '집으로 (zi-bro)',
        initialNotificationContent: 'GPS 모니터링 중',
        foregroundServiceNotificationId: 888,
      ),
      iosConfiguration: IosConfiguration(
        autoStart: false,
        onForeground: onStart,
      ),
    );
  }

  static Future<bool> requestPermission() async {
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) return false;
    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) return false;
    }
    if (permission == LocationPermission.deniedForever) return false;
    return true;
  }

  static Future<void> startTracking() async {
    final service = FlutterBackgroundService();
    service.startService();
  }

  static Future<void> stopTracking() async {
    final service = FlutterBackgroundService();
    service.invoke('stop');
  }
}
