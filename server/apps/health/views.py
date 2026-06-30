import os
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.db import connections
from django.core.cache import cache


@api_view(['GET'])
@permission_classes([AllowAny])
def health(request):
    db_healthy = False
    redis_healthy = False
    try:
        connections['default'].ensure_connection()
        db_healthy = True
    except Exception:
        pass
    try:
        cache.ping()
        redis_healthy = True
    except Exception:
        pass
    return Response({
        'success': True, 'message': 'OK',
        'data': {
            'status': 'healthy',
            'uptime': 0,
            'database': 'healthy' if db_healthy else 'unhealthy',
            'redis': 'healthy' if redis_healthy else 'unhealthy',
        },
        'errors': [],
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def health_detailed(request):
    db_healthy = False
    redis_healthy = False
    try:
        connections['default'].ensure_connection()
        db_healthy = True
    except Exception:
        pass
    try:
        cache.ping()
        redis_healthy = True
    except Exception:
        pass
    return Response({
        'success': True, 'message': 'OK',
        'data': {
            'status': 'healthy',
            'uptime': 0,
            'database': 'healthy' if db_healthy else 'unhealthy',
            'redis': 'healthy' if redis_healthy else 'unhealthy',
            'memory': {
                'rss': 'N/A', 'heapUsed': 'N/A', 'heapTotal': 'N/A',
            },
            'nodeVersion': 'N/A',
        },
        'errors': [],
    })
