from datetime import datetime, timezone
from django.db.models import Count, Sum
from django.core.cache import cache
from rest_framework.decorators import api_view
from rest_framework.response import Response
from apps.accounts.models import (
    Organization, User, Group, Student, Payment, Expense, Attendance
)
from apps.accounts.auth import verify_access_token


def _user(request):
    auth = request.headers.get('Authorization', '')
    if auth.startswith('Bearer '):
        return verify_access_token(auth[7:])
    return None


@api_view(['GET'])
def dashboard(request):
    user = _user(request)
    if not user:
        return Response({'success': False, 'message': 'Unauthorized', 'errors': ['NO_TOKEN']}, status=401)

    org_id = user['organizationId']
    cache_key = f'dashboard:{org_id}'
    cached = cache.get(cache_key)
    if cached:
        return Response({'success': True, 'message': 'OK', 'data': cached, 'errors': []})

    now = datetime.now(timezone.utc)
    year = now.year
    month = now.month

    total_students = Student.objects.filter(organization_id=org_id).count()
    total_groups = Group.objects.filter(organization_id=org_id).count()
    total_teachers = User.objects.filter(organization_id=org_id, role='teacher').count()
    total_admins = User.objects.filter(organization_id=org_id, role__in=['org_admin', 'super_admin']).count()

    payments = Payment.objects.filter(organization_id=org_id, date__year=year)
    expenses = Expense.objects.filter(organization_id=org_id, date__year=year)

    all_students = Student.objects.filter(organization_id=org_id).values('id', 'group_id', 'payment_status')
    total_debtors = sum(1 for s in all_students if s['payment_status'] in ('debt', 'risk'))
    paid_students = sum(1 for s in all_students if s['payment_status'] == 'paid')

    attendance = Attendance.objects.filter(organization_id=org_id)
    today = now.date()
    present_today = attendance.filter(date__date=today, status='present').count()
    absent_today = attendance.filter(date__date=today, status='absent').count()
    late_today = attendance.filter(date__date=today, status='late').count()

    monthly_payments = payments.filter(date__month=month)
    monthly_expenses = expenses.filter(date__month=month)

    monthly_revenue = []
    for m in range(1, 13):
        monthly_revenue.append({
            'month': m,
            'revenue': float(payments.filter(date__month=m).aggregate(s=Sum('amount'))['s'] or 0),
            'expense': float(expenses.filter(date__month=m).aggregate(s=Sum('amount'))['s'] or 0),
        })

    total_revenue = float(monthly_payments.aggregate(s=Sum('amount'))['s'] or 0)
    total_expense = float(monthly_expenses.aggregate(s=Sum('amount'))['s'] or 0)

    data = {
        'totalStudents': total_students,
        'totalGroups': total_groups,
        'totalTeachers': total_teachers,
        'totalAdmins': total_admins,
        'totalRevenue': total_revenue,
        'totalExpense': total_expense,
        'netProfit': total_revenue - total_expense,
        'debtors': total_debtors,
        'attendanceRate': round(present_today / max(attendance.count(), 1) * 100) if attendance.exists() else 0,
        'presentToday': present_today,
        'absentToday': absent_today,
        'lateToday': late_today,
        'monthlyRevenue': monthly_revenue,
        'todayRevenue': float(payments.filter(date__date=today).aggregate(s=Sum('amount'))['s'] or 0),
        'groupStats': [],
        'courseStats': [],
        'teacherRating': [],
    }
    cache.set(cache_key, data, 300)
    return Response({'success': True, 'message': 'OK', 'data': data, 'errors': []})
