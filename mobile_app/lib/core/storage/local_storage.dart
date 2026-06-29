import 'dart:convert';
import 'package:hive_flutter/hive_flutter.dart';

class LocalStorage {
  static const String _boxName = 'opencode_cache';
  static late Box _box;

  static Future<void> init() async {
    await Hive.initFlutter();
    _box = await Hive.openBox(_boxName);
  }

  // Generic cache helpers
  static Future<void> cacheData(String key, dynamic data) async {
    await _box.put(key, jsonEncode(data));
  }

  static T? getCachedData<T>(String key, T Function(Map<String, dynamic>) fromJson) {
    final raw = _box.get(key);
    if (raw == null) return null;
    try {
      final decoded = jsonDecode(raw as String);
      if (decoded is List) {
        return decoded.map((e) => fromJson(e as Map<String, dynamic>)).toList() as T;
      }
      return fromJson(decoded as Map<String, dynamic>);
    } catch {
      return null;
    }
  }

  static Future<void> clear() async => _box.clear();

  static Future<void> remove(String key) async => _box.delete(key);

  // Auth
  static Future<void> saveAuth(Map<String, dynamic> data) async {
    await _box.put('auth_user', jsonEncode(data['user']));
    await _box.put('auth_token', data['token']);
    await _box.put('auth_org', jsonEncode(data['organization']));
  }

  static Map<String, dynamic>? getCachedUser() {
    final raw = _box.get('auth_user');
    if (raw == null) return null;
    return jsonDecode(raw as String) as Map<String, dynamic>;
  }

  static String? getCachedToken() => _box.get('auth_token');

  static Future<void> clearAuth() async {
    await _box.delete('auth_user');
    await _box.delete('auth_token');
    await _box.delete('auth_org');
  }

  // Dashboard
  static Future<void> cacheDashboard(Map<String, dynamic> data) =>
      cacheData('dashboard', data);

  static Map<String, dynamic>? getCachedDashboard() {
    final raw = _box.get('dashboard');
    if (raw == null) return null;
    return jsonDecode(raw as String) as Map<String, dynamic>;
  }
}
