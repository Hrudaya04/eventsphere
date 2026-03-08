from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.deps import get_current_user, require_admin
from app.models.models import User, Announcement, Notification, Registration, Event
from app.schemas.schemas import AnnouncementCreate, AnnouncementOut, NotificationOut

router = APIRouter(prefix="/api/announcements", tags=["announcements"])
notif_router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.post("/", response_model=AnnouncementOut, status_code=201)
def create_announcement(payload: AnnouncementCreate, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    event = db.query(Event).filter(Event.id == payload.event_id).first()
    if not event:
        raise HTTPException(404, "Event not found")

    ann = Announcement(event_id=payload.event_id, title=payload.title, message=payload.message, created_by=admin.id)
    db.add(ann)
    db.flush()

    # Fan out notifications to all registered participants
    registrations = db.query(Registration).filter(Registration.event_id == payload.event_id).all()
    for reg in registrations:
        notif = Notification(user_id=reg.user_id, title=payload.title, message=payload.message)
        db.add(notif)

    db.commit()
    db.refresh(ann)
    return ann


@router.get("/event/{event_id}", response_model=List[AnnouncementOut])
def event_announcements(event_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(Announcement).filter(Announcement.event_id == event_id).order_by(Announcement.created_at.desc()).all()


@notif_router.get("/", response_model=List[NotificationOut])
def my_notifications(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Notification).filter(Notification.user_id == current_user.id).order_by(Notification.created_at.desc()).all()


@notif_router.put("/{notif_id}/read", response_model=NotificationOut)
def mark_read(notif_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    notif = db.query(Notification).filter(Notification.id == notif_id, Notification.user_id == current_user.id).first()
    if not notif:
        raise HTTPException(404, "Notification not found")
    notif.is_read = True
    db.commit()
    db.refresh(notif)
    return notif


@notif_router.put("/read-all", status_code=204)
def mark_all_read(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db.query(Notification).filter(Notification.user_id == current_user.id, Notification.is_read == False).update({"is_read": True})
    db.commit()
