from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.deps import get_current_user, require_admin
from app.models.models import User, Event, Registration, Notification, UserRole, Waitlist
from app.schemas.schemas import EventCreate, EventUpdate, EventOut

router = APIRouter(prefix="/api/events", tags=["events"])


def _enrich(event: Event, db: Session) -> EventOut:
    count = db.query(Registration).filter(Registration.event_id == event.id).count()
    waitlist_count = db.query(Waitlist).filter(Waitlist.event_id == event.id).count()
    out = EventOut.model_validate(event)
    out.registration_count = count
    out.waitlist_count = waitlist_count
    return out


def _notify_all_participants(event: Event, db: Session):
    participants = db.query(User).filter(User.role == UserRole.participant, User.is_active == True).all()
    for user in participants:
        notif = Notification(
            user_id=user.id,
            title=f"New Event: {event.title}",
            message=f"A new event '{event.title}' has been published"
                    + (f" at {event.venue}" if event.venue else "")
                    + f". Check it out and register!",
        )
        db.add(notif)


@router.get("/", response_model=List[EventOut])
def list_events(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    events = db.query(Event).order_by(Event.start_date).all()
    return [_enrich(e, db) for e in events]


@router.get("/{event_id}", response_model=EventOut)
def get_event(event_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(404, "Event not found")
    return _enrich(event, db)


@router.post("/", response_model=EventOut, status_code=201)
def create_event(payload: EventCreate, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    event = Event(**payload.model_dump(), created_by=admin.id)
    db.add(event)
    db.flush()
    _notify_all_participants(event, db)
    db.commit()
    db.refresh(event)
    return _enrich(event, db)


@router.put("/{event_id}", response_model=EventOut)
def update_event(event_id: int, payload: EventUpdate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(404, "Event not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(event, field, value)
    db.commit()
    db.refresh(event)
    return _enrich(event, db)


@router.delete("/{event_id}", status_code=204)
def delete_event(event_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(404, "Event not found")
    db.delete(event)
    db.commit()
