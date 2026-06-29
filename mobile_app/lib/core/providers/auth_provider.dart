import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../network/api_client.dart';
import '../storage/local_storage.dart';

enum AuthStatus { unknown, authenticated, unauthenticated }

class AuthState {
  final AuthStatus status;
  final Map<String, dynamic>? user;
  final Map<String, dynamic>? organization;
  final String? error;
  final bool loading;

  const AuthState({
    this.status = AuthStatus.unknown,
    this.user,
    this.organization,
    this.error,
    this.loading = false,
  });

  AuthState copyWith({
    AuthStatus? status,
    Map<String, dynamic>? user,
    Map<String, dynamic>? organization,
    String? error,
    bool? loading,
  }) => AuthState(
    status: status ?? this.status,
    user: user ?? this.user,
    organization: organization ?? this.organization,
    error: error,
    loading: loading ?? this.loading,
  );
}

class AuthNotifier extends StateNotifier<AuthState> {
  final ApiClient _api;

  AuthNotifier(this._api) : super(const AuthState()) {
    _checkAuth();
  }

  Future<void> _checkAuth() async {
    final token = LocalStorage.getCachedToken();
    if (token != null) {
      final user = LocalStorage.getCachedUser();
      state = AuthState(status: AuthStatus.authenticated, user: user);
    } else {
      state = const AuthState(status: AuthStatus.unauthenticated);
    }
  }

  Future<void> login(String login, String password) async {
    state = state.copyWith(loading: true, error: null);
    try {
      final response = await _api.login(login, password);
      if (response['success'] == true) {
        final data = response['data'] as Map<String, dynamic>;
        await LocalStorage.saveAuth(data);
        state = AuthState(
          status: AuthStatus.authenticated,
          user: data['user'] as Map<String, dynamic>?,
          organization: data['organization'] as Map<String, dynamic>?,
        );
      } else {
        state = state.copyWith(loading: false, error: response['message'] ?? 'Login xatosi', status: AuthStatus.unauthenticated);
      }
    } catch (e) {
      state = state.copyWith(loading: false, error: 'Tarmoq xatosi', status: AuthStatus.unauthenticated);
    }
  }

  Future<void> loginWithOtp(String phone) async {
    state = state.copyWith(loading: true, error: null);
    try {
      await _api.sendOtp(phone);
      state = state.copyWith(loading: false);
    } catch (e) {
      state = state.copyWith(loading: false, error: 'Kod yuborishda xatolik');
    }
  }

  Future<void> verifyOtp(String phone, String code) async {
    state = state.copyWith(loading: true, error: null);
    try {
      final response = await _api.verifyOtp(phone, code);
      if (response['success'] == true) {
        final data = response['data'] as Map<String, dynamic>;
        await LocalStorage.saveAuth(data);
        state = AuthState(
          status: AuthStatus.authenticated,
          user: data['user'] as Map<String, dynamic>?,
          organization: data['organization'] as Map<String, dynamic>?,
        );
      } else {
        state = state.copyWith(loading: false, error: 'Yaroqsiz kod');
      }
    } catch (e) {
      state = state.copyWith(loading: false, error: 'Tasdiqlash xatosi');
    }
  }

  Future<void> logout() async {
    await LocalStorage.clearAuth();
    state = const AuthState(status: AuthStatus.unauthenticated);
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(ref.read(apiClientProvider));
});
