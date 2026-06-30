from django.urls import path
from . import views

urlpatterns = [
    path('', views.payment_list, name='payment-list'),
    path('<str:payment_id>', views.payment_detail, name='payment-detail'),
]
