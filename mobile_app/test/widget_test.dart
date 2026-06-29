import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:opencode_crm_app/main.dart';

void main() {
  testWidgets('App loads', (WidgetTester tester) async {
    await tester.pumpWidget(const OpenCodeApp());
    expect(find.byType(MaterialApp), findsOneWidget);
  });
}
