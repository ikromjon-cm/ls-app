from django.urls import path
from . import views

urlpatterns = [
    path('', views.attendance_list, name='attendance-list'),
    path('bulk', views.attendance_bulk, name='attendance-bulk'),
]
