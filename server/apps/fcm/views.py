from rest_framework.decorators import api_view
from rest_framework.response import Response
from apps.accounts.models import Device
from apps.accounts.auth import verify_access_token


def _user(request):
    auth = request.headers.get('Authorization', '')
    if auth.startswith('Bearer '):
        return verify_access_token(auth[7:])
    return None


@api_view(['POST'])
def register_device(request):
    user = _user(request)
    if not user:
        return Response({'success': False, 'message': 'Unauthorized', 'errors': ['NO_TOKEN']}, status=401)

    device_info = request.data.get('deviceInfo', '')
    platform = request.data.get('platform', '')

    Device.objects.create(
        organization_id=user['organizationId'],
        user_id=user['userId'],
        device_info=device_info,
        platform=platform,
        ip=request.META.get('REMOTE_ADDR', ''),
    )
    return Response({'success': True, 'message': 'Device registered', 'data': None, 'errors': []})
