import secrets
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List
import csv
import io
from app.core.database import get_db
from app.core.deps import get_current_user, require_admin
from app.models.models import User, Event, Registration, Waitlist, Notification, CheckIn
from app.schemas.schemas import RegistrationCreate, RegistrationOut, WaitlistOut

router = APIRouter(prefix="/api/registrations", tags=["registrations"])


@router.post("/", response_model=RegistrationOut, status_code=201)
def register_for_event(payload: RegistrationCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    event = db.query(Event).filter(Event.id == payload.event_id).first()
    if not event:
        raise HTTPException(404, "Event not found")

    existing = db.query(Registration).filter(
        Registration.user_id == current_user.id,
        Registration.event_id == payload.event_id
    ).first()
    if existing:
        raise HTTPException(400, "Already registered for this event")

    count = db.query(Registration).filter(Registration.event_id == payload.event_id).count()
    if count >= event.capacity:
        raise HTTPException(400, "Event is at full capacity")

    reg = Registration(user_id=current_user.id, event_id=payload.event_id, team_id=payload.team_id)
    db.add(reg)
    db.commit()
    db.refresh(reg)
    return reg


@router.delete("/{event_id}", status_code=204)
def unregister(event_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    reg = db.query(Registration).filter(
        Registration.user_id == current_user.id,
        Registration.event_id == event_id
    ).first()
    if not reg:
        raise HTTPException(404, "Registration not found")
    db.delete(reg)
    db.commit()

    # Auto-promote first person on waitlist
    event = db.query(Event).filter(Event.id == event_id).first()
    if event and event.enable_waitlist:
        next_in_line = db.query(Waitlist).filter(Waitlist.event_id == event_id).order_by(Waitlist.joined_at).first()
        if next_in_line:
            new_reg = Registration(user_id=next_in_line.user_id, event_id=event_id)
            db.add(new_reg)
            notif = Notification(
                user_id=next_in_line.user_id,
                title=f"You're in! — {event.title}",
                message=f"A spot opened up and you've been automatically registered for '{event.title}'!"
            )
            db.add(notif)
            db.delete(next_in_line)
            db.commit()


@router.get("/my", response_model=List[RegistrationOut])
def my_registrations(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Registration).filter(Registration.user_id == current_user.id).all()


@router.get("/event/{event_id}", response_model=List[RegistrationOut])
def event_registrations(event_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return db.query(Registration).filter(Registration.event_id == event_id).all()


@router.get("/event/{event_id}/export")
def export_registrations_csv(event_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(404, "Event not found")

    registrations = db.query(Registration).filter(Registration.event_id == event_id).all()
    checkin_user_ids = {c.user_id for c in db.query(CheckIn).filter(CheckIn.event_id == event_id).all()}

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["#", "Name", "Email", "Registered At", "Checked In", "Team"])
    for i, reg in enumerate(registrations, 1):
        writer.writerow([
            i,
            reg.user.name if reg.user else "",
            reg.user.email if reg.user else "",
            reg.registered_at.strftime("%Y-%m-%d %H:%M") if reg.registered_at else "",
            "Yes" if reg.user_id in checkin_user_ids else "No",
            reg.team.name if reg.team else "—",
        ])

    output.seek(0)
    filename = f"{event.title.replace(' ', '_')}_participants.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


# ─── Waitlist ────────────────────────────────────────────────────────────────

@router.post("/waitlist", response_model=WaitlistOut, status_code=201)
def join_waitlist(payload: RegistrationCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    event = db.query(Event).filter(Event.id == payload.event_id).first()
    if not event:
        raise HTTPException(404, "Event not found")
    if not event.enable_waitlist:
        raise HTTPException(400, "Waitlist not enabled for this event")

    existing_reg = db.query(Registration).filter(
        Registration.user_id == current_user.id,
        Registration.event_id == payload.event_id
    ).first()
    if existing_reg:
        raise HTTPException(400, "Already registered for this event")

    existing_wait = db.query(Waitlist).filter(
        Waitlist.user_id == current_user.id,
        Waitlist.event_id == payload.event_id
    ).first()
    if existing_wait:
        raise HTTPException(400, "Already on waitlist for this event")

    entry = Waitlist(user_id=current_user.id, event_id=payload.event_id)
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.get("/waitlist/my", response_model=List[WaitlistOut])
def my_waitlist(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Waitlist).filter(Waitlist.user_id == current_user.id).all()


@router.delete("/waitlist/{event_id}", status_code=204)
def leave_waitlist(event_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    entry = db.query(Waitlist).filter(
        Waitlist.user_id == current_user.id,
        Waitlist.event_id == event_id
    ).first()
    if not entry:
        raise HTTPException(404, "Not on waitlist")
    db.delete(entry)
    db.commit()
