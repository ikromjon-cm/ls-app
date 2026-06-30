import re
from django.http import JsonResponse
from rest_framework import status


class OrganizationMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        return response


class SanitizeInputMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.method in ('POST', 'PUT', 'PATCH'):
            if hasattr(request, 'data') and isinstance(request.data, dict):
                request._data = self._sanitize(request.data)
        response = self.get_response(request)
        return response

    def _sanitize(self, value):
        if isinstance(value, str):
            return re.sub(r'<[^>]*>', '', value).strip()
        if isinstance(value, list):
            return [self._sanitize(v) for v in value]
        if isinstance(value, dict):
            return {k: self._sanitize(v) for k, v in value.items()}
        return value


def custom_exception_handler(exc, context):
    from rest_framework.views import exception_handler
    response = exception_handler(exc, context)
    if response is not None:
        errors = []
        if isinstance(response.data, dict):
            for field, msgs in response.data.items():
                if isinstance(msgs, list):
                    errors.extend([f'{field}: {str(m)}' for m in msgs])
                else:
                    errors.append(str(msgs))
        response.data = {
            'success': False,
            'message': str(exc) if str(exc) else 'Xatolik yuz berdi',
            'data': None,
            'errors': errors if errors else [str(exc)],
        }
    else:
        response = JsonResponse({
            'success': False,
            'message': 'Serverda xatolik yuz berdi',
            'data': None,
            'errors': ['SERVER_ERROR'],
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    return response
