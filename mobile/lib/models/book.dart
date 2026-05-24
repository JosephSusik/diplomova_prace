class Book {
  final String id;
  final String? isbn;
  final String title;
  final String? subtitle;
  final List<String> authors;
  final String? publisher;
  final String? publishedDate;
  final int? pageCount;
  final String? language;
  final String? description;
  final String? coverUrl;

  const Book({
    required this.id,
    this.isbn,
    required this.title,
    this.subtitle,
    required this.authors,
    this.publisher,
    this.publishedDate,
    this.pageCount,
    this.language,
    this.description,
    this.coverUrl,
  });

  /// Partial book from POST /books/search-by-isbn (`id` may be absent for manual/Google prefills).
  factory Book.fromSearchPayload(Map<String, dynamic> json) => Book(
        id: json['id'] as String? ?? '',
        isbn: json['ISBN'] as String?,
        title: (json['title'] as String?) ?? '',
        subtitle: json['subtitle'] as String?,
        authors: (json['authors'] as List<dynamic>?)
                ?.map((e) => e as String)
                .toList() ??
            [],
        publisher: json['publisher'] as String?,
        publishedDate: json['published_date'] as String?,
        pageCount: json['page_count'] as int?,
        language: json['language'] as String?,
        description: json['description'] as String?,
        coverUrl: json['cover_url'] as String?,
      );

  factory Book.fromJson(Map<String, dynamic> json) => Book(
        id: json['id'] as String,
        isbn: json['ISBN'] as String?,
        title: json['title'] as String,
        subtitle: json['subtitle'] as String?,
        authors: (json['authors'] as List<dynamic>?)
                ?.map((e) => e as String)
                .toList() ??
            [],
        publisher: json['publisher'] as String?,
        publishedDate: json['published_date'] as String?,
        pageCount: json['page_count'] as int?,
        language: json['language'] as String?,
        description: json['description'] as String?,
        coverUrl: json['cover_url'] as String?,
      );
}

class SearchByIsbnResponse {
  final Book? book;
  final List<String> disabledFields;
  final String? source;

  const SearchByIsbnResponse({
    this.book,
    required this.disabledFields,
    this.source,
  });

  factory SearchByIsbnResponse.fromJson(Map<String, dynamic> json) =>
      SearchByIsbnResponse(
        book: json['book'] != null
            ? Book.fromSearchPayload(json['book'] as Map<String, dynamic>)
            : null,
        disabledFields: (json['disabledFields'] as List<dynamic>?)
                ?.map((e) => e as String)
                .toList() ??
            [],
        source: json['source'] as String?,
      );
}

class CreateBookData {
  final String? isbn;
  final String title;
  final String? subtitle;
  final List<String> authors;
  final String? publisher;
  final String? publishedDate;
  final int? pageCount;
  final String? language;
  final String? description;
  final String? coverUrl;

  const CreateBookData({
    this.isbn,
    required this.title,
    this.subtitle,
    required this.authors,
    this.publisher,
    this.publishedDate,
    this.pageCount,
    this.language,
    this.description,
    this.coverUrl,
  });

  Map<String, dynamic> toJson() => {
        if (isbn != null && isbn!.isNotEmpty) 'ISBN': isbn,
        'title': title,
        if (subtitle != null && subtitle!.isNotEmpty) 'subtitle': subtitle,
        if (authors.isNotEmpty) 'authors': authors,
        if (publisher != null && publisher!.isNotEmpty) 'publisher': publisher,
        if (publishedDate != null && publishedDate!.isNotEmpty)
          'published_date': publishedDate,
        if (pageCount != null) 'page_count': pageCount,
        if (language != null && language!.isNotEmpty) 'language': language,
        if (description != null && description!.isNotEmpty)
          'description': description,
        if (coverUrl != null && coverUrl!.isNotEmpty) 'cover_url': coverUrl,
      };
}
