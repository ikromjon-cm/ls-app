import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shimmer/shimmer.dart';
import '../core/auth_provider.dart';
import '../core/api_client.dart';

class StudentHomeScreen extends StatefulWidget {
  @override
  State<StudentHomeScreen> createState() => _StudentHomeScreenState();
}

class _StudentHomeScreenState extends State<StudentHomeScreen> {
  Map<String, dynamic>? _data;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final d = await ApiClient().get('/student/portal');
      if (mounted) setState(() { _data = d; _loading = false; });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final student = _data?['student'] as Map<String, dynamic>?;
    final schedule = _data?['schedule'] as List<dynamic>? ?? [];
    return Scaffold(
      appBar: AppBar(
        title: const Text('Mening profilim'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () async {
              await auth.logout();
              if (mounted) Navigator.pushReplacementNamed(context, '/login');
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        child: _loading
          ? Shimmer.fromColors(
              baseColor: Colors.grey[300]!,
              highlightColor: Colors.grey[100]!,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: List.generate(4, (_) => Container(
                  height: 100,
                  margin: const EdgeInsets.only(bottom: 12),
                  decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12)),
                )),
              ),
            )
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Row(children: [
                      CircleAvatar(
                        radius: 30,
                        backgroundColor: const Color(0xFF6366F1).withOpacity(0.1),
                        child: Text(
                          (student?['name'] as String? ?? '?')[0].toUpperCase(),
                          style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Color(0xFF6366F1)),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(student?['name'] as String? ?? '', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                            Text('${_data?['group']?['name'] ?? ''} | ${student?['course'] ?? ''}', style: TextStyle(color: Colors.grey[500])),
                          ],
                        ),
                      ),
                    ]),
                  ),
                ),
                const SizedBox(height: 12),
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: [
                        _statItem("Davomat", '${_data?['attendancePercent'] ?? 0}%', Icons.calendar_today, Colors.blue),
                        _statItem("Qarzdorlik", _data?['debt'] == true ? 'Bor' : "Yo'q", Icons.warning, _data?['debt'] == true ? Colors.red : Colors.green),
                        _statItem("Bugun", _data?['todayAttendance'] == 'present' ? "Keldi" : '-', Icons.check_circle, Colors.orange),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                const Text('Mening ma\'lumotlarim', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                const SizedBox(height: 12),
                Row(children: [
                  _actionBtn(Icons.grading, 'Baholar', () {}),
                  const SizedBox(width: 12),
                  _actionBtn(Icons.home_work, 'Vazifalar', () {}),
                  const SizedBox(width: 12),
                  _actionBtn(Icons.schedule, 'Jadval', () {}),
                ]),
                const SizedBox(height: 16),
                const Text('Bugungi darslar', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                ...schedule.map((s) => Card(
                  margin: const EdgeInsets.only(bottom: 8),
                  child: ListTile(
                    leading: Container(
                      width: 48, height: 48,
                      decoration: BoxDecoration(color: const Color(0xFF6366F1).withOpacity(0.05), borderRadius: BorderRadius.circular(12)),
                      child: Center(child: Text(
                        (s['timeStart'] as String? ?? '').length >= 5 ? (s['timeStart'] as String).substring(0, 5) : '',
                        style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF6366F1)),
                      )),
                    ),
                    title: Text(s['subject'] as String? ?? '', style: const TextStyle(fontWeight: FontWeight.w600)),
                    subtitle: Text('${s['room'] ?? ''} | ${s['teacherName'] ?? ''}', style: TextStyle(color: Colors.grey[500], fontSize: 12)),
                  ),
                )),
              ],
            ),
      ),
    );
  }

  Widget _statItem(String label, String value, IconData icon, Color color) {
    return Column(children: [
      Icon(icon, color: color, size: 24),
      const SizedBox(height: 4),
      Text(value, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: color)),
      Text(label, style: TextStyle(fontSize: 11, color: Colors.grey[500])),
    ]);
  }

  Widget _actionBtn(IconData icon, String label, VoidCallback onTap) {
    return Expanded(
      child: Material(
        color: const Color(0xFF6366F1).withOpacity(0.05),
        borderRadius: BorderRadius.circular(12),
        child: InkWell(
          borderRadius: BorderRadius.circular(12),
          onTap: onTap,
          child: Container(
            padding: const EdgeInsets.symmetric(vertical: 20),
            child: Column(children: [
              Icon(icon, color: const Color(0xFF6366F1), size: 28),
              const SizedBox(height: 6),
              Text(label, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500)),
            ]),
          ),
        ),
      ),
    );
  }
}
