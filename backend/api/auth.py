"""
Campus Gate - Authentication & Official Google OAuth Endpoints
==============================================================
"""

from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from backend.core.auth import (
    verify_google_id_token,
    get_or_create_user,
    create_access_token,
    get_current_user,
    is_contributor_superadmin,
    CONTRIBUTOR_SUPERADMINS
)
from backend.core.config import settings

router = APIRouter(prefix="/api/auth", tags=["Authentication & Official Google OAuth"])


class OAuthGoogleRequest(BaseModel):
    credential: Optional[str] = None  # Official Google JWT id_token from Google Identity Services SDK
    email: Optional[str] = None       # Fallback for dev/persona testing
    name: Optional[str] = None
    avatar: Optional[str] = None
    role: Optional[str] = None        # Optional persona request for testing


class LoginRequest(BaseModel):
    email: str
    password: Optional[str] = None
    role: Optional[str] = None


@router.get("/config", summary="Get Public OAuth Configuration")
def get_auth_config():
    """Returns Google Client ID and project contributor superadmin whitelist."""
    return {
        "google_client_id": settings.GOOGLE_CLIENT_ID or "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com",
        "superadmin_emails": CONTRIBUTOR_SUPERADMINS
    }


@router.get("/contributors", summary="Get Project Contributors & Superadmin Roster")
def get_contributors():
    """Returns list of project contributors permanently elevated to Superadmin."""
    contributors = [
        {
            "name": "Arin Gupta",
            "email": "24cd10ar15@mitsgwl.ac.in",
            "role": "superadmin",
            "contribution": "Core Architecture, Computer Vision & Backend",
            "is_superadmin": True,
            "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
        },
        {
            "name": "Vivek Chaurasiya",
            "email": "vivekchaurasiya943@gmail.com",
            "role": "superadmin",
            "contribution": "Project Contributor & AI Pipeline",
            "is_superadmin": True,
            "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"
        },
        {
            "name": "Sarvesh Baghel",
            "email": "sarveshsingh8462@gmail.com",
            "role": "superadmin",
            "contribution": "Project Contributor & Security Operations",
            "is_superadmin": True,
            "avatar": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80"
        }
    ]
    return contributors


@router.post("/oauth/google", summary="Official Google OAuth2 Ingress Verification & Registration")
def oauth_google_login(req: OAuthGoogleRequest):
    """
    Exchanges Google OAuth2 credential (from Google Identity Services) for a signed JWT.
    - If a real Google credential token is provided, validates with Google tokeninfo.
    - Automatically checks email against project contributors; if matched, grants Superadmin.
    - Automatically registers new users into database.
    """
    verified_email = None
    verified_name = None
    verified_avatar = None
    google_id = None

    if req.credential and req.credential.strip() and not req.credential.startswith("mock-"):
        # Verify official Google JWT with Google's servers
        try:
            google_profile = verify_google_id_token(req.credential)
            verified_email = google_profile["email"]
            verified_name = google_profile["name"]
            verified_avatar = google_profile["avatar"]
            google_id = google_profile["google_id"]
        except Exception as e:
            # If Google token verification fails or offline, report or fallback
            raise HTTPException(status_code=401, detail=f"Google token verification failed: {e}")
    else:
        # Dev / Testing fallback
        verified_email = (req.email or "24cd10ar15@mitsgwl.ac.in").strip().lower()
        verified_name = req.name or ("Arin Gupta" if "24cd10ar15" in verified_email else verified_email.split("@")[0].title())
        verified_avatar = req.avatar

    # Register or fetch user from DB; contributor check executes inside get_or_create_user
    user = get_or_create_user(
        email=verified_email,
        name=verified_name,
        avatar=verified_avatar,
        google_id=google_id,
        requested_role=req.role
    )

    token = create_access_token({
        "sub": user["email"],
        "id": user["id"],
        "name": user["name"],
        "role": user["role"],
        "is_superadmin": user.get("is_superadmin", False),
        "department": user["department"],
        "avatar": user["avatar"]
    })

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user,
        "is_superadmin": user.get("is_superadmin", False)
    }


@router.post("/login", summary="Direct Login & Contributor Persona Elevation")
def login(req: LoginRequest):
    """Direct login; contributors are automatically elevated to Superadmin."""
    user = get_or_create_user(
        email=req.email,
        requested_role=req.role
    )

    token = create_access_token({
        "sub": user["email"],
        "id": user["id"],
        "name": user["name"],
        "role": user["role"],
        "is_superadmin": user.get("is_superadmin", False),
        "department": user["department"],
        "avatar": user["avatar"]
    })

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user,
        "is_superadmin": user.get("is_superadmin", False)
    }


@router.get("/me", summary="Get Authenticated User Profile & Active Permissions")
def get_me(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Returns profile and active privilege flags for the authenticated user."""
    role = current_user.get("role", "user")
    is_super = current_user.get("is_superadmin", False) or is_contributor_superadmin(current_user.get("email", ""))

    permissions = {
        "is_superadmin": is_super,
        "can_access_global_portal": True,
        "can_operate_gate_barrier": role in ["guard", "admin"] or is_super,
        "can_resolve_alerts": role in ["guard", "admin"] or is_super,
        "can_view_cctv_matrix": role == "admin" or is_super,
        "can_manage_roster_crud": role == "admin" or is_super,
        "can_view_analytics": role == "admin" or is_super,
        "can_configure_nodes": role == "admin" or is_super,
        "can_elevate_roles": is_super
    }

    return {
        "user": current_user,
        "permissions": permissions
    }
