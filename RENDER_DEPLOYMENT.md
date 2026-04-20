# PacketScope - Render Deployment Guide

## 📁 Root Folder Structure

Your root folder is: **`PacketScope/`**

```
PacketScope/                          ← ROOT FOLDER (upload this entire folder)
├── backend/                          ← Backend Node.js server
│   ├── models/
│   ├── routes/
│   ├── server.js                     ← Main server file
│   ├── sniffer.py                    ← Python packet sniffer
│   └── package.json
├── frontend/                         ← Frontend React app
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
├── package.json                      ← ROOT package.json (BUILD ORCHESTRATOR)
├── copy-files.js                     ← File copy utility
├── Dockerfile                        ← Docker image definition
├── render.yaml                       ← Render deployment config (OPTIONAL)
└── .env.example                      ← Example environment variables
```

---

## 🔨 Build Command

**Primary Build Command** (used by Dockerfile):
```bash
npm run build
```

**What it does:**
1. Compiles the React frontend with Vite: `cd frontend && npm run build`
2. Creates optimized build in `frontend/dist/`
3. Copies all built files to `backend/public/` for serving

**Detailed breakdown:**
```json
{
  "build": "cd frontend && npm run build && cd .. && node copy-files.js"
}
```

---

## 🚀 Start Command

**Primary Start Command** (used by Render):
```bash
npm start
```

**What it does:**
- Changes to backend directory: `cd backend && npm start`
- Starts Node.js server: `node server.js`
- Listens on PORT 5000 (or custom PORT from environment)
- Serves frontend files from `backend/public/`
- Connects to MongoDB

---

## 📋 Step-by-Step Render Deployment

### Step 1: Prepare Your Repository
1. Ensure all files are committed to GitHub
2. The root folder `PacketScope/` should be your repository root
3. Verify these files exist in root:
   - `package.json` ✓
   - `Dockerfile` ✓
   - `render.yaml` ✓
   - `copy-files.js` ✓

### Step 2: Create MongoDB Database
**Option A: MongoDB Atlas (Recommended)**
1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free account
3. Create a cluster (M0 free tier)
4. Get your connection string:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/packetscope?retryWrites=true&w=majority
   ```
5. Save this as `MONGO_URI`

**Option B: Render Managed PostgreSQL** (alternative)
- Not ideal for this app; use MongoDB

### Step 3: Set Up Render Service
1. Go to https://render.com
2. Sign in with GitHub
3. Click **"New +"** → **"Web Service"**
4. Connect your GitHub repository containing `PacketScope/`
5. Configure:
   - **Name**: `packetscope`
   - **Environment**: Docker
   - **Branch**: main (or your branch)
   - **Root Directory**: Leave empty (or `.` if needed)

### Step 4: Configure Build & Start Commands

In Render Dashboard → Environment:

**Build Command:**
```bash
npm run build
```

**Start Command:**
```bash
npm start
```

**Note**: These are configured in `render.yaml` but verify in Render dashboard

### Step 5: Set Environment Variables

In Render Dashboard → Environment → Add Secret:

| Key | Value | Type |
|-----|-------|------|
| `MONGO_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/packetscope...` | Secret |
| `FRONTEND_URL` | `https://your-app.onrender.com` | Environment |
| `PYTHON_PATH` | `python3` | Environment |
| `VITE_API_URL` | `` (empty string) | Environment |

**Getting your URL:**
- After deployment, Render provides: `https://packetscope-xxxxx.onrender.com`
- Use this for `FRONTEND_URL`

### Step 6: Deploy
1. Click **"Create Web Service"**
2. Render starts the build process:
   - Reads `Dockerfile`
   - Installs Node.js 18 + Python 3
   - Runs: `npm run build`
   - Copies frontend to backend
   - Runs: `npm start`

3. Wait for deployment (3-5 minutes)
4. Access your app at `https://packetscope-xxxxx.onrender.com`

---

## 📦 Build Process Breakdown

### What Happens When You Deploy:

1. **Dockerfile Execution**
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   COPY backend/package*.json ./backend/
   COPY frontend/package*.json ./frontend/
   RUN npm run install-all
   COPY . .
   RUN npm run build
   EXPOSE 5000
   CMD ["npm", "start"]
   ```

2. **Install Dependencies**
   ```bash
   npm run install-all
   ```
   This runs:
   - `npm install` (root)
   - `cd backend && npm install`
   - `cd frontend && npm install`

3. **Build Frontend**
   ```bash
   npm run build
   ```
   Vite creates optimized React bundle in `frontend/dist/`

4. **Copy Files**
   The `copy-files.js` script copies from `frontend/dist/` → `backend/public/`

5. **Start Server**
   ```bash
   npm start
   ```
   Node.js server starts and:
   - Serves static files from `backend/public/`
   - Runs API endpoints
   - Connects to MongoDB

---

## 🌐 File Serving Flow

```
User Request (https://packetscope-xxxxx.onrender.com)
        ↓
    Render Container
        ↓
    Node.js Server (port 5000)
        ↓
    Express Middleware (express.static('public'))
        ↓
    backend/public/
    ├── index.html
    ├── assets/
    │   ├── index-xxxxxx.js
    │   └── index-xxxxxx.css
```

---

## ✅ Verify After Deployment

1. **Frontend loads**: Visit `https://packetscope-xxxxx.onrender.com`
2. **Health check**: Visit `https://packetscope-xxxxx.onrender.com/health`
   - Should return: `{"status":"ok","database":"connected","sniffer":"stopped"}`
3. **API working**: Check network tab in DevTools for `/api/*` calls

---

## 🔧 Troubleshooting

### Build fails
- Check: Are all 3 `package.json` files present?
  - `PacketScope/package.json` ✓
  - `PacketScope/backend/package.json` ✓
  - `PacketScope/frontend/package.json` ✓

### App crashes
- Check logs: Render Dashboard → Logs
- Verify: `MONGO_URI` is correct
- Check: Port is 5000 (Render sets `$PORT`)

### Frontend not loading
- Ensure `npm run build` completes successfully
- Check: Files copied to `backend/public/`
- Verify: `server.js` serves static files

### API calls fail
- Check: `FRONTEND_URL` set correctly
- Verify: `VITE_API_URL=""` (empty for same-origin)
- Monitor: Network tab for actual requests

---

## 📱 Environment Variables Reference

```env
# Required
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/db

# Optional but recommended
FRONTEND_URL=https://packetscope-xxxxx.onrender.com
PYTHON_PATH=python3
VITE_API_URL=

# Auto-set by Render
PORT=5000 (set automatically)
NODE_ENV=production (recommended to set)
```

---

## 🎯 Summary

| Item | Value |
|------|-------|
| Root Folder | `PacketScope/` |
| Build Command | `npm run build` |
| Start Command | `npm start` |
| Port | `5000` |
| Main Server File | `backend/server.js` |
| Static Files | `backend/public/` |
| Database | MongoDB Atlas |

Your application is ready for production on Render! 🚀