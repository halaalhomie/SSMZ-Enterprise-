from app.core.security import (
    hash_password, verify_password, create_access_token, create_refresh_token,
    decode_token, validate_password_strength,
)


def test_password_hashing_roundtrip():
    plain = "MySecret123!"
    hashed = hash_password(plain)
    assert hashed != plain
    assert verify_password(plain, hashed) is True
    assert verify_password("WrongPassword", hashed) is False


def test_access_token_roundtrip():
    token = create_access_token({"sub": "user-123", "role": "owner"})
    payload = decode_token(token)
    assert payload["sub"] == "user-123"
    assert payload["type"] == "access"


def test_refresh_token_roundtrip():
    token = create_refresh_token({"sub": "user-123"})
    payload = decode_token(token)
    assert payload["type"] == "refresh"


def test_password_strength_validation():
    assert validate_password_strength("Weak1!") is False  # too short
    assert validate_password_strength("alllowercase1!") is False  # no uppercase
    assert validate_password_strength("ALLUPPERCASE1!") is False  # no lowercase
    assert validate_password_strength("NoDigitsHere!") is False  # no digit
    assert validate_password_strength("NoSpecialChar123") is False  # no special char
    assert validate_password_strength("ValidPass123!") is True
