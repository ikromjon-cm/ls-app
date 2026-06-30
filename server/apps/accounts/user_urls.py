from django.urls import path
from . import views

urlpatterns = [
    path('', views.user_list, name='user-list'),
    path('<str:user_id>', views.user_detail, name='user-detail'),
]
