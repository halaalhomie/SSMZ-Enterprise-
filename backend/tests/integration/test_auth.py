import pytest


@pytest.mark.asyncio
async def test_register_creates_owner(client):
    response = await client.post(
        "/api/v1/auth/register?store_name=My Shop",
        json={
            "name": "Owner Name",
            "email": "newowner@test.com",
            "password": "StrongPass1!",
            "role": "owner",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["user"]["email"] == "newowner@test.com"
    assert data["user"]["role"] == "owner"
    assert "access_token" in data
    assert "refresh_token" in data


@pytest.mark.asyncio
async def test_register_rejects_weak_password(client):
    response = await client.post(
        "/api/v1/auth/register?store_name=My Shop",
        json={
            "name": "Owner",
            "email": "weak@test.com",
            "password": "weak",
            "role": "owner",
        },
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_login_success(client, owner_token):
    _, user = owner_token
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": user["email"], "password": "TestPass123!"},
    )
    assert response.status_code == 200
    assert "access_token" in response.json()


@pytest.mark.asyncio
async def test_login_wrong_password(client, owner_token):
    _, user = owner_token
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": user["email"], "password": "WrongPassword1!"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_me_requires_auth(client):
    response = await client.get("/api/v1/auth/me")
    assert response.status_code in (401, 403)


@pytest.mark.asyncio
async def test_get_me_with_valid_token(client, owner_token):
    headers, user = owner_token
    response = await client.get("/api/v1/auth/me", headers=headers)
    assert response.status_code == 200
    assert response.json()["email"] == user["email"]


@pytest.mark.asyncio
async def test_refresh_token_flow(client, owner_token):
    headers, user = owner_token
    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"email": user["email"], "password": "TestPass123!"},
    )
    refresh_token = login_resp.json()["refresh_token"]

    response = await client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
    assert response.status_code == 200
    assert "access_token" in response.json()


@pytest.mark.asyncio
async def test_change_password(client, owner_token):
    headers, user = owner_token
    response = await client.post(
        "/api/v1/auth/change-password",
        headers=headers,
        json={"current_password": "TestPass123!", "new_password": "NewPass456!"},
    )
    assert response.status_code == 200

    # Old password should no longer work
    old_login = await client.post(
        "/api/v1/auth/login",
        json={"email": user["email"], "password": "TestPass123!"},
    )
    assert old_login.status_code == 401

    # New password should work
    new_login = await client.post(
        "/api/v1/auth/login",
        json={"email": user["email"], "password": "NewPass456!"},
    )
    assert new_login.status_code == 200
