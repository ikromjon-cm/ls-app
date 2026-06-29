import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/providers/connectivity_provider.dart';

class ParentShell extends ConsumerWidget {
  final Widget child;
  const ParentShell({super.key, required this.child});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isOnline = ref.watch(isOnlineProvider);
    final cs = Theme.of(context).colorScheme;

    return Scaffold(
      body: Column(
        children: [
          if (!isOnline)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 16),
              color: cs.error,
              child: Row(
                children: [
                  Icon(Icons.wifi_off, size: 16, color: cs.onError),
                  const SizedBox(width: 8),
                  Text('Internet aloqasi yo\'q', style: TextStyle(color: cs.onError, fontSize: 13)),
                ],
              ),
            ),
          Expanded(child: child),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _calculateIndex(context),
        onDestinationSelected: (i) => _onTap(i, context),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.dashboard_outlined), selectedIcon: Icon(Icons.dashboard), label: 'Dashboard'),
          NavigationDestination(icon: Icon(Icons.people_outline), selectedIcon: Icon(Icons.people), label: 'Farzandlar'),
          NavigationDestination(icon: Icon(Icons.payments_outlined), selectedIcon: Icon(Icons.payments), label: "To'lovlar"),
          NavigationDestination(icon: Icon(Icons.chat_outlined), selectedIcon: Icon(Icons.chat), label: 'Xabarlar'),
          NavigationDestination(icon: Icon(Icons.notifications_outlined), selectedIcon: Icon(Icons.notifications), label: 'Bildirishnomalar'),
        ],
      ),
    );
  }

  int _calculateIndex(BuildContext context) {
    final location = GoRouterState.of(context).matchedLocation;
    if (location.startsWith('/parent/children')) return 1;
    if (location.startsWith('/parent/payments')) return 2;
    if (location.startsWith('/parent/chat')) return 3;
    if (location.startsWith('/parent/notifications')) return 4;
    return 0;
  }

  void _onTap(int i, BuildContext context) {
    switch (i) {
      case 0: context.go('/parent');
      case 1: context.go('/parent/children');
      case 2: context.go('/parent/payments');
      case 3: context.go('/parent/chat');
      case 4: context.go('/parent/notifications');
    }
  }
}
