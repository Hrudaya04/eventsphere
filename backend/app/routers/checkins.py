import secrets
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.deps import get_current_user, require_admin
from app.models.models import User, CheckIn, Registration
from app.schemas.schemas import CheckInCreate, CheckInQR, CheckInOut

router = APIRouter(prefix="/api/checkins", tags=["checkins"])


@router.post("/", response_model=CheckInOut, status_code=201)
def checkin(payload: CheckInCreate, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    reg = db.query(Registration).filter(
        Registration.user_id == payload.user_id,
        Registration.event_id == payload.event_id
    ).first()
    if not reg:
        raise HTTPException(400, "User is not registered for this event")

    existing = db.query(CheckIn).filter(CheckIn.user_id == payload.user_id, CheckIn.event_id == payload.event_id).first()
    if existing:
        raise HTTPException(400, "User already checked in")

    ci = CheckIn(user_id=payload.user_id, event_id=payload.event_id, checked_in_by=admin.id)
    db.add(ci)
    db.commit()
    db.refresh(ci)
    return ci


@router.post("/qr-verify", response_model=CheckInOut)
def checkin_by_qr(payload: CheckInQR, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    """Verify a QR token and mark user as checked in."""
    ci = db.query(CheckIn).filter(CheckIn.qr_token == payload.qr_token).first()
    if not ci:
        raise HTTPException(404, "Invalid QR token")
    if ci.checked_in_by is not None:
        raise HTTPException(400, "Already checked in via QR")
    ci.checked_in_by = admin.id
    db.commit()
    db.refresh(ci)
    return ci


@router.post("/generate-qr/{event_id}", response_model=CheckInOut)
def generate_qr_token(event_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Generate a QR token for participant self check-in."""
    reg = db.query(Registration).filter(
        Registration.user_id == current_user.id,
        Registration.event_id == event_id
    ).first()
    if not reg:
        raise HTTPException(400, "You are not registered for this event")

    existing = db.query(CheckIn).filter(
        CheckIn.user_id == current_user.id,
        CheckIn.event_id == event_id
    ).first()
    if existing:
        return existing  # Return existing QR

    token = secrets.token_urlsafe(32)
    ci = CheckIn(user_id=current_user.id, event_id=event_id, qr_token=token)
    db.add(ci)
    db.commit()
    db.refresh(ci)
    return ci


@router.get("/event/{event_id}", response_model=List[CheckInOut])
def event_checkins(event_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return db.query(CheckIn).filter(CheckIn.event_id == event_id).all()


@router.get("/my/{event_id}", response_model=CheckInOut)
def my_checkin(event_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ci = db.query(CheckIn).filter(
        CheckIn.user_id == current_user.id,
        CheckIn.event_id == event_id
    ).first()
    if not ci:
        raise HTTPException(404, "No check-in found")
    return ci
