from rest_framework.decorators import api_view
from rest_framework.response import Response
from apps.accounts.models import ScheduleEntry
from apps.accounts.auth import verify_access_token


def _user(request):
    auth = request.headers.get('Authorization', '')
    if auth.startswith('Bearer '):
        return verify_access_token(auth[7:])
    return None


@api_view(['GET', 'POST'])
def schedule_list(request):
    user = _user(request)
    if not user:
        return Response({'success': False, 'message': 'Unauthorized', 'errors': ['NO_TOKEN']}, status=401)

    org_id = user['organizationId']

    if request.method == 'GET':
        where = {'organization_id': org_id}
        group_id = request.query_params.get('groupId')
        day = request.query_params.get('day')
        if group_id:
            where['group_id'] = group_id
        if day:
            where['day'] = day
        entries = ScheduleEntry.objects.filter(**where).order_by('day', 'time_start')
        data = [{
            'id': e.id, 'groupId': e.group_id, 'subject': e.subject,
            'teacherId': e.teacher_id, 'day': e.day,
            'timeStart': e.time_start, 'timeEnd': e.time_end,
            'room': e.room, 'createdById': e.created_by_id,
        } for e in entries]
        return Response({'success': True, 'message': 'OK', 'data': data, 'errors': []})

    if user.get('role') not in ('super_admin', 'org_admin'):
        return Response({'success': False, 'message': "Ruxsat yo'q", 'errors': ['FORBIDDEN']}, status=403)

    body = request.data
    entry = ScheduleEntry.objects.create(
        organization_id=org_id, group_id=body.get('groupId'),
        subject=body.get('subject'), teacher_id=body.get('teacherId'),
        day=body.get('day'), time_start=body.get('timeStart'),
        time_end=body.get('timeEnd'), room=body.get('room'),
        created_by_id=user['userId'],
    )
    return Response({
        'success': True, 'message': "Dars qo'shildi",
        'data': {'id': entry.id}, 'errors': [],
    }, status=201)


@api_view(['DELETE'])
def schedule_detail(request, entry_id):
    user = _user(request)
    if not user or user.get('role') not in ('super_admin', 'org_admin'):
        return Response({'success': False, 'message': "Ruxsat yo'q", 'errors': ['FORBIDDEN']}, status=403)
    ScheduleEntry.objects.filter(id=entry_id).delete()
    return Response({'success': True, 'message': "Dars o'chirildi", 'data': None, 'errors': []})
