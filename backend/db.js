import mysql from "mysql2";
import dotenv from "dotenv";

dotenv.config({ quiet: true });

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10,
  idleTimeout: 60000,
  queueLimit: 0,

  connectTimeout: 10000,

  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Optional connection test
db.getConnection((err, connection) => {
  if (err) {
    console.log("DB Connection Error:", err);
  } else {
    console.log("MySQL Connected ✅");
    connection.release();
  }
});
//users  user_photo  chat_messages post  post_comments post_reactions stories myfriends myvisitor ignorelist
export default db;