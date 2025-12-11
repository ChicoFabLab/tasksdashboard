#!/bin/bash

echo "Testing development build..."
docker build --target development -t taskboard:dev .

echo ""
echo "Testing production build..."
docker build --target production -t taskboard:prod .

echo ""
echo "Testing PocketBase build..."
docker build -f Dockerfile.pocketbase -t taskboard-pocketbase:latest .

echo ""
echo "All builds completed successfully"
echo ""
echo "Run dev:  docker-compose up app-dev"
echo "Run prod: docker-compose --profile production up app-prod"
