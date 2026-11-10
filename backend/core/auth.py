"""
Campus Gate - Authentication & Official Google OAuth Module
===========================================================
Handles official Google OAuth2 token verification, persistent user registration,
and explicit Superadmin promotion for project contributors.
"""

import os
import time
import json
import urllib.request
import urllib.error
from typing import Optional, Dict, Any, List
import jwt
from fastapi import HTTPException, status, Header
from sqlalchemy.orm import Session

from backend.core.config import settings
from backend.core.database import SessionLocal
from backend.models.user import User

SECRET_KEY = settings.JWT_SECRET_KEY
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_SECONDS = 60 * 60 * 24 * 7  # 7 days

# Project Core Contributors permanently promoted to Superadmin
CONTRIBUTOR_SUPERADMINS = [
    "24cd10ar15@mitsgwl.ac.in",       # Arin Gupta (Lead Contributor)
    "arin.gupta@mits.ac.in",          # Arin Gupta (Institutional)
    "vivekchaurasiya943@gmail.com",   # Vivek Chaurasiya (Core Contributor)
    "sarveshsingh8462@gmail.com",     # Sarvesh Baghel (Core Contributor)
    "admin@campusgate.edu"            # Fallback local admin
]

# Ensure settings superadmins are merged
ALL_SUPERADMIN_EMAILS = set(CONTRIBUTOR_SUPERADMINS + [e.lower() for e in settings.SUPERADMIN_EMAILS])


def is_contributor_superadmin(email: str) -> bool:
    """Checks whether the given email belongs to a designated project contributor."""
    if not email:
        return False
    return email.strip().lower() in ALL_SUPERADMIN_EMAILS


def verify_google_id_token(id_token: str) -> Dict[str, Any]:
    """
    Verifies a Google OAuth2 ID Token using Google's official public tokeninfo service.
    Returns verified user payload: email, name, picture, sub.
    """
    if not id_token:
        raise HTTPException(status_code=400, detail="Missing Google ID token.")

    tokeninfo_url = f"https://oauth2.googleapis.com/tokeninfo?id_token={id_token}"
    try:
        req = urllib.request.Request(tokeninfo_url, headers={"User-Agent": "CampusGate-Auth/1.0"})
        with urllib.request.urlopen(req, timeout=6.0) as response:
            payload = json.loads(response.read().decode("utf-8"))
            
            # Basic claim validation
            if "email" not in payload:
                raise HTTPException(status_code=400, detail="Google token does not contain email.")
            return {
                "google_id": payload.get("sub"),
                "email": payload["email"].lower(),
                "name": payload.get("name") or payload["email"].split("@")[0].title(),
                "avatar": payload.get("picture", ""),
                "email_verified": payload.get("email_verified") == "true" or payload.get("email_verified") is True
            }
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Google token verification failed: {error_body}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Network error communicating with Google Identity service: {str(e)}"
        )


def get_or_create_user(email: str, name: Optional[str] = None, avatar: Optional[str] = None,
                       google_id: Optional[str] = None, requested_role: Optional[str] = None) -> Dict[str, Any]:
    """
    Looks up user in database; registers them if new.
    Project contributors are permanently and immutably set to 'superadmin' / 'admin'.
    """
    clean_email = email.strip().lower()
    is_super = is_contributor_superadmin(clean_email)
    
    # Determine granted role
    if is_super:
        assigned_role = "admin"  # Has full admin + superadmin privileges
        assigned_dept = "Project Core Contributor (Superadmin)"
    elif requested_role in ["guard", "admin"]:
        assigned_role = requested_role
        assigned_dept = "Campus Security Personnel" if requested_role == "guard" else "Campus Operations"
    else:
        assigned_role = "user"
        assigned_dept = "Campus Member / Resident"

    db = SessionLocal()
    try:
        user_record = db.query(User).filter(User.email == clean_email).first()
        if not user_record:
            user_record = User(
                id=f"usr-{abs(hash(clean_email)) % 1000000:06d}",
                email=clean_email,
                name=name or clean_email.split("@")[0].title(),
                role=assigned_role,
                is_superadmin=is_super,
                department=assigned_dept,
                avatar_url=avatar or "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
                google_id=google_id,
                is_active=True
            )
            db.add(user_record)
            db.commit()
            db.refresh(user_record)
        else:
            # Re-affirm superadmin status if contributor
            if is_super and not user_record.is_superadmin:
                user_record.is_superadmin = True
                user_record.role = "admin"
                user_record.department = assigned_dept
                db.commit()
                db.refresh(user_record)

        return {
            "id": user_record.id,
            "email": user_record.email,
            "name": user_record.name,
            "role": user_record.role,
            "is_superadmin": user_record.is_superadmin,
            "department": user_record.department,
            "avatar": user_record.avatar_url,
            "google_id": user_record.google_id
        }
    except Exception as e:
        db.rollback()
        # In-memory fallback if database locked
        return {
            "id": f"usr-{abs(hash(clean_email)) % 1000000:06d}",
            "email": clean_email,
            "name": name or clean_email.split("@")[0].title(),
            "role": assigned_role,
            "is_superadmin": is_super,
            "department": assigned_dept,
            "avatar": avatar or "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80"
        }
    finally:
        db.close()


def create_access_token(data: Dict[str, Any], expires_delta: Optional[int] = None) -> str:
    """Encodes JWT payload with expiration and role claims."""
    to_encode = data.copy()
    expire = time.time() + (expires_delta or ACCESS_TOKEN_EXPIRE_SECONDS)
    to_encode.update({"exp": expire, "iat": time.time()})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> Dict[str, Any]:
    """Decodes and validates JWT token."""
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired, please sign in again."
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token."
        )


def get_current_user(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    """Dependency for securing endpoints via Bearer token."""
    if not authorization or not authorization.startswith("Bearer "):
        if settings.ENVIRONMENT.lower() == "production":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication credentials were not provided."
            )
        # Fallback to Superadmin only in local development for testing convenience
        return get_or_create_user("24cd10ar15@mitsgwl.ac.in", name="Arin Gupta")

    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    email = payload.get("sub")
    if not email:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token subject.")

    return get_or_create_user(email)
