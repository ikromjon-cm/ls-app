import os
from datetime import timedelta
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.getenv('DJANGO_SECRET_KEY', 'django-insecure-change-me-in-production')
DEBUG = os.getenv('DJANGO_DEBUG', 'false').lower() == 'true'
ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', '*').split(',')

INSTALLED_APPS = [
    'daphne',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'channels',
    'apps.accounts',
    'apps.groups',
    'apps.students',
    'apps.payments',
    'apps.expenses',
    'apps.attendance',
    'apps.homework',
    'apps.grades',
    'apps.schedule',
    'apps.library',
    'apps.exams',
    'apps.certificates',
    'apps.notifications',
    'apps.messages',
    'apps.dashboard',
    'apps.reports',
    'apps.audit',
    'apps.teacher',
    'apps.parent',
    'apps.setting',
    'apps.email',
    'apps.fcm',
    'apps.payment_provider',
    'apps.health',
    'apps.docs',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'apps.accounts.middleware.OrganizationMiddleware',
    'apps.accounts.middleware.SanitizeInputMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'
ASGI_APPLICATION = 'config.asgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('POSTGRES_DB', 'opencode_crm'),
        'USER': os.getenv('POSTGRES_USER', 'postgres'),
        'PASSWORD': os.getenv('POSTGRES_PASSWORD', 'postgres'),
        'HOST': os.getenv('POSTGRES_HOST', 'localhost'),
        'PORT': os.getenv('POSTGRES_PORT', '5434'),
        'OPTIONS': {
            'connect_timeout': 10,
        },
    }
}

CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': os.getenv('REDIS_URL', 'redis://localhost:6379/0'),
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            'IGNORE_EXCEPTIONS': True,
        },
    }
}

CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            'hosts': [os.getenv('REDIS_URL', 'redis://localhost:6379')],
        },
    },
}

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'apps.accounts.auth.CustomJWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 50,
    'DEFAULT_RENDERER_CLASSES': (
        'rest_framework.renderers.JSONRenderer',
    ),
    'EXCEPTION_HANDLER': 'apps.accounts.middleware.custom_exception_handler',
    'DATETIME_FORMAT': '%Y-%m-%dT%H:%M:%S.%fZ',
    'UNAUTHENTICATED_USER': None,
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=24),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'SIGNING_KEY': os.getenv('JWT_SECRET', SECRET_KEY),
}

CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = [
    'content-type', 'authorization', 'x-organization-id', 'x-csrftoken',
]

LANGUAGE_CODE = 'uz'
TIME_ZONE = 'Asia/Tashkent'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
MEDIA_URL = 'uploads/'
MEDIA_ROOT = BASE_DIR / 'uploads'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

if not DEBUG:
    SENTRY_DSN = os.getenv('SENTRY_DSN')
    if SENTRY_DSN:
        import sentry_sdk
        sentry_sdk.init(dsn=SENTRY_DSN, send_default_pants=False)

FCM_SERVER_KEY = os.getenv('FCM_SERVER_KEY', '')
RESEND_API_KEY = os.getenv('RESEND_API_KEY', '')
CLICK_MERCHANT_ID = os.getenv('CLICK_MERCHANT_ID', '')
CLICK_SECRET_KEY = os.getenv('CLICK_SECRET_KEY', '')
PAYME_MERCHANT_ID = os.getenv('PAYME_MERCHANT_ID', '')
PAYME_SECRET_KEY = os.getenv('PAYME_SECRET_KEY', '')
UZUM_MERCHANT_ID = os.getenv('UZUM_MERCHANT_ID', '')
UZUM_SECRET_KEY = os.getenv('UZUM_SECRET_KEY', '')
UZUM_TERMINAL_ID = os.getenv('UZUM_TERMINAL_ID', '')
STRIPE_SECRET_KEY = os.getenv('STRIPE_SECRET_KEY', '')
