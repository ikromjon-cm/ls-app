import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/api_client.dart';

final chatProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final response = await ref.read(apiClientProvider).getMessages();
  final data = response['data'];
  return (data is List ? data : []).cast<Map<String, dynamic>>();
});

class ParentChatScreen extends ConsumerWidget {
  const ParentChatScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final messages = ref.watch(chatProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Xabarlar'), centerTitle: true),
      body: messages.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (_, __) => const Center(child: Text('Xatolik yuz berdi')),
        data: (list) => list.isEmpty
            ? const Center(child: Text('Xabarlar mavjud emas'))
            : ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: list.length,
                itemBuilder: (_, i) => Card(
                  child: ListTile(
                    title: Text(list[i]['content'] ?? ''),
                    subtitle: Text(list[i]['createdAt'] ?? ''),
                    leading: CircleAvatar(child: Icon(Icons.person)),
                  ),
                ),
              ),
      ),
    );
  }
}
