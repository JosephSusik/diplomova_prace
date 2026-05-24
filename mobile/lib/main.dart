import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'services/auth_manager.dart';
import 'screens/login_screen.dart';
import 'screens/main_tab_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final authManager = AuthManager();
  await authManager.loadFromStorage();
  runApp(
    ChangeNotifierProvider.value(
      value: authManager,
      child: const BooklyApp(),
    ),
  );
}

class BooklyApp extends StatelessWidget {
  const BooklyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Bookly',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF4F46E5),
          brightness: Brightness.light,
        ),
        useMaterial3: true,
        inputDecorationTheme: InputDecorationTheme(
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
          contentPadding:
              const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            minimumSize: const Size.fromHeight(52),
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
        ),
      ),
      home: const _RootRouter(),
    );
  }
}

class _RootRouter extends StatelessWidget {
  const _RootRouter();

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthManager>();
    if (auth.isLoggedIn) {
      return const MainTabScreen();
    }
    return const LoginScreen();
  }
}
