import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';

import '../models/book.dart';

class BookCard extends StatelessWidget {
  final Book book;

  const BookCard({super.key, required this.book});

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final authorsLabel = book.authors.isNotEmpty
        ? book.authors.join(', ')
        : 'Neznámý autor';

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      elevation: 1,
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            _CoverImage(coverUrl: book.coverUrl),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    book.title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context)
                        .textTheme
                        .titleMedium
                        ?.copyWith(fontWeight: FontWeight.w600),
                  ),
                  if (book.subtitle != null &&
                      book.subtitle!.isNotEmpty) ...[
                    const SizedBox(height: 2),
                    Text(
                      book.subtitle!,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: Theme.of(context)
                          .textTheme
                          .bodySmall
                          ?.copyWith(color: scheme.onSurfaceVariant),
                    ),
                  ],
                  const SizedBox(height: 4),
                  Text(
                    authorsLabel,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context)
                        .textTheme
                        .bodySmall
                        ?.copyWith(color: scheme.primary),
                  ),
                  if (book.pageCount != null) ...[
                    const SizedBox(height: 4),
                    Text(
                      '${book.pageCount} stran',
                      style: Theme.of(context)
                          .textTheme
                          .bodySmall
                          ?.copyWith(color: scheme.onSurfaceVariant),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CoverImage extends StatelessWidget {
  final String? coverUrl;

  const _CoverImage({this.coverUrl});

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;

    final placeholder = Container(
      width: 60,
      height: 84,
      decoration: BoxDecoration(
        color: scheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Icon(Icons.book_outlined,
          color: scheme.onSurfaceVariant, size: 28),
    );

    if (coverUrl == null || coverUrl!.isEmpty) return placeholder;

    return ClipRRect(
      borderRadius: BorderRadius.circular(6),
      child: CachedNetworkImage(
        imageUrl: coverUrl!,
        width: 60,
        height: 84,
        fit: BoxFit.cover,
        placeholder: (_, __) => placeholder,
        errorWidget: (_, __, ___) => placeholder,
      ),
    );
  }
}
