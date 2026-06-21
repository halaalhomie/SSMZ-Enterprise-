import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

const String baseUrl = 'http://172.20.10.6:8000/api/v1';
const _storage = FlutterSecureStorage();

class ApiClient {
  static final ApiClient _instance = ApiClient._internal();
  factory ApiClient() => _instance;

  late Dio dio;
  bool _isRefreshing = false;

  ApiClient._internal() {
    dio = Dio(BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 15),
      headers: {'Content-Type': 'application/json'},
    ));

    dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await _storage.read(key: 'access_token');
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        handler.next(options);
      },
      onError: (DioException error, handler) async {
        if (error.response?.statusCode == 401 && !_isRefreshing) {
          _isRefreshing = true;
          try {
            final refreshToken = await _storage.read(key: 'refresh_token');
            if (refreshToken == null) {
              await _storage.deleteAll();
              _isRefreshing = false;
              return handler.next(error);
            }

            final response = await Dio(BaseOptions(baseUrl: baseUrl)).post(
              '/auth/refresh',
              data: {'refresh_token': refreshToken},
            );

            await _storage.write(key: 'access_token', value: response.data['access_token']);
            await _storage.write(key: 'refresh_token', value: response.data['refresh_token']);

            // Retry the original request
            final opts = error.requestOptions;
            opts.headers['Authorization'] = 'Bearer ${response.data['access_token']}';
            final retryResponse = await dio.fetch(opts);
            _isRefreshing = false;
            return handler.resolve(retryResponse);
          } catch (e) {
            await _storage.deleteAll();
            _isRefreshing = false;
            return handler.next(error);
          }
        }
        handler.next(error);
      },
    ));
  }

  static Future<void> saveTokens(String access, String refresh) async {
    await _storage.write(key: 'access_token', value: access);
    await _storage.write(key: 'refresh_token', value: refresh);
  }

  static Future<void> clearTokens() async {
    await _storage.deleteAll();
  }

  static Future<String?> getAccessToken() => _storage.read(key: 'access_token');
}
