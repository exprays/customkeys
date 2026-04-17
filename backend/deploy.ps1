# deploy.ps1 - Deploy Nano backend to Google Cloud Run (Windows Version)
# Usage: .\deploy.ps1 [PROJECT_ID] [REGION]

$ErrorActionPreference = "Stop"

$PROJECT_ID = if ($args[0]) { $args[0] } else { "your-gcp-project-id" }
$REGION = if ($args[1]) { $args[1] } else { "us-central1" }
$SERVICE_NAME = "nano-api"
$IMAGE = "gcr.io/$PROJECT_ID/$SERVICE_NAME"

Write-Host "[BUILD] Building Docker image..." -ForegroundColor Cyan
docker build -t $IMAGE .

Write-Host "[PUSH] Pushing to Google Container Registry..." -ForegroundColor Cyan
docker push $IMAGE

Write-Host "[CONFIG] Loading environment variables from .env..." -ForegroundColor Cyan
if (Test-Path .env) {
    # Read .env, ignore comments and empty lines
    $lines = Get-Content .env | Where-Object { $_ -notmatch "^#" -and $_ -notmatch "^\s*$" }
    # Join with commas for gcloud
    $ENV_VARS = $lines -join ","
} else {
    Write-Host "[WARN] .env file not found, using default APP_ENV=production" -ForegroundColor Yellow
    $ENV_VARS = "APP_ENV=production"
}

Write-Host "[DEPLOY] Deploying to Cloud Run..." -ForegroundColor Cyan
gcloud run deploy $SERVICE_NAME `
  --image $IMAGE `
  --platform managed `
  --region $REGION `
  --allow-unauthenticated `
  --port 8080 `
  --memory 512Mi `
  --cpu 1 `
  --min-instances 0 `
  --max-instances 10 `
  --set-env-vars $ENV_VARS `
  --project $PROJECT_ID

Write-Host "`n[SUCCESS] Deployed! Service URL:" -ForegroundColor Green
gcloud run services describe $SERVICE_NAME `
  --platform managed `
  --region $REGION `
  --format "value(status.url)" `
  --project $PROJECT_ID
