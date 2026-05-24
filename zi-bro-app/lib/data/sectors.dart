// 실종자 섹터 데이터
class Sector {
  final String id;
  final String name;
  final double lat;
  final double lng;
  final double radiusM;
  final String flyerUrl;
  final String? dynamicUrl;

  Sector({
    required this.id,
    required this.name,
    required this.lat,
    required this.lng,
    required this.radiusM,
    required this.flyerUrl,
    this.dynamicUrl,
  });

  factory Sector.fromJson(Map<String, dynamic> json) {
    return Sector(
      id: json['id'] as String,
      name: json['name'] as String,
      lat: (json['lat'] as num).toDouble(),
      lng: (json['lng'] as num).toDouble(),
      radiusM: (json['radius_m'] as num).toDouble(),
      flyerUrl: json['flyer_url'] as String,
      dynamicUrl: json['dynamic_url'] as String?,
    );
  }
}

// API 응답 없을 때 사용하는 폴백 데이터 (데모용)
final List<Sector> hardcodedSectors = [
  Sector(
    id: 'cnu_eng5',
    name: '충남대 공대 5호관',
    lat: 36.366492,
    lng: 127.344525,
    radiusM: 500,
    flyerUrl: 'http://172.20.10.3:5173/',
  ),
];

// 하위 호환용 별칭
final List<Sector> sectorList = hardcodedSectors;
