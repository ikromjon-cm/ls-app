from rest_framework.decorators import api_view
from rest_framework.response import Response
from apps.accounts.models import User
from apps.accounts.auth import verify_access_token
from apps.accounts.serializers import UserSerializer


def _user(request):
    auth = request.headers.get('Authorization', '')
    if auth.startswith('Bearer '):
        return verify_access_token(auth[7:])
    return None


@api_view(['GET'])
def teacher_list(request):
    user = _user(request)
    if not user:
        return Response({'success': False, 'message': 'Unauthorized', 'errors': ['NO_TOKEN']}, status=401)

    org_id = user['organizationId']
    teachers = User.objects.filter(organization_id=org_id, role='teacher').order_by('name')
    return Response({'success': True, 'message': 'OK', 'data': UserSerializer(teachers, many=True).data, 'errors': []})
