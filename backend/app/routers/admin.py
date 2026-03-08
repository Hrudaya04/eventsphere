from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.deps import require_admin
from app.models.models import User, Event, Registration, CheckIn, Waitlist, EventStatus
from app.schemas.schemas import AdminStats, UserOut, EventAnalytics

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/stats", response_model=AdminStats)
def stats(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return AdminStats(
        total_events=db.query(Event).count(),
        total_users=db.query(User).count(),
        total_registrations=db.query(Registration).count(),
        total_checkins=db.query(CheckIn).count(),
        upcoming_events=db.query(Event).filter(Event.status == EventStatus.upcoming).count(),
    )


@router.get("/users", response_model=List[UserOut])
def list_users(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return db.query(User).order_by(User.created_at.desc()).all()


@router.get("/analytics", response_model=List[EventAnalytics])
def analytics(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    events = db.query(Event).order_by(Event.start_date.desc()).all()
    result = []
    for event in events:
        reg_count = db.query(Registration).filter(Registration.event_id == event.id).count()
        checkin_count = db.query(CheckIn).filter(CheckIn.event_id == event.id).count()
        waitlist_count = db.query(Waitlist).filter(Waitlist.event_id == event.id).count()
        fill_rate = round((reg_count / event.capacity) * 100, 1) if event.capacity > 0 else 0
        result.append(EventAnalytics(
            event_id=event.id,
            event_title=event.title,
            capacity=event.capacity,
            registrations=reg_count,
            checkins=checkin_count,
            waitlist=waitlist_count,
            fill_rate=fill_rate,
        ))
    return result
