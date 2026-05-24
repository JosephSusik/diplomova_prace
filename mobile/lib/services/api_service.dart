import 'dart:convert';
import 'package:http/http.dart' as http;

import '../models/user.dart';
import '../models/book.dart';

class ApiException implements Exception {
  final String message;
  final int? statusCode;
  const ApiException(this.message, {this.statusCode});

  @override
  String toString() => 'ApiException($statusCode): $message';
}

class ApiService {
  /// Base URL for `/api` routes (must include `/api` suffix).
  ///
  /// Simulator on the same Mac can use localhost. A physical phone cannot —
  /// use your Mac's LAN IP instead, e.g. `http://192.168.1.42:3001/api`.
  ///
  /// ```bash
  /// flutter run --dart-define=BOOKLY_API_BASE=http://192.168.1.42:3001/api
  /// ```
  static const String baseUrl = String.fromEnvironment(
    'BOOKLY_API_BASE',
    defaultValue: 'http://localhost:3001/api',
  );

  // ---------------------------------------------------------------------------
  // Auth
  // ---------------------------------------------------------------------------

  Future<LoginResponse> login(String email, String password) async {
    final res = await http.post(
      Uri.parse('$baseUrl/users/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': password}),
    );
    final body = _decode(res);
    return LoginResponse.fromJson(body);
  }

  Future<User> getCurrentUser(String token) async {
    final res = await http.get(
      Uri.parse('$baseUrl/users/me'),
      headers: _authHeaders(token),
    );
    return User.fromJson(_decode(res));
  }

  // ---------------------------------------------------------------------------
  // Books
  // ---------------------------------------------------------------------------

  Future<List<Book>> fetchMyBooks(String token, String userId) async {
    final res = await http.get(
      Uri.parse('$baseUrl/books/$userId'),
      headers: _authHeaders(token),
    );
    final List<dynamic> list = _decode(res) as List<dynamic>;
    return list
        .map((e) => Book.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<SearchByIsbnResponse> searchByIsbn(
      String token, String isbn) async {
    final res = await http.post(
      Uri.parse('$baseUrl/books/search-by-isbn'),
      headers: {
        'Content-Type': 'application/json',
        ..._authHeaders(token),
      },
      body: jsonEncode({'ISBN': isbn}),
    );
    return SearchByIsbnResponse.fromJson(_decode(res));
  }

  Future<Book> createBook(String token, CreateBookData data) async {
    final res = await http.post(
      Uri.parse('$baseUrl/books'),
      headers: {
        'Content-Type': 'application/json',
        ..._authHeaders(token),
      },
      body: jsonEncode(data.toJson()),
    );
    final body = _decode(res) as Map<String, dynamic>;
    final bookJson = body['book'] as Map<String, dynamic>?;
    if (bookJson == null) {
      throw ApiException(
        'Invalid response: missing book',
        statusCode: res.statusCode,
      );
    }
    return Book.fromJson(bookJson);
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  Map<String, String> _authHeaders(String token) => {
        'Authorization': 'Bearer $token',
      };

  dynamic _decode(http.Response res) {
    if (res.statusCode < 200 || res.statusCode >= 300) {
      String message = 'Request failed';
      try {
        final body = jsonDecode(res.body) as Map<String, dynamic>;
        message = (body['error'] ?? body['message']) as String? ?? message;
      } catch (_) {}
      throw ApiException(message, statusCode: res.statusCode);
    }
    return jsonDecode(res.body);
  }
}
