from rest_framework.decorators import api_view
from rest_framework.response import Response
from apps.accounts.models import Homework
from apps.accounts.auth import verify_access_token


def _user(request):
    auth = request.headers.get('Authorization', '')
    if auth.startswith('Bearer '):
        return verify_access_token(auth[7:])
    return None


@api_view(['GET', 'POST'])
def homework_list(request):
    user = _user(request)
    if not user:
        return Response({'success': False, 'message': 'Unauthorized', 'errors': ['NO_TOKEN']}, status=401)

    org_id = user['organizationId']

    if request.method == 'GET':
        where = {'organization_id': org_id}
        group_id = request.query_params.get('groupId')
        if group_id:
            where['group_id'] = group_id
        hw = Homework.objects.filter(**where).order_by('-created_at')
        data = [{
            'id': h.id, 'groupId': h.group_id, 'title': h.title,
            'description': h.description, 'deadline': h.deadline,
            'files': h.files, 'createdById': h.created_by_id,
            'createdByName': h.created_by_name, 'createdAt': h.created_at,
        } for h in hw]
        return Response({'success': True, 'message': 'OK', 'data': data, 'errors': []})

    if user.get('role') not in ('super_admin', 'org_admin', 'teacher'):
        return Response({'success': False, 'message': "Ruxsat yo'q", 'errors': ['FORBIDDEN']}, status=403)

    body = request.data
    hw = Homework.objects.create(
        organization_id=org_id, group_id=body.get('groupId'),
        title=body.get('title'), description=body.get('description'),
        deadline=body.get('deadline'), files=body.get('files', []),
        created_by_id=user['userId'],
    )
    return Response({
        'success': True, 'message': 'Topshiriq yaratildi',
        'data': {'id': hw.id, 'title': hw.title}, 'errors': [],
    }, status=201)


@api_view(['DELETE'])
def homework_detail(request, hw_id):
    user = _user(request)
    if not user or user.get('role') not in ('super_admin', 'org_admin', 'teacher'):
        return Response({'success': False, 'message': "Ruxsat yo'q", 'errors': ['FORBIDDEN']}, status=403)
    Homework.objects.filter(id=hw_id).delete()
    return Response({'success': True, 'message': "Topshiriq o'chirildi", 'data': None, 'errors': []})
