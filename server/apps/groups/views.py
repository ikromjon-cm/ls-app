from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db.models import Count
from apps.accounts.models import Group, Homework, ScheduleEntry, Student
from apps.accounts.auth import verify_access_token


def _get_user(request):
    auth = request.headers.get('Authorization', '')
    if auth.startswith('Bearer '):
        return verify_access_token(auth[7:])
    return None


@api_view(['GET', 'POST'])
def group_list(request):
    user = _get_user(request)
    if not user:
        return Response({'success': False, 'message': 'Unauthorized', 'errors': ['NO_TOKEN']}, status=401)

    org_id = user['organizationId']

    if request.method == 'GET':
        qs = Group.objects.filter(organization_id=org_id)
        if user.get('role') == 'teacher':
            qs = qs.filter(teacher_id=user['userId'])
        groups = qs.annotate(student_count=Count('students')).order_by('-created_at')
        data = []
        for g in groups:
            data.append({
                'id': g.id, 'name': g.name, 'course': g.course, 'teacherId': g.teacher_id,
                'teacherName': g.teacher_name, 'room': g.room, 'status': g.status,
                'price': g.price, 'startDate': g.start_date, 'daysOfWeek': g.days_of_week,
                'startTime': g.start_time, 'endTime': g.end_time, 'monthDuration': g.month_duration,
                '_count': {'students': g.student_count},
                'createdAt': g.created_at,
            })
        return Response({'success': True, 'message': 'OK', 'data': data, 'errors': []})

    if user.get('role') not in ('super_admin', 'org_admin'):
        return Response({'success': False, 'message': "Ruxsat yo'q", 'errors': ['FORBIDDEN']}, status=403)

    body = request.data
    group = Group.objects.create(
        organization_id=org_id, name=body.get('name'), course=body.get('course'),
        teacher_id=body.get('teacherId'), teacher_name=body.get('teacherName'),
        room=body.get('room'), price=body.get('price'),
        start_date=body.get('startDate'), days_of_week=body.get('daysOfWeek'),
        start_time=body.get('startTime'), end_time=body.get('endTime'),
        month_duration=body.get('monthDuration'),
    )
    return Response({
        'success': True, 'message': 'Guruh yaratildi',
        'data': {'id': group.id, 'name': group.name},
        'errors': [],
    }, status=201)


@api_view(['PUT', 'DELETE'])
def group_detail(request, group_id):
    user = _get_user(request)
    if not user:
        return Response({'success': False, 'message': 'Unauthorized', 'errors': ['NO_TOKEN']}, status=401)

    if user.get('role') not in ('super_admin', 'org_admin'):
        return Response({'success': False, 'message': "Ruxsat yo'q", 'errors': ['FORBIDDEN']}, status=403)

    if request.method == 'PUT':
        Group.objects.filter(id=group_id).update(**request.data)
        return Response({'success': True, 'message': 'Guruh yangilandi', 'data': None, 'errors': []})

    Homework.objects.filter(group_id=group_id).delete()
    ScheduleEntry.objects.filter(group_id=group_id).delete()
    Student.objects.filter(group_id=group_id).update(group=None)
    Group.objects.filter(id=group_id).delete()
    return Response({'success': True, 'message': "Guruh o'chirildi", 'data': None, 'errors': []})
