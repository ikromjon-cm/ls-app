from datetime import datetime
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.core.cache import cache
from .models import User, Organization, OrganizationBranch, OrganizationCourse, Session, AuditLog
from .auth import (
    hash_password, compare_password,
    generate_access_token, generate_refresh_token,
    verify_access_token, verify_refresh_token,
    generate_otp, store_otp, verify_otp,
    generate_2fa_secret, verify_2fa_token, generate_2fa_qr_code,
)


def success(data=None, message='OK', status=200):
    return Response({'success': True, 'message': message, 'data': data, 'errors': []}, status=status)


def fail(message, status=400, errors=None):
    return Response({'success': False, 'message': message, 'data': None, 'errors': errors or []}, status=status)


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    login_input = request.data.get('login', '')
    password = request.data.get('password', '')

    if not login_input or not password:
        return fail('Login va parol talab qilinadi')

    user = User.objects.filter(active=True).filter(
        login=login_input
    ).first()

    if not user:
        user = User.objects.filter(active=True, email=login_input).first()
    if not user:
        user = User.objects.filter(active=True, phone=login_input).first()

    if not user or not compare_password(password, user.password):
        return fail('Login yoki parol xato', 401)

    if user.two_factor_enabled:
        code = generate_otp()
        store_otp(f'2fa:{user.id}', code, '2fa')
        return success({
            'requires2FA': True,
            'userId': user.id,
            'method': 'sms' if user.phone else 'app',
        }, '2FA kodi yuborildi')

    token = generate_access_token(user)
    refresh_token = generate_refresh_token(user)

    from .models import Session
    Session.objects.create(
        user=user, token=token, refresh_token=refresh_token,
        device_info=request.headers.get('User-Agent', '')[:255],
        ip=request.META.get('REMOTE_ADDR', ''),
        expires_at=datetime.now(),
    )

    AuditLog.objects.create(
        organization=user.organization, user=user, user_name=user.name,
        action='Tizimga kirdi', type='auth', ip=request.META.get('REMOTE_ADDR', ''),
    )

    return success({
        'user': UserSerializer(user).data,
        'token': token,
        'refreshToken': refresh_token,
        'organization': OrganizationSerializer(user.organization).data,
    }, "Tizimga muvaffaqiyatli kirdingiz")


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_2fa(request):
    user_id = request.data.get('userId', '')
    code = request.data.get('code', '')

    if not user_id or not code:
        return fail('UserId va kod talab qilinadi')

    if not verify_otp(f'2fa:{user_id}', code, '2fa'):
        return fail('Yaroqsiz kod', 401)

    user = User.objects.filter(id=user_id).first()
    if not user:
        return fail('Foydalanuvchi topilmadi', 404)

    token = generate_access_token(user)
    refresh_token = generate_refresh_token(user)

    Session.objects.create(
        user=user, token=token, refresh_token=refresh_token,
        device_info=request.headers.get('User-Agent', '')[:255],
        ip=request.META.get('REMOTE_ADDR', ''),
        expires_at=datetime.now(),
    )

    return success({
        'user': UserSerializer(user).data,
        'token': token,
        'refreshToken': refresh_token,
        'organization': OrganizationSerializer(user.organization).data,
    }, 'Tasdiqlandi')


@api_view(['POST'])
@permission_classes([AllowAny])
def refresh_token(request):
    refresh_token_str = request.data.get('refreshToken', '')
    if not refresh_token_str:
        return fail('Refresh token talab qilinadi')

    payload = verify_refresh_token(refresh_token_str)
    if not payload:
        return fail('Yaroqsiz refresh token', 401)

    user = User.objects.filter(id=payload.get('userId')).first()
    if not user:
        return fail('Foydalanuvchi topilmadi', 404)

    new_token = generate_access_token(user)
    new_refresh = generate_refresh_token(user)

    Session.objects.create(
        user=user, token=new_token, refresh_token=new_refresh,
        expires_at=datetime.now(),
    )

    return success({'token': new_token, 'refreshToken': new_refresh}, 'Token yangilandi')


@api_view(['POST'])
@permission_classes([AllowAny])
def logout(request):
    auth_header = request.headers.get('Authorization', '')
    if auth_header.startswith('Bearer '):
        token = auth_header[7:]
        Session.objects.filter(token=token).delete()
    return success(None, 'Chiqildi')


@api_view(['POST'])
@permission_classes([AllowAny])
def send_otp(request):
    phone = request.data.get('phone', '')
    if not phone:
        return fail('Telefon raqam talab qilinadi')

    allowed = cache.get(f'rate:otp:{phone}', 0)
    if allowed >= 3:
        return fail("Ko'p urunish, keyinroq urinib ko'ring", 429)

    code = generate_otp()
    store_otp(phone, code, 'login')
    cache.incr(f'rate:otp:{phone}', 1)
    cache.expire(f'rate:otp:{phone}', 300)
    return success(None, 'Kod yuborildi')


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_otp_view(request):
    phone = request.data.get('phone', '')
    code = request.data.get('code', '')

    if not phone or not code:
        return fail('Telefon va kod talab qilinadi')

    if not verify_otp(phone, code, 'login'):
        return fail('Yaroqsiz kod', 401)

    user = User.objects.filter(phone=phone, active=True).first()
    if not user:
        return fail('Foydalanuvchi topilmadi', 404)

    token = generate_access_token(user)
    refresh_token_val = generate_refresh_token(user)

    return success({
        'user': UserSerializer(user).data,
        'token': token,
        'refreshToken': refresh_token_val,
        'organization': OrganizationSerializer(user.organization).data,
    }, 'Tasdiqlandi')


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def setup_2fa(request):
    auth_header = request.headers.get('Authorization', '')
    payload = verify_access_token(auth_header[7:])
    if not payload:
        return fail('Yaroqsiz token', 401)

    user = User.objects.filter(id=payload['userId']).first()
    if not user:
        return fail('Foydalanuvchi topilmadi', 404)

    secret, otpauth_url = generate_2fa_secret(user.email or user.login)
    qr_code = generate_2fa_qr_code(otpauth_url)
    user.two_factor_secret = secret
    user.save(update_fields=['two_factor_secret'])

    return success({'secret': secret, 'qrCode': qr_code, 'otpauthUrl': otpauth_url}, '2FA sozlandi')


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def enable_2fa(request):
    auth_header = request.headers.get('Authorization', '')
    payload = verify_access_token(auth_header[7:])
    if not payload:
        return fail('Yaroqsiz token', 401)

    token_code = request.data.get('token', '')
    user = User.objects.filter(id=payload['userId']).first()
    if not user or not user.two_factor_secret:
        return fail('2FA sozlanmagan')

    if not verify_2fa_token(user.two_factor_secret, token_code):
        return fail('Yaroqsiz kod', 401)

    user.two_factor_enabled = True
    user.save(update_fields=['two_factor_enabled'])
    return success(None, '2FA faollashtirildi')


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def disable_2fa(request):
    auth_header = request.headers.get('Authorization', '')
    payload = verify_access_token(auth_header[7:])
    if not payload:
        return fail('Yaroqsiz token', 401)

    User.objects.filter(id=payload['userId']).update(
        two_factor_enabled=False, two_factor_secret=None
    )
    return success(None, "2FA o'chirildi")


from .serializers import UserSerializer, OrganizationSerializer


@api_view(['POST'])
@permission_classes([AllowAny])
def register_organization(request):
    name = request.data.get('name', '')
    slug = request.data.get('slug', '')
    admin_name = request.data.get('adminName', '')
    admin_email = request.data.get('adminEmail', '')
    admin_password = request.data.get('adminPassword', '')

    if not all([name, slug, admin_name, admin_email, admin_password]):
        return fail('Barcha maydonlar talab qilinadi')

    if Organization.objects.filter(slug=slug).exists():
        return fail('Bunday slug mavjud', 409)

    org = Organization.objects.create(name=name, slug=slug, plan='starter')

    OrganizationBranch.objects.create(organization=org, name='Asosiy filial')
    for course_name in ['Frontend', 'Backend', 'IELTS', 'Python', 'Mobile', 'Design']:
        OrganizationCourse.objects.create(organization=org, name=course_name)

    user = User.objects.create(
        organization=org, login=admin_email, email=admin_email,
        name=admin_name, password=hash_password(admin_password), role='org_admin',
    )

    return success({
        'organization': OrganizationSerializer(org).data,
        'user': {'id': user.id, 'name': user.name, 'email': user.email, 'role': user.role},
    }, 'Tashkilot yaratildi', 201)


@api_view(['GET', 'POST'])
def user_list(request):
    org_id = getattr(request, 'organization_id', None)
    role = getattr(request, 'user_role', '')

    if not org_id:
        return fail('Unauthorized', 401)

    if request.method == 'GET':
        users = User.objects.filter(organization_id=org_id).order_by('-created_at')
        return success(UserSerializer(users, many=True).data)

    if role not in ('super_admin', 'org_admin'):
        return fail("Ruxsat yo'q", 403)

    login = request.data.get('login', '')
    name = request.data.get('name', '')
    password = request.data.get('password', '')
    user_role = request.data.get('role', 'employee')

    if User.objects.filter(organization_id=org_id, login=login).exists():
        return fail('Bunday login mavjud', 409)

    user = User.objects.create(
        organization_id=org_id, login=login, name=name,
        password=hash_password(password), role=user_role,
        email=request.data.get('email', ''),
        phone=request.data.get('phone', ''),
    )

    return success(UserSerializer(user).data, 'Foydalanuvchi yaratildi', 201)


@api_view(['PUT', 'DELETE'])
def user_detail(request, user_id):
    role = getattr(request, 'user_role', '')

    if role not in ('super_admin', 'org_admin') and request.method == 'PUT':
        return fail("Ruxsat yo'q", 403)
    if role != 'super_admin' and request.method == 'DELETE':
        return fail("Ruxsat yo'q", 403)

    if request.method == 'PUT':
        data = {k: v for k, v in request.data.items() if k != 'password'}
        if request.data.get('password'):
            data['password'] = hash_password(request.data['password'])
        User.objects.filter(id=user_id).update(**data)
        user = User.objects.filter(id=user_id).first()
        return success(UserSerializer(user).data, 'Foydalanuvchi yangilandi')

    from .models import Device, Notification, Group, Message
    Device.objects.filter(user_id=user_id).delete()
    Notification.objects.filter(user_id=user_id).delete()
    Group.objects.filter(teacher_id=user_id).update(teacher=None)
    Message.objects.filter(sender_id=user_id).delete()
    Message.objects.filter(receiver_id=user_id).delete()
    User.objects.filter(id=user_id).delete()
    return success(None, "Foydalanuvchi o'chirildi")
