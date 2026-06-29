import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';
import '../core/api_client.dart';

class ParentNotificationsScreen extends StatefulWidget {
  @override
  State<ParentNotificationsScreen> createState() => _ParentNotificationsScreenState();
}

class _ParentNotificationsScreenState extends State<ParentNotificationsScreen> {
  List<dynamic>? _notifications;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final d = await ApiClient().get('/notifications');
      if (mounted) setState(() { _notifications = d as List; _loading = false; });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Scaffold(
        appBar: AppBar(title: Text('Xabarnomalar')),
        body: Shimmer.fromColors(
          baseColor: Colors.grey[300]!,
          highlightColor: Colors.grey[100]!,
          child: ListView(padding: EdgeInsets.all(16), children: List.generate(5, (_) => Container(height: 70, margin: EdgeInsets.only(bottom: 8), decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12))))),
        ),
      );
    }

    if (_notifications == null || _notifications!.isEmpty) {
      return Scaffold(
        appBar: AppBar(title: Text('Xabarnomalar')),
        body: Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
          Icon(Icons.notifications_none, size: 64, color: Colors.grey[300]),
          SizedBox(height: 16),
          Text('Xabarnomalar mavjud emas', style: TextStyle(color: Colors.grey[500])),
        ])),
      );
    }

    return Scaffold(
      appBar: AppBar(title: Text('Xabarnomalar')),
      body: RefreshIndicator(
        onRefresh: _load,
        child: ListView.builder(
          padding: EdgeInsets.all(16),
          itemCount: _notifications!.length,
          itemBuilder: (_, i) {
            final n = _notifications![i];
            IconData icon;
            Color color;
            switch (n['type'] as String? ?? '') {
              case 'attendance': icon = Icons.calendar_month; color = Colors.blue; break;
              case 'payment': icon = Icons.payments; color = Colors.green; break;
              case 'homework': icon = Icons.home_work; color = Colors.orange; break;
              default: icon = Icons.notifications; color = Colors.grey;
            }
            return Card(
              margin: EdgeInsets.only(bottom: 8),
              child: ListTile(
                leading: CircleAvatar(backgroundColor: color.withOpacity(0.1), child: Icon(icon, color: color)),
                title: Text(n['title'] ?? '', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                subtitle: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (n['message'] != null) Text(n['message'] as String, style: TextStyle(fontSize: 12, color: Colors.grey[600])),
                    if (n['createdAt'] != null) Text(n['createdAt'].toString().substring(0, 10), style: TextStyle(fontSize: 11, color: Colors.grey[400])),
                  ],
                ),
                trailing: n['read'] == false ? Icon(Icons.circle, size: 8, color: Color(0xFF6366F1)) : null,
                onTap: () async {
                  if (n['read'] == false) {
                    await ApiClient().post('/notifications/${n['id']}/read');
                    _load();
                  }
                },
              ),
            );
          },
        ),
      ),
    );
  }
}
