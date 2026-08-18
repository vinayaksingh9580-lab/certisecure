"""
CertiSecure2 — Authentication API

Endpoints: login, refresh token, get current user, user registration using JSON storage.
"""

from fastapi import APIRouter, Depends, HTTPException, Request, status

from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_current_user,
    hash_password,
    verify_password,
)
from app.models.models import StudentAccount, User, UserRole
from app.schemas.schemas import (
    LoginRequest,
    RefreshRequest,
    TokenResponse,
    UserCreate,
    UserResponse,
)
from app.services.audit_service import AuditAction, log_event
from app.services.json_storage import json_storage

router = APIRouter()


@router.post("/login", response_model=TokenResponse)
async def login(
    data: LoginRequest,
    request: Request,
):
    """Authenticate user and return JWT tokens."""
    user_dict = await json_storage.get_user_by_email(data.email)
    user = User.from_dict(user_dict) if user_dict else None

    if not user:
        student_dict = await json_storage.get_student_by_email(data.email)
        if student_dict:
            student_account = StudentAccount.from_dict(student_dict)
            if verify_password(data.password, student_account.password_hash):
                user = User(
                    id=student_account.user_id,
                    email=student_account.email,
                    password_hash=student_account.password_hash,
                    full_name=student_account.full_name,
                    role=UserRole.VERIFIER,
                    institution_id=None,
                    is_active=student_account.is_active,
                    created_at=student_account.created_at,
                )

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )
    elif not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled",
        )

    role_str = user.role.value if hasattr(user.role, "value") else str(user.role)
    access_token = create_access_token(user.id, role_str, user.institution_id)
    refresh_token = create_refresh_token(user.id)

    await log_event(
        None,
        action=AuditAction.USER_LOGIN,
        actor_id=user.id,
        resource_type="user",
        resource_id=str(user.id),
        ip_address=request.client.host if request.client else None,
    )

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserResponse.model_validate(user),
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    data: RefreshRequest,
):
    """Refresh an access token using a refresh token."""
    payload = decode_token(data.refresh_token)

    if payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    user_id = int(payload.get("sub", 0))
    user_dict = await json_storage.get_user_by_id(user_id)
    user = User.from_dict(user_dict) if user_dict else None

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )

    role_str = user.role.value if hasattr(user.role, "value") else str(user.role)
    access_token = create_access_token(user.id, role_str, user.institution_id)
    new_refresh_token = create_refresh_token(user.id)

    return TokenResponse(
        access_token=access_token,
        refresh_token=new_refresh_token,
        user=UserResponse.model_validate(user),
    )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get the current authenticated user's profile."""
    return UserResponse.model_validate(current_user)


@router.post("/register-student", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_student(
    data: UserCreate,
    request: Request,
):
    """Public student self-registration for accessing issued certificates."""
    if data.role not in ["verifier", "student"]:
        raise HTTPException(status_code=400, detail="Student registration must create a verifier account")

    existing_user = await json_storage.get_user_by_email(data.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    existing_student = await json_storage.get_student_by_email(data.email)
    if existing_student:
        raise HTTPException(status_code=400, detail="Email already registered")

    password_hash_str = hash_password(data.password)

    user_obj = User(
        email=data.email,
        password_hash=password_hash_str,
        full_name=data.full_name,
        role=UserRole.VERIFIER,
        institution_id=data.institution_id,
        is_active=True,
    )
    saved_user_dict = await json_storage.add_user(user_obj.to_dict())
    user = User.from_dict(saved_user_dict)

    student_account = StudentAccount(
        user_id=user.id,
        email=data.email,
        password_hash=password_hash_str,
        full_name=data.full_name,
        student_code=f"STU-{user.id:06d}",
        is_active=True,
    )
    await json_storage.add_user(student_account.to_dict())

    await log_event(
        None,
        action=AuditAction.USER_CREATED,
        actor_id=user.id,
        resource_type="user",
        resource_id=str(user.id),
        ip_address=request.client.host if request.client else None,
    )

    return UserResponse.model_validate(user)


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(
    data: UserCreate,
    request: Request,
    current_user: User = Depends(get_current_user),
):
    """Register a new user (Admin or Issuer creating users)."""
    user_role = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
    if user_role not in ["admin", "issuer"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    existing = await json_storage.get_user_by_email(data.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    institution_id = data.institution_id
    if user_role == "issuer":
        institution_id = current_user.institution_id

    user_obj = User(
        email=data.email,
        password_hash=hash_password(data.password),
        full_name=data.full_name,
        role=UserRole(data.role),
        institution_id=institution_id,
        is_active=True,
    )
    saved_user_dict = await json_storage.add_user(user_obj.to_dict())
    user = User.from_dict(saved_user_dict)

    await log_event(
        None,
        action=AuditAction.USER_CREATED,
        actor_id=current_user.id,
        resource_type="user",
        resource_id=str(user.id),
        ip_address=request.client.host if request.client else None,
    )

    return UserResponse.model_validate(user)
