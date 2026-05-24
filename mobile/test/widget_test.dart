import 'package:bookly/main.dart';
import 'package:bookly/services/auth_manager.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';

void main() {
  testWidgets('shows login screen when unauthenticated',
      (WidgetTester tester) async {
    await tester.pumpWidget(
      ChangeNotifierProvider(
        create: (_) => AuthManager(),
        child: const BooklyApp(),
      ),
    );

    expect(find.text('Bookly'), findsWidgets);
    expect(find.text('Přihlásit se'), findsOneWidget);
  });
}
