from datetime import datetime, timedelta
import uuid
import pyotp
import qrcode
import base64
from io import BytesIO
from django.conf import settings
from django.core.cache import cache
from rest_framework_simplejwt.tokens import AccessToken, RefreshToken
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
import hashlib


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def compare_password(password: str, hashed: str) -> bool:
    return hash_password(password) == hashed


def generate_access_token(user) -> str:
    token = AccessToken()
    token['userId'] = user.id
    token['organizationId'] = user.organization_id
    token['role'] = user.role
    token['name'] = user.name
    return str(token)


def generate_refresh_token(user) -> str:
    token = RefreshToken()
    token['userId'] = user.id
    token['organizationId'] = user.organization_id
    token['role'] = user.role
    return str(token)


def verify_access_token(token_str: str) -> dict | None:
    try:
        token = AccessToken(token_str)
        return {
            'userId': token['userId'],
            'organizationId': token['organizationId'],
            'role': token['role'],
            'name': token.get('name', ''),
        }
    except Exception:
        return None


def verify_refresh_token(token_str: str) -> dict | None:
    try:
        token = RefreshToken(token_str)
        return {
            'userId': token['userId'],
            'organizationId': token['organizationId'],
            'role': token['role'],
        }
    except Exception:
        return None


def has_permission(user_role: str, required_role: str) -> bool:
    hierarchy = {
        'super_admin': 100,
        'org_admin': 80,
        'manager': 60,
        'teacher': 40,
        'parent': 20,
        'student': 10,
        'employee': 0,
    }
    return hierarchy.get(user_role, 0) >= hierarchy.get(required_role, 0)


def generate_otp() -> str:
    return str(uuid.uuid4().int)[:6]


def store_otp(key: str, code: str, otp_type: str, ttl: int = 300):
    cache.set(f'otp:{otp_type}:{key}', code, ttl)


def verify_otp(key: str, code: str, otp_type: str) -> bool:
    stored = cache.get(f'otp:{otp_type}:{key}')
    if stored and stored == code:
        cache.delete(f'otp:{otp_type}:{key}')
        return True
    return False


def generate_2fa_secret(email: str) -> tuple[str, str]:
    secret = pyotp.random_base32()
    totp = pyotp.TOTP(secret)
    otpauth_url = totp.provisioning_uri(name=email, issuer_name='OpenCode CRM')
    return secret, otpauth_url


def verify_2fa_token(secret: str, token: str) -> bool:
    totp = pyotp.TOTP(secret)
    return totp.verify(token)


def generate_2fa_qr_code(otpauth_url: str) -> str:
    img = qrcode.make(otpauth_url)
    buf = BytesIO()
    img.save(buf, format='PNG')
    return base64.b64encode(buf.getvalue()).decode()


class SimpleUser:
    """Minimal user object for DRF authentication."""
    def __init__(self, user_id, organization_id, role, name=''):
        self.id = user_id
        self.pk = user_id
        self.organization_id = organization_id
        self.role = role
        self.name = name
        self.is_active = True

    @property
    def is_authenticated(self):
        return True


class CustomJWTAuthentication(BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return None

        payload = verify_access_token(auth_header[7:])
        if not payload:
            return None

        user = SimpleUser(
            user_id=payload['userId'],
            organization_id=payload['organizationId'],
            role=payload['role'],
            name=payload.get('name', ''),
        )
        request.user_id = payload['userId']
        request.organization_id = payload['organizationId']
        request.user_role = payload['role']

        return (user, None)
