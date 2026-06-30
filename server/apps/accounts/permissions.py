from rest_framework.permissions import BasePermission
from .auth import has_permission


class IsAuthenticated(BasePermission):
    def has_permission(self, request, view):
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return False
        from .auth import verify_access_token
        payload = verify_access_token(auth_header[7:])
        if not payload:
            return False
        request.user_id = payload.get('userId')
        request.organization_id = payload.get('organizationId')
        request.user_role = payload.get('role')
        return True


class AuthorizeRole(BasePermission):
    allowed_roles = []

    def __init__(self, *roles):
        self.allowed_roles = roles

    def has_permission(self, request, view):
        if not hasattr(request, 'user_role'):
            return False
        return any(
            has_permission(request.user_role, role)
            for role in self.allowed_roles
        )


def authorize(*roles):
    class _AuthorizeRole(BasePermission):
        def has_permission(self, request, view):
            if not hasattr(request, 'user_role'):
                return False
            return any(has_permission(request.user_role, r) for r in roles)
    return _AuthorizeRole
