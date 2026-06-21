// Data models for the Store IMS mobile app.
// In production, generate these with freezed + json_serializable.

class AppUser {
  final String id;
  final String storeId;
  final String name;
  final String email;
  final String role;
  final bool isActive;

  AppUser({
    required this.id,
    required this.storeId,
    required this.name,
    required this.email,
    required this.role,
    required this.isActive,
  });

  factory AppUser.fromJson(Map<String, dynamic> json) => AppUser(
        id: json['id'],
        storeId: json['store_id'],
        name: json['name'],
        email: json['email'],
        role: json['role'],
        isActive: json['is_active'],
      );

  bool get isOwner => role == 'owner';
}

class Product {
  final String id;
  final String name;
  final String sku;
  final String? barcode;
  final String? categoryId;
  final String? categoryName;
  final double purchasePrice;
  final double sellingPrice;
  final int quantity;
  final int minStock;
  final String? imageUrl;

  Product({
    required this.id,
    required this.name,
    required this.sku,
    this.barcode,
    this.categoryId,
    this.categoryName,
    required this.purchasePrice,
    required this.sellingPrice,
    required this.quantity,
    required this.minStock,
    this.imageUrl,
  });

  bool get isLowStock => quantity <= minStock;

  factory Product.fromJson(Map<String, dynamic> json) => Product(
        id: json['id'],
        name: json['name'],
        sku: json['sku'],
        barcode: json['barcode'],
        categoryId: json['category_id'],
        categoryName: json['category']?['name'],
        purchasePrice: double.parse(json['purchase_price'].toString()),
        sellingPrice: double.parse(json['selling_price'].toString()),
        quantity: json['quantity'],
        minStock: json['min_stock'],
        imageUrl: json['image_url'],
      );
}

class StockTransaction {
  final String id;
  final String productId;
  final String? productName;
  final String type; // stock_in | stock_out | adjustment
  final int quantity;
  final String? userName;
  final String? reason;
  final DateTime createdAt;

  StockTransaction({
    required this.id,
    required this.productId,
    this.productName,
    required this.type,
    required this.quantity,
    this.userName,
    this.reason,
    required this.createdAt,
  });

  factory StockTransaction.fromJson(Map<String, dynamic> json) => StockTransaction(
        id: json['id'],
        productId: json['product_id'],
        productName: json['product']?['name'],
        type: json['type'],
        quantity: json['quantity'],
        userName: json['user']?['name'],
        reason: json['reason'],
        createdAt: DateTime.parse(json['created_at']),
      );
}

class DashboardStats {
  final int totalProducts;
  final double totalInventoryValue;
  final int lowStockCount;
  final int todayStockIn;
  final int todayStockOut;

  DashboardStats({
    required this.totalProducts,
    required this.totalInventoryValue,
    required this.lowStockCount,
    required this.todayStockIn,
    required this.todayStockOut,
  });

  factory DashboardStats.fromJson(Map<String, dynamic> json) => DashboardStats(
        totalProducts: json['total_products'],
        totalInventoryValue: double.parse(json['total_inventory_value'].toString()),
        lowStockCount: json['low_stock_count'],
        todayStockIn: json['today_stock_in'],
        todayStockOut: json['today_stock_out'],
      );
}
