import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import { config } from "dotenv";

config({ path: ".env.local" });

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DATABASE_HOST,
    port: Number(process.env.DATABASE_PORT || 3306),
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    multipleStatements: true,
  });

  const dbName = process.env.DATABASE_NAME || "clinic";
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await connection.query(`USE \`${dbName}\``);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS dentists (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      username VARCHAR(120) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      clinic_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS patients (
      id INT AUTO_INCREMENT PRIMARY KEY,
      dentist_id INT NOT NULL,
      name VARCHAR(120) NOT NULL,
      phone VARCHAR(32) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_patients_dentist FOREIGN KEY (dentist_id) REFERENCES dentists(id) ON DELETE CASCADE,
      INDEX idx_patients_dentist (dentist_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS procedures (
      id INT AUTO_INCREMENT PRIMARY KEY,
      patient_id INT NOT NULL,
      name VARCHAR(190) NOT NULL,
      total_price DECIMAL(12,2) NOT NULL DEFAULT 0,
      status ENUM('active','finished') NOT NULL DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      finished_at TIMESTAMP NULL,
      CONSTRAINT fk_procedures_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
      INDEX idx_procedures_patient (patient_id),
      INDEX idx_procedures_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS sessions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      procedure_id INT NOT NULL,
      notes TEXT,
      amount_paid DECIMAL(12,2) NOT NULL DEFAULT 0,
      teeth JSON NOT NULL,
      session_date DATE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_sessions_procedure FOREIGN KEY (procedure_id) REFERENCES procedures(id) ON DELETE CASCADE,
      INDEX idx_sessions_procedure (procedure_id),
      INDEX idx_sessions_date (session_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  const [columns] = await connection.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'dentists'`,
    [dbName]
  );
  const columnNames = columns.map((row) => row.COLUMN_NAME);

  if (columnNames.includes("email") && !columnNames.includes("username")) {
    await connection.query(`
      ALTER TABLE dentists
      CHANGE COLUMN email username VARCHAR(120) NOT NULL UNIQUE
    `);
    await connection.query(
      "UPDATE dentists SET username = ? WHERE username = ?",
      ["rawan", "dentist@clinic.sy"]
    );
    console.log("Migrated dentists.email -> dentists.username");
  }

  const defaultUsername = "rawan";
  const defaultName = "د. روان المنصور";
  const defaultPassword = "dentist123";

  const [rows] = await connection.query(
    "SELECT id FROM dentists WHERE username = ?",
    [defaultUsername]
  );

  if (!rows.length) {
    const hash = await bcrypt.hash(defaultPassword, 10);
    await connection.query(
      "INSERT INTO dentists (name, username, password_hash, clinic_percentage) VALUES (?, ?, ?, ?)",
      [defaultName, defaultUsername, hash, 30]
    );
    console.log(
      `Seeded dentist: ${defaultUsername} / ${defaultPassword} (${defaultName})`
    );
  } else {
    await connection.query(
      "UPDATE dentists SET name = ?, username = ? WHERE id = ?",
      [defaultName, defaultUsername, rows[0].id]
    );
    console.log(
      `Updated default dentist: ${defaultUsername} / ${defaultPassword} (${defaultName})`
    );
  }

  await connection.end();
  console.log("Database ready.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
