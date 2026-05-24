import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:url_launcher/url_launcher.dart';
import '../data/sectors.dart';

class NotificationService {
  final FlutterLocalNotificationsPlugin _notifications =
      FlutterLocalNotificationsPlugin();

  String? _pendingUrl;

  // 알림 초기화
  Future<void> init() async {
    const androidSettings = AndroidInitializationSettings(
      '@mipmap/ic_launcher',
    );
    const iosSettings = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );
    const settings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    await _notifications.initialize(
      settings,
      onDidReceiveNotificationResponse: (response) {
        _openUrl(_pendingUrl);
      },
    );
  }

  // 실종자 알림 띄우기
  Future<void> showAlert(Sector sector) async {
    _pendingUrl = sector.flyerUrl;

    const androidDetails = AndroidNotificationDetails(
      'zi_bro_alert',
      '실종자 알림',
      channelDescription: '주변 실종자 알림',
      importance: Importance.high,
      priority: Priority.high,
    );
    const iosDetails = DarwinNotificationDetails();
    const details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    await _notifications.show(
      0,
      '📢 주변에 실종자가 있습니다',
      '${sector.name} 지역 실종자 정보를 확인해주세요. 탭하여 전단지 보기',
      details,
    );
  }

  // URL 열기 (웹 전단지 페이지)
  Future<void> _openUrl(String? url) async {
    if (url == null) return;
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }
}
