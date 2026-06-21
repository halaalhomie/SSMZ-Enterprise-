import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../../../core/api_client.dart';
import '../../../shared/models/models.dart';

class InventoryState {
  final List<Product> products;
  final bool isLoading;
  final String? error;
  final int page;
  final int totalPages;

  InventoryState({
    this.products = const [],
    this.isLoading = false,
    this.error,
    this.page = 1,
    this.totalPages = 1,
  });

  InventoryState copyWith({
    List<Product>? products,
    bool? isLoading,
    String? error,
    int? page,
    int? totalPages,
  }) => InventoryState(
        products: products ?? this.products,
        isLoading: isLoading ?? this.isLoading,
        error: error,
        page: page ?? this.page,
        totalPages: totalPages ?? this.totalPages,
      );
}

class InventoryNotifier extends StateNotifier<InventoryState> {
  final Dio _dio = ApiClient().dio;

  InventoryNotifier() : super(InventoryState());

  Future<void> fetchProducts({String? search, bool lowStockOnly = false, int page = 1}) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final response = await _dio.get('/products', queryParameters: {
        'page': page,
        'page_size': 20,
        if (search != null && search.isNotEmpty) 'search': search,
        if (lowStockOnly) 'low_stock': true,
      });

      final items = (response.data['items'] as List).map((e) => Product.fromJson(e)).toList();
      state = state.copyWith(
        products: page == 1 ? items : [...state.products, ...items],
        isLoading: false,
        page: response.data['page'],
        totalPages: response.data['pages'],
      );
    } on DioException catch (e) {
      state = state.copyWith(isLoading: false, error: e.response?.data['detail'] ?? 'Failed to load');
    }
  }

  /// Lookup a product by barcode. Returns null if not found.
  Future<Product?> findByBarcode(String barcode) async {
    try {
      final response = await _dio.get('/products/barcode/$barcode');
      return Product.fromJson(response.data);
    } on DioException catch (e) {
      if (e.response?.statusCode == 404) return null;
      rethrow;
    }
  }

  Future<bool> stockIn(String productId, int quantity, {String? remarks}) async {
    try {
      await _dio.post('/stock/in', data: {
        'product_id': productId,
        'quantity': quantity,
        if (remarks != null) 'remarks': remarks,
      });
      await fetchProducts();
      return true;
    } on DioException {
      return false;
    }
  }

  Future<bool> stockOut(String productId, int quantity, {String? reason}) async {
    try {
      await _dio.post('/stock/out', data: {
        'product_id': productId,
        'quantity': quantity,
        if (reason != null) 'reason': reason,
      });
      await fetchProducts();
      return true;
    } on DioException {
      return false;
    }
  }
}

final inventoryProvider = StateNotifierProvider<InventoryNotifier, InventoryState>((ref) => InventoryNotifier());

final dashboardStatsProvider = FutureProvider<DashboardStats>((ref) async {
  final dio = ApiClient().dio;
  final response = await dio.get('/dashboard/stats');
  return DashboardStats.fromJson(response.data);
});
