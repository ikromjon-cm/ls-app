from django.urls import path
from . import views

urlpatterns = [
    path('send', views.send_email_view, name='email-send'),
]
