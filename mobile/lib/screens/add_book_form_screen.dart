import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../services/auth_manager.dart';
import '../services/api_service.dart';
import '../models/book.dart';

class AddBookFormScreen extends StatefulWidget {
  final Book? initialData;
  final List<String> disabledFields;

  const AddBookFormScreen({
    super.key,
    required this.initialData,
    required this.disabledFields,
  });

  @override
  State<AddBookFormScreen> createState() => _AddBookFormScreenState();
}

class _AddBookFormScreenState extends State<AddBookFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final ApiService _api = ApiService();
  bool _saving = false;

  late final TextEditingController _isbnCtrl;
  late final TextEditingController _titleCtrl;
  late final TextEditingController _subtitleCtrl;
  late final TextEditingController _authorsCtrl;
  late final TextEditingController _publisherCtrl;
  late final TextEditingController _publishedDateCtrl;
  late final TextEditingController _pageCountCtrl;
  late final TextEditingController _languageCtrl;
  late final TextEditingController _descriptionCtrl;

  // Cover URL is set from search results but not shown as an editable field.
  String? _coverUrl;

  @override
  void initState() {
    super.initState();
    final d = widget.initialData;
    _isbnCtrl = TextEditingController(text: d?.isbn ?? '');
    _titleCtrl = TextEditingController(text: d?.title ?? '');
    _subtitleCtrl = TextEditingController(text: d?.subtitle ?? '');
    _authorsCtrl =
        TextEditingController(text: d?.authors.join(', ') ?? '');
    _publisherCtrl = TextEditingController(text: d?.publisher ?? '');
    _publishedDateCtrl =
        TextEditingController(text: d?.publishedDate ?? '');
    _pageCountCtrl = TextEditingController(
        text: d?.pageCount != null ? '${d!.pageCount}' : '');
    _languageCtrl = TextEditingController(text: d?.language ?? '');
    _descriptionCtrl = TextEditingController(text: d?.description ?? '');
    _coverUrl = d?.coverUrl;
  }

  @override
  void dispose() {
    _isbnCtrl.dispose();
    _titleCtrl.dispose();
    _subtitleCtrl.dispose();
    _authorsCtrl.dispose();
    _publisherCtrl.dispose();
    _publishedDateCtrl.dispose();
    _pageCountCtrl.dispose();
    _languageCtrl.dispose();
    _descriptionCtrl.dispose();
    super.dispose();
  }

  bool _isDisabled(String field) => widget.disabledFields.contains(field);

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);

    final authors = _authorsCtrl.text
        .split(',')
        .map((a) => a.trim())
        .where((a) => a.isNotEmpty)
        .toList();

    final data = CreateBookData(
      isbn: _isbnCtrl.text.trim().isEmpty ? null : _isbnCtrl.text.trim(),
      title: _titleCtrl.text.trim(),
      subtitle: _subtitleCtrl.text.trim().isEmpty
          ? null
          : _subtitleCtrl.text.trim(),
      authors: authors,
      publisher: _publisherCtrl.text.trim().isEmpty
          ? null
          : _publisherCtrl.text.trim(),
      publishedDate: _publishedDateCtrl.text.trim().isEmpty
          ? null
          : _publishedDateCtrl.text.trim(),
      pageCount: int.tryParse(_pageCountCtrl.text.trim()),
      language: _languageCtrl.text.trim().isEmpty
          ? null
          : _languageCtrl.text.trim(),
      description: _descriptionCtrl.text.trim().isEmpty
          ? null
          : _descriptionCtrl.text.trim(),
      coverUrl: _coverUrl,
    );

    try {
      final auth = context.read<AuthManager>();
      await _api.createBook(auth.token!, data);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Kniha byla přidána do knihovny.')),
      );
      // Return to the tab root (pop until the bottom-nav tab is reached).
      Navigator.of(context).popUntil((route) => route.isFirst);
    } on ApiException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.message)),
      );
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Nepodařilo se uložit knihu.')),
      );
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isFromScan = widget.initialData != null;

    return Scaffold(
      appBar: AppBar(
        title: Text(isFromScan ? 'Potvrdit knihu' : 'Nová kniha'),
        centerTitle: false,
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            if (isFromScan) ...[
              _InfoBanner(
                message: widget.disabledFields.isEmpty
                    ? 'Údaje byly předvyplněny z databáze. Zkontrolujte je a potvrďte.'
                    : 'Šedá pole byla doplněna automaticky a jsou uzamčena.',
              ),
              const SizedBox(height: 16),
            ],
            _buildField(
              label: 'ISBN',
              controller: _isbnCtrl,
              field: 'ISBN',
              keyboardType: TextInputType.number,
            ),
            _buildField(
              label: 'Název *',
              controller: _titleCtrl,
              field: 'title',
              validator: (v) =>
                  v == null || v.trim().isEmpty ? 'Název je povinný' : null,
            ),
            _buildField(
              label: 'Podnázev',
              controller: _subtitleCtrl,
              field: 'subtitle',
            ),
            _buildField(
              label: 'Autoři (oddělení čárkou)',
              controller: _authorsCtrl,
              field: 'authors',
            ),
            _buildField(
              label: 'Vydavatel',
              controller: _publisherCtrl,
              field: 'publisher',
            ),
            _buildField(
              label: 'Datum vydání',
              controller: _publishedDateCtrl,
              field: 'published_date',
              keyboardType: TextInputType.datetime,
            ),
            _buildField(
              label: 'Počet stran',
              controller: _pageCountCtrl,
              field: 'page_count',
              keyboardType: TextInputType.number,
              inputFormatters: [FilteringTextInputFormatter.digitsOnly],
            ),
            _buildField(
              label: 'Jazyk',
              controller: _languageCtrl,
              field: 'language',
            ),
            _buildField(
              label: 'Popis',
              controller: _descriptionCtrl,
              field: 'description',
              maxLines: 4,
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: _saving ? null : _save,
              icon: _saving
                  ? const SizedBox(
                      height: 18,
                      width: 18,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.save_outlined),
              label: Text(_saving ? 'Ukládám…' : 'Uložit knihu'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Theme.of(context).colorScheme.primary,
                foregroundColor: Theme.of(context).colorScheme.onPrimary,
              ),
            ),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  Widget _buildField({
    required String label,
    required TextEditingController controller,
    required String field,
    TextInputType? keyboardType,
    List<TextInputFormatter>? inputFormatters,
    int maxLines = 1,
    String? Function(String?)? validator,
  }) {
    final disabled = _isDisabled(field);
    final scheme = Theme.of(context).colorScheme;

    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: TextFormField(
        controller: controller,
        readOnly: disabled,
        enabled: !disabled,
        keyboardType: keyboardType,
        inputFormatters: inputFormatters,
        maxLines: maxLines,
        validator: validator,
        decoration: InputDecoration(
          labelText: label,
          filled: disabled,
          fillColor: disabled ? scheme.surfaceContainerHighest : null,
          suffixIcon: disabled
              ? Icon(Icons.lock_outline,
                  size: 18, color: scheme.onSurfaceVariant)
              : null,
        ),
      ),
    );
  }
}

class _InfoBanner extends StatelessWidget {
  final String message;
  const _InfoBanner({required this.message});

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: scheme.secondaryContainer,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        children: [
          Icon(Icons.info_outline,
              color: scheme.onSecondaryContainer, size: 18),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              message,
              style: TextStyle(color: scheme.onSecondaryContainer),
            ),
          ),
        ],
      ),
    );
  }
}
