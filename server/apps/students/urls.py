from django.urls import path
from . import views

urlpatterns = [
    path('', views.student_list, name='student-list'),
    path('<str:student_id>', views.student_detail, name='student-detail'),
]
