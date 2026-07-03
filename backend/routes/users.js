import express from "express";

import fetch from "node-fetch";
import { verifyToken } from "../middlewares/auth.js";
const router = express.Router();

// ✅ Default location (Delhi)

const DEFAULT_LAT = 28.6139;

const DEFAULT_LNG = 77.209;

//API for push lat long value in db

router.get("/lati", async (req, res) => {
  const db = req.app.get("db");

  // =========================

  // GET USERS WITHOUT LAT/LNG

  // =========================

  const sql = `

    SELECT

      city,

      state,

      country,

      MIN(address) as address

    FROM users

    WHERE

      city IS NOT NULL

      AND city != ''

      AND email IS NOT NULL

      AND email != ''

      AND telephone IS NOT NULL

      AND telephone != ''

      AND LOWER(country) = 'india'

      AND (

        latitude IS NULL

        OR latitude = ''

        OR longitude IS NULL

        OR longitude = ''

      )

    GROUP BY city, state, country

    LIMIT 80, 50

  `;

  db.query(sql, async (err, result) => {
    if (err) {
      console.log(err);

      return res.status(500).json({
        success: false,

        error: err.message,
      });
    }

    let updated = [];

    // =========================

    // GEOCODE FUNCTION

    // =========================

    async function getLatLng(address) {
      try {
        if (!address || address.length < 3) {
          return null;
        }

        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`;

        const controller = new AbortController();

        const timeout = setTimeout(() => {
          controller.abort();
        }, 10000);

        let response;

        try {
          response = await fetch(url, {
            headers: {
              "User-Agent": "indiandost-app",
            },

            signal: controller.signal,
          });
        } catch (err) {
          if (err.name === "AbortError") {
            console.log("Request timeout");
          } else {
            console.log("Fetch Error:", err);
          }

          return null;
        }

        clearTimeout(timeout);

        // response check

        if (response.status === 429) {
          console.log("Rate limit hit");

          await new Promise((r) => setTimeout(r, 15000));

          return null;
        }

        if (!response.ok) {
          console.log(
            "Geocode HTTP Error:",

            response.status,
          );

          return null;
        }

        const text = await response.text();

        // invalid response check

        if (text.startsWith("<")) {
          console.log(
            "Non JSON Response:",

            text.substring(0, 200),
          );

          return null;
        }

        const data = JSON.parse(text);

        if (!data || !data.length) {
          return null;
        }

        return {
          lat: data[0].lat,

          lng: data[0].lon,
        };
      } catch (e) {
        console.log("Geocode Error:", e);

        return null;
      }
    }

    // =========================

    // PROCESS LOCATIONS

    // =========================

    for (const u of result) {
      const fullAddress = [u.city, u.state, u.country]

        .filter(Boolean)

        .join(", ");

      if (!fullAddress) {
        continue;
      }

      console.log("Checking:", fullAddress);

      const loc = await getLatLng(fullAddress);

      if (loc) {
        try {
          await new Promise((resolve, reject) => {
            db.query(
              `

                UPDATE users

                SET latitude=?, longitude=?

                WHERE

                  city=?

                  AND (

                    state=? OR (state IS NULL AND ? IS NULL)

                  )

                  AND (

                    country=? OR (country IS NULL AND ? IS NULL)

                  )

                  AND email IS NOT NULL

                  AND email != ''

                  AND telephone IS NOT NULL

                  AND telephone != ''

                  AND (

                    latitude IS NULL

                    OR latitude = ''

                    OR longitude IS NULL

                    OR longitude = ''

                  )

              `,

              [
                loc.lat,

                loc.lng,

                u.city,

                u.state,

                u.state,

                u.country,

                u.country,
              ],

              (err, r) => {
                if (err) {
                  console.log(err);

                  return reject(err);
                }

                updated.push({
                  city: u.city,

                  state: u.state,

                  country: u.country,

                  latitude: loc.lat,

                  longitude: loc.lng,

                  affectedRows: r.affectedRows,
                });

                console.log(
                  "Updated:",

                  fullAddress,

                  "Rows:",

                  r.affectedRows,
                );

                resolve();
              },
            );
          });
        } catch (e) {
          console.log("Update Error:", e);
        }
      }

      // Nominatim rate limit safety

      await new Promise((r) => setTimeout(r, 1200));
    }

    return res.json({
      success: true,

      updatedCities: updated.length,

      data: updated,
    });
  });
});

router.get("/", (req, res) => {
  const db = req.app.get("db");

  const page = parseInt(req.query.page || 1);
  if (page > 8) {
  return res.json([]);
  }
  const limit = Math.min(parseInt(req.query.limit || 10), 60);
  const offset = (page - 1) * limit;

  const myId = parseInt(req.query.myId || 0);

  const lat = req.query.lat ? parseFloat(req.query.lat) : null;
  const lng = req.query.lng ? parseFloat(req.query.lng) : null;
  const hasLocation = lat !== null && lng !== null;
console.log({
  myId,
  page: page,
  limit,
  lat,
  lng,
});
  const sql = `
SELECT
    u.srno,
    u.name,
    TIMESTAMPDIFF(YEAR,u.dob,CURDATE()) AS age,
    u.city,
    u.mood,
    u.pic,
    u.status,
    u.online,
    u.onst,
    u.live_status,
    u.live_room,
    u.coins,
    u.fcm_token,

    CASE
        WHEN ? IS NULL THEN NULL
        ELSE ROUND(
            6371 * ACOS(
                COS(RADIANS(?))
                * COS(RADIANS(u.latitude))
                * COS(RADIANS(u.longitude) - RADIANS(?))
                + SIN(RADIANS(?))
                * SIN(RADIANS(u.latitude))
            ),1)
    END AS distance

FROM users u

LEFT JOIN ignorelist i
ON (
      (i.user=? AND i.user2=u.srno)
   OR (i.user=u.srno AND i.user2=?)
)

WHERE
    u.status='A'
    AND i.user IS NULL

ORDER BY

    (u.fcm_token IS NOT NULL AND u.fcm_token<>'') DESC,

    (u.coins>1) DESC,

    u.onst DESC,

    CASE
        WHEN ? IS NULL THEN 0
        ELSE distance
    END ASC,

    u.srno DESC

LIMIT ?
OFFSET ?;
`;

  db.query(
    sql,
    [
      lat,       // CASE
      lat,       // COS
      lng,       // LONG
      lat,       // SIN

      myId,
      myId,

      lat,

      limit,
      offset,
    ],
    (err, rows) => {
      if (err) {
        console.log(err);
        return res.status(500).json(err);
      }

      const users = rows.map((u) => ({
        id: u.srno,
        name: u.name,
        age: u.age,
        city: u.city,
        mood: u.mood,
        pic: u.status === "N" ? "" : u.pic,
        online: u.online,
        onst: u.onst,
        live_status: u.live_status,
        live_room: u.live_room,
        coins: u.coins,
        distance:
          u.distance === null ? null : `${u.distance} km`,
      }));

      res.json(users);
    }
  );
});

// =============================

// ✅ fetch Live User and rooms

// =============================

router.get("/live-users", verifyToken, (req, res) => {
  const db = req.app.get("db");

  const sql = `

    SELECT srno,name,pic,live_room 

    FROM users

    WHERE live_status = 1 `;

  db.query(sql, (err, result) => {
    if (err) return res.json(err);

    res.json(result);
  });
});

// =============================

// ✅ FILTER BY CITY

// =============================

router.get("/city/:city", verifyToken, (req, res) => {
  const db = req.app.get("db");

  const city = req.params.city;

  const sql = `

    SELECT srno, name, TIMESTAMPDIFF(YEAR, dob, CURDATE()) AS age, city, pic, online

    FROM users

    WHERE city = ?

    LIMIT 50

  `;

  db.query(sql, [city], (err, result) => {
    if (err) return res.json(err);

    res.json(result);
  });
});

//update location

router.post("/update-location", (req, res) => {
  const db = req.app.get("db");

  const { userId, lat, lng } = req.body;

  db.query(
    "UPDATE users SET latitude=?, longitude=? WHERE srno=?",

    [lat, lng, userId],

    () => res.json({ success: true }),
  );
});
//===========================
//update moods
//////////////////////////////
router.post("/update-mood", verifyToken, (req, res) => {

  const db = req.app.get("db");

  const { userId, mood } = req.body;
  if (!userId || !mood) {
    return res.json({
      success: false
    });
  }

  db.query(
    `
    UPDATE users
    SET mood=?, mood_updated_at=NOW()
    WHERE srno=?
    `,
    [mood, userId],
    (err) => {

      if (err) {
        console.log(err);

        return res.json({
          success: false
        });
      }

      res.json({
        success: true
      });

    }
  );
});

//==========================
//get nearwise same mood users
//==========================
router.get("/mood-users", verifyToken, (req, res) => {

  const db = req.app.get("db");

  const {
    myId,
    lat,
    lng,
    mood
  } = req.query;

  const sql = `
  
  SELECT
    srno,
    name,
    TIMESTAMPDIFF(YEAR, dob, CURDATE()) AS age,
    city,
    pic,
    mood,
    onst,

    (
      6371 * acos(
        cos(radians(?)) *
        cos(radians(latitude)) *
        cos(radians(longitude) - radians(?)) +
        sin(radians(?)) *
        sin(radians(latitude))
      )
    ) AS distance

  FROM users

  WHERE

    srno != ?
    AND mood = ?
    AND status='A'

  HAVING distance <= 50

  ORDER BY onst DESC, distance ASC

  LIMIT 50
  `;

  db.query(
    sql,
    [lat, lng, lat, myId, mood],
    (err, result) => {

      if (err) {
        console.log(err);
        return res.json([]);
      }

      res.json(result);

    }
  );

});

//=======================
//get coin api
//=========================
router.get("/coins/:id", (req, res) => {
  const db = req.app.get("db");

  const userId = req.params.id;

  db.query("SELECT coins FROM users WHERE srno=?", [userId], (err, rows) => {
    if (err) {
      return res.status(500).json({
        success: false,
      });
    }

    if (!rows.length) {
      return res.json({
        success: false,
      });
    }

    res.json({
      success: true,
      coins: rows[0].coins,
    });
  });
});
//===========================

//search api-----

//===========================

router.get("/search", verifyToken, (req, res) => {
  const q = req.query.q?.trim();

  const db = req.app.get("db");

  if (!q) {
    return res.json({
      success: true,

      users: [],
    });
  }

  db.query(
    `

    SELECT

      srno,

      name,

      user,

      email,

      pic

    FROM users

    WHERE

      name LIKE ?

      OR user LIKE ?

      OR email LIKE ?

    LIMIT 20

    `,

    [`%${q}%`, `%${q}%`, `%${q}%`],

    (err, rows) => {
      if (err) {
        console.log("SEARCH ERROR:", err);

        return res.status(500).json({
          success: false,

          message: "Server error",

          error: err.message,
        });
      }

      return res.json({
        success: true,

        users: rows,
      });
    },
  );
});

//my referer
router.get("/my-referrals", verifyToken, (req, res) => {
  const db = req.app.get("db");
   const userCode = req.user.id; // ya jo referral code field hai
  db.query(
    `
    SELECT
    srno,
    name,
    city,
    pic,
    date AS created_at,
    refcode
FROM users
WHERE refcode IN (
    ?,
    (SELECT user FROM users WHERE srno = ?)
)
ORDER BY srno DESC;
    `,
    [String(userCode),userCode],
    (err, rows) => {
      //console.log(rows);
      if (err) return res.status(500).json(err);
      res.json({
        success: true,
        total: rows.length,
        referrals: rows
      });
    }
  );
});

//rewards distribut referor ka :
router.get("/validate_referrals", (req, res) => {
  const db = req.app.get("db");
  console.log("validation start ---");
///AND c.l_dt >= UNIX_TIMESTAMP(
         ////   DATE_ADD(c.date, INTERVAL 2 DAY)
         // )
  db.query(
    `
    SELECT
      c.srno AS child_srno,
      c.refcode,
      p.srno AS parent_srno,
      p.user AS parent_code
    FROM users c
    INNER JOIN users p
      ON c.refcode = p.user
    WHERE
      c.email IS NOT NULL
      AND c.email <> ''
      AND c.l_dt <= UNIX_TIMESTAMP(CURDATE())      
    `,
    (err, rows) => {
      if (err) {
        console.error(err);
        return res.status(500).json(err);
      }

      if (!rows.length) {
        return res.json({
          success: true,
          processed: 0,
          message: "No eligible referrals found"
        });
      }

      let processed = 0; 

      rows.forEach((row) => {
        const parentSrno = row.parent_srno;
        const childSrno = row.child_srno;

        // 1. Parent ko 500 coins
        db.query(
          `
          UPDATE users
          SET coins = coins + 1000
          WHERE srno = ?
          `,
          [parentSrno]
        );
        // SAVE HISTORY
      // =========================
      const reward_value="ref_"+childSrno;
      db.query(
        `
        INSERT INTO rewards_history
        (
          user_id,
          reward_type,
          reward_value,
          coins,
          debit
        )
        VALUES (?,?,?,?,?)
        `,
        [parentSrno, "refer", reward_value, "1000","0"]
      );
        
        // 2. Child refcode ko parent srno me convert
        db.query(
          `
          UPDATE users
          SET refcode = ?
          WHERE srno = ?
          `,
          [parentSrno, childSrno]
        );

        processed++;
      });

      res.json({
        success: true,
        processed,
        message: `${processed} referrals validated successfully`
      });
    }
  );
});

// birthday user
router.get("/birthday-users", async (req, res) => {

  try {

    const db = req.app.get("db");

    const viewerId = req.query.myId;

    const sql = `
      SELECT 
        u.srno,
        u.name,
        u.pic,
        u.dob,
        TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) AS age

      FROM users u

      WHERE
        MONTH(u.dob) = MONTH(CURDATE())
        AND DAY(u.dob) = DAY(CURDATE())

        AND NOT EXISTS (
          SELECT 1
          FROM ignorelist i
          WHERE
            (i.user = ? AND i.user2 = u.srno)
            OR
            (i.user = u.srno AND i.user2 = ?)
        )

      ORDER BY RAND()

      LIMIT 10
    `;

    db.query(
      sql,
      [viewerId, viewerId],
      (err, result) => {

        if (err) {

          console.log(err);

          return res.status(500).json([]);

        }

        res.json(result);

      }
    );

  } catch (err) {

    console.log(err);

    res.status(500).json([]);

  }

});

// new user list with in 50KM Only
router.get("/new-users", async (req, res) => {

  try {

    const db = req.app.get("db");

    const viewerId = req.query.myId;

    // 🔥 get viewer location
    const userSql = `
      SELECT latitude, longitude
      FROM users
      WHERE srno = ?
      LIMIT 1
    `;

    db.query(userSql, [viewerId], (err, userResult) => {

      if (err || !userResult.length) {

        console.log(err);

        return res.status(500).json([]);

      }

      const myLat = userResult[0].latitude;
      const myLng = userResult[0].longitude;

      const sql = `

        SELECT
          u.srno,
          u.name,
          u.pic,
          u.dob,
          u.date,

          TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) AS age,

          (
            6371 * ACOS(
              COS(RADIANS(?))
              * COS(RADIANS(u.latitude))
              * COS(RADIANS(u.longitude) - RADIANS(?))
              + SIN(RADIANS(?))
              * SIN(RADIANS(u.latitude))
            )
          ) AS distance

        FROM users u

        WHERE

          u.srno != ?

          AND u.latitude IS NOT NULL
          AND u.longitude IS NOT NULL

          AND NOT EXISTS (
            SELECT 1
            FROM ignorelist i
            WHERE
              (i.user = ? AND i.user2 = u.srno)
              OR
              (i.user = u.srno AND i.user2 = ?)
          )

        HAVING distance <= 50

        ORDER BY u.srno DESC

        LIMIT 5
      `;

      db.query(
        sql,
        [
          myLat,
          myLng,
          myLat,
          viewerId,
          viewerId,
          viewerId
        ],
        (err, result) => {

          if (err) {

            console.log(err);

            return res.status(500).json([]);

          }

          res.json(result);

        }
      );

    });

  } catch (err) {

    console.log(err);

    res.status(500).json([]);

  }

});

// =============================

// ✅ USER PROFILE

// =============================

router.get("/:id", verifyToken, (req, res) => {
  //console.log("PROFILE API CALLED");

  const db = req.app.get("db");
console.log('profile api--');
  const profileId = parseInt(req.params.id) || 0;

  // 👁 current logged-in viewer

  const viewerId = parseInt(req.query.viewer) || 0;

  //console.log(profileId+'-----view---'+viewerId);

  // don't save self visit

  if (profileId !== viewerId) {
    const sql = `

    INSERT INTO myvisitor (user, visitor, time)

    VALUES (?, ?, UNIX_TIMESTAMP())

    ON DUPLICATE KEY UPDATE

    time = UNIX_TIMESTAMP()

  `;

    db.query(sql, [profileId, viewerId], (err) => {
      if (err) console.log(err);
    });
  }

  // if viewer not logged in

  if (!viewerId) {
    return res.json({
      success: false,

      message: "Invalid viewer",
    });
  }

  // =========================

  // 🚫 BLOCK CHECK

  // =========================

  const blockSql = `

    SELECT sr

    FROM ignorelist

    WHERE

    (user = ? AND user2 = ?)

    OR

    (user = ? AND user2 = ?)

  `;

  db.query(
    blockSql,

    [viewerId, profileId, profileId, viewerId],

    (blockErr, blockResult) => {
      if (blockErr) {
        console.log(blockErr);

        return res.json({
          success: false,
        });
      }

      // 🚫 BLOCKED

      if (blockResult.length > 0) {
        return res.json({
          blocked: true,
        });
      }

      // =========================

      // ✅ FETCH PROFILE

      // =========================

      const sql = `
         SELECT
    srno,
    name,
    sex,
    TIMESTAMPDIFF(
      YEAR,
      dob,
      CURDATE()
    ) AS age,
    city,
    country,
    height,
    weight,
    body_type,
    doingnow,
    relationship_goal,
    coins,
    language,
    mood,
    CASE
      WHEN status = 'N' THEN ''
      ELSE pic
    END AS pic,
    about,
    online,
    onst,
    live_status,
    live_room,
    insta 
  FROM users
  WHERE srno = ?

      `;

      db.query(sql, [profileId], (err, result) => {
        if (err) {
          console.log(err);

          return res.json({
            success: false,
          });
        }

        // ❌ USER NOT FOUND

        if (result.length === 0) {
          return res.json({
            success: false,

            message: "User not found",
          });
        }

        // ✅ SUCCESS

        res.json(result[0]);
      });
    },
  );
});
// visitor List

router.get("/my-visitors/:id", verifyToken, (req, res) => {
  const db = req.app.get("db");
  const userId = req.params.id;
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 10);
  const offset = (page - 1) * limit;
  const sql = `

    SELECT 

      mv.visitor AS userid,

       mv.time,

              DATE_FORMAT(FROM_UNIXTIME(mv.time),'%d %b %Y %h:%i %p') AS visit_date,

          CASE

            WHEN UNIX_TIMESTAMP() - mv.time < 60 THEN 'Just now'

            WHEN UNIX_TIMESTAMP() - mv.time < 3600  THEN CONCAT(FLOOR((UNIX_TIMESTAMP() - mv.time)/60),' min ago')

            WHEN UNIX_TIMESTAMP() - mv.time < 86400 THEN CONCAT(FLOOR((UNIX_TIMESTAMP() - mv.time)/3600),' hr ago')

            ELSE CONCAT(FLOOR((UNIX_TIMESTAMP() - mv.time)/86400), ' days ago' )

          END AS visited_ago ,

      u.name,

      u.pic

    FROM myvisitor mv

    JOIN users u ON u.srno = mv.visitor

    WHERE mv.user = ?

    ORDER BY mv.time DESC LIMIT ? OFFSET ?

  `;

  db.query(sql, [userId, limit, offset], (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,

        message: err.message,
      });
    }

    res.json({
      success: true,

      visitors: result,
    });
  });
});


// =============================

// 🖼️ Get user gallery

// =============================

router.get("/photogallery/:id", verifyToken, (req, res) => {
  const db = req.app.get("db");

  db.query(
    "SELECT id, url FROM user_photos WHERE user_id=?",

    [req.params.id],

    (err, result) => {
      if (err) return res.json(err);

      res.json(result);
    },
  );
});



export default router;
