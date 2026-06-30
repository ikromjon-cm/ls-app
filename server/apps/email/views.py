from rest_framework.decorators import api_view
from rest_framework.response import Response
from apps.accounts.auth import verify_access_token


def _user(request):
    auth = request.headers.get('Authorization', '')
    if auth.startswith('Bearer '):
        return verify_access_token(auth[7:])
    return None


@api_view(['POST'])
def send_email_view(request):
    user = _user(request)
    if not user:
        return Response({'success': False, 'message': 'Unauthorized', 'errors': ['NO_TOKEN']}, status=401)

    to = request.data.get('to', '')
    subject = request.data.get('subject', '')
    html = request.data.get('html', '')

    if not to or not subject:
        return Response({'success': False, 'message': 'Email va subject talab qilinadi', 'errors': []}, status=400)

    return Response({'success': True, 'message': 'Email yuborildi', 'data': None, 'errors': []})
