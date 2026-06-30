from datetime import datetime
from rest_framework.decorators import api_view
from rest_framework.response import Response
from apps.accounts.models import Attendance, Student
from apps.accounts.auth import verify_access_token


def _user(request):
    auth = request.headers.get('Authorization', '')
    if auth.startswith('Bearer '):
        return verify_access_token(auth[7:])
    return None


@api_view(['GET', 'POST'])
def attendance_list(request):
    user = _user(request)
    if not user:
        return Response({'success': False, 'message': 'Unauthorized', 'errors': ['NO_TOKEN']}, status=401)

    org_id = user['organizationId']

    if request.method == 'GET':
        where = {'organization_id': org_id}
        date_str = request.query_params.get('date')
        group_id = request.query_params.get('groupId')
        if date_str:
            where['date__date'] = datetime.fromisoformat(date_str.replace('Z', '')).date()

        qs = Attendance.objects.filter(**where)
        if group_id:
            student_ids = Student.objects.filter(group_id=group_id).values_list('id', flat=True)
            qs = qs.filter(student_id__in=list(student_ids))

        attendance = qs.select_related('student').order_by('-created_at')
        data = [{
            'id': a.id, 'studentId': a.student_id,
            'studentName': a.student.name if a.student else '',
            'date': a.date, 'status': a.status, 'note': a.note,
        } for a in attendance]
        return Response({'success': True, 'message': 'OK', 'data': data, 'errors': []})

    if user.get('role') not in ('super_admin', 'org_admin', 'teacher'):
        return Response({'success': False, 'message': "Ruxsat yo'q", 'errors': ['FORBIDDEN']}, status=403)

    body = request.data
    date_val = body.get('date', datetime.now())
    student_id = body.get('studentId')

    existing = Attendance.objects.filter(
        organization_id=org_id, student_id=student_id,
        date__date=datetime.fromisoformat(date_val.replace('Z', '')).date() if isinstance(date_val, str) else date_val.date(),
    ).first()

    if existing:
        existing.status = body.get('status')
        existing.note = body.get('note')
        existing.marked_by_id = user['userId']
        existing.save()
        att = existing
    else:
        att = Attendance.objects.create(
            organization_id=org_id, student_id=student_id,
            date=date_val, status=body.get('status'), note=body.get('note'),
            marked_by_id=user['userId'],
        )

    return Response({'success': True, 'message': 'Davomat belgilandi', 'data': {'id': att.id}, 'errors': []})


@api_view(['POST'])
def attendance_bulk(request):
    user = _user(request)
    if not user or user.get('role') not in ('super_admin', 'org_admin', 'teacher'):
        return Response({'success': False, 'message': "Ruxsat yo'q", 'errors': ['FORBIDDEN']}, status=403)

    records = request.data.get('records', [])
    for rec in records:
        Attendance.objects.update_or_create(
            organization_id=user['organizationId'],
            student_id=rec.get('studentId'),
            date__date=datetime.fromisoformat(rec.get('date', '').replace('Z', '')).date() if rec.get('date') else datetime.now().date(),
            defaults={'status': rec.get('status'), 'note': rec.get('note'), 'marked_by_id': user['userId']},
        )
    return Response({'success': True, 'message': 'Davomat belgilandi', 'data': None, 'errors': []})
