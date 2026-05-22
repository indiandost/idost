import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import sharp from "sharp";
import dotenv from "dotenv";
import upload from "../middlewares/upload.js";
import cloudinary from "../config/cloudinary.js";
dotenv.config();

const router = express.Router();
// =============================
// 📥 Upload SINGLE profile pic
// =============================
router.post(
  "/upload/:id",
  upload.single("photo"),
  async (req, res) => {

    const db = req.app.get("db");
    const userId = req.params.id;

    try {

      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: "No file uploaded",
        });
      }

      // ✅ Cloudinary image URL
      const fileUrl = req.file.path;

      // =============================
      // DELETE OLD PROFILE PIC
      // =============================
      db.query(
        "SELECT pic FROM users WHERE srno=?",
        [userId],
        async (err, rows) => {

          if (!err && rows.length > 0 && rows[0].pic) {

            try {

              const oldUrl = rows[0].pic;

              // extract public_id
              const parts = oldUrl.split("/");
              const fileName =
                parts[parts.length - 1].split(".")[0];

              const folder =
                parts[parts.length - 2];

              const publicId =
                `${folder}/${fileName}`;

              await cloudinary.uploader.destroy(
                publicId
              );

            } catch (e) {
              console.log(
                "Old image delete error:",
                e.message
              );
            }
          }

          // =============================
          // UPDATE PROFILE PIC
          // =============================
          db.query(
            "UPDATE users SET pic=? WHERE srno=?",
            [fileUrl, userId],
            (err2) => {

              if (err2) {
                console.log(err2);

                return res.status(500).json({
                  success: false,
                });
              }

              res.json({
                success: true,
                pic: fileUrl,
              });

            }
          );

        }
      );

    } catch (err) {

      console.log(err);

      res.status(500).json({
        success: false,
      });

    }

  }
);

// =============================
// 📥 Upload MULTIPLE PHOTOS
// =============================
router.post(
  "/upload-multiple/:id",
  upload.array("photos", 5),
  async (req, res) => {

    const db = req.app.get("db");
    const userId = req.params.id;

    try {

      if (!req.files || req.files.length === 0) {

        return res.status(400).json({
          success: false,
          error: "No files uploaded",
        });

      }

      // =============================
      // SAVE ALL IMAGE URLS
      // =============================
      for (const file of req.files) {

        const imageUrl = file.path;

        db.query(
          "INSERT INTO user_photos (user_id, url) VALUES (?, ?)",
          [userId, imageUrl]
        );

      }

      res.json({
        success: true,
      });

    } catch (err) {

      console.log(err);

      res.status(500).json({
        success: false,
      });

    }

  }
);


/*import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import sharp from "sharp";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

// =============================
// 📁 ENV CONFIG
// =============================
const UPLOAD_DIR = process.env.UPLOAD_DIR || "uploads";
const FILE_URL =  process.env.FILE_URL || `${process.env.BASE_URL}/uploads`;

// ensure folders exist
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}
if (!fs.existsSync(path.join(UPLOAD_DIR, "tmp"))) {
  fs.mkdirSync(path.join(UPLOAD_DIR, "tmp"), { recursive: true });
}

// =============================
// 📦 Multer temp storage
// =============================
const upload = multer({
  dest: path.join(UPLOAD_DIR, "tmp"),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});

// =============================
// 📥 Upload SINGLE profile pic
// =============================
router.post("/upload/:id", upload.single("photo"), async (req, res) => {
  const db = req.app.get("db");
  const userId = req.params.id;

  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: "No file" });
    }

    const inputPath = req.file.path;
    const fileName = Date.now() + ".jpg";
    const outputPath = path.join(UPLOAD_DIR, fileName);

    // 🔥 resize + crop
    await sharp(inputPath)
      .resize(400, 500, { fit: "cover" })
      .jpeg({ quality: 80 })
      .toFile(outputPath);

    // delete temp file
    fs.unlinkSync(inputPath);

    const fileUrl = `${FILE_URL}/${fileName}`;

    // update main profile pic
    db.query(
      "UPDATE users SET pic=? WHERE srno=?",
      [fileUrl, userId]
    );

    res.json({ success: true, pic: fileUrl });

  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false });
  }
});

// =============================
// 📥 Upload MULTIPLE photos
// =============================
router.post(
  "/upload-multiple/:id",
  upload.array("photos", 5),
  async (req, res) => {
    const db = req.app.get("db");
    const userId = req.params.id;

    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ success: false });
      }

      for (const file of req.files) {
        const fileName =
          Date.now() + "-" + Math.floor(Math.random() * 10000) + ".jpg";

        const outputPath = path.join(UPLOAD_DIR, fileName);

        await sharp(file.path)
          .resize(400, 500, { fit: "cover" })
          .jpeg({ quality: 80 })
          .toFile(outputPath);

        fs.unlinkSync(file.path);

        const url = `${FILE_URL}/${fileName}`;

        db.query(
          "INSERT INTO user_photos (user_id, url) VALUES (?, ?)",
          [userId, url]
        );
      }

      res.json({ success: true });

    } catch (err) {
      console.log(err);
      res.status(500).json({ success: false });
    }
  }
);
*/
// =============================
// 👤 Get My Profile
// =============================
router.get("/me/:id", (req, res) => {
  const db = req.app.get("db");
  const id = req.params.id;

  const sql = `
    SELECT 
      srno,
      name,
      city,
      pic,
      dob,
      about,
      telephone,
      email,
      online,
      doingnow,
      sex,
      relationship_goal,
      language,
      TIMESTAMPDIFF(YEAR, dob, CURDATE()) AS age
    FROM users WHERE srno=?
  `;

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.log(err);

      return res.status(500).json({
        success: false,
        error: err.message
      });
    }

    console.log(result[0]);

    return res.json(result[0]);
  });
});

// =============================
// 🖼️ Get user gallery
// =============================
router.get("/photos/:id", (req, res) => {
  const db = req.app.get("db");

  db.query(
    "SELECT id, url FROM user_photos WHERE user_id=?",
    [req.params.id],
    (err, result) => {
      if (err) return res.json(err);
      res.json(result);
    }
  );
});

// =============================
// ⭐ Set main profile pic
// =============================
router.post("/set-main/:id", (req, res) => {
  const db = req.app.get("db");
  const { url } = req.body;

  db.query(
    "UPDATE users SET pic=? WHERE srno=?",
    [url, req.params.id],
    () => res.json({ success: true })
  );
});

// =============================
// ❌ Delete photo
// =============================
router.delete("/delete-photo/:photoId", async (req, res) => {

  const db = req.app.get("db");
  const photoId = req.params.photoId;

  db.query(
    "SELECT url FROM user_photos WHERE id=?",
    [photoId],

    async (err, result) => {

      if (err || result.length === 0) {

        return res.json({
          success: false,
        });

      }

      // =============================
      // DELETE FROM CLOUDINARY
      // =============================
      const url = result[0].url;

      try {

        const parts = url.split("/");

        const file =
          parts[parts.length - 1];

        const folder =
          parts[parts.length - 2];

        const publicId =
          `${folder}/${file.split(".")[0]}`;

        await cloudinary.uploader.destroy(
          publicId
        );

        console.log(
          "✅ Cloudinary image deleted"
        );

      } catch (err) {

        console.log(
          "❌ Cloudinary delete error:",
          err.message
        );

      }

      // =============================
      // DELETE DB RECORD
      // =============================
      db.query(
        "DELETE FROM user_photos WHERE id=?",
        [photoId],

        (deleteErr) => {

          if (deleteErr) {

            return res.json({
              success: false,
            });

          }

          res.json({
            success: true,
          });

        }
      );

    }
  );

});

router.post("/update/:id", async (req, res) => {
    const db = req.app.get("db");
    const {
      name,
      dob,
      city,
      about,
      telephone,
      email,
      online,
      doingnow,
      sex,
      relationship_goal,
      language
    } = req.body;

    db.query(`
      UPDATE users SET
        name=?,
        dob=?,
        city=?,
        about=?,
        telephone=?,
        email=?,
        online=?,
        doingnow=?,
        sex=?,
        relationship_goal=?,
        language=?
      WHERE srno=?
    `, [
      name,
      dob,
      city,
      about,
      telephone,
      email,
      online,
      doingnow,
      sex,
      relationship_goal,
      language,
      req.params.id
    ], (err, result) => {

      if (err) {
        console.log(err);

        return res.status(500).json({
          success: false,
          error: err.message
        });
      }

  res.json({
    success: true
  });

});

});

export default router;