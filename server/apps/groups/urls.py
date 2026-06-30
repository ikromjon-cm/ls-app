from django.urls import path
from . import views

urlpatterns = [
    path('', views.group_list, name='group-list'),
    path('<str:group_id>', views.group_detail, name='group-detail'),
]
