import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:provider/provider.dart';

import '../services/auth_manager.dart';
import '../services/api_service.dart';
import 'add_book_form_screen.dart';

class AddBookScreen extends StatelessWidget {
  const AddBookScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Přidat knihu'),
        centerTitle: false,
      ),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'Jak chcete přidat knihu?',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            Text(
              'Naskenujte čárový kód nebo zadejte údaje ručně.',
              style: TextStyle(color: scheme.onSurfaceVariant),
            ),
            const SizedBox(height: 32),
            _OptionCard(
              icon: Icons.qr_code_scanner,
              title: 'Skenovat čárový kód',
              subtitle: 'Automaticky vyplní formulář podle ISBN',
              onTap: () => _openScanner(context),
            ),
            const SizedBox(height: 16),
            _OptionCard(
              icon: Icons.edit_note,
              title: 'Ruční zadání',
              subtitle: 'Vyplňte údaje o knize ručně',
              onTap: () => _openManual(context),
            ),
          ],
        ),
      ),
    );
  }

  void _openScanner(BuildContext context) {
    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => const _BarcodeScannerScreen()),
    );
  }

  void _openManual(BuildContext context) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => const AddBookFormScreen(
          initialData: null,
          disabledFields: [],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Option card widget
// ---------------------------------------------------------------------------

class _OptionCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  const _OptionCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          border: Border.all(color: scheme.outlineVariant),
          borderRadius: BorderRadius.circular(16),
          color: scheme.surfaceContainerLow,
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: scheme.primaryContainer,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: scheme.onPrimaryContainer, size: 28),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title,
                      style: Theme.of(context)
                          .textTheme
                          .titleMedium
                          ?.copyWith(fontWeight: FontWeight.w600)),
                  const SizedBox(height: 4),
                  Text(subtitle,
                      style: TextStyle(color: scheme.onSurfaceVariant)),
                ],
              ),
            ),
            Icon(Icons.chevron_right, color: scheme.onSurfaceVariant),
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Barcode scanner screen
// ---------------------------------------------------------------------------

class _BarcodeScannerScreen extends StatefulWidget {
  const _BarcodeScannerScreen();

  @override
  State<_BarcodeScannerScreen> createState() => _BarcodeScannerScreenState();
}

class _BarcodeScannerScreenState extends State<_BarcodeScannerScreen> {
  final MobileScannerController _controller = MobileScannerController();
  bool _processing = false;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _onDetect(BarcodeCapture capture) async {
    if (_processing) return;
    final barcode = capture.barcodes.firstOrNull;
    if (barcode == null || barcode.rawValue == null) return;

    final isbn = barcode.rawValue!;
    final auth = context.read<AuthManager>();
    final api = ApiService();

    setState(() => _processing = true);
    await _controller.stop();
    if (!mounted) return;

    try {
      final result = await api.searchByIsbn(auth.token!, isbn);
      if (!mounted) return;
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(
          builder: (_) => AddBookFormScreen(
            initialData: result.book,
            disabledFields: result.disabledFields,
          ),
        ),
      );
    } on ApiException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.message)),
      );
      setState(() => _processing = false);
      await _controller.start();
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('ISBN nenalezeno. Zkuste to znovu.')),
      );
      setState(() => _processing = false);
      await _controller.start();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Skenovat čárový kód'),
        actions: [
          IconButton(
            icon: const Icon(Icons.flash_on),
            onPressed: () => _controller.toggleTorch(),
          ),
          IconButton(
            icon: const Icon(Icons.flip_camera_ios),
            onPressed: () => _controller.switchCamera(),
          ),
        ],
      ),
      body: Stack(
        children: [
          MobileScanner(
            controller: _controller,
            onDetect: _onDetect,
          ),
          // Viewfinder overlay
          Center(
            child: Container(
              width: 260,
              height: 120,
              decoration: BoxDecoration(
                border: Border.all(color: Colors.white, width: 2),
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
          if (_processing)
            Container(
              color: Colors.black54,
              child: const Center(
                child: CircularProgressIndicator(color: Colors.white),
              ),
            ),
          Positioned(
            bottom: 40,
            left: 0,
            right: 0,
            child: Center(
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: Colors.black54,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Text(
                  'Namiřte na čárový kód knihy (ISBN)',
                  style: TextStyle(color: Colors.white),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
