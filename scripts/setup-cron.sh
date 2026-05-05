#!/bin/bash

# DreamBeesArt Blog Automation - Firebase Cron Setup
# This script configures Google Cloud Scheduler to hit your Next.js cron endpoint.

PROJECT_ID=$(gcloud config get-value project)
LOCATION="us-central1"
CRON_SECRET="dream-bees-cron-secret-2026"
# Replace with your actual production URL after deployment
APP_URL="https://${PROJECT_ID}.web.app/api/admin/blog/cron"

echo "Setting up Cron Job for Project: $PROJECT_ID"
echo "Target URL: $APP_URL"

# Create the Cloud Scheduler job
gcloud scheduler jobs create http blog-automation-daily \
    --schedule="0 9 * * *" \
    --uri="$APP_URL" \
    --http-method=GET \
    --location="$LOCATION" \
    --headers="x-cron-secret=$CRON_SECRET" \
    --description="Daily automated blog content generation for DreamBeesArt" \
    --time-zone="UTC"

echo "------------------------------------------------"
echo "Cron job 'blog-automation-daily' created successfully!"
echo "It will run daily at 09:00 UTC."
echo "You can trigger it manually for testing via the Google Cloud Console."
echo "------------------------------------------------"
