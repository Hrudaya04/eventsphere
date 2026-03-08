import random
import string
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.models import User, Team, TeamMember, Event, Registration
from app.schemas.schemas import TeamCreate, TeamJoin, TeamOut

router = APIRouter(prefix="/api/teams", tags=["teams"])


def _gen_code(db: Session) -> str:
    while True:
        code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        if not db.query(Team).filter(Team.join_code == code).first():
            return code


@router.post("/", response_model=TeamOut, status_code=201)
def create_team(payload: TeamCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    event = db.query(Event).filter(Event.id == payload.event_id).first()
    if not event:
        raise HTTPException(404, "Event not found")
    if not event.allow_teams:
        raise HTTPException(400, "This event does not allow teams")

    team = Team(name=payload.name, event_id=payload.event_id, owner_id=current_user.id, join_code=_gen_code(db))
    db.add(team)
    db.flush()
    member = TeamMember(team_id=team.id, user_id=current_user.id)
    db.add(member)
    db.commit()
    db.refresh(team)
    return team


@router.post("/join", response_model=TeamOut)
def join_team(payload: TeamJoin, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    team = db.query(Team).filter(Team.join_code == payload.join_code).first()
    if not team:
        raise HTTPException(404, "Invalid join code")

    event = db.query(Event).filter(Event.id == team.event_id).first()
    if len(team.members) >= event.max_team_size:
        raise HTTPException(400, "Team is full")

    existing = db.query(TeamMember).filter(TeamMember.team_id == team.id, TeamMember.user_id == current_user.id).first()
    if existing:
        raise HTTPException(400, "Already in this team")

    member = TeamMember(team_id=team.id, user_id=current_user.id)
    db.add(member)
    db.commit()
    db.refresh(team)
    return team


@router.get("/my", response_model=List[TeamOut])
def my_teams(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    memberships = db.query(TeamMember).filter(TeamMember.user_id == current_user.id).all()
    team_ids = [m.team_id for m in memberships]
    return db.query(Team).filter(Team.id.in_(team_ids)).all()


@router.get("/event/{event_id}", response_model=List[TeamOut])
def event_teams(event_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    teams = db.query(Team).filter(Team.event_id == event_id).all()
    result = []
    for team in teams:
        member_ids = {m.user_id for m in team.members}
        team_dict = {
            "id": team.id,
            "name": team.name,
            "join_code": team.join_code if current_user.id in member_ids else "••••••",
            "event_id": team.event_id,
            "owner_id": team.owner_id,
            "created_at": team.created_at,
            "members": team.members,
        }
        result.append(TeamOut(**team_dict))
    return result


@router.get("/{team_id}", response_model=TeamOut)
def get_team(team_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(404, "Team not found")
    return team
