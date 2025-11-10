import { Router } from "express";
import { upload } from "../middleware/upload.js";
import { pool } from "../db.js";
const router = Router();

router.get("/", async (req, res) => {
  try {
    const { status, search } = req.query;
    const params = [];
    let sql = "SELECT * FROM items WHERE 1=1";
    if (status) { sql += " AND status = ?"; params.push(status); }
    if (search) { sql += " AND (name LIKE ? OR description LIKE ?)"; params.push(`%${search}%`,`%${search}%`); }
    sql += " ORDER BY date_found DESC, item_id DESC";
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
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

router.patch("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const [result] = await pool.query(`UPDATE items SET status=? WHERE item_id=?`, [status, id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: "Item not found" });
    const [rows] = await pool.query("SELECT * FROM items WHERE item_id = ?", [id]);
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
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
