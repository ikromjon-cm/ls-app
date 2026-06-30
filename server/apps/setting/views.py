from rest_framework.decorators import api_view
from rest_framework.response import Response
from apps.accounts.models import Organization, OrganizationBranch, OrganizationCourse
from apps.accounts.serializers import OrganizationSerializer
from apps.accounts.auth import verify_access_token


def _user(request):
    auth = request.headers.get('Authorization', '')
    if auth.startswith('Bearer '):
        return verify_access_token(auth[7:])
    return None


@api_view(['GET', 'PUT'])
def settings_view(request):
    user = _user(request)
    if not user or user.get('role') not in ('super_admin', 'org_admin'):
        return Response({'success': False, 'message': "Ruxsat yo'q", 'errors': ['FORBIDDEN']}, status=403)

    org_id = user['organizationId']

    if request.method == 'GET':
        org = Organization.objects.filter(id=org_id).first()
        branches = OrganizationBranch.objects.filter(organization_id=org_id).values('id', 'name', 'address', 'phone')
        courses = OrganizationCourse.objects.filter(organization_id=org_id).values('id', 'name')
        return Response({
            'success': True, 'message': 'OK',
            'data': {
                'organization': OrganizationSerializer(org).data if org else None,
                'branches': list(branches),
                'courses': list(courses),
            },
            'errors': [],
        })

    Organization.objects.filter(id=org_id).update(**request.data.get('organization', {}))
    return Response({'success': True, 'message': 'Sozlamalar saqlandi', 'data': None, 'errors': []})
