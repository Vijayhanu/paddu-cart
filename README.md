# Paddu Cart

A Vite + React application for Paddu Point.

## Scripts

```json
"scripts": {
  "dev": "npx vite",
  "build": "npx vite build",
  "preview": "npx vite preview --host",
  "start": "npx vite preview --host"
}
```

## Local Development

```powershell
cd C:\Users\vijay\.gemini\antigravity\scratch\paddu-cart
npm install          # install dependencies (including ws)
npm run dev          # start dev server
```

The dev server will print a **Local** URL (`http://localhost:5173/`) and a **Network** URL (e.g. `http://10.25.222.208:5173/`). Open the Network URL on a device on the same network to view the app.

## Production Build & Preview

```powershell
npm run build        # creates production assets in dist/
npm run preview      # serves the built app locally (hosted on all interfaces)
```

## Deploying to Render (Free)

1. Push this repository to GitHub.
2. In Render, create a **Static Site** and link the repository.
3. Set the **Build Command** to `npm install && npm run build`.
4. Set the **Publish Directory** to `dist`.
5. Add a **Start Command** (optional) to keep the preview server alive:
   ```
   npx vite preview --host
   ```
6. Deploy – Render will give you a public URL.

## Deploying to Fly.io (Free tier)

1. Install Fly CLI: `curl -L https://fly.io/install.sh | sh`.
2. `fly launch` – choose "Dockerfile" when prompted.
3. Replace the generated `Dockerfile` with:
   ```Dockerfile
   FROM node:20-alpine AS builder
   WORKDIR /app
   COPY . .
   RUN npm install && npm run build
   FROM nginx:alpine
   COPY --from=builder /app/dist /usr/share/nginx/html
   EXPOSE 80
   CMD ["nginx", "-g", "daemon off;"]
   ```
4. `fly deploy` – Fly will provide a public URL.

## Issues

- If you see `ERR_MODULE_NOT_FOUND: Cannot find package 'ws'`, run `npm install ws`.
- Ensure port `5173` (or the port you configure) is allowed through Windows Firewall.

---

Happy publishing! 🚀
