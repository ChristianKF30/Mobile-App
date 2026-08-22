# 📱 Smartphone App + Node.js & PostgreSQL Backend (Render Ready)

This repository contains your Node.js + Express backend designed specifically to serve smartphone client applications (iOS, Android, React Native, PWA) and store data in **PostgreSQL**.

---

## 📁 Project Structure

```
smartphone-app/
├── server.js          # Express server with CORS, PostgreSQL pool, & API routes
├── package.json       # Dependencies (express, cors, pg, dotenv)
├── .env.example       # Environment variables template
├── public/
│   └── index.html     # Interactive mobile smartphone browser client simulator
└── README.md          # Project guide
```

---

## 🐘 PostgreSQL Integration

The backend automatically detects the `DATABASE_URL` environment variable.

* **On Render.com**: Render automatically provides `DATABASE_URL` when linking your PostgreSQL database to your Web Service. SSL is automatically enabled (`rejectUnauthorized: false`).
* **Auto Table Creation**: On server startup, `server.js` automatically creates the `notes` table if it doesn't already exist:
  ```sql
  CREATE TABLE IF NOT EXISTS notes (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );
  ```
* **Local Fallback**: If no `DATABASE_URL` is provided locally, the server smoothly falls back to an in-memory array so you can continue testing without needing a local database running.

---

## ☁️ Deploying to Render.com

1. Push your code to a **GitHub** repository.
2. Go to **Render Dashboard** → **New +** → **Web Service**.
3. Connect your repository.
4. Set the build and start commands:
   * **Build Command:** `npm install`
   * **Start Command:** `npm start`
5. Connect your **Render PostgreSQL Database**:
   * Add Environment Variable: `DATABASE_URL` = *(Your Render Postgres Connection String)*
6. Click **Create Web Service**!

Once deployed, your live URL (e.g. `https://your-app.onrender.com`) is ready to serve your smartphone apps anywhere in the world! 📱
