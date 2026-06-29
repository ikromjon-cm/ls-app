import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/auth_provider.dart';
import '../core/api_client.dart';

class ParentChatScreen extends StatefulWidget {
  ParentChatScreen({Key? key}) : super(key: key);
  @override
  State<ParentChatScreen> createState() => _ParentChatScreenState();
}

class _ParentChatScreenState extends State<ParentChatScreen> {
  final _msgCtrl = TextEditingController();
  final _scrollCtrl = ScrollController();
  List<dynamic> _messages = [];
  List<dynamic> _teachers = [];
  dynamic _selectedTeacher;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _loadTeachers();
  }

  @override
  void dispose() {
    _msgCtrl.dispose();
    _scrollCtrl.dispose();
    _timer?.cancel();
    super.dispose();
  }

  Future<void> _loadTeachers() async {
    try {
      final teachers = await ApiClient().get('/users?role=teacher');
      setState(() => _teachers = teachers as List);
      if (teachers.isNotEmpty) {
        _selectedTeacher = teachers.first;
        _loadMessages();
      }
    } catch (_) {}
  }

  Future<void> _loadMessages() async {
    if (_selectedTeacher == null) return;
    try {
      final auth = context.read<AuthProvider>();
      final msgs = await ApiClient().get('/messages', params: {'parentId': '${auth.user!['id']}', 'teacherId': '${_selectedTeacher!['id']}'});
      if (mounted) setState(() => _messages = msgs as List);
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (_scrollCtrl.hasClients) _scrollCtrl.animateTo(_scrollCtrl.position.maxScrollExtent, duration: Duration(milliseconds: 200), curve: Curves.easeOut);
      });
    } catch (_) {}
  }

  Future<void> _sendMessage() async {
    if (_msgCtrl.text.trim().isEmpty || _selectedTeacher == null) return;
    final auth = context.read<AuthProvider>();
    try {
      await ApiClient().post('/messages', data: {
        'receiverId': _selectedTeacher!['id'],
        'text': _msgCtrl.text.trim(),
      });
      _msgCtrl.clear();
      _loadMessages();
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: _selectedTeacher == null
          ? Text('Chat')
          : DropdownButton(
              value: _selectedTeacher,
              isDense: true,
              underline: SizedBox(),
              items: _teachers.map((t) => DropdownMenuItem(value: t, child: Text(t['name'] ?? ''))).toList(),
              onChanged: (v) => setState(() { _selectedTeacher = v; _loadMessages(); }),
            ),
      ),
      body: Column(
        children: [
          Expanded(
            child: _messages.isEmpty
              ? Center(child: Text('Xabarlar mavjud emas', style: TextStyle(color: Colors.grey[500])))
              : ListView.builder(
                  controller: _scrollCtrl,
                  padding: EdgeInsets.all(16),
                  itemCount: _messages.length,
                  itemBuilder: (_, i) {
                    final m = _messages[i];
                    final isMe = m['senderRole'] == 'parent';
                    return Align(
                      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
                      child: Container(
                        margin: EdgeInsets.only(bottom: 8),
                        padding: EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                        decoration: BoxDecoration(
                          color: isMe ? Color(0xFF6366F1) : Colors.grey[100],
                          borderRadius: BorderRadius.only(
                            topLeft: Radius.circular(16), topRight: Radius.circular(16),
                            bottomLeft: isMe ? Radius.circular(16) : Radius.circular(4),
                            bottomRight: isMe ? Radius.circular(4) : Radius.circular(16),
                          ),
                        ),
                        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.75),
                        child: Text(m['text'] ?? '', style: TextStyle(color: isMe ? Colors.white : Colors.black87, fontSize: 14)),
                      ),
                    );
                  },
                ),
          ),
          Container(
            padding: EdgeInsets.all(12),
            decoration: BoxDecoration(color: Theme.of(context).scaffoldBackgroundColor, boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 8)]),
            child: SafeArea(
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _msgCtrl,
                      decoration: InputDecoration(hintText: 'Xabar yozish...', contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 10), isDense: true),
                      textInputAction: TextInputAction.send,
                      onSubmitted: (_) => _sendMessage(),
                    ),
                  ),
                  SizedBox(width: 8),
                  IconButton.filled(
                    onPressed: _sendMessage,
                    icon: Icon(Icons.send),
                    color: Colors.white,
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
