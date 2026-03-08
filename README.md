# EventSphere 🎯
A multi-event management platform built with FastAPI + React.

---

## 📁 Project Structure

```
eventsphere/
├── backend/          ← FastAPI backend
│   ├── app/
│   │   ├── core/     ← config, database, security, deps
│   │   ├── models/   ← SQLAlchemy models
│   │   ├── routers/  ← API route handlers
│   │   ├── schemas/  ← Pydantic schemas
│   │   └── main.py   ← App entry point
│   └── requirements.txt
│
├── frontend/         ← React + Vite frontend
│   ├── src/
│   │   ├── api/      ← Axios API calls
│   │   ├── components/
│   │   ├── context/  ← Auth + dark mode context
│   │   └── pages/    ← All page components
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Python 3.11 or 3.12 (recommended)
- Node.js 18+
- npm

---

### Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Run the server
uvicorn app.main:app --reload --port 8000
```

Backend runs at: http://127.0.0.1:8000  
Swagger docs at: http://127.0.0.1:8000/docs

> **Note:** SQLite database (`eventsphere.db`) is created automatically on first run — no setup needed.

---

### Frontend Setup

Open a **second terminal**:

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend runs at: http://localhost:5173

---

## ✨ Features

### For Participants
- Register/login with role-based access
- Browse and search events with filters (status, category)
- Register or join **waitlist** for full events (auto-promoted when a spot opens)
- **QR code check-in** — get your personal QR after registering
- Create and join teams using a join code
- View and manage notifications
- Edit your profile (name, bio, avatar URL)
- 🌙 Dark mode

### For Admins
- Create, edit, delete events with category, cover image, waitlist toggle
- 📊 **Analytics dashboard** — per-event fill rate and check-in rate
- 📥 **Export participants to CSV** per event
- **QR check-in verification** — paste QR token to check in a participant
- Manual one-click check-in from participant list
- Send announcements (auto-notifies all participants via notifications)
- View and search all users with role filters

---

## 🛠️ Tech Stack

| Layer     | Technology                        |
|-----------|-----------------------------------|
| Frontend  | React 18, Vite, Tailwind CSS      |
| Backend   | Python, FastAPI                   |
| Database  | SQLite (dev) / PostgreSQL (prod)  |
| ORM       | SQLAlchemy 2.0                    |
| Auth      | JWT (python-jose + passlib)       |
| Icons     | Lucide React                      |

---

## 🔐 Creating an Admin Account

On the Register page, select **"Admin / Organizer"** as your role.

---

## 🗄️ Switching to PostgreSQL (Production)

In `backend/app/core/config.py`, change:
```python
DATABASE_URL: str = "sqlite:///./eventsphere.db"
```
to:
```python
DATABASE_URL: str = "postgresql://user:password@localhost/eventsphere"
```
Then install: `pip install psycopg2-binary`

---

## 📦 Key API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/me` | Update profile |
| GET | `/api/events/` | List all events |
| POST | `/api/events/` | Create event (admin) |
| GET | `/api/registrations/my` | My registrations |
| POST | `/api/registrations/` | Register for event |
| GET | `/api/registrations/event/{id}/export` | Export CSV (admin) |
| POST | `/api/registrations/waitlist` | Join waitlist |
| DELETE | `/api/registrations/waitlist/{id}` | Leave waitlist |
| POST | `/api/checkins/generate-qr/{event_id}` | Get QR token |
| POST | `/api/checkins/qr-verify` | Verify QR (admin) |
| GET | `/api/admin/analytics` | Analytics (admin) |
| GET | `/api/admin/stats` | Dashboard stats (admin) |

Full interactive API docs available at `http://127.0.0.1:8000/docs` when backend is running.

---

## 👥 Team

Built by **MarshalX** — Vedika D, Gargi P, Hrudaya G, Siddhi K
