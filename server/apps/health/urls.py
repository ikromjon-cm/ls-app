from django.urls import path
from . import views

urlpatterns = [
    path('', views.health, name='health'),
    path('detailed', views.health_detailed, name='health-detailed'),
]
