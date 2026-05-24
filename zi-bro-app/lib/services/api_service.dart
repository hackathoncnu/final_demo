import 'dart:convert';
import 'package:http/http.dart' as http;
import '../data/sectors.dart';

// 백엔드 공개 URL — VS Code 포트 포워딩 URL로 교체하세요
// 예: 'https://xxxxxxxx-8080.app.github.dev'
const String kBackendUrl = 'http://192.168.0.27:8080';

class ApiService {
  static Future<List<Sector>> fetchSectors() async {
    try {
      final res = await http
          .get(Uri.parse('$kBackendUrl/missing/sectors'))
          .timeout(const Duration(seconds: 10));
      if (res.statusCode == 200) {
        final List<dynamic> data = jsonDecode(res.body);
        if (data.isEmpty) return hardcodedSectors;
        return data
            .map((json) => Sector(
                  id: json['id'] as String,
                  name: json['name'] as String,
                  lat: (json['lat'] as num).toDouble(),
                  lng: (json['lng'] as num).toDouble(),
                  radiusM: (json['radius_m'] as num).toDouble(),
                  flyerUrl: json['flyer_url'] as String,
                ))
            .toList();
      }
    } catch (_) {}
    // API 실패 시 하드코딩 데이터로 폴백
    return hardcodedSectors;
  }
}
