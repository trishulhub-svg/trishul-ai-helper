#!/bin/bash
cd /home/z/my-project
while true; do
  echo "$(date): Starting Next.js server..." >> /home/z/my-project/keep-alive.log
  node node_modules/.bin/next dev -p 3000 >> /home/z/my-project/dev.log 2>&1
  EXIT_CODE=$?
  echo "$(date): Next.js exited with code $EXIT_CODE" >> /home/z/my-project/keep-alive.log
  sleep 3
done
