import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const run = async () => {
  try {
    const pool = await mysql.createPool(process.env.DATABASE_URL);
    console.log("✅ Conectat la baza de date!");

    // Șterge tabela USERS și o recreează corect
    const sql = `
      DROP TABLE IF EXISTS USERS;

      CREATE TABLE USERS (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL
      );
    `;

    await pool.query(sql);
    console.log("✅ Tabela USERS a fost recreată corect!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Eroare la resetarea tabelei:", err.message);
    process.exit(1);
  }
};

run();
