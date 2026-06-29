import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shimmer/shimmer.dart';
import '../core/auth_provider.dart';
import '../core/api_client.dart';

class ParentDashboardScreen extends StatefulWidget {
  @override
  State<ParentDashboardScreen> createState() => _ParentDashboardScreenState();
}

class _ParentDashboardScreenState extends State<ParentDashboardScreen> {
  List<dynamic>? _children;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final data = await ApiClient().get('/parent/children');
      setState(() { _children = data as List; _loading = false; });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    return Scaffold(
      appBar: AppBar(
        title: Text('Dashboard'),
        actions: [
          IconButton(
            icon: Icon(Icons.notifications_outlined),
            onPressed: () => Navigator.pushNamed(context, '/notifications'),
          ),
          IconButton(
            icon: Icon(Icons.logout),
            onPressed: () async {
              await auth.logout();
              Navigator.pushReplacementNamed(context, '/login');
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        child: _loading ? _buildShimmer() : _buildContent(),
      ),
    );
  }

  Widget _buildShimmer() {
    return Shimmer.fromColors(
      baseColor: Colors.grey[300]!,
      highlightColor: Colors.grey[100]!,
      child: ListView(padding: EdgeInsets.all(16), children: List.generate(4, (_) => Container(height: 100, margin: EdgeInsets.only(bottom: 12), decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12))))),
    );
  }

  Widget _buildContent() {
    final children = _children ?? [];
    final totalDue = children.fold<double>(0, (s, c) => s + (c['totalPaid'] ?? 0));
    final childCount = children.length;
    final todayPresent = children.where((c) => c['todayStatus'] == 'present').length;

    return ListView(padding: EdgeInsets.all(16), children: [
      // Stats cards
      Row(children: [
        _statCard('Farzandlar', '$childCount ta', Icons.people, Color(0xFF6366F1)),
        SizedBox(width: 12),
        _statCard("To'lovlar", '${totalDue.toStringAsFixed(0)} so\'m', Icons.payments, Color(0xFF10B981)),
      ]),
      SizedBox(height: 12),
      Row(children: [
        _statCard('Bugun keldi', '$todayPresent/$childCount', Icons.check_circle, Color(0xFF3B82F6)),
        SizedBox(width: 12),
        _statCard('Qarzdorlik', '${children.where((c) => c['paymentStatus'] == 'debt').length} ta', Icons.warning, Color(0xFFEF4444)),
      ]),
      SizedBox(height: 24),
      Text('Farzandlaringiz', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
      SizedBox(height: 12),
      ...children.map((c) => _childCard(c)),
    ]);
  }

  Widget _statCard(String title, String value, IconData icon, Color color) {
    return Expanded(
      child: Card(
        child: Padding(padding: EdgeInsets.all(16), child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: color, size: 28),
            SizedBox(height: 8),
            Text(value, style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            Text(title, style: TextStyle(color: Colors.grey[500], fontSize: 12)),
          ],
        )),
      ),
    );
  }

  Widget _childCard(dynamic child) {
    final status = child['todayStatus'];
    final statusColor = status == 'present' ? Colors.green : status == 'absent' ? Colors.red : Colors.grey;
    final statusText = status == 'present' ? "Keldi" : status == 'absent' ? "Kelmadi" : status == 'late' ? "Kechikdi" : status == 'excused' ? "Sababli" : "Belgilanmagan";

    return Card(
      margin: EdgeInsets.only(bottom: 12),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () => Navigator.pushNamed(context, '/child', arguments: child),
        child: Padding(padding: EdgeInsets.all(16), child: Row(
          children: [
            CircleAvatar(
              radius: 28,
              backgroundColor: Color(0xFF6366F1).withOpacity(0.1),
              child: Text((child['name'] ?? '?').toString()[0].toUpperCase(), style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Color(0xFF6366F1))),
            ),
            SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(child['name'] ?? '', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                  SizedBox(height: 4),
                  Text('${child['groupName'] ?? 'N/A'} | ${child['teacherName'] ?? 'N/A'}', style: TextStyle(color: Colors.grey[500], fontSize: 13)),
                ],
              ),
            ),
            Container(
              padding: EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(color: statusColor.withOpacity(0.1), borderRadius: BorderRadius.circular(20)),
              child: Text(statusText, style: TextStyle(color: statusColor, fontSize: 11, fontWeight: FontWeight.w500)),
            ),
          ],
        )),
      ),
    );
  }
}
