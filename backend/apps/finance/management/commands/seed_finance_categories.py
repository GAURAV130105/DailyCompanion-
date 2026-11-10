"""
Management command to seed default transaction categories for existing users.
"""
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from apps.finance.views import seed_user_categories

User = get_user_model()


class Command(BaseCommand):
    help = "Seeds default financial categories for users who don't have them yet."

    def handle(self, *args, **options):
        users = User.objects.all()
        count = 0
        for user in users:
            seed_user_categories(user)
            count += 1
        self.stdout.write(
            self.style.SUCCESS(f"Successfully ensured default finance categories for {count} users.")
        )
