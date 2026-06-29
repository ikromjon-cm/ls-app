import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/api_client.dart';

final childrenProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final response = await ref.read(apiClientProvider).get('/parent/children');
  final data = response['data'];
  return (data is List ? data : []).cast<Map<String, dynamic>>();
});

class ParentChildrenScreen extends ConsumerWidget {
  const ParentChildrenScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final children = ref.watch(childrenProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Farzandlarim'), centerTitle: true),
      body: children.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (_, __) => const Center(child: Text('Xatolik yuz berdi')),
        data: (list) => list.isEmpty
            ? const Center(child: Text('Farzandlar mavjud emas'))
            : ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: list.length,
                itemBuilder: (_, i) => Card(
                  child: ListTile(
                    leading: CircleAvatar(child: Text((list[i]['name'] as String? ?? '?')[0])),
                    title: Text(list[i]['name'] ?? ''),
                    subtitle: Text(list[i]['groupName'] ?? ''),
                    trailing: Chip(label: Text(list[i]['paymentStatus'] ?? '')),
                  ),
                ),
              ),
      ),
    );
  }
}
