"""
Views for Finance transactions, categories, budgets, and analytics.
"""
from datetime import date
from django.db.models import Sum
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.common.permissions import IsOwner
from .models import Budget, Transaction, TransactionCategory
from .serializers import (
    BudgetSerializer,
    TransactionCategorySerializer,
    TransactionSerializer,
)


DEFAULT_CATEGORIES = [
    ("Food & Dining", "expense", "#f97316", "utensils"),
    ("Books & Study Materials", "expense", "#6366f1", "book"),
    ("Housing & Rent", "expense", "#ef4444", "home"),
    ("Transportation", "expense", "#3b82f6", "bus"),
    ("Tuition & Exam Fees", "expense", "#8b5cf6", "graduation-cap"),
    ("Personal Care & Health", "expense", "#ec4899", "heart"),
    ("Entertainment & Subscriptions", "expense", "#14b8a6", "tv"),
    ("Allowance / Family Support", "income", "#10b981", "wallet"),
    ("Part-Time Job / Stipend", "income", "#22c55e", "briefcase"),
    ("Scholarship", "income", "#06b6d4", "award"),
    ("Other", "both", "#6b7280", "tag"),
]


def seed_user_categories(user):
    for name, ctype, color, icon in DEFAULT_CATEGORIES:
        TransactionCategory.objects.get_or_create(
            user=user,
            name=name,
            defaults={
                "type": ctype,
                "color": color,
                "icon": icon,
                "is_default": True,
            },
        )


class TransactionCategoryViewSet(viewsets.ModelViewSet):
    """
    CRUD viewset for transaction categories with auto-seeding for new users.
    """

    serializer_class = TransactionCategorySerializer
    permission_classes = [IsAuthenticated, IsOwner]
    filterset_fields = ["type", "is_default"]
    search_fields = ["name"]
    ordering_fields = ["name"]

    def get_queryset(self):
        qs = TransactionCategory.objects.filter(user=self.request.user)
        if not qs.exists():
            seed_user_categories(self.request.user)
            qs = TransactionCategory.objects.filter(user=self.request.user)
        return qs

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class TransactionViewSet(viewsets.ModelViewSet):
    """
    CRUD viewset for income and expense transactions.
    """

    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated, IsOwner]
    filterset_fields = ["type", "category"]
    search_fields = ["title", "notes"]
    ordering_fields = ["date", "amount", "created_at"]

    def get_queryset(self):
        return (
            Transaction.objects.filter(user=self.request.user)
            .select_related("category")
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=["get"], url_path="summary")
    def summary(self, request):
        """
        Returns monthly income, expenses, and net savings.
        Accepts optional ?month=YYYY-MM or defaults to current month.
        """
        month_param = request.query_params.get("month")
        today = timezone.localdate()
        if month_param:
            try:
                parts = month_param.split("-")
                target_year = int(parts[0])
                target_month = int(parts[1])
            except (ValueError, IndexError):
                target_year, target_month = today.year, today.month
        else:
            target_year, target_month = today.year, today.month

        qs = self.get_queryset().filter(
            date__year=target_year, date__month=target_month
        )
        income = (
            qs.filter(type="income").aggregate(Sum("amount"))["amount__sum"] or 0
        )
        expenses = (
            qs.filter(type="expense").aggregate(Sum("amount"))["amount__sum"] or 0
        )
        net_savings = float(income) - float(expenses)

        return Response(
            {
                "year": target_year,
                "month": target_month,
                "total_income": float(income),
                "total_expenses": float(expenses),
                "net_savings": net_savings,
            }
        )

    @action(detail=False, methods=["get"], url_path="analytics")
    def analytics(self, request):
        """
        Returns expense breakdown by category for the requested month.
        """
        month_param = request.query_params.get("month")
        today = timezone.localdate()
        if month_param:
            try:
                parts = month_param.split("-")
                target_year = int(parts[0])
                target_month = int(parts[1])
            except (ValueError, IndexError):
                target_year, target_month = today.year, today.month
        else:
            target_year, target_month = today.year, today.month

        expense_qs = self.get_queryset().filter(
            type="expense", date__year=target_year, date__month=target_month
        )
        total_expense = (
            expense_qs.aggregate(Sum("amount"))["amount__sum"] or 0
        )

        by_cat = (
            expense_qs.values("category__id", "category__name", "category__color")
            .annotate(total=Sum("amount"))
            .order_by("-total")
        )

        categories_data = []
        for item in by_cat:
            cat_total = float(item["total"] or 0)
            pct = (
                round((cat_total / float(total_expense) * 100.0), 1)
                if total_expense > 0
                else 0.0
            )
            categories_data.append(
                {
                    "category_id": str(item["category__id"]),
                    "category_name": item["category__name"] or "Uncategorized",
                    "color": item["category__color"] or "#6366f1",
                    "amount": cat_total,
                    "percent": pct,
                }
            )

        return Response(
            {
                "year": target_year,
                "month": target_month,
                "total_expense": float(total_expense),
                "by_category": categories_data,
            }
        )


class BudgetViewSet(viewsets.ModelViewSet):
    """
    CRUD viewset for monthly category budgets.
    """

    serializer_class = BudgetSerializer
    permission_classes = [IsAuthenticated, IsOwner]
    filterset_fields = ["month", "category"]
    ordering_fields = ["month", "amount"]

    def get_queryset(self):
        return Budget.objects.filter(user=self.request.user).select_related("category")

    def perform_create(self, serializer):
        category = serializer.validated_data.get("category")
        if category.user != self.request.user:
            raise PermissionError("Cannot budget for another user's category.")
        # Ensure month is first day of the month
        m = serializer.validated_data.get("month")
        normalized_month = date(m.year, m.month, 1)
        serializer.save(user=self.request.user, month=normalized_month)
