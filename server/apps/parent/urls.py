from django.urls import path
from . import views

urlpatterns = [
    path('children', views.parent_children, name='parent-children'),
]
