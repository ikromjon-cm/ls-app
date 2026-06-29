import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/storage/local_storage.dart';

final dashboardDataProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  try {
    final response = await ref.read(apiClientProvider).getDashboard();
    final data = response['data'] as Map<String, dynamic>;
    await LocalStorage.cacheDashboard(data);
    return data;
  } catch (e) {
    final cached = LocalStorage.getCachedDashboard();
    if (cached != null) return cached;
    rethrow;
  }
});

class ParentDashboardScreen extends ConsumerWidget {
  const ParentDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final dashboard = ref.watch(dashboardDataProvider);
    final cs = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(title: const Text('Dashboard'), centerTitle: true),
      body: dashboard.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.cloud_off, size: 48, color: cs.error),
              const SizedBox(height: 16),
              Text('Ma\'lumotlarni yuklashda xatolik', style: TextStyle(color: cs.onSurfaceVariant)),
              const SizedBox(height: 8),
              FilledButton.tonal(onPressed: () => ref.invalidate(dashboardDataProvider), child: const Text('Qayta urinish')),
            ],
          ),
        ),
        data: (data) => RefreshIndicator(
          onRefresh: () => ref.refresh(dashboardDataProvider.future),
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              _StatCard(
                icon: Icons.school, label: "O'quvchilar", value: '${data['totalStudents'] ?? 0}',
                color: cs.primary, iconBg: cs.primaryContainer,
              ),
              const SizedBox(height: 12),
              _StatCard(
                icon: Icons.group, label: 'Guruhlar', value: '${data['totalGroups'] ?? 0}',
                color: cs.tertiary, iconBg: cs.tertiaryContainer,
              ),
              const SizedBox(height: 12),
              _StatCard(
                icon: Icons.payments, label: "Bugungi to'lov", value: '${(data['todayRevenue'] ?? 0).toString()} so\'m',
                color: Colors.green, iconBg: Colors.green.withValues(alpha: 0.15),
              ),
              const SizedBox(height: 12),
              _StatCard(
                icon: Icons.dangerous, label: 'Qarzdorlar', value: '${data['debtors'] ?? 0}',
                color: cs.error, iconBg: cs.errorContainer,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final IconData icon;
  final String label, value;
  final Color color, iconBg;
  const _StatCard({required this.icon, required this.label, required this.value, required this.color, required this.iconBg});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: iconBg, borderRadius: BorderRadius.circular(12)),
              child: Icon(icon, color: color, size: 28),
            ),
            const SizedBox(width: 16),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant)),
                const SizedBox(height: 4),
                Text(value, style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold)),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
