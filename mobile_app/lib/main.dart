import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'core/constants.dart';
import 'core/api_client.dart';
import 'core/auth_provider.dart';
import 'core/theme.dart';
import 'screens/splash_screen.dart';
import 'screens/login_screen.dart';
import 'screens/home_screen.dart';
import 'screens/child_detail_screen.dart';
import 'screens/parent_notifications_screen.dart';
import 'screens/student_home_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
      ],
      child: OpenCodeCRMApp(),
    ),
  );
}

class OpenCodeCRMApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'OpenCode CRM',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      darkTheme: AppTheme.dark,
      themeMode: ThemeMode.light,
      initialRoute: '/splash',
      onGenerateRoute: (settings) {
        final args = settings.arguments;
        switch (settings.name) {
          case '/splash': return MaterialPageRoute(builder: (_) => SplashScreen());
          case '/login': return MaterialPageRoute(builder: (_) => LoginScreen());
          case '/home': return MaterialPageRoute(builder: (_) => HomeScreen());
          case '/student-home': return MaterialPageRoute(builder: (_) => StudentHomeScreen());
          case '/notifications': return MaterialPageRoute(builder: (_) => ParentNotificationsScreen());
          case '/child': return MaterialPageRoute(builder: (_) => ChildDetailScreen(child: args as Map<String, dynamic>));
          default: return MaterialPageRoute(builder: (_) => Scaffold(body: Center(child: Text('Page not found'))));
        }
      },
    );
  }
}
