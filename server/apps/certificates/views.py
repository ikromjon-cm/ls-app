from rest_framework.decorators import api_view
from rest_framework.response import Response
from apps.accounts.models import Certificate
from apps.accounts.auth import verify_access_token


def _user(request):
    auth = request.headers.get('Authorization', '')
    if auth.startswith('Bearer '):
        return verify_access_token(auth[7:])
    return None


@api_view(['GET', 'POST'])
def certificate_list(request):
    user = _user(request)
    if not user:
        return Response({'success': False, 'message': 'Unauthorized', 'errors': ['NO_TOKEN']}, status=401)

    org_id = user['organizationId']

    if request.method == 'GET':
        where = {'organization_id': org_id}
        student_id = request.query_params.get('studentId')
        if student_id:
            where['student_id'] = student_id
        certs = Certificate.objects.filter(**where).order_by('-issued_at')
        data = [{
            'id': c.id, 'studentId': c.student_id, 'studentName': c.student_name,
            'type': c.type, 'certificateNumber': c.certificate_number,
            'issueDate': c.issue_date, 'description': c.description,
            'issuedById': c.issued_by_id, 'issuedByName': c.issued_by_name,
            'issuedAt': c.issued_at,
        } for c in certs]
        return Response({'success': True, 'message': 'OK', 'data': data, 'errors': []})

    if user.get('role') not in ('super_admin', 'org_admin'):
        return Response({'success': False, 'message': "Ruxsat yo'q", 'errors': ['FORBIDDEN']}, status=403)

    body = request.data
    cert = Certificate.objects.create(
        organization_id=org_id, student_id=body.get('studentId'),
        student_name=body.get('studentName'), type=body.get('type', 'completion'),
        certificate_number=body.get('certificateNumber'),
        issue_date=body.get('issueDate'), description=body.get('description'),
        issued_by_id=user['userId'], issued_by_name=user.get('name', ''),
    )
    return Response({
        'success': True, 'message': 'Sertifikat berildi',
        'data': {'id': cert.id}, 'errors': [],
    }, status=201)
