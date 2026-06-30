from django.core.management.base import BaseCommand
from apps.accounts.models import Organization, User, OrganizationBranch, OrganizationCourse
from apps.accounts.auth import hash_password


class Command(BaseCommand):
    help = 'Seed database with initial data'

    def handle(self, *args, **options):
        org, _ = Organization.objects.get_or_create(
            slug='demo',
            defaults={'name': 'Demo Maktab', 'plan': 'starter', 'status': 'active'},
        )

        OrganizationBranch.objects.get_or_create(organization=org, name='Asosiy filial')

        courses = ['Frontend', 'Backend', 'IELTS', 'Python', 'Mobile', 'Design']
        for name in courses:
            OrganizationCourse.objects.get_or_create(organization=org, name=name)

        users_data = [
            {'login': 'superadmin', 'name': 'Super Admin', 'password': 'admin123', 'role': 'super_admin'},
            {'login': 'admin1', 'name': 'Admin 1', 'password': 'admin123', 'role': 'org_admin'},
            {'login': 'teacher1', 'name': 'Teacher 1', 'password': 'teacher123', 'role': 'teacher'},
        ]
        for u in users_data:
            User.objects.get_or_create(
                organization=org, login=u['login'],
                defaults={
                    'name': u['name'],
                    'password': hash_password(u['password']),
                    'role': u['role'],
                    'active': True,
                },
            )

        self.stdout.write(self.style.SUCCESS('Database seeded successfully'))
