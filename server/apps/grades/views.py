from rest_framework.decorators import api_view
from rest_framework.response import Response
from apps.accounts.models import Grade
from apps.accounts.auth import verify_access_token


def _user(request):
    auth = request.headers.get('Authorization', '')
    if auth.startswith('Bearer '):
        return verify_access_token(auth[7:])
    return None


@api_view(['GET', 'POST'])
def grade_list(request):
    user = _user(request)
    if not user:
        return Response({'success': False, 'message': 'Unauthorized', 'errors': ['NO_TOKEN']}, status=401)

    org_id = user['organizationId']

    if request.method == 'GET':
        where = {'organization_id': org_id}
        student_id = request.query_params.get('studentId')
        subject = request.query_params.get('subject')
        if student_id:
            where['student_id'] = student_id
        if subject:
            where['subject'] = subject
        grades = Grade.objects.filter(**where).order_by('-created_at')
        data = [{
            'id': g.id, 'studentId': g.student_id, 'subject': g.subject,
            'score': g.score, 'createdById': g.created_by_id, 'createdAt': g.created_at,
        } for g in grades]
        return Response({'success': True, 'message': 'OK', 'data': data, 'errors': []})

    if user.get('role') not in ('super_admin', 'org_admin', 'teacher'):
        return Response({'success': False, 'message': "Ruxsat yo'q", 'errors': ['FORBIDDEN']}, status=403)

    body = request.data
    grade = Grade.objects.create(
        organization_id=org_id, student_id=body.get('studentId'),
        subject=body.get('subject'), score=body.get('score'),
        created_by_id=user['userId'],
    )
    return Response({
        'success': True, 'message': "Baho qo'yildi",
        'data': {'id': grade.id, 'score': grade.score}, 'errors': [],
    }, status=201)
