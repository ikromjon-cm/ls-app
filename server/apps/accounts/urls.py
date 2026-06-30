from django.urls import path
from . import views

urlpatterns = [
    path('login', views.login, name='auth-login'),
    path('verify-2fa', views.verify_2fa, name='auth-verify-2fa'),
    path('refresh', views.refresh_token, name='auth-refresh'),
    path('logout', views.logout, name='auth-logout'),
    path('send-otp', views.send_otp, name='auth-send-otp'),
    path('verify-otp', views.verify_otp_view, name='auth-verify-otp'),
    path('setup-2fa', views.setup_2fa, name='auth-setup-2fa'),
    path('enable-2fa', views.enable_2fa, name='auth-enable-2fa'),
    path('disable-2fa', views.disable_2fa, name='auth-disable-2fa'),
]
