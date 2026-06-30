from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny


@api_view(['GET'])
@permission_classes([AllowAny])
def api_docs(request):
    return JsonResponse({
        'success': True, 'message': 'API Documentation',
        'data': {
            'openapi': '3.0.0',
            'info': {'title': 'Lighthouse CRM API', 'description': 'Enterprise CRM API', 'version': '2.0.0'},
            'baseUrl': '/api',
        },
        'errors': [],
    })
