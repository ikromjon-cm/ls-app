import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/api_client.dart';

final notifProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final response = await ref.read(apiClientProvider).getNotifications();
  final data = response['data'];
  return (data is List ? data : []).cast<Map<String, dynamic>>();
});

class ParentNotificationsScreen extends ConsumerWidget {
  const ParentNotificationsScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notifs = ref.watch(notifProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Bildirishnomalar'), centerTitle: true),
      body: notifs.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (_, __) => const Center(child: Text('Xatolik yuz berdi')),
        data: (list) => list.isEmpty
            ? const Center(child: Text('Bildirishnomalar mavjud emas'))
            : ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: list.length,
                itemBuilder: (_, i) => Card(
                  child: ListTile(
                    leading: Icon(
                      list[i]['type'] == 'success' ? Icons.check_circle : list[i]['type'] == 'warning' ? Icons.warning : Icons.info,
                      color: list[i]['type'] == 'success' ? Colors.green : list[i]['type'] == 'warning' ? Colors.orange : Colors.blue,
                    ),
                    title: Text(list[i]['title'] ?? ''),
                    subtitle: Text(list[i]['message'] ?? ''),
                  ),
                ),
              ),
      ),
    );
  }
}
