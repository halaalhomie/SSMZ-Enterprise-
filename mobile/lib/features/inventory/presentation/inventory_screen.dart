import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../data/inventory_provider.dart';
import '../../../shared/models/models.dart';

class InventoryScreen extends ConsumerStatefulWidget {
  const InventoryScreen({super.key});

  @override
  ConsumerState<InventoryScreen> createState() => _InventoryScreenState();
}

class _InventoryScreenState extends ConsumerState<InventoryScreen> {
  final _searchController = TextEditingController();
  bool _lowStockOnly = false;

  @override
  void initState() {
    super.initState();
    Future.microtask(() => ref.read(inventoryProvider.notifier).fetchProducts());
  }

  void _search() {
    ref.read(inventoryProvider.notifier).fetchProducts(
          search: _searchController.text,
          lowStockOnly: _lowStockOnly,
        );
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(inventoryProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Inventory'),
        actions: [
          IconButton(icon: const Icon(Icons.qr_code_scanner), onPressed: () => context.push('/scanner')),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              children: [
                TextField(
                  controller: _searchController,
                  decoration: InputDecoration(
                    hintText: 'Search by name, SKU, barcode...',
                    prefixIcon: const Icon(Icons.search),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    isDense: true,
                  ),
                  onSubmitted: (_) => _search(),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    FilterChip(
                      label: const Text('Low stock only'),
                      selected: _lowStockOnly,
                      onSelected: (v) {
                        setState(() => _lowStockOnly = v);
                        _search();
                      },
                    ),
                  ],
                ),
              ],
            ),
          ),
          Expanded(
            child: state.isLoading && state.products.isEmpty
                ? const Center(child: CircularProgressIndicator())
                : state.products.isEmpty
                    ? const Center(child: Text('No products found'))
                    : RefreshIndicator(
                        onRefresh: () async => _search(),
                        child: ListView.builder(
                          itemCount: state.products.length,
                          itemBuilder: (context, index) {
                            final p = state.products[index];
                            return _ProductTile(product: p);
                          },
                        ),
                      ),
          ),
        ],
      ),
    );
  }
}

class _ProductTile extends StatelessWidget {
  final Product product;
  const _ProductTile({required this.product});

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: CircleAvatar(
        backgroundColor: product.isLowStock ? Colors.red.shade50 : Colors.green.shade50,
        child: Icon(
          product.isLowStock ? Icons.warning_amber : Icons.inventory_2,
          color: product.isLowStock ? Colors.red : Colors.green,
          size: 20,
        ),
      ),
      title: Text(product.name, maxLines: 1, overflow: TextOverflow.ellipsis),
      subtitle: Text('SKU: ${product.sku} · ₹${product.sellingPrice.toStringAsFixed(2)}'),
      trailing: Column(
        crossAxisAlignment: CrossAxisAlignment.end,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text('${product.quantity}', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
          Text('min: ${product.minStock}', style: Theme.of(context).textTheme.bodySmall),
        ],
      ),
      onTap: () => context.push('/inventory/${product.id}'),
    );
  }
}
