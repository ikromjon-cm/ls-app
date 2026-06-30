from rest_framework.decorators import api_view
from rest_framework.response import Response
from apps.accounts.models import AuditLog
from apps.accounts.auth import verify_access_token


def _user(request):
    auth = request.headers.get('Authorization', '')
    if auth.startswith('Bearer '):
        return verify_access_token(auth[7:])
    return None


@api_view(['GET'])
def audit_list(request):
    user = _user(request)
    if not user or user.get('role') not in ('super_admin', 'org_admin'):
        return Response({'success': False, 'message': "Ruxsat yo'q", 'errors': ['FORBIDDEN']}, status=403)

    org_id = user['organizationId']
    logs = AuditLog.objects.filter(organization_id=org_id).order_by('-created_at')[:200]
    data = [{
        'id': l.id, 'userId': l.user_id, 'userName': l.user_name,
        'action': l.action, 'details': l.details, 'type': l.type,
        'ip': l.ip, 'createdAt': l.created_at,
    } for l in logs]
    return Response({'success': True, 'message': 'OK', 'data': data, 'errors': []})
