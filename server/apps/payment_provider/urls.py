from django.urls import path
from . import views

urlpatterns = [
    path('', views.provider_list, name='provider-list'),
    path('click/webhook', views.click_webhook, name='click-webhook'),
    path('payme/webhook', views.payme_webhook, name='payme-webhook'),
]
