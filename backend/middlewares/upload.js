import multer from "multer";

const storage = multer.memoryStorage();

const upload = multer({

  storage,

  limits: {
    fileSize: 15 * 1024 * 1024,
  },

  fileFilter: (req, file, cb) => {

    const allowed = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "video/mp4",
    ];

    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type"));
    }
  },
});

export default upload;
/*import multer from "multer";

import {
  CloudinaryStorage,
} from "multer-storage-cloudinary";

import cloudinary
from "../config/cloudinary.js";

// =========================
// CLOUDINARY STORAGE
// =========================
const storage =
  new CloudinaryStorage({

    cloudinary,

    params: async (req, file) => {

      const isVideo =
        file.mimetype.startsWith(
          "video"
        );

      return {

        folder:
          req.body.folder ||
          "indiandost",

        // ✅ IMPORTANT FIX
        resource_type: "auto",

        allowed_formats: isVideo
          ? [
              "mp4",
              "mov",
              "webm",
            ]
          : [
              "jpg",
              "jpeg",
              "png",
              "webp",
            ],

      };

    },

  });

// =========================
// FILE FILTER
// =========================
const fileFilter = (
  req,
  file,
  cb
) => {

  const allowed = [

    // images
    "image/jpeg",
    "image/png",
    "image/webp",

    // videos
    "video/mp4",
    "video/webm",
    "video/quicktime",

  ];

  if (
    !allowed.includes(
      file.mimetype
    )
  ) {

    return cb(
      new Error(
        "Invalid file type"
      )
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
      fileSize: 10 * 1024 * 1024,
  },

});

export default upload;
*/