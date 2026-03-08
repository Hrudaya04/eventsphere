from pydantic import BaseModel, EmailStr, field_serializer
from typing import Optional, List
from datetime import datetime, timezone
from app.models.models import UserRole, EventStatus


def _utc_iso(dt: datetime | None) -> str | None:
    """Return an ISO-8601 string with explicit UTC offset so browsers parse correctly."""
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.isoformat()


# ─── Auth ───────────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: UserRole = UserRole.participant

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None

class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: UserRole
    is_active: bool
    created_at: datetime
    bio: Optional[str] = None
    avatar_url: Optional[str] = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserOut


# ─── Events ─────────────────────────────────────────────────────────────────

class EventCreate(BaseModel):
    title: str
    description: Optional[str] = None
    venue: Optional[str] = None
    start_date: datetime
    end_date: datetime
    capacity: int = 100
    allow_teams: bool = True
    max_team_size: int = 5
    category: Optional[str] = None
    cover_image_url: Optional[str] = None
    enable_waitlist: bool = False

class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    venue: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    capacity: Optional[int] = None
    status: Optional[EventStatus] = None
    allow_teams: Optional[bool] = None
    max_team_size: Optional[int] = None
    category: Optional[str] = None
    cover_image_url: Optional[str] = None
    enable_waitlist: Optional[bool] = None

class EventOut(BaseModel):
    id: int
    title: str
    description: Optional[str]
    venue: Optional[str]
    start_date: datetime
    end_date: datetime
    capacity: int
    status: EventStatus
    allow_teams: bool
    max_team_size: int
    created_by: Optional[int]
    created_at: datetime
    registration_count: Optional[int] = 0
    waitlist_count: Optional[int] = 0
    category: Optional[str] = None
    cover_image_url: Optional[str] = None
    enable_waitlist: Optional[bool] = False

    class Config:
        from_attributes = True


# ─── Registrations ──────────────────────────────────────────────────────────

class RegistrationCreate(BaseModel):
    event_id: int
    team_id: Optional[int] = None

class RegistrationOut(BaseModel):
    id: int
    user_id: int
    event_id: int
    team_id: Optional[int]
    registered_at: datetime
    user: Optional[UserOut] = None
    event: Optional[EventOut] = None

    class Config:
        from_attributes = True

class WaitlistOut(BaseModel):
    id: int
    user_id: int
    event_id: int
    joined_at: datetime
    user: Optional[UserOut] = None

    class Config:
        from_attributes = True


# ─── Teams ──────────────────────────────────────────────────────────────────

class TeamCreate(BaseModel):
    name: str
    event_id: int

class TeamJoin(BaseModel):
    join_code: str

class TeamMemberOut(BaseModel):
    id: int
    user_id: int
    joined_at: datetime
    user: Optional[UserOut] = None

    class Config:
        from_attributes = True

class TeamOut(BaseModel):
    id: int
    name: str
    join_code: str
    event_id: int
    owner_id: int
    created_at: datetime
    members: List[TeamMemberOut] = []

    class Config:
        from_attributes = True


# ─── Announcements & Notifications ──────────────────────────────────────────

class AnnouncementCreate(BaseModel):
    event_id: int
    title: str
    message: str

class AnnouncementOut(BaseModel):
    id: int
    event_id: int
    title: str
    message: str
    created_by: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True

class NotificationOut(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    is_read: bool
    created_at: datetime

    @field_serializer('created_at')
    def serialize_created_at(self, v: datetime) -> str:
        return _utc_iso(v)

    class Config:
        from_attributes = True


# ─── Check-in ───────────────────────────────────────────────────────────────

class CheckInCreate(BaseModel):
    user_id: int
    event_id: int

class CheckInQR(BaseModel):
    qr_token: str

class CheckInOut(BaseModel):
    id: int
    user_id: int
    event_id: int
    checked_in_at: datetime
    qr_token: Optional[str] = None
    user: Optional[UserOut] = None

    class Config:
        from_attributes = True


# ─── Admin Stats ────────────────────────────────────────────────────────────

class AdminStats(BaseModel):
    total_events: int
    total_users: int
    total_registrations: int
    total_checkins: int
    upcoming_events: int

class EventAnalytics(BaseModel):
    event_id: int
    event_title: str
    capacity: int
    registrations: int
    checkins: int
    waitlist: int
    fill_rate: float
