import pytest


@pytest.mark.asyncio
async def test_create_product(client, owner_token):
    headers, _ = owner_token
    response = await client.post(
        "/api/v1/products",
        headers=headers,
        json={
            "name": "Maggi Noodles",
            "sku": "MAG-001",
            "barcode": "8901058851351",
            "purchase_price": "10.00",
            "selling_price": "14.00",
            "quantity": 100,
            "min_stock": 10,
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Maggi Noodles"
    assert data["quantity"] == 100


@pytest.mark.asyncio
async def test_create_product_duplicate_sku_fails(client, owner_token):
    headers, _ = owner_token
    payload = {
        "name": "Product A", "sku": "DUP-001", "purchase_price": "1.00",
        "selling_price": "2.00", "quantity": 10, "min_stock": 2,
    }
    r1 = await client.post("/api/v1/products", headers=headers, json=payload)
    assert r1.status_code == 200

    payload["name"] = "Product B"
    r2 = await client.post("/api/v1/products", headers=headers, json=payload)
    assert r2.status_code == 400


@pytest.mark.asyncio
async def test_negative_price_rejected(client, owner_token):
    headers, _ = owner_token
    response = await client.post(
        "/api/v1/products",
        headers=headers,
        json={
            "name": "Bad Product", "sku": "BAD-001",
            "purchase_price": "-5.00", "selling_price": "10.00",
            "quantity": 0, "min_stock": 5,
        },
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_list_products(client, owner_token):
    headers, _ = owner_token
    await client.post(
        "/api/v1/products", headers=headers,
        json={"name": "Pepsi", "sku": "PEP-001", "purchase_price": "30", "selling_price": "40", "quantity": 50, "min_stock": 5},
    )
    response = await client.get("/api/v1/products", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1


@pytest.mark.asyncio
async def test_stock_in_increases_quantity(client, owner_token):
    headers, _ = owner_token
    product_resp = await client.post(
        "/api/v1/products", headers=headers,
        json={"name": "Milk", "sku": "MILK-001", "purchase_price": "20", "selling_price": "25", "quantity": 10, "min_stock": 5},
    )
    product_id = product_resp.json()["id"]

    stock_resp = await client.post(
        "/api/v1/stock/in", headers=headers,
        json={"product_id": product_id, "quantity": 20},
    )
    assert stock_resp.status_code == 200

    product = await client.get(f"/api/v1/products/{product_id}", headers=headers)
    assert product.json()["quantity"] == 30


@pytest.mark.asyncio
async def test_stock_out_decreases_quantity(client, owner_token):
    headers, _ = owner_token
    product_resp = await client.post(
        "/api/v1/products", headers=headers,
        json={"name": "Bread", "sku": "BREAD-001", "purchase_price": "20", "selling_price": "30", "quantity": 10, "min_stock": 2},
    )
    product_id = product_resp.json()["id"]

    stock_resp = await client.post(
        "/api/v1/stock/out", headers=headers,
        json={"product_id": product_id, "quantity": 4, "reason": "Sale"},
    )
    assert stock_resp.status_code == 200

    product = await client.get(f"/api/v1/products/{product_id}", headers=headers)
    assert product.json()["quantity"] == 6


@pytest.mark.asyncio
async def test_stock_out_prevents_negative_inventory(client, owner_token):
    headers, _ = owner_token
    product_resp = await client.post(
        "/api/v1/products", headers=headers,
        json={"name": "Sugar", "sku": "SUGAR-001", "purchase_price": "40", "selling_price": "50", "quantity": 5, "min_stock": 2},
    )
    product_id = product_resp.json()["id"]

    stock_resp = await client.post(
        "/api/v1/stock/out", headers=headers,
        json={"product_id": product_id, "quantity": 10, "reason": "Sale"},
    )
    assert stock_resp.status_code == 400
    assert "Insufficient stock" in stock_resp.json()["detail"]


@pytest.mark.asyncio
async def test_audit_calculates_difference(client, owner_token):
    headers, _ = owner_token
    product_resp = await client.post(
        "/api/v1/products", headers=headers,
        json={"name": "Rice", "sku": "RICE-001", "purchase_price": "50", "selling_price": "60", "quantity": 120, "min_stock": 10},
    )
    product_id = product_resp.json()["id"]

    audit_resp = await client.post(
        "/api/v1/audits", headers=headers,
        json={"product_id": product_id, "physical_quantity": 115, "notes": "Monthly check"},
    )
    assert audit_resp.status_code == 200
    data = audit_resp.json()
    assert data["db_quantity"] == 120
    assert data["physical_quantity"] == 115
    assert data["difference"] == -5


@pytest.mark.asyncio
async def test_dashboard_stats(client, owner_token):
    headers, _ = owner_token
    response = await client.get("/api/v1/dashboard/stats", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "total_products" in data
    assert "total_inventory_value" in data
    assert "low_stock_count" in data
