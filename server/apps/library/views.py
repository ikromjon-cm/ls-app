from django.db.models import Q
from rest_framework.decorators import api_view
from rest_framework.response import Response
from apps.accounts.models import Book
from apps.accounts.auth import verify_access_token


def _user(request):
    auth = request.headers.get('Authorization', '')
    if auth.startswith('Bearer '):
        return verify_access_token(auth[7:])
    return None


@api_view(['GET', 'POST'])
def book_list(request):
    user = _user(request)
    if not user:
        return Response({'success': False, 'message': 'Unauthorized', 'errors': ['NO_TOKEN']}, status=401)

    org_id = user['organizationId']

    if request.method == 'GET':
        where = {'organization_id': org_id}
        search = request.query_params.get('search')
        if search:
            where['OR'] = [
                Q(title__icontains=search),
                Q(author__icontains=search),
            ]
        books = Book.objects.filter(organization_id=org_id)
        if search:
            books = books.filter(Q(title__icontains=search) | Q(author__icontains=search))
        books = books.order_by('-created_at')
        data = [{
            'id': b.id, 'title': b.title, 'author': b.author,
            'category': b.category, 'fileUrl': b.file_url,
            'description': b.description, 'createdById': b.created_by_id,
            'createdAt': b.created_at,
        } for b in books]
        return Response({'success': True, 'message': 'OK', 'data': data, 'errors': []})

    if user.get('role') not in ('super_admin', 'org_admin'):
        return Response({'success': False, 'message': "Ruxsat yo'q", 'errors': ['FORBIDDEN']}, status=403)

    body = request.data
    book = Book.objects.create(
        organization_id=org_id, title=body.get('title'), author=body.get('author'),
        category=body.get('category'), file_url=body.get('fileUrl'),
        description=body.get('description'), created_by_id=user['userId'],
    )
    return Response({
        'success': True, 'message': "Kitob qo'shildi",
        'data': {'id': book.id, 'title': book.title}, 'errors': [],
    }, status=201)


@api_view(['DELETE'])
def book_detail(request, book_id):
    user = _user(request)
    if not user or user.get('role') not in ('super_admin', 'org_admin'):
        return Response({'success': False, 'message': "Ruxsat yo'q", 'errors': ['FORBIDDEN']}, status=403)
    Book.objects.filter(id=book_id).delete()
    return Response({'success': True, 'message': "Kitob o'chirildi", 'data': None, 'errors': []})
