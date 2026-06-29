import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'core/api_client.dart';
import 'core/auth_provider.dart';
import 'core/connectivity_provider.dart';
import 'core/theme.dart';
import 'screens/splash_screen.dart';
import 'screens/login_screen.dart';
import 'screens/home_screen.dart';
import 'screens/child_detail_screen.dart';
import 'screens/parent_notifications_screen.dart';
import 'screens/student_home_screen.dart';
import 'screens/parent_children_screen.dart';
import 'screens/parent_payments_screen.dart';
import 'screens/parent_chat_screen.dart';
import 'screens/parent_dashboard_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => ConnectivityProvider()),
        ChangeNotifierProvider(create: (_) => AuthProvider()),
      ],
      child: const OpenCodeCRMApp(),
    ),
  );
}

class OpenCodeCRMApp extends StatelessWidget {
  const OpenCodeCRMApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'OpenCode CRM',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      darkTheme: AppTheme.dark,
      themeMode: ThemeMode.system,
      initialRoute: '/splash',
      onGenerateRoute: (settings) {
        final args = settings.arguments;
        switch (settings.name) {
          case '/splash':
            return MaterialPageRoute(builder: (_) => SplashScreen());
          case '/login':
            return MaterialPageRoute(builder: (_) => LoginScreen());
          case '/home':
            return MaterialPageRoute(builder: (_) => HomeScreen());
          case '/student-home':
            return MaterialPageRoute(builder: (_) => StudentHomeScreen());
          case '/notifications':
            return MaterialPageRoute(builder: (_) => ParentNotificationsScreen());
          case '/children':
            return MaterialPageRoute(builder: (_) => ParentChildrenScreen());
          case '/payments':
            return MaterialPageRoute(builder: (_) => ParentPaymentsScreen());
          case '/chat':
            return MaterialPageRoute(builder: (_) => ParentChatScreen());
          case '/dashboard':
            return MaterialPageRoute(builder: (_) => ParentDashboardScreen());
          case '/child':
            return MaterialPageRoute(builder: (_) => ChildDetailScreen(child: args as Map<String, dynamic>));
          default:
            return MaterialPageRoute(
              builder: (_) => Scaffold(
                body: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.error_outline, size: 48, color: Colors.grey[300]),
                      const SizedBox(height: 16),
                      Text('Sahifa topilmadi', style: TextStyle(color: Colors.grey[500])),
                    ],
                  ),
                ),
              ),
            );
        }
      },
    );
  }
}
