from rest_framework.decorators import api_view
from rest_framework.response import Response
from apps.accounts.models import Exam, ExamResult
from apps.accounts.auth import verify_access_token


def _user(request):
    auth = request.headers.get('Authorization', '')
    if auth.startswith('Bearer '):
        return verify_access_token(auth[7:])
    return None


@api_view(['GET', 'POST'])
def exam_list(request):
    user = _user(request)
    if not user:
        return Response({'success': False, 'message': 'Unauthorized', 'errors': ['NO_TOKEN']}, status=401)

    org_id = user['organizationId']

    if request.method == 'GET':
        where = {'organization_id': org_id}
        group_id = request.query_params.get('groupId')
        if group_id:
            where['group_id'] = group_id
        exams = Exam.objects.filter(**where).order_by('-created_at')
        data = [{
            'id': e.id, 'groupId': e.group_id, 'title': e.title,
            'questions': e.questions, 'timeLimit': e.time_limit,
            'maxScore': e.max_score, 'date': e.date,
            'createdById': e.created_by_id, 'createdAt': e.created_at,
        } for e in exams]
        return Response({'success': True, 'message': 'OK', 'data': data, 'errors': []})

    if user.get('role') not in ('super_admin', 'org_admin', 'teacher'):
        return Response({'success': False, 'message': "Ruxsat yo'q", 'errors': ['FORBIDDEN']}, status=403)

    body = request.data
    exam = Exam.objects.create(
        organization_id=org_id, group_id=body.get('groupId'),
        title=body.get('title'), questions=body.get('questions', []),
        time_limit=body.get('timeLimit'), max_score=body.get('maxScore'),
        date=body.get('date'), created_by_id=user['userId'],
    )
    return Response({
        'success': True, 'message': 'Imtihon yaratildi',
        'data': {'id': exam.id, 'title': exam.title}, 'errors': [],
    }, status=201)


@api_view(['GET'])
def exam_results(request):
    user = _user(request)
    if not user:
        return Response({'success': False, 'message': 'Unauthorized', 'errors': ['NO_TOKEN']}, status=401)

    where = {}
    exam_id = request.query_params.get('examId')
    student_id = request.query_params.get('studentId')
    if exam_id:
        where['exam_id'] = exam_id
    if student_id:
        where['student_id'] = student_id

    results = ExamResult.objects.filter(**where).order_by('-submitted_at')
    data = [{
        'id': r.id, 'examId': r.exam_id, 'studentId': r.student_id,
        'studentName': r.student_name, 'score': r.score,
        'maxScore': r.max_score, 'answers': r.answers,
        'submittedAt': r.submitted_at,
    } for r in results]
    return Response({'success': True, 'message': 'OK', 'data': data, 'errors': []})
