# Railway Deployment Plan

This guide outlines the steps required to deploy the Node.js backend to Railway. Since the application uses a file-based SQLite database (`data/panic_button.db`), we must use Railway Volumes to ensure data persists across deployments and restarts.

## 1. Prepare Your Repository
1. Ensure your latest code is committed and pushed to a GitHub repository.
2. **Backend Entrypoint:** Verify that `backend/package.json` has a valid `start` script. 
   ```json
   "scripts": {
     "start": "node src/server.js",
     "dev": "nodemon src/server.js"
   }
   ```
3. Make sure the backend serves the `public/` directory properly for the `map.html` and admin dashboard.

## 2. Setting Up Railway
1. Go to your [Railway Dashboard](https://railway.app/).
2. Click **New Project** and select **Deploy from GitHub repo**.
3. Select the `driver-panic-button` repository.
4. Railway will analyze the root directory. To correctly point to the backend, you'll need to configure the deployment path.

### Root Directory Configuration
If your backend is inside the `backend/` folder, tell Railway to treat `backend` as the root deployment directory:
1. Go to your Project > **Service Settings** > **Build**.
2. Set the **Root Directory** to `backend`.
3. Save the changes (Railway may trigger a new build; it will fail without the volume, which is fine for now).

## 3. Persistent Volume (Mandatory for SQLite)
Since Railway containers are ephemeral, any data saved to the local filesystem will be lost upon redeployment unless a Volume is attached.
1. In your Service, go to **Settings** > **Volumes**.
2. Click **New Volume**.
3. Give it a name (e.g., `sqlite-data`) and set the **Mount Path** to `/app/data`.
*(Since we set the root directory to `backend`, the app runs from `/app`. The SQLite file will be stored in `/app/data`)*

## 4. Environment Variables
1. Go to **Settings** > **Variables**.
2. Add the following key-value pairs:
   * `PORT` = `4000` *(Railway usually overrides this, but it's good practice to set it)*
   * `DB_PATH` = `/app/data/panic_button.db` *(This must exactly match the Mount Path you chose for your volume)*
   * `PUBLIC_URL` = `https://<your-railway-app-url>.up.railway.app` *(Optional, use if you enforce absolute URLs for tracking)*

## 5. Domain Name
1. Go to **Settings** > **Networking**.
2. Click **Generate Domain** to get your public `.up.railway.app` URL (or assign a custom domain).

## 6. Update the Mobile App
Once the backend is successfully deployed and accessible online:
1. Open your React Native code.
2. Navigate to `lib/api-client.ts` (or wherever your Axios instance is configured).
3. Change the `baseURL` from local or dev API to your new Railway production URL.
   ```typescript
   // Example
   const apiClient = axios.create({
     baseURL: "https://your-app-name.up.railway.app/api",
   });
   ```
4. Build the mobile app again with Expo so it points to the cloud environment.

## Validation 
1. Open the Railway domain followed by `/api/health` in your browser to verify it's working.
2. Trigger a panic event from the mobile app and check the Railway logs to confirm the database was updated properly inside the new volume.
