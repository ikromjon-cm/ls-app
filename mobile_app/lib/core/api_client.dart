import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'constants.dart';

class ApiClient {
  static final ApiClient _instance = ApiClient._internal();
  factory ApiClient() => _instance;
  ApiClient._internal();

  late Dio _dio;
  final _storage = FlutterSecureStorage();
  String? _token;

  Future<void> init() async {
    _token = await _storage.read(key: 'auth_token');
    _dio = Dio(BaseOptions(
      baseUrl: AppConfig.baseUrl,
      headers: {'Content-Type': 'application/json'},
      connectTimeout: Duration(seconds: 10),
      receiveTimeout: Duration(seconds: 10),
    ));

    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) {
        if (_token != null) options.headers['Authorization'] = 'Bearer $_token';
        handler.next(options);
      },
      onError: (error, handler) async {
        if (error.response?.statusCode == 401) {
          final rt = await _storage.read(key: 'refresh_token');
          if (rt != null) {
            try {
              final res = await Dio().post('${AppConfig.baseUrl}/auth/refresh',
                data: {'refreshToken': rt});
              if (res.statusCode == 200) {
                _token = res.data['token'];
                await _storage.write(key: 'auth_token', value: _token);
                error.requestOptions.headers['Authorization'] = 'Bearer $_token';
                final retry = await _dio.fetch(error.requestOptions);
                return handler.resolve(retry);
              }
            } catch (_) {}
          }
          await _storage.deleteAll();
        }
        handler.next(error);
      },
    ));
  }

  Future<void> setTokens(String token, String refreshToken) async {
    _token = token;
    await _storage.write(key: 'auth_token', value: token);
    await _storage.write(key: 'refresh_token', value: refreshToken);
  }

  Future<void> clearTokens() async {
    _token = null;
    await _storage.deleteAll();
  }

  Future<Map<String, dynamic>> login(String login, String password) async {
    final res = await _dio.post('/auth/login', data: {'login': login, 'password': password});
    return res.data;
  }

  Future<Map<String, dynamic>> parentLogin(String phone, String password) async {
    final res = await _dio.post('/auth/login', data: {'login': phone, 'password': password});
    return res.data;
  }

  Future<dynamic> get(String path, {Map<String, dynamic>? params}) async {
    final res = await _dio.get(path, queryParameters: params);
    return res.data;
  }

  Future<dynamic> post(String path, {Map<String, dynamic>? data}) async {
    final res = await _dio.post(path, data: data);
    return res.data;
  }
}
