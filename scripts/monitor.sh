#!/bin/bash

container_name="screenshot-service"

while true; do
  health_status=$(docker inspect --format='{{.State.Health.Status}}' $container_name)
  if [ "$health_status" = "unhealthy" ]; then
    echo "Container is unhealthy. Restarting..."
    docker restart $container_name
  elif [ "$health_status" = "healthy" ]; then
    echo "Container is healthy."
  fi
  sleep 30
done