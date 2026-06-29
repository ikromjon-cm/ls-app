import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/providers/auth_provider.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});
  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _loginCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  bool _showPass = false;
  bool _isOtpMode = false;

  @override
  void dispose() { _loginCtrl.dispose(); _passCtrl.dispose(); _phoneCtrl.dispose(); super.dispose(); }

  Future<void> _login() async {
    if (_isOtpMode) {
      final phone = _phoneCtrl.text.trim();
      if (phone.length < 9) return;
      await ref.read(authProvider.notifier).loginWithOtp(phone);
      if (mounted) context.push('/otp', extra: phone);
    } else {
      if (_loginCtrl.text.isEmpty || _passCtrl.text.isEmpty) return;
      await ref.read(authProvider.notifier).login(_loginCtrl.text.trim(), _passCtrl.text);
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(authProvider);
    final cs = Theme.of(context).colorScheme;

    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: cs.primaryContainer.withValues(alpha: 0.3),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Icon(Icons.school_rounded, size: 48, color: cs.primary),
                ),
                const SizedBox(height: 24),
                Text('OpenCode CRM', style: Theme.of(context).textTheme.displaySmall?.copyWith(fontWeight: FontWeight.bold)),
                const SizedBox(height: 4),
                Text('Tizimga kirish', style: Theme.of(context).textTheme.bodyLarge?.copyWith(color: cs.onSurfaceVariant)),
                const SizedBox(height: 32),

                if (state.error != null)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 16),
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: cs.error.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        children: [
                          Icon(Icons.error_outline, color: cs.error, size: 20),
                          const SizedBox(width: 8),
                          Expanded(child: Text(state.error!, style: TextStyle(color: cs.error))),
                        ],
                      ),
                    ),
                  ),

                if (_isOtpMode) ...[
                  TextField(
                    controller: _phoneCtrl,
                    keyboardType: TextInputType.phone,
                    decoration: InputDecoration(
                      labelText: 'Telefon raqam',
                      hintText: '+998901234567',
                      prefixIcon: const Icon(Icons.phone_android),
                    ),
                  ),
                ] else ...[
                  TextField(
                    controller: _loginCtrl,
                    textInputAction: TextInputAction.next,
                    decoration: InputDecoration(
                      labelText: 'Login yoki Email',
                      prefixIcon: const Icon(Icons.person_outline),
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: _passCtrl,
                    obscureText: !_showPass,
                    textInputAction: TextInputAction.done,
                    onSubmitted: (_) => _login(),
                    decoration: InputDecoration(
                      labelText: 'Parol',
                      prefixIcon: const Icon(Icons.lock_outline),
                      suffixIcon: IconButton(
                        icon: Icon(_showPass ? Icons.visibility_off : Icons.visibility),
                        onPressed: () => setState(() => _showPass = !_showPass),
                      ),
                    ),
                  ),
                ],
                const SizedBox(height: 24),

                FilledButton(
                  onPressed: state.loading ? null : _login,
                  child: state.loading
                      ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                      : Text(_isOtpMode ? 'Kod yuborish' : 'Kirish'),
                ),
                const SizedBox(height: 12),
                TextButton(
                  onPressed: () => setState(() => _isOtpMode = !_isOtpMode),
                  child: Text(_isOtpMode ? 'Parol bilan kirish' : 'Telefon orqali kirish'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
