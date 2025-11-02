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
const dbUrl = process.env.DATABASE_URL;
let pool;

try {
  pool = await mysql.createPool(dbUrl);
  console.log("✅ Conectat cu succes la baza de date!");
} catch (err) {
  console.error("❌ Eroare la conectarea bazei de date:", err.message);
}

// ================== REGISTER ==================
app.get('/register', (req, res) => {
  res.render('register');
});

app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    const hashed = await bcrypt.hash(password, 10);
    await pool.query('INSERT INTO USERS (username, password) VALUES (?, ?)', [username, hashed]);
    res.send("✅ Cont creat cu succes!");
  } catch (err) {
    console.error("Eroare la înregistrare:", err);
    res.status(500).send("❌ Eroare la înregistrare.");
  }
});

// ================== LOGIN ==================
app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const [rows] = await pool.query('SELECT * FROM USERS WHERE username = ?', [username]);
    if (rows.length === 0) return res.send("❌ Utilizator inexistent!");

    const valid = await bcrypt.compare(password, rows[0].password);
    if (!valid) return res.send("❌ Parolă incorectă!");

    res.send("✅ Autentificare reușită!");
  } catch (err) {
    console.error("Eroare la login:", err);
    res.status(500).send("❌ Eroare la autentificare.");
  }
});

// ================== CONFIGURARE STRIPE ==================
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder");

// ================== CONECTARE BAZĂ DE DATE ==================


let pool;
try {
  pool = await mysql.createPool(dbUrl);
  console.log("✅ Conectat cu succes la baza de date!");
} catch (err) {
  console.error("❌ Eroare la conectarea bazei de date:", err.message);
}
// TESTARE CONEXIUNE DB =====================
app.get("/test-db", async (req, res) => {
  try {
    const [rows] = await pool.query("SHOW TABLES;");
    res.send(`<h3>✅ Conexiune OK! Tabelele găsite:</h3><pre>${JSON.stringify(rows, null, 2)}</pre>`);
  } catch (err) {
    res.send(`<h3>❌ Eroare la interogare DB:</h3><pre>${err.message}</pre>`);
  }
});

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
  console.log(`Serverul rulează pe portul ${port}`);
});
