import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import '../core/api_client.dart';

class ChildDetailScreen extends StatefulWidget {
  final Map<String, dynamic> child;
  ChildDetailScreen({required this.child});

  @override
  State<ChildDetailScreen> createState() => _ChildDetailScreenState();
}

class _ChildDetailScreenState extends State<ChildDetailScreen> {
  Map<String, dynamic>? _portalData;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final data = await ApiClient().get('/student/portal?id=${widget.child['id']}');
      setState(() { _portalData = data; _loading = false; });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final child = widget.child;
    return Scaffold(
      appBar: AppBar(title: Text(child['name'] ?? '')),
      body: _loading
        ? Center(child: CircularProgressIndicator())
        : ListView(padding: EdgeInsets.all(16), children: [
          // Info card
          Card(child: Padding(padding: EdgeInsets.all(16), child: Column(
            children: [
              CircleAvatar(
                radius: 32,
                backgroundColor: Color(0xFF6366F1).withOpacity(0.1),
                child: Text((child['name'] ?? '?').toString()[0].toUpperCase(), style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Color(0xFF6366F1))),
              ),
              SizedBox(height: 8),
              Text(child['name'] ?? '', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              Text('${child['groupName'] ?? 'N/A'} • ${child['teacherName'] ?? 'N/A'}', style: TextStyle(color: Colors.grey[500])),
            ],
          ))),
          SizedBox(height: 16),

          // Quick stats
          Row(children: [
            _quickStat("Davomat", "${child['attendancePercent'] ?? 0}%", Icons.calendar_today, Colors.blue),
            SizedBox(width: 12),
            _quickStat("To'lov", '${(child['totalPaid'] ?? 0).toStringAsFixed(0)} so\'m', Icons.payments, Colors.green),
          ]),
          SizedBox(height: 12),
          Row(children: [
            _quickStat('Qarzdorlik', child['paymentStatus'] == 'debt' ? 'Bor' : 'Yo\'q', Icons.warning, child['paymentStatus'] == 'debt' ? Colors.red : Colors.green),
            SizedBox(width: 12),
            _quickStat('Bugun', child['todayStatus'] == 'present' ? "Keldi" : child['todayStatus'] == 'absent' ? "Kelmadi" : '-', Icons.info, Colors.orange),
          ]),
          SizedBox(height: 24),

          // Attendance chart
          Text('Davomat statistikasi', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          SizedBox(height: 8),
          Card(child: Padding(padding: EdgeInsets.all(16), child: SizedBox(
            height: 200,
            child: _portalData?['grades'] != null && (_portalData!['grades'] as List).isNotEmpty
              ? BarChart(BarChartData(
                  barGroups: (_portalData!['grades'] as List).asMap().entries.map((e) => BarChartGroupData(x: e.key, barRods: [
                    BarChartRodData(toY: (e.value['average'] as num?)?.toDouble() ?? 0, color: Color(0xFF6366F1), width: 16, borderRadius: BorderRadius.circular(4)),
                  ])).toList(),
                  titlesData: FlTitlesData(
                    leftTitles: AxisTitles(sideTitles: SideTitles(showTitles: true, reservedSize: 28, getTitlesWidget: (v, _) => Text('${v.toInt()}', style: TextStyle(fontSize: 10)))),
                    bottomTitles: AxisTitles(sideTitles: SideTitles(showTitles: true, getTitlesWidget: (v, _) {
                      final grades = _portalData!['grades'] as List;
                      if (v.toInt() < grades.length) return Text(grades[v.toInt()]['subject'].toString().substring(0, 3), style: TextStyle(fontSize: 9));
                      return Text('');
                    })),
                    topTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                    rightTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  ),
                  gridData: FlGridData(show: true, drawVerticalLine: false),
                  borderData: FlBorderData(show: false),
                ))
              : Center(child: Text('Ma\'lumot mavjud emas', style: TextStyle(color: Colors.grey[500]))),
          ))),

          // Action buttons
          SizedBox(height: 16),
          Wrap(spacing: 12, runSpacing: 12, children: [
            _actionBtn(Icons.calendar_month, 'Davomat', () => Navigator.pushNamed(context, '/attendance', arguments: child)),
            _actionBtn(Icons.payments, "To'lovlar", () => Navigator.pushNamed(context, '/payments', arguments: child)),
            _actionBtn(Icons.grading, 'Baholar', () => Navigator.pushNamed(context, '/grades', arguments: child)),
            _actionBtn(Icons.home_work, 'Vazifalar', () => Navigator.pushNamed(context, '/homework', arguments: child)),
          ]),
        ]),
    );
  }

  Widget _quickStat(String label, String value, IconData icon, Color color) {
    return Expanded(
      child: Card(
        child: Padding(padding: EdgeInsets.all(12), child: Column(
          children: [
            Icon(icon, color: color, size: 24),
            SizedBox(height: 4),
            Text(value, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: color)),
            Text(label, style: TextStyle(color: Colors.grey[500], fontSize: 11)),
          ],
        )),
      ),
    );
  }

  Widget _actionBtn(IconData icon, String label, VoidCallback onTap) {
    return Material(
      color: Color(0xFF6366F1).withOpacity(0.05),
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: onTap,
        child: Container(
          width: (MediaQuery.of(context).size.width - 56) / 2,
          padding: EdgeInsets.symmetric(vertical: 16),
          child: Column(
            children: [
              Icon(icon, color: Color(0xFF6366F1), size: 28),
              SizedBox(height: 6),
              Text(label, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500)),
            ],
          ),
        ),
      ),
    );
  }
}
