# IronTrack Weekly - Netlify Deployment Guide

This app is a pure front-end React application built with Vite and Tailwind CSS. It uses `localStorage` for data persistence, making it perfect for static hosting on Netlify.

## 🚀 One-Click Deployment

1. **Push your code to GitHub/GitLab/Bitbucket.**
2. **Connect to Netlify**:
   - Log in to [Netlify](https://app.netlify.com/).
   - Click **"Add new site"** > **"Import an existing project"**.
   - Select your repository.
3. **Configure Build Settings**:
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`
   - (These are already configured in `netlify.toml`)
4. **Set Environment Variables**:
   - Go to **Site settings > Build & deploy > Environment variables**.
   - Add `GEMINI_API_KEY`: Your Google Gemini API key (required for AI Tips).
   - Add `VITE_FIREBASE_API_KEY`: Your Firebase API Key.
   - Add `VITE_FIREBASE_AUTH_DOMAIN`: Your Firebase Auth Domain.
   - Add `VITE_FIREBASE_PROJECT_ID`: Your Firebase Project ID.
   - Add `VITE_FIREBASE_STORAGE_BUCKET`: Your Firebase Storage Bucket.
   - Add `VITE_FIREBASE_MESSAGING_SENDER_ID`: Your Firebase Messaging Sender ID.
   - Add `VITE_FIREBASE_APP_ID`: Your Firebase App ID.
5. **Deploy!**

## 🛠 Local Development

```bash
npm install
npm run dev
```

## 📦 Build for Production

```bash
npm run build
```
The output will be in the `dist/` folder.
