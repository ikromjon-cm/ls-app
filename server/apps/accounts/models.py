import uuid
from django.db import models


def cuid():
    return uuid.uuid4().hex[:25]


class Organization(models.Model):
    PLAN_CHOICES = [('free', 'Free'), ('starter', 'Starter'), ('pro', 'Pro'), ('enterprise', 'Enterprise')]
    STATUS_CHOICES = [('active', 'Active'), ('suspended', 'Suspended'), ('deleted', 'Deleted')]

    id = models.CharField(max_length=25, primary_key=True, default=cuid, editable=False)
    name = models.CharField(max_length=255)
    slug = models.CharField(max_length=255, unique=True)
    logo = models.CharField(max_length=500, null=True, blank=True)
    domain = models.CharField(max_length=255, null=True, blank=True)
    plan = models.CharField(max_length=20, choices=PLAN_CHOICES, default='free')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    settings = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'organizations'


class OrganizationBranch(models.Model):
    id = models.CharField(max_length=25, primary_key=True, default=cuid, editable=False)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='branches')
    name = models.CharField(max_length=255)
    address = models.TextField(null=True, blank=True)
    phone = models.CharField(max_length=50, null=True, blank=True)

    class Meta:
        db_table = 'organization_branches'
        unique_together = [('organization', 'name')]


class OrganizationCourse(models.Model):
    id = models.CharField(max_length=25, primary_key=True, default=cuid, editable=False)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='courses')
    name = models.CharField(max_length=255)

    class Meta:
        db_table = 'organization_courses'
        unique_together = [('organization', 'name')]


class User(models.Model):
    ROLE_CHOICES = [
        ('super_admin', 'Super Admin'),
        ('org_admin', 'Org Admin'),
        ('manager', 'Manager'),
        ('teacher', 'Teacher'),
        ('parent', 'Parent'),
        ('student', 'Student'),
        ('employee', 'Employee'),
    ]

    id = models.CharField(max_length=25, primary_key=True, default=cuid, editable=False)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='users')
    login = models.CharField(max_length=255)
    email = models.EmailField(max_length=255, null=True, blank=True)
    phone = models.CharField(max_length=50, null=True, blank=True)
    password = models.CharField(max_length=255)
    name = models.CharField(max_length=255)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='employee')
    avatar = models.CharField(max_length=500, null=True, blank=True)
    active = models.BooleanField(default=True)
    two_factor_secret = models.CharField(max_length=255, null=True, blank=True)
    two_factor_enabled = models.BooleanField(default=False)
    last_login_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'users'
        unique_together = [('organization', 'login'), ('organization', 'email')]
        indexes = [models.Index(fields=['organization', 'role'])]

    @property
    def is_authenticated(self):
        return True


class Session(models.Model):
    id = models.CharField(max_length=25, primary_key=True, default=cuid, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sessions')
    token = models.TextField(unique=True)
    refresh_token = models.TextField(null=True, blank=True, unique=True)
    device_info = models.TextField(null=True, blank=True)
    ip = models.CharField(max_length=50, null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'sessions'
        indexes = [models.Index(fields=['user']), models.Index(fields=['expires_at'])]


class OtpCode(models.Model):
    id = models.CharField(max_length=25, primary_key=True, default=cuid, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    phone = models.CharField(max_length=50, null=True, blank=True)
    email = models.EmailField(null=True, blank=True)
    code = models.CharField(max_length=10)
    type = models.CharField(max_length=20)
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'otp_codes'
        indexes = [
            models.Index(fields=['phone', 'code', 'type']),
            models.Index(fields=['email', 'code', 'type']),
            models.Index(fields=['expires_at']),
        ]


class Group(models.Model):
    id = models.CharField(max_length=25, primary_key=True, default=cuid, editable=False)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='groups')
    name = models.CharField(max_length=255)
    course = models.CharField(max_length=255, null=True, blank=True)
    teacher = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='teacher_groups')
    teacher_name = models.CharField(max_length=255, null=True, blank=True)
    room = models.CharField(max_length=100, null=True, blank=True)
    status = models.CharField(max_length=20, default='active')
    price = models.FloatField(null=True, blank=True)
    start_date = models.DateTimeField(null=True, blank=True)
    end_date = models.DateTimeField(null=True, blank=True)
    month_duration = models.IntegerField(null=True, blank=True)
    days_of_week = models.JSONField(null=True, blank=True)
    start_time = models.CharField(max_length=10, null=True, blank=True)
    end_time = models.CharField(max_length=10, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'groups'
        indexes = [models.Index(fields=['organization', 'teacher'])]


class Student(models.Model):
    PAYMENT_STATUS_CHOICES = [('paid', 'Paid'), ('debt', 'Debt'), ('risk', 'Risk')]

    id = models.CharField(max_length=25, primary_key=True, default=cuid, editable=False)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='students')
    name = models.CharField(max_length=255)
    phone = models.CharField(max_length=50, null=True, blank=True)
    group = models.ForeignKey(Group, on_delete=models.SET_NULL, null=True, blank=True, related_name='students')
    course = models.CharField(max_length=255, null=True, blank=True)
    parent_ids = models.JSONField(default=list)
    parent_name = models.CharField(max_length=255, null=True, blank=True)
    parent_phone = models.CharField(max_length=50, null=True, blank=True)
    payment_status = models.CharField(max_length=10, choices=PAYMENT_STATUS_CHOICES, default='debt')
    last_payment_date = models.DateTimeField(null=True, blank=True)
    risk_group = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'students'
        indexes = [
            models.Index(fields=['organization', 'group']),
            models.Index(fields=['organization', 'phone']),
        ]


class Payment(models.Model):
    METHOD_CHOICES = [('Naqd', 'Naqd'), ('Click', 'Click'), ('Payme', 'Payme'), ('Uzum', 'Uzum'), ('Bank', 'Bank'), ('Stripe', 'Stripe')]

    id = models.CharField(max_length=25, primary_key=True, default=cuid, editable=False)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='payments')
    student = models.ForeignKey(Student, on_delete=models.SET_NULL, null=True, blank=True, related_name='payments')
    student_name = models.CharField(max_length=255, null=True, blank=True)
    group_id = models.CharField(max_length=25, null=True, blank=True)
    group_name = models.CharField(max_length=255, null=True, blank=True)
    amount = models.FloatField()
    method = models.CharField(max_length=20, choices=METHOD_CHOICES, default='Naqd')
    date = models.DateTimeField(auto_now_add=True)
    note = models.TextField(null=True, blank=True)
    transaction_ref = models.CharField(max_length=255, null=True, blank=True)
    created_by_id = models.CharField(max_length=25, null=True, blank=True)
    created_by_name = models.CharField(max_length=255, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'payments'
        indexes = [
            models.Index(fields=['organization', 'student']),
            models.Index(fields=['organization', 'date']),
        ]


class PaymentTransaction(models.Model):
    STATUS_CHOICES = [('pending', 'Pending'), ('paid', 'Paid'), ('failed', 'Failed'), ('cancelled', 'Cancelled')]

    id = models.CharField(max_length=25, primary_key=True, default=cuid, editable=False)
    organization_id = models.CharField(max_length=25)
    order_id = models.CharField(max_length=255, unique=True)
    provider = models.CharField(max_length=50)
    amount = models.FloatField()
    student_id = models.CharField(max_length=25, null=True, blank=True)
    invoice_id = models.CharField(max_length=255, null=True, blank=True)
    transaction_id = models.CharField(max_length=255, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    payment_url = models.TextField(null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'payment_transactions'


class Expense(models.Model):
    id = models.CharField(max_length=25, primary_key=True, default=cuid, editable=False)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='expenses')
    amount = models.FloatField()
    description = models.TextField()
    category = models.CharField(max_length=255, null=True, blank=True)
    date = models.DateTimeField(auto_now_add=True)
    created_by_id = models.CharField(max_length=25, null=True, blank=True)
    created_by_name = models.CharField(max_length=255, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'expenses'
        indexes = [
            models.Index(fields=['organization', 'date']),
            models.Index(fields=['organization', 'category']),
        ]


class Attendance(models.Model):
    STATUS_CHOICES = [('present', 'Present'), ('absent', 'Absent'), ('late', 'Late')]

    id = models.CharField(max_length=25, primary_key=True, default=cuid, editable=False)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='attendance')
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='attendance')
    date = models.DateTimeField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES)
    note = models.TextField(null=True, blank=True)
    marked_by_id = models.CharField(max_length=25, null=True, blank=True)
    marked_by_name = models.CharField(max_length=255, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'attendance'
        unique_together = [('organization', 'student', 'date')]
        indexes = [models.Index(fields=['organization', 'date'])]


class Homework(models.Model):
    id = models.CharField(max_length=25, primary_key=True, default=cuid, editable=False)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='homework')
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name='homework')
    title = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)
    deadline = models.DateTimeField(null=True, blank=True)
    files = models.JSONField(default=list)
    created_by_id = models.CharField(max_length=25, null=True, blank=True)
    created_by_name = models.CharField(max_length=255, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'homework'
        indexes = [models.Index(fields=['organization', 'group'])]


class Grade(models.Model):
    id = models.CharField(max_length=25, primary_key=True, default=cuid, editable=False)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='grades')
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='grades')
    subject = models.CharField(max_length=255)
    score = models.FloatField()
    created_by_id = models.CharField(max_length=25, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'grades'
        indexes = [
            models.Index(fields=['organization', 'student']),
            models.Index(fields=['organization', 'subject']),
        ]


class ScheduleEntry(models.Model):
    DAY_CHOICES = [
        ('monday', 'Monday'), ('tuesday', 'Tuesday'), ('wednesday', 'Wednesday'),
        ('thursday', 'Thursday'), ('friday', 'Friday'), ('saturday', 'Saturday'), ('sunday', 'Sunday'),
    ]

    id = models.CharField(max_length=25, primary_key=True, default=cuid, editable=False)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='schedule')
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name='schedule')
    subject = models.CharField(max_length=255)
    teacher_id = models.CharField(max_length=25, null=True, blank=True)
    day = models.CharField(max_length=10, choices=DAY_CHOICES)
    time_start = models.CharField(max_length=10)
    time_end = models.CharField(max_length=10)
    room = models.CharField(max_length=100, null=True, blank=True)
    created_by_id = models.CharField(max_length=25, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'schedule_entries'
        indexes = [models.Index(fields=['organization', 'group', 'day'])]


class Message(models.Model):
    id = models.CharField(max_length=25, primary_key=True, default=cuid, editable=False)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='messages')
    content = models.TextField()
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_messages')
    student_id = models.CharField(max_length=25, null=True, blank=True)
    read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'messages'
        indexes = [
            models.Index(fields=['organization', 'sender', 'receiver']),
            models.Index(fields=['organization', 'created_at']),
        ]


class Notification(models.Model):
    TYPE_CHOICES = [('info', 'Info'), ('success', 'Success'), ('warning', 'Warning'), ('error', 'Error')]

    id = models.CharField(max_length=25, primary_key=True, default=cuid, editable=False)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='notifications')
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='notifications')
    title = models.CharField(max_length=255)
    message = models.TextField()
    type = models.CharField(max_length=10, choices=TYPE_CHOICES, default='info')
    read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notifications'
        indexes = [
            models.Index(fields=['organization', 'user']),
            models.Index(fields=['organization', 'read']),
        ]


class Book(models.Model):
    id = models.CharField(max_length=25, primary_key=True, default=cuid, editable=False)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='library')
    title = models.CharField(max_length=255)
    author = models.CharField(max_length=255, null=True, blank=True)
    category = models.CharField(max_length=255, null=True, blank=True)
    file_url = models.TextField(null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    created_by_id = models.CharField(max_length=25, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'books'
        indexes = [models.Index(fields=['organization', 'category'])]


class Exam(models.Model):
    id = models.CharField(max_length=25, primary_key=True, default=cuid, editable=False)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='exams')
    group_id = models.CharField(max_length=25, null=True, blank=True)
    title = models.CharField(max_length=255)
    questions = models.JSONField(default=list)
    time_limit = models.IntegerField(null=True, blank=True)
    max_score = models.FloatField(null=True, blank=True)
    date = models.DateTimeField(null=True, blank=True)
    created_by_id = models.CharField(max_length=25, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'exams'
        indexes = [models.Index(fields=['organization', 'group_id'])]


class ExamResult(models.Model):
    id = models.CharField(max_length=25, primary_key=True, default=cuid, editable=False)
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name='results')
    student_id = models.CharField(max_length=25, null=True, blank=True)
    student_name = models.CharField(max_length=255, null=True, blank=True)
    score = models.FloatField()
    max_score = models.FloatField(null=True, blank=True)
    answers = models.JSONField(default=list)
    submitted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'exam_results'
        indexes = [models.Index(fields=['exam']), models.Index(fields=['student_id'])]


class Certificate(models.Model):
    TYPE_CHOICES = [('completion', 'Completion'), ('participation', 'Participation'), ('achievement', 'Achievement')]

    id = models.CharField(max_length=25, primary_key=True, default=cuid, editable=False)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='certificates')
    student = models.ForeignKey(Student, on_delete=models.SET_NULL, null=True, blank=True, related_name='certificates')
    student_name = models.CharField(max_length=255, null=True, blank=True)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='completion')
    certificate_number = models.CharField(max_length=255, null=True, blank=True)
    issue_date = models.DateTimeField(null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    issued_by_id = models.CharField(max_length=25, null=True, blank=True)
    issued_by_name = models.CharField(max_length=255, null=True, blank=True)
    issued_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'certificates'
        indexes = [models.Index(fields=['organization', 'student'])]


class QrCode(models.Model):
    id = models.CharField(max_length=25, primary_key=True, default=cuid, editable=False)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='qr_codes')
    code = models.CharField(max_length=255, unique=True)
    active = models.BooleanField(default=True)
    created_by_id = models.CharField(max_length=25, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'qr_codes'
        indexes = [models.Index(fields=['organization', 'code'])]


class Device(models.Model):
    id = models.CharField(max_length=25, primary_key=True, default=cuid, editable=False)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='devices')
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='devices')
    device_info = models.TextField(null=True, blank=True)
    ip = models.CharField(max_length=50, null=True, blank=True)
    platform = models.CharField(max_length=50, null=True, blank=True)
    first_seen = models.DateTimeField(auto_now_add=True)
    last_active = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'devices'
        indexes = [models.Index(fields=['organization', 'user'])]


class AuditLog(models.Model):
    id = models.CharField(max_length=25, primary_key=True, default=cuid, editable=False)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='audit_logs')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='audit_logs')
    user_name = models.CharField(max_length=255, null=True, blank=True)
    action = models.CharField(max_length=255)
    details = models.TextField(null=True, blank=True)
    type = models.CharField(max_length=50, default='general')
    ip = models.CharField(max_length=50, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'audit_logs'
        indexes = [
            models.Index(fields=['organization', 'type']),
            models.Index(fields=['organization', 'created_at']),
        ]


class Subscription(models.Model):
    PLAN_CHOICES = [('free', 'Free'), ('starter', 'Starter'), ('pro', 'Pro'), ('enterprise', 'Enterprise')]
    STATUS_CHOICES = [('active', 'Active'), ('canceled', 'Canceled'), ('past_due', 'Past Due')]

    id = models.CharField(max_length=25, primary_key=True, default=cuid, editable=False)
    organization = models.OneToOneField(Organization, on_delete=models.CASCADE, related_name='subscription')
    plan = models.CharField(max_length=20, choices=PLAN_CHOICES, default='free')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    current_period_start = models.DateTimeField(auto_now_add=True)
    current_period_end = models.DateTimeField()
    trial_ends_at = models.DateTimeField(null=True, blank=True)
    stripe_id = models.CharField(max_length=255, null=True, blank=True)
    payme_id = models.CharField(max_length=255, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'subscriptions'
