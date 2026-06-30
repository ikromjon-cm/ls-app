from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from apps.accounts.models import PaymentTransaction


@api_view(['GET'])
def provider_list(request):
    return Response({
        'success': True, 'message': 'OK',
        'data': [
            {'id': 'click', 'name': 'Click', 'active': True},
            {'id': 'payme', 'name': 'Payme', 'active': True},
            {'id': 'uzum', 'name': 'Uzum', 'active': True},
            {'id': 'stripe', 'name': 'Stripe', 'active': True},
        ],
        'errors': [],
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def click_webhook(request):
    return Response({'success': True, 'message': 'OK', 'data': None, 'errors': []})


@api_view(['POST'])
@permission_classes([AllowAny])
def payme_webhook(request):
    return Response({'success': True, 'message': 'OK', 'data': None, 'errors': []})
