import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final apiClientProvider = Provider<ApiClient>((ref) => ApiClient());

class ApiClient {
  late final Dio _dio;
  final _storage = const FlutterSecureStorage();

  static const String _baseUrl = 'https://ls-app-m856.onrender.com/api';

  ApiClient() {
    _dio = Dio(BaseOptions(
      baseUrl: _baseUrl,
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 10),
      headers: {'Content-Type': 'application/json', 'Accept': 'application/json'},
    ));

    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await _storage.read(key: 'access_token');
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        handler.next(options);
      },
      onError: (error, handler) async {
        if (error.response?.statusCode == 401) {
          final refreshed = await _refreshToken();
          if (refreshed) {
            final retryResponse = await _dio.fetch(error.requestOptions);
            return handler.resolve(retryResponse);
          }
        }
        handler.next(error);
      },
    ));
  }

  Future<String?> getToken() => _storage.read(key: 'access_token');

  Future<bool> _refreshToken() async {
    try {
      final refreshToken = await _storage.read(key: 'refresh_token');
      if (refreshToken == null) return false;
      final response = await Dio(BaseOptions(baseUrl: _baseUrl)).post('/auth/refresh', data: {'refreshToken': refreshToken});
      await _storage.write(key: 'access_token', value: response.data['data']['token']);
      await _storage.write(key: 'refresh_token', value: response.data['data']['refreshToken']);
      return true;
    } catch {
      await _storage.deleteAll();
      return false;
    }
  }

  Future<Map<String, dynamic>> get(String path, {Map<String, dynamic>? params}) async {
    final response = await _dio.get(path, queryParameters: params);
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> post(String path, {Map<String, dynamic>? data}) async {
    final response = await _dio.post(path, data: data);
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> put(String path, {Map<String, dynamic>? data}) async {
    final response = await _dio.put(path, data: data);
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> delete(String path) async {
    final response = await _dio.delete(path);
    return response.data as Map<String, dynamic>;
  }

  // Convenience methods
  Future<Map<String, dynamic>> login(String login, String password) =>
      post('/auth/login', data: {'login': login, 'password': password});

  Future<Map<String, dynamic>> sendOtp(String phone) =>
      post('/auth/send-otp', data: {'phone': phone});

  Future<Map<String, dynamic>> verifyOtp(String phone, String code) =>
      post('/auth/verify-otp', data: {'phone': phone, 'code': code});

  Future<Map<String, dynamic>> getDashboard() => get('/dashboard');

  Future<Map<String, dynamic>> getStudents({String? search}) =>
      get('/students', params: search != null ? {'search': search} : null);

  Future<Map<String, dynamic>> getGroups() => get('/groups');

  Future<Map<String, dynamic>> getPayments() => get('/payments');

  Future<Map<String, dynamic>> getAttendance({String? date}) =>
      get('/attendance', params: date != null ? {'date': date} : null);

  Future<Map<String, dynamic>> getMessages({String? otherId}) =>
      get('/messages', params: otherId != null ? {'otherId': otherId} : null);

  Future<Map<String, dynamic>> sendMessage(String content, String receiverId, {String? studentId}) =>
      post('/messages', data: {'content': content, 'receiverId': receiverId, 'studentId': studentId});

  Future<Map<String, dynamic>> getNotifications() => get('/notifications');
}
