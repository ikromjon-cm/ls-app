import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/connectivity_provider.dart';

class StudentShell extends ConsumerWidget {
  final Widget child;
  const StudentShell({super.key, required this.child});

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
    );
  }
}
