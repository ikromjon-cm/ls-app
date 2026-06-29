import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/providers/auth_provider.dart';

class OtpScreen extends ConsumerStatefulWidget {
  final String phone;
  const OtpScreen({super.key, required this.phone});
  @override
  ConsumerState<OtpScreen> createState() => _OtpScreenState();
}

class _OtpScreenState extends ConsumerState<OtpScreen> {
  final _codeCtrl = TextEditingController();

  @override
  void dispose() { _codeCtrl.dispose(); super.dispose(); }

  Future<void> _verify() async {
    if (_codeCtrl.text.length < 4) return;
    await ref.read(authProvider.notifier).verifyOtp(widget.phone, _codeCtrl.text.trim());
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(authProvider);
    final cs = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(title: const Text('Tasdiqlash')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            const Spacer(),
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(color: cs.primaryContainer.withValues(alpha: 0.3), borderRadius: BorderRadius.circular(20)),
              child: Icon(Icons.smartphone_rounded, size: 48, color: cs.primary),
            ),
            const SizedBox(height: 24),
            Text('Tasdiqlash kodi', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 8),
            Text('${widget.phone} raqamiga kod yuborildi', style: TextStyle(color: cs.onSurfaceVariant)),
            const SizedBox(height: 32),
            TextField(
              controller: _codeCtrl,
              keyboardType: TextInputType.number,
              textAlign: TextAlign.center,
              maxLength: 6,
              style: Theme.of(context).textTheme.headlineMedium,
              decoration: InputDecoration(counterText: '', hintText: '000000'),
            ),
            const SizedBox(height: 24),
            FilledButton(
              onPressed: state.loading ? null : _verify,
              child: state.loading
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                  : const Text('Tasdiqlash'),
            ),
            const Spacer(),
          ],
        ),
      ),
    );
  }
}
