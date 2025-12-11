# Quick Deploy Guide

## Local Development
```bash
docker-compose up app-dev
```

## Local Production Test
```bash
docker-compose --profile production up app-prod
```

## Server Deployment

1. Copy files to server:
```bash
scp docker-compose.prod.yml env.example pb_schema.json user@server:/opt/taskboard/
```

2. Create `.env.local` on server:
```bash
cd /opt/taskboard
cp env.example .env.local
nano .env.local
```

3. Pull and run:
```bash
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

4. View logs:
```bash
docker-compose -f docker-compose.prod.yml logs -f
```

## Updates
Push to `main` branch → GitHub Actions builds and pushes to GHCR

Update production:
```bash
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```
