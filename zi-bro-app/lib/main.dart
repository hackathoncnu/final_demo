import 'package:flutter/material.dart';
import 'package:flutter_background_service/flutter_background_service.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:geolocator/geolocator.dart';
import 'package:url_launcher/url_launcher.dart';
import 'services/location_service.dart';
import 'data/sectors.dart';

final FlutterLocalNotificationsPlugin flutterLocalNotificationsPlugin =
    FlutterLocalNotificationsPlugin();

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  try {
    await LocationService.initService();
  } catch (e) {}
  runApp(const ZiBroApp());
}

class ZiBroApp extends StatelessWidget {
  const ZiBroApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: '집으로 (zi-bro)',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.orange),
        useMaterial3: true,
      ),
      home: const HomePage(),
    );
  }
}

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  bool _isTracking = false;
  String _status = 'GPS 모니터링 대기 중';
  String _location = '';

  @override
  void initState() {
    super.initState();

    flutterLocalNotificationsPlugin.initialize(
      const InitializationSettings(
        android: AndroidInitializationSettings('@mipmap/ic_launcher'),
      ),
      onDidReceiveNotificationResponse: (response) {
        _openFlyerUrl(response.payload);
      },
    );

    // 앱이 알림으로 열렸을 때 처리
    flutterLocalNotificationsPlugin.getNotificationAppLaunchDetails().then((
      details,
    ) {
      if (details != null &&
          details.didNotificationLaunchApp &&
          details.notificationResponse != null) {
        _openFlyerUrl(details.notificationResponse!.payload);
      }
    });

    FlutterBackgroundService().on('update').listen((data) {
      if (data != null && mounted) {
        setState(() {
          double lat = data['lat'];
          double lng = data['lng'];
          String sector = data['sector'];
          int count = data['sector_count'] ?? 0;
          _location =
              '위치: ${lat.toStringAsFixed(4)}, ${lng.toStringAsFixed(4)}';
          _status = '📡 모니터링 중 — $sector\n수색 구역 $count개 감시 중';
        });
      }
    });
  }

  void _openFlyerUrl(String? url) async {
    if (url != null && url.isNotEmpty) {
      final uri = Uri.parse(url);
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      }
    }
  }

  Future<void> _startTracking() async {
    setState(() {
      _status = '권한 요청 중...';
    });

    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        setState(() {
          _status = '❌ GPS를 켜주세요';
        });
        return;
      }

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.denied ||
          permission == LocationPermission.deniedForever) {
        setState(() {
          _status = '❌ 권한 거부됨';
        });
        return;
      }

      setState(() {
        _isTracking = true;
        _status = '📡 서비스 시작 중...';
      });

      await LocationService.startTracking();

      setState(() {
        _status = '📡 모니터링 활성화됨!';
      });
    } catch (e) {
      setState(() {
        _status = '에러: $e';
      });
    }
  }

  Future<void> _stopTracking() async {
    await LocationService.stopTracking();
    setState(() {
      _isTracking = false;
      _status = 'GPS 모니터링 중지됨';
      _location = '';
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(32.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Text(
                '집으로',
                style: TextStyle(
                  fontSize: 36,
                  fontWeight: FontWeight.bold,
                  color: Colors.orange,
                ),
              ),
              const Text(
                'zi-bro',
                style: TextStyle(fontSize: 18, color: Colors.grey),
              ),
              const SizedBox(height: 48),
              Icon(
                _isTracking ? Icons.location_on : Icons.location_off,
                size: 80,
                color: _isTracking ? Colors.orange : Colors.grey,
              ),
              const SizedBox(height: 24),
              Text(
                _status,
                style: const TextStyle(fontSize: 16),
                textAlign: TextAlign.center,
              ),
              if (_location.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: Text(
                    _location,
                    style: const TextStyle(fontSize: 13, color: Colors.grey),
                  ),
                ),
              const SizedBox(height: 48),
              SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton(
                  onPressed: _isTracking ? _stopTracking : _startTracking,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: _isTracking ? Colors.grey : Colors.orange,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                  child: Text(
                    _isTracking ? '모니터링 중지' : '모니터링 시작',
                    style: const TextStyle(fontSize: 18),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
