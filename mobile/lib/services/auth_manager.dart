import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../models/user.dart';
import 'api_service.dart';

const _keyToken = 'bookly_token';
const _keyUser = 'bookly_user';

class AuthManager extends ChangeNotifier {
  final ApiService _api = ApiService();

  String? _token;
  User? _user;

  String? get token => _token;
  User? get user => _user;
  bool get isLoggedIn => _token != null && _user != null;

  /// Restores persisted session on app start.
  Future<void> loadFromStorage() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString(_keyToken);
    final userJson = prefs.getString(_keyUser);
    if (userJson != null) {
      try {
        _user = User.fromJson(
            jsonDecode(userJson) as Map<String, dynamic>);
      } catch (_) {
        _token = null;
      }
    }
  }

  Future<void> login(String email, String password) async {
    final response = await _api.login(email, password);
    _token = response.token;
    _user = response.user;

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyToken, _token!);
    await prefs.setString(_keyUser, jsonEncode(_user!.toJson()));

    notifyListeners();
  }

  Future<void> logout() async {
    _token = null;
    _user = null;

    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_keyToken);
    await prefs.remove(_keyUser);

    notifyListeners();
  }
}
