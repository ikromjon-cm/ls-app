import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';
import '../core/api_client.dart';

class ParentChildrenScreen extends StatefulWidget {
  @override
  State<ParentChildrenScreen> createState() => _ParentChildrenScreenState();
}

class _ParentChildrenScreenState extends State<ParentChildrenScreen> {
  List<dynamic>? _children;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final d = await ApiClient().get('/parent/children');
      if (mounted) setState(() { _children = d as List; _loading = false; });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Widget _shimmerLoading() {
    return Shimmer.fromColors(
      baseColor: Colors.grey[300]!,
      highlightColor: Colors.grey[100]!,
      child: ListView(
        padding: EdgeInsets.all(16),
        children: List.generate(3, (_) => Container(
          height: 160,
          margin: EdgeInsets.only(bottom: 12),
          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12)),
        )),
      ),
    );
  }

  Widget _emptyState() {
    return Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
      Icon(Icons.child_care_outlined, size: 64, color: Colors.grey[300]),
      SizedBox(height: 16),
      Text("Farzandlar mavjud emas", style: TextStyle(color: Colors.grey[500])),
    ]));
  }

  Widget _childCard(dynamic child) {
    return Card(
      margin: EdgeInsets.only(bottom: 12),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () => Navigator.pushNamed(context, '/child', arguments: child),
        child: Column(
          children: [
            ListTile(
              leading: CircleAvatar(
                radius: 24,
                backgroundColor: Color(0xFF6366F1).withOpacity(0.1),
                child: Text((child['name'] ?? '?').toString()[0].toUpperCase(), style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF6366F1))),
              ),
              title: Text(child['name'] ?? '', style: TextStyle(fontWeight: FontWeight.w600)),
              subtitle: Text('${child['groupName'] ?? 'N/A'} \u2022 ${child['teacherName'] ?? 'N/A'}'),
              trailing: Icon(Icons.chevron_right),
            ),
            Padding(
              padding: EdgeInsets.fromLTRB(16, 0, 16, 12),
              child: Row(children: [
                _stat('Davomat', '${child['attendancePercent'] ?? 0}%', Colors.blue),
                SizedBox(width: 12),
                _stat("To'lov", '${(child['totalPaid'] ?? 0).toStringAsFixed(0)} so\'m', Colors.green),
              ]),
            ),
          ],
        ),
      ),
    );
  }

  Widget _stat(String label, String value, Color color) {
    return Expanded(
      child: Container(
        padding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(color: color.withOpacity(0.05), borderRadius: BorderRadius.circular(8)),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(value, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: color)),
            Text(label, style: TextStyle(color: Colors.grey[500], fontSize: 11)),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    Widget body;
    if (_loading) {
      body = _shimmerLoading();
    } else if (_children == null || _children!.isEmpty) {
      body = _emptyState();
    } else {
      body = RefreshIndicator(
        onRefresh: _load,
        child: ListView.builder(
          padding: EdgeInsets.all(16),
          itemCount: _children!.length,
          itemBuilder: (_, i) => _childCard(_children![i]),
        ),
      );
    }
    return Scaffold(appBar: AppBar(title: Text('Farzandlarim')), body: body);
  }
}
