from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import engine, Base
from app.routers.auth import router as auth_router
from app.routers.events import router as events_router
from app.routers.registrations import router as reg_router
from app.routers.teams import router as teams_router
from app.routers.announcements import router as ann_router, notif_router
from app.routers.checkins import router as checkin_router
from app.routers.admin import router as admin_router

# Import all models so SQLAlchemy creates tables
import app.models.models  # noqa

# Create all tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="EventSphere API",
    description="Multi-Event Management Platform",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(events_router)
app.include_router(reg_router)
app.include_router(teams_router)
app.include_router(ann_router)
app.include_router(notif_router)
app.include_router(checkin_router)
app.include_router(admin_router)


@app.get("/")
def root():
    return {"message": "EventSphere API is running", "docs": "/docs"}
