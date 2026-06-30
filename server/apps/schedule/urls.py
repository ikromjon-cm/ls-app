from django.urls import path
from . import views

urlpatterns = [
    path('', views.schedule_list, name='schedule-list'),
    path('<str:entry_id>', views.schedule_detail, name='schedule-detail'),
]
