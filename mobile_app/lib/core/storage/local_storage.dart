import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class LocalStorage {
  static const _secure = FlutterSecureStorage();
  static final Map<String, String> _memoryCache = {};
  static bool _initialized = false;

  static Future<void> init() async {
    if (_initialized) return;
    // Preload secure storage into memory for sync access
    for (final key in ['auth_user', 'auth_token', 'auth_org']) {
      final val = await _secure.read(key: key);
      if (val != null) _memoryCache[key] = val;
    }
    _initialized = true;
  }

  static Future<void> cacheData(String key, dynamic data) async {
    _memoryCache[key] = jsonEncode(data);
  }

  static T? getCachedData<T>(String key, T Function(Map<String, dynamic>) fromJson) {
    final raw = _memoryCache[key];
    if (raw == null) return null;
    try {
      final decoded = jsonDecode(raw);
      if (decoded is List) {
        return decoded.map((e) => fromJson(e as Map<String, dynamic>)).toList() as T;
      }
      return fromJson(decoded as Map<String, dynamic>);
    } catch (_) {
      return null;
    }
  }

  static Future<void> clear() async {
    _memoryCache.clear();
    await _secure.deleteAll();
  }

  static Future<void> remove(String key) async {
    _memoryCache.remove(key);
  }

  static Future<void> saveAuth(Map<String, dynamic> data) async {
    if (data['user'] != null) {
      final val = jsonEncode(data['user']);
      _memoryCache['auth_user'] = val;
      await _secure.write(key: 'auth_user', value: val);
    }
    if (data['token'] != null) {
      _memoryCache['auth_token'] = data['token'];
      await _secure.write(key: 'auth_token', value: data['token']);
    }
    if (data['organization'] != null) {
      final val = jsonEncode(data['organization']);
      _memoryCache['auth_org'] = val;
      await _secure.write(key: 'auth_org', value: val);
    }
  }

  static Map<String, dynamic>? getCachedUser() {
    final raw = _memoryCache['auth_user'];
    if (raw == null) return null;
    return jsonDecode(raw) as Map<String, dynamic>;
  }

  static String? getCachedToken() {
    return _memoryCache['auth_token'];
  }

  static Future<void> clearAuth() async {
    _memoryCache.remove('auth_user');
    _memoryCache.remove('auth_token');
    _memoryCache.remove('auth_org');
    await _secure.delete(key: 'auth_user');
    await _secure.delete(key: 'auth_token');
    await _secure.delete(key: 'auth_org');
  }

  static Future<void> cacheDashboard(Map<String, dynamic> data) async {
    await cacheData('dashboard', data);
  }

  static Map<String, dynamic>? getCachedDashboard() {
    return getCachedData<Map<String, dynamic>>('dashboard', (json) => json);
  }
}
