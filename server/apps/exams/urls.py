from django.urls import path
from . import views

urlpatterns = [
    path('', views.exam_list, name='exam-list'),
    path('results', views.exam_results, name='exam-results'),
]
