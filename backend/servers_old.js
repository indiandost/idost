import express from "express";
import mysql from "mysql2";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// ✅ MySQL connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "", // your password
  database: "idst"
});

db.connect((err) => {
  if (err) {
    console.log("DB Error:", err);
  } else {
    console.log("MySQL Connected ✅");
  }
});

// ✅ Default location (Delhi) if user location not provided
const DEFAULT_LAT = 28.6139;
const DEFAULT_LNG = 77.2090;

// ✅ GET USERS WITH DISTANCE
app.get("/users", (req, res) => {

  // get lat/lng from query (frontend can send later)
  const userLat = req.query.lat || DEFAULT_LAT;
  const userLng = req.query.lng || DEFAULT_LNG;

  const sql = `
    SELECT 
      srno,
      name,
      age,
      city,
      pic,
      online,
      (
        6371 * acos(
          cos(radians(?)) * cos(radians(latitude)) *
          cos(radians(longitude) - radians(?)) +
          sin(radians(?)) * sin(radians(latitude))
        )
      ) AS distance
    FROM users
    WHERE status = 'A'
    ORDER BY distance ASC
    LIMIT 50
  `;

  db.query(sql, [userLat, userLng, userLat], (err, result) => {
    if (err) return res.json(err);

    // format response
    const users = result.map(u => ({
      id: u.srno,
      name: u.name,
      age: u.age,
      city: u.city,
      pic: u.pic,
      online: u.online,
      distance: u.distance ? u.distance.toFixed(1) + " km" : "N/A"
    }));

    res.json(users);
  });
});

// ✅ OPTIONAL: FILTER BY CITY
app.get("/users/city/:city", (req, res) => {
  const city = req.params.city;

  const sql = `
    SELECT srno, name, age, city, pic, online
    FROM users
    WHERE city = ?
    LIMIT 50
  `;

  db.query(sql, [city], (err, result) => {
    if (err) return res.json(err);
    res.json(result);
  });
});
//user profile view
app.get("/user/:id", (req, res) => {
  const id = req.params.id;

  const sql = `
    SELECT srno, name, age, city, pic, about, online
    FROM users
    WHERE srno = ?
  `;

  db.query(sql, [id], (err, result) => {
    if (err) return res.json(err);
    res.json(result[0]);
  });
});
// ✅ TEST API
app.get("/", (req, res) => {
  res.send("API Running 🚀");
});

// ✅ START SERVER
app.listen(5000, () => {
  console.log("Server running on http://localhost:5000 🚀");
});