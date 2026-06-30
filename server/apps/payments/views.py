from datetime import datetime
from rest_framework.decorators import api_view
from rest_framework.response import Response
from apps.accounts.models import Payment, Student
from apps.accounts.auth import verify_access_token


def _user(request):
    auth = request.headers.get('Authorization', '')
    if auth.startswith('Bearer '):
        return verify_access_token(auth[7:])
    return None


@api_view(['GET', 'POST'])
def payment_list(request):
    user = _user(request)
    if not user:
        return Response({'success': False, 'message': 'Unauthorized', 'errors': ['NO_TOKEN']}, status=401)

    org_id = user['organizationId']

    if request.method == 'GET':
        payments = Payment.objects.filter(organization_id=org_id).order_by('-created_at')
        data = []
        for p in payments:
            data.append({
                'id': p.id, 'studentId': p.student_id, 'studentName': p.student_name,
                'amount': p.amount, 'method': p.method, 'date': p.date,
                'note': p.note, 'groupId': p.group_id, 'createdById': p.created_by_id,
                'createdByName': p.created_by_name, 'createdAt': p.created_at,
            })
        return Response({'success': True, 'message': 'OK', 'data': data, 'errors': []})

    if user.get('role') not in ('super_admin', 'org_admin'):
        return Response({'success': False, 'message': "Ruxsat yo'q", 'errors': ['FORBIDDEN']}, status=403)

    body = request.data
    payment = Payment.objects.create(
        organization_id=org_id, student_id=body.get('studentId'),
        amount=body.get('amount'), method=body.get('method', 'Naqd'),
        date=body.get('date', datetime.now()), note=body.get('note'),
        student_name=body.get('studentName', ''), group_id=body.get('groupId'),
        created_by_id=user['userId'], created_by_name=body.get('createdByName', ''),
    )

    if body.get('studentId'):
        Student.objects.filter(id=body['studentId']).update(
            payment_status='paid', last_payment_date=datetime.now(),
        )

    return Response({
        'success': True, 'message': "To'lov qayd etildi",
        'data': {'id': payment.id, 'amount': payment.amount},
        'errors': [],
    }, status=201)


@api_view(['PUT', 'DELETE'])
def payment_detail(request, payment_id):
    user = _user(request)
    if not user:
        return Response({'success': False, 'message': 'Unauthorized', 'errors': ['NO_TOKEN']}, status=401)

    if user.get('role') not in ('super_admin', 'org_admin'):
        return Response({'success': False, 'message': "Ruxsat yo'q", 'errors': ['FORBIDDEN']}, status=403)

    if request.method == 'PUT':
        Payment.objects.filter(id=payment_id).update(**request.data)
        return Response({'success': True, 'message': "To'lov yangilandi", 'data': None, 'errors': []})

    Payment.objects.filter(id=payment_id).delete()
    return Response({'success': True, 'message': "To'lov o'chirildi", 'data': None, 'errors': []})
