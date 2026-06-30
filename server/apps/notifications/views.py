from rest_framework.decorators import api_view
from rest_framework.response import Response
from apps.accounts.models import Notification
from apps.accounts.auth import verify_access_token


def _user(request):
    auth = request.headers.get('Authorization', '')
    if auth.startswith('Bearer '):
        return verify_access_token(auth[7:])
    return None


@api_view(['GET'])
def notification_list(request):
    user = _user(request)
    if not user:
        return Response({'success': False, 'message': 'Unauthorized', 'errors': ['NO_TOKEN']}, status=401)

    org_id = user['organizationId']
    notifications = Notification.objects.filter(
        organization_id=org_id,
    ).filter(
        user_id=user['userId']
    ).order_by('-created_at')[:100]

    data = [{
        'id': n.id, 'title': n.title, 'message': n.message,
        'type': n.type, 'read': n.read, 'createdAt': n.created_at,
    } for n in notifications]
    return Response({'success': True, 'message': 'OK', 'data': data, 'errors': []})


@api_view(['PUT'])
def mark_read(request, notif_id):
    user = _user(request)
    if not user:
        return Response({'success': False, 'message': 'Unauthorized', 'errors': ['NO_TOKEN']}, status=401)
    Notification.objects.filter(id=notif_id).update(read=True)
    return Response({'success': True, 'message': "Xabarnoma o'qildi", 'data': None, 'errors': []})


@api_view(['PUT'])
def mark_all_read(request):
    user = _user(request)
    if not user:
        return Response({'success': False, 'message': 'Unauthorized', 'errors': ['NO_TOKEN']}, status=401)
    Notification.objects.filter(user_id=user['userId'], read=False).update(read=True)
    return Response({'success': True, 'message': "Barcha xabarlar o'qildi", 'data': None, 'errors': []})
