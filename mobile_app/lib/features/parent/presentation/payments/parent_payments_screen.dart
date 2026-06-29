import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/api_client.dart';

final paymentsProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final response = await ref.read(apiClientProvider).get('/parent/payments');
  final data = response['data'];
  return (data is List ? data : []).cast<Map<String, dynamic>>();
});

class ParentPaymentsScreen extends ConsumerWidget {
  const ParentPaymentsScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final payments = ref.watch(paymentsProvider);
    return Scaffold(
      appBar: AppBar(title: const Text("To'lovlar"), centerTitle: true),
      body: payments.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (_, __) => const Center(child: Text('Xatolik yuz berdi')),
        data: (list) => list.isEmpty
            ? const Center(child: Text("To'lovlar mavjud emas"))
            : ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: list.length,
                itemBuilder: (_, i) => Card(
                  child: ListTile(
                    leading: CircleAvatar(child: Text((list[i]['studentName'] as String? ?? '?')[0])),
                    title: Text('${list[i]['amount'] ?? 0} so\'m'),
                    subtitle: Text('${list[i]['method'] ?? ''} • ${list[i]['date'] ?? ''}'),
                  ),
                ),
              ),
      ),
    );
  }
}
