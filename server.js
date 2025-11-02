// ================== IMPORTURI ==================
import express from "express";
import path from "path";
import mysql from "mysql2/promise";
import bcrypt from "bcrypt";
import session from "express-session";
import multer from "multer";
import Stripe from "stripe";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// ================== CONFIG .ENV ==================
dotenv.config();

// ================== SETĂRI DIRECTOR ==================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ================== APLICAȚIA EXPRESS ==================
const app = express();
const port = process.env.PORT || 3000;

// ================== CONFIGURARE STRIPE ==================
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder");

// ================== CONECTARE BAZĂ DE DATE ==================
const dbUrl = process.env.DATABASE_URL;

let pool;
try {
  pool = await mysql.createPool(dbUrl);
  console.log("✅ Conectat cu succes la baza de date!");
} catch (err) {
  console.error("❌ Eroare la conectarea bazei de date:", err.message);
}

// ================== CONFIGURARE EXPRESS ==================
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ================== SESIUNI ==================
app.use(
  session({
    secret: "secretretele",
    resave: false,
    saveUninitialized: true,
  })
);

// ================== UPLOAD IMAGINI ==================
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "public/uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// ================== RUTE PRINCIPALE ==================
app.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT NOW() AS time");
    res.send(`✅ Conexiune activă la DB. Ora serverului MySQL: ${rows[0].time}`);
  } catch (err) {
    console.error("Eroare la interogare:", err.message);
    res.status(500).send("❌ Eroare la interogare.");
  }
});

// ================== PORNIRE SERVER ==================
app.listen(port, () => {
  console.log(`🚀 Serverul rulează la http://localhost:${port}`);
});
