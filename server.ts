import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database("gym.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS schedule (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    day_number INTEGER NOT NULL,
    exercise_name TEXT NOT NULL,
    muscle_group TEXT,
    target_sets INTEGER DEFAULT 3,
    target_reps TEXT DEFAULT '8-12',
    notes TEXT
  );

  CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    exercise_id INTEGER,
    exercise_name TEXT NOT NULL,
    muscle_group TEXT,
    day_number INTEGER,
    weight REAL,
    sets INTEGER,
    reps INTEGER,
    notes TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(exercise_id) REFERENCES schedule(id)
  );
`);

// Migration: Add columns if they don't exist
try {
  db.prepare("ALTER TABLE schedule ADD COLUMN muscle_group TEXT").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE schedule ADD COLUMN notes TEXT").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE logs ADD COLUMN muscle_group TEXT").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE logs ADD COLUMN notes TEXT").run();
} catch (e) {}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  
  // Get full schedule
  app.get("/api/schedule", (req, res) => {
    const rows = db.prepare("SELECT * FROM schedule ORDER BY day_number, id").all();
    res.json(rows);
  });

  // Add exercise to schedule
  app.post("/api/schedule", (req, res) => {
    const { day_number, exercise_name, muscle_group, target_sets, target_reps, notes } = req.body;
    const info = db.prepare(
      "INSERT INTO schedule (day_number, exercise_name, muscle_group, target_sets, target_reps, notes) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(day_number, exercise_name, muscle_group, target_sets || 3, target_reps || '8-12', notes);
    res.json({ id: info.lastInsertRowid });
  });

  // Delete from schedule
  app.delete("/api/schedule/:id", (req, res) => {
    db.prepare("DELETE FROM schedule WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Log a workout
  app.post("/api/logs", (req, res) => {
    const { exercise_id, exercise_name, muscle_group, day_number, weight, sets, reps, notes } = req.body;
    const info = db.prepare(
      "INSERT INTO logs (exercise_id, exercise_name, muscle_group, day_number, weight, sets, reps, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    ).run(exercise_id, exercise_name, muscle_group, day_number, weight, sets, reps, notes);
    res.json({ id: info.lastInsertRowid });
  });

  // Analytics: Volume over time
  app.get("/api/analytics/volume", (req, res) => {
    const rows = db.prepare(`
      SELECT date(timestamp) as date, SUM(weight * sets * reps) as volume
      FROM logs
      GROUP BY date(timestamp)
      ORDER BY date ASC
      LIMIT 30
    `).all();
    res.json(rows);
  });

  // Analytics: Frequency (workouts per week)
  app.get("/api/analytics/frequency", (req, res) => {
    const rows = db.prepare(`
      SELECT strftime('%Y-%W', timestamp) as week, COUNT(DISTINCT date(timestamp)) as count
      FROM logs
      GROUP BY week
      ORDER BY week ASC
      LIMIT 12
    `).all();
    res.json(rows);
  });

  // Analytics: Personal Bests
  app.get("/api/analytics/pbs", (req, res) => {
    const rows = db.prepare(`
      SELECT exercise_name, MAX(weight) as max_weight
      FROM logs
      GROUP BY exercise_name
      ORDER BY max_weight DESC
    `).all();
    res.json(rows);
  });

  // Get logs (history)
  app.get("/api/logs", (req, res) => {
    const rows = db.prepare("SELECT * FROM logs ORDER BY timestamp DESC").all();
    res.json(rows);
  });

  // Get weekly progress (logs from the current week)
  app.get("/api/weekly-progress", (req, res) => {
    // Simple logic: get logs from the last 7 days
    const rows = db.prepare(`
      SELECT * FROM logs 
      WHERE timestamp >= date('now', 'weekday 0', '-7 days')
      ORDER BY timestamp DESC
    `).all();
    res.json(rows);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist/index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
