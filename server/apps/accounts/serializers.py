from rest_framework import serializers
from .models import User, Organization


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'login', 'name', 'role', 'email', 'phone', 'avatar', 'active', 'last_login_at', 'created_at']
        read_only_fields = ['id', 'last_login_at', 'created_at']


class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = ['id', 'name', 'slug', 'logo', 'plan', 'status', 'created_at']
        read_only_fields = ['id', 'created_at']
