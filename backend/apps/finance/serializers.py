"""
Serializers for Finance transactions, categories, and budgets.
"""
from django.db.models import Sum
from rest_framework import serializers
from .models import Budget, Transaction, TransactionCategory


class TransactionCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = TransactionCategory
        fields = [
            "id",
            "user",
            "name",
            "icon",
            "type",
            "color",
            "is_default",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "user", "created_at", "updated_at"]


class TransactionSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    category_color = serializers.CharField(source="category.color", read_only=True)
    category_icon = serializers.CharField(source="category.icon", read_only=True)

    class Meta:
        model = Transaction
        fields = [
            "id",
            "user",
            "title",
            "amount",
            "type",
            "category",
            "category_name",
            "category_color",
            "category_icon",
            "date",
            "notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "user", "created_at", "updated_at"]


class BudgetSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    category_color = serializers.CharField(source="category.color", read_only=True)
    spent = serializers.SerializerMethodField()

    class Meta:
        model = Budget
        fields = [
            "id",
            "user",
            "category",
            "category_name",
            "category_color",
            "month",
            "amount",
            "spent",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "user", "created_at", "updated_at"]

    def get_spent(self, obj):
        # Sum of expense transactions in month for obj.category
        total = (
            Transaction.objects.filter(
                user=obj.user,
                category=obj.category,
                type="expense",
                date__year=obj.month.year,
                date__month=obj.month.month,
            ).aggregate(Sum("amount"))["amount__sum"]
            or 0
        )
        return float(total)
