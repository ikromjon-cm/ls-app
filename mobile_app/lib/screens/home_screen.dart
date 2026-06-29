import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/auth_provider.dart';
import '../core/api_client.dart';
import 'parent_dashboard_screen.dart';
import 'parent_children_screen.dart';
import 'parent_payments_screen.dart';
import 'parent_notifications_screen.dart';
import 'parent_chat_screen.dart';
import 'student_home_screen.dart';

class HomeScreen extends StatefulWidget {
  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _page = 0;

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    if (auth.isStudent) return StudentHomeScreen();

    final pages = [
      ParentDashboardScreen(),
      ParentChildrenScreen(),
      ParentPaymentsScreen(),
      ParentChatScreen(key: ValueKey('chat_${auth.user?['id']}')),
    ];

    final icons = [Icons.dashboard_outlined, Icons.people_outline, Icons.payments_outlined, Icons.chat_outlined];
    final labels = ['Dashboard', 'Farzandlar', "To'lovlar", 'Chat'];

    return Scaffold(
      body: IndexedStack(index: _page, children: pages),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _page,
        onDestinationSelected: (i) => setState(() => _page = i),
        destinations: List.generate(4, (i) => NavigationDestination(icon: Icon(icons[i]), label: labels[i])),
      ),
    );
  }
}
