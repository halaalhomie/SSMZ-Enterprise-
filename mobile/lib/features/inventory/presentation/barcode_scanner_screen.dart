import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import '../data/inventory_provider.dart';

/// Barcode scanner — workflow described in the master prompt:
/// If barcode exists -> open product detail.
/// If barcode doesn't exist -> prompt to create a new product with this barcode pre-filled.
class BarcodeScannerScreen extends ConsumerStatefulWidget {
  const BarcodeScannerScreen({super.key});

  @override
  ConsumerState<BarcodeScannerScreen> createState() => _BarcodeScannerScreenState();
}

class _BarcodeScannerScreenState extends ConsumerState<BarcodeScannerScreen> {
  final MobileScannerController _controller = MobileScannerController();
  bool _processing = false;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _handleBarcode(String barcode) async {
    if (_processing) return;
    setState(() => _processing = true);
    await _controller.stop();

    try {
      final product = await ref.read(inventoryProvider.notifier).findByBarcode(barcode);

      if (!mounted) return;

      if (product != null) {
        // Existing product → go to its detail page
        context.pushReplacement('/inventory/${product.id}');
      } else {
        // Unknown barcode → offer to create a new product
        final create = await showDialog<bool>(
          context: context,
          builder: (ctx) => AlertDialog(
            title: const Text('Product not found'),
            content: Text('No product found for barcode:\n$barcode\n\nWould you like to create a new product?'),
            actions: [
              TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
              FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Create Product')),
            ],
          ),
        );

        if (create == true && mounted) {
          context.pushReplacement('/inventory/new', extra: {'barcode': barcode});
        } else {
          await _controller.start();
          setState(() => _processing = false);
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
        await _controller.start();
        setState(() => _processing = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Scan Barcode'),
        actions: [
          IconButton(
            icon: const Icon(Icons.flash_on),
            onPressed: () => _controller.toggleTorch(),
          ),
        ],
      ),
      body: Stack(
        children: [
          MobileScanner(
            controller: _controller,
            onDetect: (capture) {
              final barcodes = capture.barcodes;
              if (barcodes.isNotEmpty && barcodes.first.rawValue != null) {
                _handleBarcode(barcodes.first.rawValue!);
              }
            },
          ),
          // Viewfinder overlay
          Center(
            child: Container(
              width: 260,
              height: 160,
              decoration: BoxDecoration(
                border: Border.all(color: Colors.white, width: 2),
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
          if (_processing)
            Container(
              color: Colors.black54,
              child: const Center(child: CircularProgressIndicator(color: Colors.white)),
            ),
          Positioned(
            bottom: 32, left: 0, right: 0,
            child: Text(
              'Point camera at a product barcode',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.white, backgroundColor: Colors.black.withOpacity(0.5)),
            ),
          ),
        ],
      ),
    );
  }
}
