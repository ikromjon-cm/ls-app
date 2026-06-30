from django.urls import path
from . import views

urlpatterns = [
    path('', views.homework_list, name='homework-list'),
    path('<str:hw_id>', views.homework_detail, name='homework-detail'),
]
