import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../../../core/api_client.dart';
import '../../../shared/models/models.dart';

class AuthState {
  final AppUser? user;
  final bool isLoading;
  final String? error;

  AuthState({this.user, this.isLoading = false, this.error});

  bool get isAuthenticated => user != null;

  AuthState copyWith({AppUser? user, bool? isLoading, String? error}) => AuthState(
        user: user ?? this.user,
        isLoading: isLoading ?? this.isLoading,
        error: error,
      );
}

class AuthNotifier extends StateNotifier<AuthState> {
  final Dio _dio = ApiClient().dio;

  AuthNotifier() : super(AuthState());

  Future<bool> login(String email, String password) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final response = await _dio.post('/auth/login', data: {
        'email': email,
        'password': password,
      });

      await ApiClient.saveTokens(
        response.data['access_token'],
        response.data['refresh_token'],
      );

      final user = AppUser.fromJson(response.data['user']);
      state = state.copyWith(user: user, isLoading: false);
      return true;
    } on DioException catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.response?.data['detail'] ?? 'Login failed',
      );
      return false;
    }
  }

  Future<void> logout() async {
    await ApiClient.clearTokens();
    state = AuthState();
  }

  Future<void> tryAutoLogin() async {
    final token = await ApiClient.getAccessToken();
    if (token == null) return;

    try {
      final response = await _dio.get('/auth/me');
      final user = AppUser.fromJson(response.data);
      state = state.copyWith(user: user);
    } catch (_) {
      await ApiClient.clearTokens();
    }
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) => AuthNotifier());
