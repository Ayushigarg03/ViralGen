# ViralGen AI — Multi-Modal AI Ad Content Generator

ViralGen AI is a full-stack, enterprise-grade multi-modal campaign generation system. It accepts a brand brief, platform selection (Instagram, LinkedIn, Twitter/X), and brand persona (Professional, Witty, Urgent) to automatically generate high-converting ad copy and styled visual assets asynchronously.

---

## ⚡ Key Features

1. **Async Generation Pipeline**: Primary endpoints immediately return a tracking ID and spawn background tasks using Celery and Redis.
2. **AI Prompt Refinement**: Re-writes short briefs into rich descriptive image prompts for DALL-E 3.
3. **Pillow Image Compositing**: Downloads the generated image and composites local typography banners, branding headers, and platform badges.
4. **Excel Logs Export**: Downloads formatted spread sheets styling successful/failed rows, displaying trends, and summary metrics.
5. **Interactive Recharts Analytics**: Real-time business intelligence displays covering platform totals, persona distribution, and daily generation counts.
6. **API Rate Limiting**: Limiters restrict requests to 10/minute per IP address utilizing a Redis counter.

---

## 🏗️ Technical Architecture

```
                                  +-------------------+
                                  |   React Client    |
                                  |    (Port 3000)    |
                                  +---------+---------+
                                            | (API Requests)
                                            v
                                  +---------+---------+
            +-------------------->|  FastAPI Backend  |<--------------------+
            |                     |    (Port 8000)    |                     |
            |                     +----+---------+----+                     |
            v                          |         |                          v
    +-------+-------+                  |         |                  +-------+-------+
    |  PostgreSQL   | (Read/Write)     |         | (Queue Jobs)     |     Redis     | (Rate Limits &
    |  (Port 5432)  |<-----------------+         +----------------->|  (Port 6379)  |  Message Broker)
    +---------------+                                               +-------+-------+
            ^                                                               |
            |                                                               | (Pulls Tasks)
            |                     +-------------------+                     |
            +---------------------+   Celery Worker   |<--------------------+
               (Persists Status)  | (Image Generator) |
                                  +---------+---------+
                                            | (Saves Composites)
                                            v
                                    [ Shared Volume ]
                               (Statically served by API)
```

---

## 🚀 Running the System

Ensure you have **Docker** and **Docker Compose** installed.

### 1. Configure Keys (Optional)
If you want to use live OpenAI APIs, set the variable in your shell or create a `.env` file in the root folder:
```bash
OPENAI_API_KEY=sk-proj-...
```
*If left unconfigured, the system will enter **Mock Mode**, generating beautiful local gradient-and-card mock images and high-quality templates automatically!*

### 2. Startup Docker
Run the following command in the root folder containing `docker-compose.yml`:
```bash
docker compose up --build
```

### 3. Open Services
- **React Frontend**: [http://localhost:3000](http://localhost:3000)
- **FastAPI Documentation (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **FastAPI Server Health**: [http://localhost:8000/](http://localhost:8000/)

---

## 📊 Analytics Aggregations (Pre-built SQL Queries)

The backend runs robust aggregates for the Analytics dashboard:
1. **Platform totals**: Total count of campaigns per social media platform.
2. **Persona counts**: Tone of voice usage levels.
3. **Daily trends**: Tracking total success vs failed generations over the last 30 days.
4. **Average generation duration**: Computes `completed_at - created_at` in seconds.
5. **Success rates**: Calculates ratio of successful to failed jobs.

---

## 📂 Folder Structure

```
viralgen-ai/
├── backend/
│   ├── main.py (FastAPI App Entrypoint)
│   ├── database.py (SQLAlchemy DB Engine)
│   ├── models.py (SQLAlchemy Schema)
│   ├── schemas.py (Pydantic Models)
│   ├── tasks.py (Celery Worker Tasks)
│   ├── ai_agent.py (GPT-4 Copy & Refinement Agents)
│   ├── image_gen.py (DALL-E 3 & Pillow compositing)
│   ├── excel_export.py (openpyxl Workbook builder)
│   └── routers/
│       ├── generate.py (Generator endpoints)
│       ├── history.py (Filter & pagination history)
│       └── analytics.py (Business Intelligence reports)
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── StatsCard.jsx (Overview cards)
│   │   │   ├── CampaignTable.jsx (Visual modal table)
│   │   │   └── Charts.jsx (Recharts wrappers)
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Generator.jsx
│   │   │   ├── History.jsx
│   │   │   └── Analytics.jsx
│   │   ├── App.jsx (Nav Shell)
│   │   └── main.jsx
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```
