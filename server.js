const express = require('express');
const path = require('path');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const session = require('express-session');
const multer = require('multer');
const Stripe = require('stripe');

const app = express();
const port = 3000;

// ==================== CONFIGURARE STRIPE ====================
 const stripe = require('stripe')('sk_test_placeholder');// ← aici pui cheia ta secretă din Stripe (ex: sk_test_...)

// ==================== CONECTARE LA BAZA DE DATE ====================
const pool = new Pool({
  user: 'process.env.DB_USER',
  host: 'process.env.DB_HOST',
  database: 'process.env.DB_NAME',
  password: 'process.env.DB_PASSWORD', // parola ta de la PostgreSQL
  port: process.env.DB_PORT,
});

// ==================== CONFIGURARE EXPRESS ====================
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ==================== SESIUNI ====================
app.use(
  session({
    secret: 'secretretele',
    resave: false,
    saveUninitialized: true,
  })
);

// ==================== CONFIGURARE UPLOAD IMAGINI ====================
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// ==================== PAGINA PRINCIPALĂ ====================
app.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM retete ORDER BY id DESC');
    res.render('index', { retete: result.rows, utilizator: req.session.utilizator });
  } catch (err) {
    res.send('Eroare la conectarea bazei de date: ' + err.message);
  }
});

// ==================== ÎNREGISTRARE ====================
app.get('/register', (req, res) => res.render('register', { mesaj: null }));

app.post('/register', async (req, res) => {
  const { email, parola } = req.body;
  try {
    const parolaHash = await bcrypt.hash(parola, 10);
    await pool.query('INSERT INTO utilizatori (email, parola) VALUES ($1, $2)', [email, parolaHash]);
    res.redirect('/login');
  } catch (err) {
    console.error('Eroare înregistrare:', err);
    res.render('register', { mesaj: 'Emailul există deja sau a apărut o eroare.' });
  }
});

// ==================== LOGIN ====================
app.get('/login', (req, res) => res.render('login', { mesaj: null }));

app.post('/login', async (req, res) => {
  const { email, parola } = req.body;
  try {
    const result = await pool.query('SELECT * FROM utilizatori WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.render('login', { mesaj: 'Email inexistent!' });
    }

    const user = result.rows[0];
    const parolaOk = await bcrypt.compare(parola, user.parola);

    if (!parolaOk) {
      return res.render('login', { mesaj: 'Parolă incorectă!' });
    }

    req.session.utilizator = user;
    res.redirect('/');
  } catch (err) {
    console.error('Eroare login:', err);
    res.render('login', { mesaj: 'Eroare la autentificare.' });
  }
});

// ==================== LOGOUT ====================
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// ==================== ADAUGĂ REȚETĂ ====================
app.get('/adauga', (req, res) => {
  if (!req.session.utilizator) return res.redirect('/login');
  res.render('adauga', { mesaj: null });
});

app.post('/adauga', upload.single('imagine'), async (req, res) => {
  const { titlu, descriere, timp_preparare, dificultate } = req.body;
  const imagine = req.file ? '/uploads/' + req.file.filename : null;
  try {
    await pool.query(
      'INSERT INTO retete (titlu, descriere, timp_preparare, dificultate, imagine) VALUES ($1, $2, $3, $4, $5)',
      [titlu, descriere, timp_preparare, dificultate, imagine]
    );
    res.redirect('/');
  } catch (err) {
    console.error('Eroare adăugare rețetă:', err);
    res.render('adauga', { mesaj: 'Eroare la adăugare.' });
  }
});

// ==================== PAGINA DE ABONAMENT ====================
app.get('/abonament', (req, res) => {
  res.render('abonament', { utilizator: req.session.utilizator });
});

// ==================== CREARE PLATĂ STRIPE ====================
app.post('/creare-plata', async (req, res) => {
  try {
    const sessionStripe = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'ron',
            product_data: {
              name: 'Abonament Premium Rețete de vânătoare',
            },
            unit_amount: 1500, // 15 RON
          },
          quantity: 1,
        },
      ],
      success_url: 'http://localhost:3000/succes',
      cancel_url: 'http://localhost:3000/abonament',
    });
    res.redirect(sessionStripe.url);
  } catch (err) {
    console.error('Eroare Stripe:', err);
    res.send('Eroare la crearea sesiunii de plată.');
  }
});

app.get('/succes', async (req, res) => {
  if (!req.session.utilizator) return res.redirect('/login');
  await pool.query('UPDATE utilizatori SET abonat = true WHERE id = $1', [req.session.utilizator.id]);
  res.render('succes');
});

// ==================== PAGINI STATICE ====================
app.get('/contact', (req, res) => res.render('contact'));

// ==================== PORNIRE SERVER ====================
app.listen(port, () => console.log(`✅ Serverul rulează la http://localhost:${port}`));
