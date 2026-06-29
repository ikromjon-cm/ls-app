import 'package:flutter/foundation.dart';
import 'api_client.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class AuthProvider extends ChangeNotifier {
  final _api = ApiClient();
  final _storage = FlutterSecureStorage();

  bool _loading = true;
  bool get loading => _loading;

  Map<String, dynamic>? _user;
  Map<String, dynamic>? get user => _user;

  String? _error;
  String? get error => _error;

  bool get isLoggedIn => _user != null;
  bool get isParent => _user?['role'] == 'parent';
  bool get isStudent => _user?['role'] == 'student';

  Future<void> init() async {
    _loading = true;
    notifyListeners();
    await _api.init();
    final token = await _storage.read(key: 'auth_token');
    if (token != null) {
      try {
        final data = await _api.post('/auth/refresh', data: {'refreshToken': await _storage.read(key: 'refresh_token')});
        _user = data['user'];
        await _api.setTokens(data['token'], data['refreshToken']);
      } catch (_) {
        await _api.clearTokens();
      }
    }
    _loading = false;
    notifyListeners();
  }

  Future<bool> login(String login, String password) async {
    _loading = true;
    _error = null;
    notifyListeners();
    try {
      final data = await _api.login(login, password);
      _user = data['user'];
      await _api.setTokens(data['token'], data['refreshToken']);
      _loading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      _loading = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    await _api.clearTokens();
    _user = null;
    notifyListeners();
  }
}
