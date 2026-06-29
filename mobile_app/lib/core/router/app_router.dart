import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/auth_provider.dart';
import '../../features/auth/presentation/login_screen.dart';
import '../../features/auth/presentation/otp_screen.dart';
import '../../features/parent/presentation/parent_shell.dart';
import '../../features/student/presentation/student_shell.dart';
import '../../features/parent/presentation/dashboard/parent_dashboard_screen.dart';
import '../../features/parent/presentation/children/parent_children_screen.dart';
import '../../features/parent/presentation/payments/parent_payments_screen.dart';
import '../../features/parent/presentation/chat/parent_chat_screen.dart';
import '../../features/parent/presentation/notifications/parent_notifications_screen.dart';
import '../../features/common/splash_screen.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authProvider);

  return GoRouter(
    initialLocation: '/splash',
    debugLogDiagnostics: true,
    redirect: (context, state) {
      final loggedIn = authState.status == AuthStatus.authenticated;
      final onAuthPage = state.matchedLocation.startsWith('/login') || state.matchedLocation.startsWith('/otp');

      if (!loggedIn && !onAuthPage && state.matchedLocation != '/splash') {
        return '/login';
      }
      if (loggedIn && onAuthPage) {
        return '/parent';
      }
      return null;
    },
    routes: [
      GoRoute(path: '/splash', builder: (_, __) => const SplashScreen()),
      GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
      GoRoute(path: '/otp', builder: (_, state) => OtpScreen(phone: state.extra as String? ?? '')),
      ShellRoute(
        builder: (_, __, child) => ParentShell(child: child),
        routes: [
          GoRoute(path: '/parent', builder: (_, __) => const ParentDashboardScreen()),
          GoRoute(path: '/parent/children', builder: (_, __) => const ParentChildrenScreen()),
          GoRoute(path: '/parent/payments', builder: (_, __) => const ParentPaymentsScreen()),
          GoRoute(path: '/parent/chat', builder: (_, __) => const ParentChatScreen()),
          GoRoute(path: '/parent/notifications', builder: (_, __) => const ParentNotificationsScreen()),
        ],
      ),
      ShellRoute(
        builder: (_, __, child) => StudentShell(child: child),
        routes: [
          GoRoute(path: '/student', builder: (_, __) => const StudentHomeScreen()),
        ],
      ),
    ],
  );
});
