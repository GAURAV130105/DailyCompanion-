"""
URLs for Finance module.
"""
from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import BudgetViewSet, TransactionCategoryViewSet, TransactionViewSet

app_name = "finance"

router = DefaultRouter()
router.register("categories", TransactionCategoryViewSet, basename="finance-category")
router.register("budgets", BudgetViewSet, basename="budget")
router.register("transactions", TransactionViewSet, basename="transaction")

urlpatterns = [
    path("", include(router.urls)),
]
