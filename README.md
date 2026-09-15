# Movie Zone 🎬

![Auto Deploy to VPS Server](https://github.com/Ssebaleke/MovieZone/actions/workflows/deploy.yml/badge.svg)

**Movie Zone** is a modern streaming web application tailored for African & International content, featuring a specialized catalog of **Ugandan VJ translated movies** (VJ Junior, VJ Emmy, VJ Ice P, VJ Jingo, VJ Mark), East African cinema, K-Dramas, Nollywood, Western movies, Bollywood, and Anime. Powered by the **Reelplexi API** (`https://api.reelplexi.com/v1`).

---

## 🌟 Key Features

- **Pure Client Streaming Experience**: Clean UI for viewers with navigation for Home, Ugandan VJs, TV Series, Movies, Latest, Trending, Regional hub, and My List.
- **Ugandan VJ Catalog Filter**: Fast filtering by top Ugandan VJs (VJ Junior, VJ Emmy, VJ Ice P, VJ Jingo, VJ Mark).
- **Multi-Region Categories**: Instant browsing by East African, K-Drama, Nollywood, Western, Bollywood, and Anime categories.
- **Dedicated Admin Console (`/admin`)**:
  - Reelplexi API Key live configuration (saves directly to system settings).
  - Ugandan VJ Media Catalog management.
  - User Signups directory & subscription tier management.
  - Real-time content analytics & statistics.
- **Docker Ready**: Pre-configured multi-container architecture with Nginx frontend reverse proxy and Node.js Express backend.

---

## 🚀 Quick Deployment with Docker

### Prerequisites
- [Docker](https://www.docker.com/) & Docker Compose installed on your host system or VPS.

### 1. Clone the Repository
```bash
git clone https://github.com/Ssebaleke/MovieZone.git
cd MovieZone
```

### 2. Configure Environment (Optional)
Copy `.env.example` to `.env` if you want to override defaults:
```bash
cp .env.example .env
```

### 3. Launch Container Stack
Run the following command to build and start the Movie Zone frontend and backend containers in background mode:

```bash
docker compose up -d --build
```

### 4. Verify Services
- **Frontend (Nginx / React SPA)**: Accessible at `http://localhost` (or `http://YOUR_SERVER_IP`)
- **Backend API (Node.js / Express)**: Accessible at `http://localhost:5000` (or reverse proxied via Nginx at `http://localhost/api/`)
- **Admin Console**: Accessible at `http://localhost/admin`

---

## 🔐 Admin Console & Reelplexi Setup

1. Open your browser and navigate to `http://YOUR_SERVER_IP/admin` (or `http://localhost:5173/admin`).
2. Log in with admin credentials:
   - **Email**: `netflix@test.com` (or `tester@netflix.com`)
   - **Password**: `password123`
3. Go to **Reelplexi API Key Config** tab.
4. Input your Reelplexi API key (e.g. `sk_live_...`) and click **Save Settings**.
5. The platform will automatically sync live content from `https://api.reelplexi.com/v1`.

---

## 🛠️ Useful Docker Commands

```bash
# View live logs of all services
docker compose logs -f

# View backend logs only
docker compose logs -f backend

# Stop services
docker compose down

# Restart container stack
docker compose restart
```

---

## 📁 Project Architecture

```
MovieZone/
├── client/                 # Vite React SPA Frontend
│   ├── src/                # UI Components, Pages, Admin Dashboard
│   ├── nginx.conf          # Nginx production proxy configuration
│   └── Dockerfile          # Multi-stage Nginx Dockerfile
├── server/                 # Express Node.js Backend API
│   ├── routes/             # API routes (vj, regions, movies, admin)
│   ├── services/           # Reelplexi API integration service
│   ├── prisma/             # SQLite Schema & Migrations
│   └── Dockerfile          # Node 20 Alpine Dockerfile
├── docker-compose.yml      # Multi-container orchestration
└── .dockerignore           # Docker build exclusions
```
