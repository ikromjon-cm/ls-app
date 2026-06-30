from django.urls import path
from . import views

urlpatterns = [
    path('financial', views.report_financial, name='report-financial'),
    path('students', views.report_students, name='report-students'),
]
