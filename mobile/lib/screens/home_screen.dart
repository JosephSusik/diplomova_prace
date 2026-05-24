import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../services/auth_manager.dart';
import '../services/api_service.dart';
import '../models/book.dart';
import '../widgets/book_card.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final ApiService _api = ApiService();
  List<Book> _books = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final auth = context.read<AuthManager>();
      final books =
          await _api.fetchMyBooks(auth.token!, auth.user!.id);
      if (mounted) setState(() => _books = books);
    } on ApiException catch (e) {
      if (mounted) setState(() => _error = e.message);
    } catch (_) {
      if (mounted) setState(() => _error = 'Nepodařilo se načíst knihy.');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Moje knihovna'),
        centerTitle: false,
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        child: _buildBody(scheme),
      ),
    );
  }

  Widget _buildBody(ColorScheme scheme) {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.error_outline, size: 48, color: scheme.error),
              const SizedBox(height: 12),
              Text(_error!,
                  textAlign: TextAlign.center,
                  style: TextStyle(color: scheme.error)),
              const SizedBox(height: 16),
              OutlinedButton.icon(
                onPressed: _load,
                icon: const Icon(Icons.refresh),
                label: const Text('Zkusit znovu'),
              ),
            ],
          ),
        ),
      );
    }

    if (_books.isEmpty) {
      return LayoutBuilder(
        builder: (context, constraints) => SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          child: SizedBox(
            height: constraints.maxHeight,
            child: Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.menu_book_rounded,
                      size: 64, color: scheme.onSurfaceVariant),
                  const SizedBox(height: 16),
                  Text('Vaše knihovna je prázdná',
                      style: Theme.of(context)
                          .textTheme
                          .titleMedium
                          ?.copyWith(color: scheme.onSurfaceVariant)),
                  const SizedBox(height: 8),
                  Text(
                    'Přidejte první knihu pomocí tlačítka Přidat.',
                    style: TextStyle(color: scheme.onSurfaceVariant),
                  ),
                ],
              ),
            ),
          ),
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.symmetric(vertical: 8),
      itemCount: _books.length,
      itemBuilder: (context, index) => BookCard(book: _books[index]),
    );
  }
}
