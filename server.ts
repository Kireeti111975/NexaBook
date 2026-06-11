import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("contacts.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    photo TEXT,
    relation TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Ensure 'relation' column exists (for existing databases)
try {
  db.prepare("SELECT relation FROM contacts LIMIT 1").get();
} catch (e) {
  console.log("Adding 'relation' column to contacts table...");
  db.exec("ALTER TABLE contacts ADD COLUMN relation TEXT");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // API Routes
  app.get("/api/contacts", (req, res) => {
    try {
      const search = req.query.search || "";
      const stmt = db.prepare("SELECT * FROM contacts WHERE name LIKE ? OR phone LIKE ? OR email LIKE ? OR relation LIKE ? ORDER BY createdAt DESC");
      const contacts = stmt.all(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
      res.json(contacts);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      res.status(500).json({ error: "Failed to fetch contacts" });
    }
  });

  app.post("/api/contacts", (req, res) => {
    try {
      const { name, phone, email, photo, relation } = req.body;
      const stmt = db.prepare("INSERT INTO contacts (name, phone, email, photo, relation) VALUES (?, ?, ?, ?, ?)");
      const result = stmt.run(name, phone, email, photo, relation || null);
      res.json({ id: result.lastInsertRowid });
    } catch (error) {
      console.error("Error saving contact:", error);
      res.status(500).json({ error: "Failed to save contact" });
    }
  });

  app.put("/api/contacts/:id", (req, res) => {
    try {
      const { id } = req.params;
      const { name, phone, email, photo, relation } = req.body;
      const stmt = db.prepare("UPDATE contacts SET name = ?, phone = ?, email = ?, photo = ?, relation = ? WHERE id = ?");
      stmt.run(name, phone, email, photo, relation || null, id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating contact:", error);
      res.status(500).json({ error: "Failed to update contact" });
    }
  });

  app.delete("/api/contacts/:id", (req, res) => {
    try {
      const { id } = req.params;
      const stmt = db.prepare("DELETE FROM contacts WHERE id = ?");
      stmt.run(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting contact:", error);
      res.status(500).json({ error: "Failed to delete contact" });
    }
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
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
