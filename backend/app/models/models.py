from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.core.database import Base


class UserRole(str, enum.Enum):
    admin = "admin"
    participant = "participant"


class EventStatus(str, enum.Enum):
    upcoming = "upcoming"
    ongoing = "ongoing"
    completed = "completed"
    cancelled = "cancelled"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.participant)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    bio = Column(Text, nullable=True)
    avatar_url = Column(String(500), nullable=True)

    registrations = relationship("Registration", back_populates="user", cascade="all, delete-orphan")
    owned_teams = relationship("Team", back_populates="owner", foreign_keys="Team.owner_id")
    team_memberships = relationship("TeamMember", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    checkins = relationship("CheckIn", back_populates="user", foreign_keys="CheckIn.user_id", cascade="all, delete-orphan")
    waitlist_entries = relationship("Waitlist", back_populates="user", cascade="all, delete-orphan")


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    venue = Column(String(300))
    start_date = Column(DateTime(timezone=True), nullable=False)
    end_date = Column(DateTime(timezone=True), nullable=False)
    capacity = Column(Integer, default=100)
    status = Column(Enum(EventStatus), default=EventStatus.upcoming)
    allow_teams = Column(Boolean, default=True)
    max_team_size = Column(Integer, default=5)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    category = Column(String(100), nullable=True)
    cover_image_url = Column(String(500), nullable=True)
    enable_waitlist = Column(Boolean, default=False)

    creator = relationship("User", foreign_keys=[created_by])
    registrations = relationship("Registration", back_populates="event", cascade="all, delete-orphan")
    teams = relationship("Team", back_populates="event", cascade="all, delete-orphan")
    checkins = relationship("CheckIn", back_populates="event", cascade="all, delete-orphan")
    announcements = relationship("Announcement", back_populates="event", cascade="all, delete-orphan")
    waitlist = relationship("Waitlist", back_populates="event", cascade="all, delete-orphan")


class Registration(Base):
    __tablename__ = "registrations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=True)
    registered_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="registrations")
    event = relationship("Event", back_populates="registrations")
    team = relationship("Team", back_populates="registrations")


class Waitlist(Base):
    __tablename__ = "waitlist"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    joined_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="waitlist_entries")
    event = relationship("Event", back_populates="waitlist")


class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    join_code = Column(String(10), unique=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    event = relationship("Event", back_populates="teams")
    owner = relationship("User", back_populates="owned_teams", foreign_keys=[owner_id])
    members = relationship("TeamMember", back_populates="team", cascade="all, delete-orphan")
    registrations = relationship("Registration", back_populates="team")


class TeamMember(Base):
    __tablename__ = "team_members"

    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    joined_at = Column(DateTime(timezone=True), server_default=func.now())

    team = relationship("Team", back_populates="members")
    user = relationship("User", back_populates="team_memberships")


class CheckIn(Base):
    __tablename__ = "checkins"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    checked_in_at = Column(DateTime(timezone=True), server_default=func.now())
    checked_in_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    qr_token = Column(String(64), unique=True, index=True, nullable=True)

    user = relationship("User", back_populates="checkins", foreign_keys="[CheckIn.user_id]")
    event = relationship("Event", back_populates="checkins")


class Announcement(Base):
    __tablename__ = "announcements"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    event = relationship("Event", back_populates="announcements")
    creator = relationship("User", foreign_keys=[created_by])


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="notifications")
