import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class StudentHomeScreen extends ConsumerWidget {
  const StudentHomeScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cs = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(title: const Text('Shaxsiy kabinet'), centerTitle: true),
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.school, size: 64, color: cs.primary),
            const SizedBox(height: 16),
            Text('O\'quvchi paneli', style: Theme.of(context).textTheme.headlineSmall),
            const SizedBox(height: 8),
            Text('Tez kunda...', style: TextStyle(color: cs.onSurfaceVariant)),
          ],
        ),
      ),
    );
  }
}
