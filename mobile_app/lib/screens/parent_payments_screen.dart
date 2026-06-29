import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:shimmer/shimmer.dart';
import '../core/api_client.dart';

class ParentPaymentsScreen extends StatefulWidget {
  @override
  State<ParentPaymentsScreen> createState() => _ParentPaymentsScreenState();
}

class _ParentPaymentsScreenState extends State<ParentPaymentsScreen> {
  List<dynamic>? _payments;
  List<dynamic>? _children;
  bool _loading = true;
  String _filterChild = '';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final c = await ApiClient().get('/parent/children');
      final p = await ApiClient().get('/parent/payments');
      if (mounted) setState(() { _children = c as List; _payments = p as List; _loading = false; });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Scaffold(
        appBar: AppBar(title: Text("To'lovlar")),
        body: Shimmer.fromColors(
          baseColor: Colors.grey[300]!,
          highlightColor: Colors.grey[100]!,
          child: ListView(padding: EdgeInsets.all(16), children: List.generate(4, (_) => Container(height: 80, margin: EdgeInsets.only(bottom: 12), decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12))))),
        ),
      );
    }
    return Scaffold(
      appBar: AppBar(title: Text("To'lovlar")),
      body: Column(
        children: [
          if (_children != null && _children!.length > 1)
            Padding(
              padding: EdgeInsets.fromLTRB(16, 8, 16, 0),
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(children: [
                  ChoiceChip(label: Text('Barchasi'), selected: _filterChild.isEmpty, onSelected: (_) => setState(() => _filterChild = '')),
                  SizedBox(width: 8),
                  ..._children!.map((c) => Padding(
                    padding: EdgeInsets.only(right: 8),
                    child: ChoiceChip(label: Text(c['name'] ?? ''), selected: _filterChild == '${c['id']}', onSelected: (_) => setState(() => _filterChild = '${c['id']}')),
                  )),
                ]),
              ),
            ),
          Expanded(
            child: _payments == null || _payments!.isEmpty
              ? Center(child: Text("To'lovlar mavjud emas", style: TextStyle(color: Colors.grey[500])))
              : ListView.builder(
                  padding: EdgeInsets.all(16),
                  itemCount: _payments!.length,
                  itemBuilder: (_, i) {
                    final p = _payments![i];
                    if (_filterChild.isNotEmpty && '${p['studentId']}' != _filterChild) return SizedBox.shrink();
                    return Card(
                      margin: EdgeInsets.only(bottom: 8),
                      child: ListTile(
                        leading: CircleAvatar(
                          backgroundColor: Color(0xFF10B981).withOpacity(0.1),
                          child: Icon(Icons.payments, color: Color(0xFF10B981)),
                        ),
                        title: Text('${NumberFormat('#,###').format(p['amount'])} so\'m', style: TextStyle(fontWeight: FontWeight.bold)),
                        subtitle: Text('${p['date'] ?? ''} | ${p['method'] ?? ''}'),
                        trailing: Text(p['createdByName'] ?? '', style: TextStyle(color: Colors.grey[500], fontSize: 12)),
                      ),
                    );
                  },
                ),
          ),
        ],
      ),
    );
  }
}
