from rest_framework.decorators import api_view
from rest_framework.response import Response
from apps.accounts.models import Student, Group, Notification, Payment, Attendance, Grade, Certificate
from apps.accounts.auth import verify_access_token


def _user(request):
    auth = request.headers.get('Authorization', '')
    if auth.startswith('Bearer '):
        return verify_access_token(auth[7:])
    return None


@api_view(['GET', 'POST'])
def student_list(request):
    user = _user(request)
    if not user:
        return Response({'success': False, 'message': 'Unauthorized', 'errors': ['NO_TOKEN']}, status=401)

    org_id = user['organizationId']

    if request.method == 'GET':
        students = Student.objects.filter(organization_id=org_id).select_related('group').order_by('-created_at')
        data = []
        for s in students:
            data.append({
                'id': s.id, 'name': s.name, 'phone': s.phone, 'groupId': s.group_id,
                'groupName': s.group.name if s.group else 'N/A',
                'course': s.course, 'parentName': s.parent_name, 'parentPhone': s.parent_phone,
                'paymentStatus': s.payment_status, 'lastPaymentDate': s.last_payment_date,
                'riskGroup': s.risk_group, 'createdAt': s.created_at,
            })
        return Response({'success': True, 'message': 'OK', 'data': data, 'errors': []})

    if user.get('role') not in ('super_admin', 'org_admin'):
        return Response({'success': False, 'message': "Ruxsat yo'q", 'errors': ['FORBIDDEN']}, status=403)

    body = request.data
    group = None
    if body.get('groupId'):
        group = Group.objects.filter(id=body['groupId']).first()

    student = Student.objects.create(
        organization_id=org_id, name=body.get('name'), phone=body.get('phone'),
        group_id=body.get('groupId'), course=body.get('course'),
        parent_name=body.get('parentName'), parent_phone=body.get('parentPhone'),
        payment_status='debt',
    )

    if group:
        Notification.objects.create(
            organization_id=org_id, title="Yangi o'quvchi",
            message=f"{body.get('name')} guruhga qo'shildi", type='info',
        )

    return Response({
        'success': True, 'message': "O'quvchi qo'shildi",
        'data': {'id': student.id, 'name': student.name, 'groupName': group.name if group else 'N/A'},
        'errors': [],
    }, status=201)


@api_view(['PUT', 'DELETE'])
def student_detail(request, student_id):
    user = _user(request)
    if not user:
        return Response({'success': False, 'message': 'Unauthorized', 'errors': ['NO_TOKEN']}, status=401)

    if user.get('role') not in ('super_admin', 'org_admin'):
        return Response({'success': False, 'message': "Ruxsat yo'q", 'errors': ['FORBIDDEN']}, status=403)

    if request.method == 'PUT':
        Student.objects.filter(id=student_id).update(**request.data)
        return Response({'success': True, 'message': "O'quvchi yangilandi", 'data': None, 'errors': []})

    Payment.objects.filter(student_id=student_id).delete()
    Attendance.objects.filter(student_id=student_id).delete()
    Grade.objects.filter(student_id=student_id).delete()
    Certificate.objects.filter(student_id=student_id).delete()
    Student.objects.filter(id=student_id).delete()
    return Response({'success': True, 'message': "O'quvchi o'chirildi", 'data': None, 'errors': []})
