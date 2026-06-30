from django.urls import path
from . import views

urlpatterns = [
    path('', views.expense_list, name='expense-list'),
    path('<str:expense_id>', views.expense_detail, name='expense-detail'),
]
