from datetime import datetime
from django.db.models import Sum, Count
from rest_framework.decorators import api_view
from rest_framework.response import Response
from apps.accounts.models import Payment, Expense, Student, Attendance
from apps.accounts.auth import verify_access_token


def _user(request):
    auth = request.headers.get('Authorization', '')
    if auth.startswith('Bearer '):
        return verify_access_token(auth[7:])
    return None


@api_view(['GET'])
def report_financial(request):
    user = _user(request)
    if not user or user.get('role') not in ('super_admin', 'org_admin'):
        return Response({'success': False, 'message': "Ruxsat yo'q", 'errors': ['FORBIDDEN']}, status=403)

    org_id = user['organizationId']
    from_date = request.query_params.get('from')
    to_date = request.query_params.get('to')

    where_p = {'organization_id': org_id}
    where_e = {'organization_id': org_id}

    if from_date:
        where_p['date__gte'] = datetime.fromisoformat(from_date.replace('Z', ''))
        where_e['date__gte'] = datetime.fromisoformat(from_date.replace('Z', ''))
    if to_date:
        where_p['date__lte'] = datetime.fromisoformat(to_date.replace('Z', ''))
        where_e['date__lte'] = datetime.fromisoformat(to_date.replace('Z', ''))

    total_revenue = Payment.objects.filter(**where_p).aggregate(s=Sum('amount'))['s'] or 0
    total_expense = Expense.objects.filter(**where_e).aggregate(s=Sum('amount'))['s'] or 0

    payments_by_method = Payment.objects.filter(**where_p).values('method').annotate(
        total=Sum('amount'), count=Count('id')
    )

    return Response({
        'success': True, 'message': 'OK',
        'data': {
            'totalRevenue': float(total_revenue),
            'totalExpense': float(total_expense),
            'netProfit': float(total_revenue - total_expense),
            'paymentsByMethod': list(payments_by_method),
        },
        'errors': [],
    })


@api_view(['GET'])
def report_students(request):
    user = _user(request)
    if not user or user.get('role') not in ('super_admin', 'org_admin'):
        return Response({'success': False, 'message': "Ruxsat yo'q", 'errors': ['FORBIDDEN']}, status=403)

    org_id = user['organizationId']
    total = Student.objects.filter(organization_id=org_id).count()
    paid = Student.objects.filter(organization_id=org_id, payment_status='paid').count()
    debt = Student.objects.filter(organization_id=org_id, payment_status='debt').count()
    risk = Student.objects.filter(organization_id=org_id, payment_status='risk').count()

    return Response({
        'success': True, 'message': 'OK',
        'data': {'total': total, 'paid': paid, 'debt': debt, 'risk': risk},
        'errors': [],
    })
