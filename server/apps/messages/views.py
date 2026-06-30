from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db.models import Q
from apps.accounts.models import Message
from apps.accounts.auth import verify_access_token


def _user(request):
    auth = request.headers.get('Authorization', '')
    if auth.startswith('Bearer '):
        return verify_access_token(auth[7:])
    return None


@api_view(['GET', 'POST'])
def message_list(request):
    user = _user(request)
    if not user:
        return Response({'success': False, 'message': 'Unauthorized', 'errors': ['NO_TOKEN']}, status=401)

    org_id = user['organizationId']

    if request.method == 'GET':
        where = {'organization_id': org_id}
        other_id = request.query_params.get('otherId')
        if other_id:
            where['OR'] = [
                Q(sender_id=user['userId'], receiver_id=other_id),
                Q(sender_id=other_id, receiver_id=user['userId']),
            ]
            messages = Message.objects.filter(**where).order_by('created_at')
        else:
            messages = Message.objects.filter(
                Q(sender_id=user['userId']) | Q(receiver_id=user['userId']),
                organization_id=org_id,
            ).order_by('created_at')

        data = [{
            'id': m.id, 'content': m.content, 'senderId': m.sender_id,
            'receiverId': m.receiver_id, 'studentId': m.student_id,
            'read': m.read, 'createdAt': m.created_at,
        } for m in messages]
        return Response({'success': True, 'message': 'OK', 'data': data, 'errors': []})

    body = request.data
    content = body.get('content', '')
    if not content:
        return Response({'success': False, 'message': 'Xabar matni talab qilinadi', 'errors': []}, status=400)

    msg = Message.objects.create(
        organization_id=org_id, content=content,
        sender_id=user['userId'], receiver_id=body.get('receiverId'),
        student_id=body.get('studentId'),
    )
    return Response({
        'success': True, 'message': 'Xabar yuborildi',
        'data': {'id': msg.id, 'content': msg.content, 'createdAt': msg.created_at},
        'errors': [],
    }, status=201)
