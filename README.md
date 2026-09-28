# Itera

Accessible group travel platform: Itera is a travel platform that matches people with accessibility needs to trips built around their preferences and accommodations. Say goodbye to constant worries; simply type, accept, and enjoy! 

## Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: PostgreSQL
- Auth: JWT
- Docker + Docker Compose for local dev

## Setup

1. Clone the repo
2. Create three `.env` files: one at project root, one in `backend/`, one in `frontend/`

**Root `.env`**
```dotenv
POSTGRES_DB=itera_db
POSTGRES_USER=itera_user
POSTGRES_PASSWORD=itera_password
JWT_SECRET=your_secret_here
JWT_EXPIRES_IN=7d
```

**`backend/.env`** (only needed if running the backend outside Docker)
```dotenv
PORT=8000
DB_HOST=localhost
DB_PORT=5433
DB_NAME=itera_db
DB_USER=itera_user
DB_PASSWORD=itera_password
JWT_SECRET=your_secret_here
JWT_EXPIRES_IN=7d
```

**`frontend/.env`**
```dotenv
VITE_API_URL=http://localhost:8000
```

3. Run everything:

```bash
docker compose up -d --build
```

4. Open:
- Frontend: http://localhost:5173
- Backend: http://localhost:8000


## WIP

- Trip creation (organizer side)
- Matching trips to accessibility profiles
- Booking
