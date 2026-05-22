import multer from "multer";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const UPLOAD_DIR =
  process.env.UPLOAD_DIR || "uploads";


// =========================
// AUTO CREATE DIRECTORY
// =========================
const ensureDir = (dir) => {

  if (!fs.existsSync(dir)) {

    fs.mkdirSync(dir, {
      recursive: true,
    });

  }

};


// =========================
// STORAGE
// =========================
const storage = multer.diskStorage({

  destination: (req, file, cb) => {

    let uploadPath = "";

    // 📖 STORIES
    if (req.body.type === "story") {

      uploadPath = path.join(
        UPLOAD_DIR,
        "stories"
      );

    }

    // 📝 POSTS
    else {

      uploadPath = path.join(
        UPLOAD_DIR,
        "posts"
      );

    }

    // ✅ CREATE FOLDER
    ensureDir(uploadPath);

    cb(null, uploadPath);

  },

  filename: (req, file, cb) => {

    // 🔒 SAFE EXTENSION
    const ext = path
      .extname(file.originalname)
      .toLowerCase();

    // 🔥 RANDOM FILE NAME
    const safeName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      ext;

    cb(null, safeName);

  },

});


// =========================
// ALLOWED TYPES
// =========================
const allowedMimeTypes = [

  // images
  "image/jpeg",
  "image/png",
  "image/webp",

  // video
  "video/mp4",

];


// =========================
// FILE FILTER
// =========================
const fileFilter = (
  req,
  file,
  cb
) => {

  // 🚫 INVALID TYPE
  if (
    !allowedMimeTypes.includes(
      file.mimetype
    )
  ) {

    return cb(
      new Error(
        "Only JPG, PNG, WEBP, MP4 allowed"
      )
    );

  }

  // 🚫 BLOCK DOUBLE EXTENSION
  const dangerous = [
    ".php",
    ".exe",
    ".js",
    ".html",
    ".sh",
  ];

  const ext = path
    .extname(file.originalname)
    .toLowerCase();

  if (dangerous.includes(ext)) {

    return cb(
      new Error("Blocked file")
    );

  }

  cb(null, true);

};


// =========================
// MULTER CONFIG
// =========================
const upload = multer({

  storage,

  fileFilter,

  limits: {

    // 15MB
    fileSize: 15 * 1024 * 1024,

  },

});

export default upload;