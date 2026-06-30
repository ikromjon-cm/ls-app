from rest_framework.decorators import api_view
from rest_framework.response import Response
from apps.accounts.models import Student, Attendance, Grade, Payment
from apps.accounts.auth import verify_access_token


def _user(request):
    auth = request.headers.get('Authorization', '')
    if auth.startswith('Bearer '):
        return verify_access_token(auth[7:])
    return None


@api_view(['GET'])
def parent_children(request):
    user = _user(request)
    if not user:
        return Response({'success': False, 'message': 'Unauthorized', 'errors': ['NO_TOKEN']}, status=401)

    org_id = user['organizationId']
    phone = request.query_params.get('phone', '')
    students = Student.objects.filter(organization_id=org_id)

    if phone:
        students = students.filter(parent_phone=phone)

    data = []
    for s in students:
        data.append({
            'id': s.id, 'name': s.name, 'groupName': s.group.name if s.group else 'N/A',
            'paymentStatus': s.payment_status,
        })
    return Response({'success': True, 'message': 'OK', 'data': data, 'errors': []})
