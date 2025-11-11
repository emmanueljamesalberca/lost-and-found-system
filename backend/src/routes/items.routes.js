import { Router } from "express";
import { upload } from "../middleware/upload.js";
import { pool } from "../db.js";
const router = Router();
const ADMIN_USER = process.env.ADMIN_USER || "";
const ADMIN_PASS = process.env.ADMIN_PASS || "";

function isAuthed(req) {
  if (!ADMIN_USER) return true; // auth disabled if not configured
  const hdr = req.headers.authorization || "";
  const [type, token] = hdr.split(" ");
  if (type !== "Basic" || !token) return false;
  const [u, p] = Buffer.from(token, "base64").toString().split(":");
  return u === ADMIN_USER && p === ADMIN_PASS;
}
function requireBasicAuth(req, res, next) {
  if (isAuthed(req)) return next();
  res.set("WWW-Authenticate", 'Basic realm="lostfound-admin"');
  return res.status(401).send("Authentication required");
}
function authUser(req) {
  const hdr = req.headers.authorization || '';
  if (!hdr.startsWith('Basic ')) return '';
  const [u] = Buffer.from(hdr.slice(6), 'base64').toString('utf8').split(':');
  return u || '';
}

// LIST
router.get("/", async (req, res) => {
  try {
    const { search = "", status = "", includeReturned } = req.query;

    if (includeReturned && !isAuthed(req)) {
      res.set("WWW-Authenticate", 'Basic realm="lostfound-admin"');
      return res.status(401).send("Authentication required");
    }

    let sql = "SELECT * FROM items WHERE 1";
    const params = [];

    if (!includeReturned) sql += ' AND status <> "returned"';
    if (status) { sql += " AND status = ?"; params.push(status); }
    if (search) {
      sql += " AND (LOWER(name) LIKE ? OR LOWER(description) LIKE ?)";
      const q = `%${String(search).toLowerCase()}%`;
      params.push(q, q);
    }

    sql += " ORDER BY date_found DESC, item_id DESC";
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


// CREATE
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const { name, description, location_found, date_found, status } = req.body;

    if (!name || !location_found || !date_found) {
      return res.status(400).json({ error: "name, location_found, and date_found are required" });
    }

    // If a file was uploaded, build a URL served by your static /uploads route
    let image_url = '';
    if (req.file && req.file.filename) {
      image_url = `/uploads/${req.file.filename}`;
    } else if (req.body.image_url) {
      image_url = String(req.body.image_url);
    }
    // normalize windows backslashes -> web slashes
    image_url = image_url ? image_url.replace(/\\/g, '/') : '';

    const [result] = await pool.query(
      `INSERT INTO items (name, description, image_url, location_found, date_found, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, description ?? null, image_url, location_found, date_found, status ?? "lost"]
    );

    const [rows] = await pool.query("SELECT * FROM items WHERE item_id = ?", [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// UPDATE
router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, location_found, date_found, status } = req.body;

    const image_url = req.file
      ? `/uploads/${req.file.filename}`
      : req.body.image_url || null;

    const [result] = await pool.query(
      `UPDATE items
       SET name=?, description=?, image_url=?, location_found=?, date_found=?, status=?
       WHERE item_id=?`,
      [name, description ?? null, image_url, location_found, date_found, status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Item not found" });
    }

    const [rows] = await pool.query("SELECT * FROM items WHERE item_id = ?", [id]);
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// STATUS UPDATE (admin only; allow only -> returned, save claimant info)
router.patch("/:id/status", requireBasicAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status: next, claimed_by = "", claimed_note = "" } = req.body;

    if (next !== "returned") {
      return res.status(400).json({ error: "Only transition to 'returned' is allowed" });
    }

    const [[row]] = await pool.query("SELECT status FROM items WHERE item_id = ?", [id]);
    if (!row) return res.status(404).json({ error: "Item not found" });

    const cur = row.status;
    const ok = (cur === "lost" && next === "returned") || (cur === "found" && next === "returned");
    if (!ok) return res.status(400).json({ error: `Transition ${cur} -> ${next} not allowed` });

    if (!claimed_by.trim()) {
      return res.status(400).json({ error: "Claimant name is required." });
    }

    const adminUser = authUser(req);
    await pool.query(
      `UPDATE items
         SET status = ?,
             claimed_by = ?,
             claimed_note = NULLIF(?, ''),
             claimed_at = NOW(),
             claimed_by_admin = ?
       WHERE item_id = ?`,
      [next, claimed_by.trim(), claimed_note, adminUser, id]
    );

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});




router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query("DELETE FROM items WHERE item_id = ?", [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: "Item not found" });
    res.status(204).end();
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
