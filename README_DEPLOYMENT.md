# Deployment Guide

This project is configured for deployment to **Railway** (Backend) and **Vercel** (Frontend).

## Phase 1: Railway Backend

1. Push the entire repository to GitHub.
2. Go to [Railway.app](https://railway.app) and create a new project from your GitHub repository.
3. Configure the **Root Directory** as `/` (default).
4. Go to the service **Variables** section and add:
   - `PORT`: `8000` (or leave blank, Railway automatically injects this).
5. The `railway.json` and `backend/Dockerfile` will automatically be used to build and deploy the FastAPI backend.
6. Once deployed, copy the Public URL provided by Railway (e.g. `https://my-backend.up.railway.app`).

## Phase 2: Vercel Frontend

1. Go to [Vercel.com](https://vercel.com) and import the same GitHub repository.
2. Set the **Root Directory** to `frontend`.
3. Vercel will automatically detect Next.js.
4. Go to **Environment Variables** and add:
   - `NEXT_PUBLIC_API_URL`: Paste the Railway URL from Phase 1 here (no trailing slash).
5. Click **Deploy**.

## Testing the Connection

Once Vercel has finished building:
1. Open the Vercel app URL.
2. The UI will load the Vanilla JS chart engine seamlessly inside a Next.js component.
3. The API calls will automatically route to your Railway backend using the `NEXT_PUBLIC_API_URL` environment variable.
