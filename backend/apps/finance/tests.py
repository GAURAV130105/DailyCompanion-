import pytest
from rest_framework import status
from apps.finance.models import TransactionCategory, Transaction


@pytest.mark.django_db
class TestFinanceAPI:
    def test_create_category_and_transaction(self, auth_client, user):
        cat_res = auth_client.post("/api/v1/finance/categories/", {
            "name": "Books & Study Material",
            "type": "expense",
            "color": "#6366f1",
        })
        assert cat_res.status_code == status.HTTP_201_CREATED
        cat_id = cat_res.data["id"]

        tx_res = auth_client.post("/api/v1/finance/transactions/", {
            "title": "UPSC Prelims Mock Test Series",
            "amount": "2500.00",
            "type": "expense",
            "category": cat_id,
            "date": "2026-11-08",
        })
        assert tx_res.status_code == status.HTTP_201_CREATED
        assert float(tx_res.data["amount"]) == 2500.0
