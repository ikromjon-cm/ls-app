from django.urls import path
from . import views

urlpatterns = [
    path('', views.book_list, name='book-list'),
    path('<str:book_id>', views.book_detail, name='book-detail'),
]
