"""
Unit tests for CampusGate Authentication, Google OAuth2, Personas, and Security Handlers
"""

import pytest
import asyncio
from unittest.mock import MagicMock, patch
from fastapi import Request
from starlette.datastructures import Headers

from backend.main import app
from backend.api.auth import (
    get_auth_config,
    get_contributors,
    get_personas,
    oauth_google_get,
    oauth_google_login,
    login,
    get_me,
    LoginRequest
)
from backend.core.auth import (
    create_access_token,
    decode_access_token,
    is_contributor_superadmin,
    ALL_SUPERADMIN_EMAILS
)


def test_auth_routes_registered():
    """Verify that both GET and POST routes are registered for /api/auth/oauth/google."""
    methods_by_path = {}
    for route in app.routes:
        if hasattr(route, "path") and hasattr(route, "methods"):
            methods_by_path.setdefault(route.path, set()).update(route.methods)

    assert "/api/auth/oauth/google" in methods_by_path
    assert "GET" in methods_by_path["/api/auth/oauth/google"], "GET must be registered to prevent 405 Method Not Allowed"
    assert "POST" in methods_by_path["/api/auth/oauth/google"], "POST must be registered"
    assert "/api/auth/oauth/google/callback" in methods_by_path
    assert "/api/auth/personas" in methods_by_path


def test_auth_config_endpoint():
    config = get_auth_config()
    assert "google_client_id" in config
    assert "superadmin_emails" in config
    assert isinstance(config["superadmin_emails"], list)


def test_contributors_endpoint():
    contributors = get_contributors()
    assert len(contributors) >= 3
    emails = [c["email"] for c in contributors]
    assert "24cd10ar15@mitsgwl.ac.in" in emails
    assert "vivekchaurasiya943@gmail.com" in emails
    assert "sarveshsingh8462@gmail.com" in emails
    sarvesh = next(c for c in contributors if "sarvesh" in c["email"])
    assert sarvesh["avatar"] == "/assets/sarvesh.png"


def test_personas_endpoint():
    personas = get_personas()
    assert len(personas) >= 3
    roles = [p["role"] for p in personas]
    assert "user" in roles
    assert "guard" in roles
    assert "admin" in roles


def test_contributor_superadmin_elevation():
    assert is_contributor_superadmin("24cd10ar15@mitsgwl.ac.in") is True
    assert is_contributor_superadmin("vivekchaurasiya943@gmail.com") is True
    assert is_contributor_superadmin("sarveshsingh8462@gmail.com") is True
    assert is_contributor_superadmin("random_visitor@gmail.com") is False


def test_jwt_token_generation_and_decode():
    payload = {
        "sub": "sarveshsingh8462@gmail.com",
        "role": "admin",
        "is_superadmin": True
    }
    token = create_access_token(payload)
    decoded = decode_access_token(token)
    assert decoded["sub"] == "sarveshsingh8462@gmail.com"
    assert decoded["role"] == "admin"
    assert decoded["is_superadmin"] is True


def test_direct_login_endpoint():
    req = LoginRequest(email="sarveshsingh8462@gmail.com", role="admin")
    resp = login(req)
    assert "access_token" in resp
    assert resp["user"]["role"] == "admin"
    assert resp["user"]["is_superadmin"] is True
    assert resp["is_superadmin"] is True


def test_oauth_google_get_no_code():
    """When GET /api/auth/oauth/google is accessed without params, returns 200 ready dict or 302/307 redirect."""
    scope = {
        "type": "http",
        "method": "GET",
        "path": "/api/auth/oauth/google",
        "headers": [(b"host", b"localhost:8000"), (b"accept", b"application/json")],
        "scheme": "http",
        "server": ("localhost", 8000),
    }
    request = Request(scope)
    res = oauth_google_get(request=request, code=None, credential=None, state=None, error=None, role=None)
    assert res is not None


def test_user_monthly_stats_endpoint():
    """Verify that /api/auth/me/stats calculates travel frequency, vehicles and charts data."""
    from backend.api.auth import get_user_monthly_stats
    from backend.core.database import SessionLocal
    db = SessionLocal()
    try:
        data = get_user_monthly_stats(
            current_user={
                "name": "Arin Gupta",
                "email": "24cd10ar15@mitsgwl.ac.in",
                "role": "user",
                "department": "Computer Science & Engineering"
            },
            db=db
        )
        assert "summary" in data
        assert "registered_vehicles" in data
        assert "daily_ingress_trend" in data
        assert "hourly_distribution" in data
        assert "gate_distribution" in data
        assert "recent_entries" in data
        assert len(data["registered_vehicles"]) >= 1
        assert len(data["daily_ingress_trend"]) >= 28
        assert data["summary"]["total_trips_this_month"] >= 1
        assert "weekly_travel_frequency" in data["summary"]
    finally:
        db.close()
