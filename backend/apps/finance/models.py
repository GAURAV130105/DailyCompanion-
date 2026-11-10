"""
Models for Student Finance, transactions, categories, and budgets.
"""
from django.conf import settings
from django.db import models
from apps.common.models import BaseModel


class TransactionCategory(BaseModel):
    """
    Category for grouping income and expense transactions.
    """

    TYPE_CHOICES = [
        ("income", "Income"),
        ("expense", "Expense"),
        ("both", "Both"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="transaction_categories",
    )
    name = models.CharField(max_length=100)
    icon = models.CharField(max_length=50, blank=True)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default="expense")
    color = models.CharField(max_length=7, default="#6366f1")
    is_default = models.BooleanField(default=False)

    class Meta:
        ordering = ["name"]
        verbose_name = "Transaction Category"
        verbose_name_plural = "Transaction Categories"

    def __str__(self):
        return f"{self.name} ({self.type})"


class Transaction(BaseModel):
    """
    Financial transaction record (Income or Expense).
    """

    TYPE_CHOICES = [
        ("income", "Income"),
        ("expense", "Expense"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="transactions",
    )
    title = models.CharField(max_length=200)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default="expense")
    category = models.ForeignKey(
        TransactionCategory,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="transactions",
    )
    date = models.DateField(db_index=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["-date", "-created_at"]
        verbose_name = "Transaction"
        verbose_name_plural = "Transactions"

    def __str__(self):
        return f"{self.type.upper()}: {self.title} - {self.amount}"


class Budget(BaseModel):
    """
    Monthly spending limit allocated to a transaction category.
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="budgets",
    )
    category = models.ForeignKey(
        TransactionCategory,
        on_delete=models.CASCADE,
        related_name="budgets",
    )
    month = models.DateField(help_text="First day of the budget month (YYYY-MM-01)")
    amount = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        unique_together = ["user", "category", "month"]
        ordering = ["-month", "category__name"]
        verbose_name = "Budget"
        verbose_name_plural = "Budgets"

    def __str__(self):
        return f"Budget {self.category.name} ({self.month}): {self.amount}"
