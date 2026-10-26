#!/usr/bin/env bash

set -euo pipefail

image=${1:?container image is required}
network=production-smoke

# Invoked by the EXIT trap.
# shellcheck disable=SC2329
cleanup() {
  docker rm --force production-app production-db production-redis 2>/dev/null || true
  docker network rm "$network" 2>/dev/null || true
}

trap cleanup EXIT

docker network create "$network"
docker run --detach --name production-db \
  --network "$network" \
  --env POSTGRES_USER=postgres \
  --env POSTGRES_PASSWORD=postgres \
  --env POSTGRES_DB=nest_monolith \
  --health-cmd "pg_isready -h 127.0.0.1 -U postgres -d nest_monolith" \
  --health-interval 1s \
  --health-retries 30 \
  postgres:18-alpine
docker run --detach --name production-redis \
  --network "$network" \
  --health-cmd "redis-cli ping" \
  --health-interval 1s \
  --health-retries 30 \
  redis:alpine

dependencies_ready=false
for _ in $(seq 1 60); do
  if docker exec production-db pg_isready -h 127.0.0.1 -U postgres -d nest_monolith >/dev/null &&
    docker exec production-redis redis-cli ping | grep --quiet PONG; then
    dependencies_ready=true
    break
  fi
  sleep 1
done

if [[ $dependencies_ready != true ]]; then
  docker logs production-db
  docker logs production-redis
  exit 1
fi

docker run --detach --name production-app \
  --network "$network" \
  --publish 127.0.0.1:43118:3000 \
  --env NODE_ENV=production \
  --env DATABASE_URL=postgresql://postgres:postgres@production-db:5432/nest_monolith?schema=public \
  --env REDIS_HOST=production-redis \
  --env OTEL_ENABLED=false \
  "$image"

for _ in $(seq 1 30); do
  if curl --fail --silent http://127.0.0.1:43118/health/live >/dev/null; then
    docker stop --time 15 production-app >/dev/null
    exit_code=$(docker inspect --format '{{.State.ExitCode}}' production-app)
    if [[ "$exit_code" == 0 || "$exit_code" == 143 ]]; then
      exit 0
    fi
    docker logs production-app
    echo "Production container did not shut down gracefully (exit $exit_code)" >&2
    exit 1
  fi
  sleep 1
done

docker logs production-app
exit 1
