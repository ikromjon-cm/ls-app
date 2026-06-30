from rest_framework.decorators import api_view
from rest_framework.response import Response
from apps.accounts.models import Expense
from apps.accounts.auth import verify_access_token


def _user(request):
    auth = request.headers.get('Authorization', '')
    if auth.startswith('Bearer '):
        return verify_access_token(auth[7:])
    return None


@api_view(['GET', 'POST'])
def expense_list(request):
    user = _user(request)
    if not user:
        return Response({'success': False, 'message': 'Unauthorized', 'errors': ['NO_TOKEN']}, status=401)

    org_id = user['organizationId']

    if request.method == 'GET':
        expenses = Expense.objects.filter(organization_id=org_id).order_by('-created_at')
        data = [{
            'id': e.id, 'amount': e.amount, 'description': e.description,
            'category': e.category, 'date': e.date,
            'createdById': e.created_by_id, 'createdByName': e.created_by_name,
            'createdAt': e.created_at,
        } for e in expenses]
        return Response({'success': True, 'message': 'OK', 'data': data, 'errors': []})

    if user.get('role') not in ('super_admin', 'org_admin'):
        return Response({'success': False, 'message': "Ruxsat yo'q", 'errors': ['FORBIDDEN']}, status=403)

    body = request.data
    expense = Expense.objects.create(
        organization_id=org_id, amount=body.get('amount'),
        description=body.get('description'), category=body.get('category'),
        created_by_id=user['userId'], created_by_name=user.get('name', ''),
    )
    return Response({
        'success': True, 'message': 'Xarajat qayd etildi',
        'data': {'id': expense.id, 'amount': expense.amount},
        'errors': [],
    }, status=201)


@api_view(['DELETE'])
def expense_detail(request, expense_id):
    user = _user(request)
    if not user or user.get('role') not in ('super_admin', 'org_admin'):
        return Response({'success': False, 'message': "Ruxsat yo'q", 'errors': ['FORBIDDEN']}, status=403)
    Expense.objects.filter(id=expense_id).delete()
    return Response({'success': True, 'message': "Xarajat o'chirildi", 'data': None, 'errors': []})
