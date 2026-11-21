from unittest.mock import patch
import pytest
from fastapi import HTTPException

from backend.core.config import settings
from backend.core.auth import get_current_user
from backend.api.gate import verify_barrier_access

def test_get_current_user_production_rejection():
    """Verify that unauthenticated requests are strictly rejected in production."""
    with patch.object(settings, "ENVIRONMENT", "production"):
        with pytest.raises(HTTPException) as exc_info:
            get_current_user(authorization=None)
        assert exc_info.value.status_code == 401
        assert "Authentication credentials were not provided" in exc_info.value.detail

def test_get_current_user_invalid_token_production():
    """Verify that invalid tokens are rejected with HTTP 401."""
    with patch.object(settings, "ENVIRONMENT", "production"):
        with pytest.raises(HTTPException) as exc_info:
            get_current_user(authorization="Bearer completely_bogus_token")
        assert exc_info.value.status_code == 401

def test_get_current_user_development_fallback():
    """Verify that development fallback permits testing without Bearer tokens."""
    with patch.object(settings, "ENVIRONMENT", "development"):
        with patch("backend.core.auth.get_or_create_user", return_value={"role": "admin", "email": "dev@mits.ac.in"}):
            user = get_current_user(authorization=None)
            assert user["role"] == "admin"
            assert user["email"] == "dev@mits.ac.in"

def test_verify_barrier_access_allows_guard():
    """Guard role must be authorized to operate boom barriers."""
    role = verify_barrier_access({"role": "guard", "email": "guard@mits.ac.in"})
    assert role == "guard"

def test_verify_barrier_access_allows_admin():
    """Admin role must be authorized to operate boom barriers."""
    role = verify_barrier_access({"role": "admin", "email": "admin@mits.ac.in"})
    assert role == "admin"

def test_verify_barrier_access_blocks_student():
    """Student role must be denied barrier control with HTTP 403 Forbidden."""
    with pytest.raises(HTTPException) as exc_info:
        verify_barrier_access({"role": "student", "email": "student@mits.ac.in"})
    assert exc_info.value.status_code == 403
    assert "not authorized to actuate gate barriers" in exc_info.value.detail

def test_verify_barrier_access_blocks_viewer():
    """Viewer / anonymous role must be denied barrier control with HTTP 403 Forbidden."""
    with pytest.raises(HTTPException) as exc_info:
        verify_barrier_access({"role": "viewer", "email": "viewer@mits.ac.in"})
    assert exc_info.value.status_code == 403

def test_cors_configuration_hardened():
    """Verify CORS origins do not combine credentials with wildcard."""
    assert "*" not in settings.CORS_ORIGINS
    assert len(settings.CORS_ORIGINS) > 0


def test_authorized_vehicles_operator_protection():
    """Verify non-operators are blocked from modifying authorized vehicles."""
    from backend.api.authorized import _require_operator
    with pytest.raises(HTTPException) as exc_info:
        _require_operator({"role": "user", "email": "user@mits.ac.in"})
    assert exc_info.value.status_code == 403
    assert "cannot modify authorized vehicle registry" in exc_info.value.detail


def test_entries_review_resolve_operator_protection():
    """Verify non-operators are blocked from resolving entry reviews."""
    from backend.api.entries import _require_operator_role
    with pytest.raises(HTTPException) as exc_info:
        _require_operator_role({"role": "student", "email": "student@mits.ac.in"})
    assert exc_info.value.status_code == 403
    assert "not authorized to perform operator audit actions" in exc_info.value.detail


def test_vision_simulation_operator_protection():
    """Verify non-operators are blocked from triggering fake simulated entries."""
    from backend.api.vision import _require_simulation_operator
    with pytest.raises(HTTPException) as exc_info:
        _require_simulation_operator({"role": "user", "email": "hacker@evil.com"})
    assert exc_info.value.status_code == 403
    assert "cannot trigger simulated ingress" in exc_info.value.detail
