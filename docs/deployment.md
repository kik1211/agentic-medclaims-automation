# ClaimPilot India — Production Deployment Guide

## 1. Prerequisites
- Docker Engine v24.0+
- Docker Compose v2.20+
- Node.js v20+ (for local CLI development)

---

## 2. Docker Compose Deployment (Recommended)

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/Claim_bot_2.git
   cd Claim_bot_2
   ```

2. Configure environment variables:
   ```bash
   cp .env.example .env
   ```

3. Launch full stack containers:
   ```bash
   docker-compose up -d --build
   ```

4. Verify running container health:
   ```bash
   docker-compose ps
   ```

---

## 3. Access Services
- **Frontend App**: `http://localhost` (Port 80)
- **Backend API**: `http://localhost:3001` (Port 3001)
- **Swagger API Docs**: `http://localhost:3001/api/docs`
- **Health Check Probe**: `http://localhost:3001/health`
- **Readiness Probe**: `http://localhost:3001/ready`
- **Telemetry Metrics**: `http://localhost:3001/metrics`
- **n8n Workflow Engine**: `http://localhost:5678`

---

## 4. Database Setup & Migration
Migrations run automatically on container boot using `npm run migrate`. For manual migrations:
```bash
docker-compose exec backend npm run migrate
```
