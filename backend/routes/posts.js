import express from "express";
import upload from "../middlewares/upload.js";
import { v2 as cloudinary } from "cloudinary";
import badWords from "../utils/badwords.js";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import streamifier from "streamifier";

dotenv.config();

const router = express.Router();

const UPLOAD_DIR =
  process.env.UPLOAD_DIR || "uploads";

const FILE_URL =  process.env.FILE_URL ||  `${process.env.BASE_URL}/uploads`;

// =============================
// CREATE POST on LOCAL server
// =============================
/*
router.post( "/create-post", upload.single("media"), (req, res) => {
    const db = req.app.get("db");
    const { user_id, content, } = req.body;

    let media = null;
    let media_type = null;

    if (req.file) {
      // SAVE FULL URL
      media =  `${FILE_URL}/posts/${req.file.filename}`;
      media_type =  req.file.mimetype.startsWith("video")
          ? "video"
          : "image";
    }
      // =============================
      // CHECK DAILY LIMIT
      // =============================
      const checkSql = `
        SELECT id
        FROM posts
        WHERE user_id = ?
        AND DATE(FROM_UNIXTIME(created_at)) = CURDATE()
      `;

      db.query( checkSql, [user_id],  (checkErr, checkRows) => {
          if (checkErr) {
            return res.status(500).json({
              success: false,
              message: "Database error"
            });
          }

          // ALREADY POSTED TODAY
          if (checkRows.length > 0) {
            return res.json({
              success: false,
              message: "You can post only once per day"
            });
          }

          const text1 = (content || "").toLowerCase();
          const found1 =  badWords.find(word => text1.includes(word));
          if (found1) {
            return res.json({
              success: false,
              message: "Inappropriate words not allowed"
            });
          }
          // INSERT POST
          const sql = `
            INSERT INTO posts (
              user_id,
              content,
              media,
              media_type,
              created_at
            )
            VALUES (?, ?, ?, ?, UNIX_TIMESTAMP())
          `;

          db.query(
            sql,
            [
              user_id,
              content,
              media,
              media_type,
            ],
            (err, result) => {

              if (err) {

                return res.status(500).json({
                  success: false,
                  message: err.message,
                });
              }

              res.json({
                success: true,
                post_id: result.insertId,
              });
            }
          );

        }
      );
   }
);
*/
///post media on claudy server 
router.post(
  "/create-post",
  upload.single("media"),
  async (req, res) => {

    const db = req.app.get("db");

    const {
      user_id,
      content,
    } = req.body;

    let media = null;
    let media_type = null;

    try {

      // =============================
      // ☁️ UPLOAD TO CLOUDINARY
      // =============================
      if (req.file) {
console.log(req.file);
console.log(process.env.CLOUDINARY_CLOUD_NAME);
 /*  const result = await cloudinary.uploader.upload(
  req.file.path,
  {
    folder: "indiandost/posts",

    resource_type:
      req.file.mimetype.startsWith("video")
        ? "video"
        : "image",
      timeout: 120000,
      chunk_size: 6000000,

    use_filename: true,
    unique_filename: true,
    overwrite: false,
  }
);
*/

const result = await new Promise((resolve, reject) => {

  const stream = cloudinary.uploader.upload_stream(
    {
      folder: "indiandost/posts",

      resource_type:
        req.file.mimetype.startsWith("video")
          ? "video"
          : "image",

      timeout: 120000,
    },

    (error, result) => {

      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    }
  );

  streamifier
    .createReadStream(req.file.buffer)
    .pipe(stream);
});
if (req.file?.path && fs.existsSync(req.file.path)) {
  fs.unlinkSync(req.file.path);
}
console.log(result);

        // 🚫 BLOCK ADULT CONTENT
        if (
          result.moderation &&
          result.moderation[0] &&
          result.moderation[0].status === "rejected"
        ) {

          return res.json({
            success: false,
            message: "Adult / nude content not allowed ❌",
          });
        }

        // ✅ CLOUDINARY URL
        media = result.secure_url;

        media_type =
          req.file.mimetype.startsWith("video")
            ? "video"
            : "image";
      }

      // =============================
      // CHECK DAILY LIMIT
      // =============================
      const checkSql = `
        SELECT id
        FROM posts
        WHERE user_id = ?
        AND DATE(FROM_UNIXTIME(created_at)) = CURDATE()
      `;

      db.query(
        checkSql,
        [user_id],
        (checkErr, checkRows) => {

          if (checkErr) {

            return res.status(500).json({
              success: false,
              message: "Database error"
            });
          }

          // 🚫 ONLY 1 POST DAILY
          if (checkRows.length > 0) {

            return res.json({
              success: false,
              message: "You can post only once per day"
            });
          }

          // =============================
          // BAD WORD FILTER
          // =============================
          const text1 = (content || "").toLowerCase();
          const found1 =  badWords.find(word => text1.includes(word));
          if (found1) {
            return res.json({
              success: false,
              message: "Inappropriate words not allowed"
            });
          }

          // =============================
          // SAVE POST
          // =============================
          const sql = `
            INSERT INTO posts (
              user_id,
              content,
              media,
              media_type,
              created_at
            )
            VALUES (?, ?, ?, ?, UNIX_TIMESTAMP())
          `;

          db.query(
            sql,
            [
              user_id,
              content,
              media,
              media_type,
            ],
            (err, result) => {

              if (err) {

                return res.status(500).json({
                  success: false,
                  message: err.message,
                });
              }

              res.json({
                success: true,
                post_id: result.insertId,
                media,
              });
            }
          );

        }
      );

} catch (err) {

  console.log("===== CLOUDINARY ERROR =====");

  console.log(err);

  console.log(err.message);

  console.log("============================");

  return res.status(500).json({
    success: false,
    error: err.message,
  });
}
  }
);
// =============================
// DELETE POST
// =============================
router.delete("/delete-post/:id/:user", (req, res) => {

    const db = req.app.get("db");

    const postId = req.params.id;
    const userId = req.params.user;

    // FIRST VERIFY OWNER
    const checkSql = `
      SELECT *
      FROM posts
      WHERE id = ?
      AND user_id = ?
    `;

    db.query(
      checkSql,
      [postId, userId],
      (checkErr, checkRows) => {

        if (checkErr) {

          return res.status(500).json({
            success: false
          });
        }

        if (checkRows.length === 0) {

          return res.json({
            success: false,
            message: "Unauthorized"
          });
        }
     //media delete    
      const post = checkRows[0];
     /*//local delete code 
     //  if (post.media) {
        const url = new URL(post.media);
        const filePath = path.join(process.cwd(), url.pathname);
          fs.unlink(filePath, (err) => {
            if (err) {
              console.log("File delete error:", err.message);
            }
          });
        }
       */
      //claudy delete code
// ==========================
// DELETE CLOUDINARY MEDIA
// ==========================
        if (post.media) {
          try {
            const parts = post.media.split("/");
            // last part => abc123.jpg
            const fileName = parts[parts.length - 1];
            // remove extension
            const publicIdWithoutExt = fileName.substring(0, fileName.lastIndexOf("."));
            // full cloudinary public id
            const publicId =  `indiandost/posts/${publicIdWithoutExt}`;
            console.log("🗑️ Delete:", publicId);
            cloudinary.uploader.destroy(publicId, {
                resource_type:
                  post.media_type === "video"
                    ? "video"
                    : "image",
              }
            )
            .then(result => {
              console.log("✅ Cloudinary deleted:", result);
            })
            .catch(err => {
              console.log("❌ Cloudinary delete error:", err);
            });
          } catch (err) {
            console.log(
              "Cloudinary delete error:",
              err
            );
          }
        }
      
        // DELETE COMMENTS
        db.query(
          "DELETE FROM post_comments WHERE post_id = ?",
          [postId]
        );

        // DELETE REACTIONS
        db.query(
          "DELETE FROM post_reactions WHERE post_id = ?",
          [postId]
        );

        // DELETE POST
        db.query(
          "DELETE FROM posts WHERE id = ?",
          [postId],
          (err) => {

            if (err) {

              return res.status(500).json({
                success: false
              });
            }

            res.json({
              success: true
            });
          }
        );

      }
    );
  }
);

// =============================
// GET FEED
// =============================
router.get("/feed", (req, res) => {

  const db = req.app.get("db");

  const viewer = Number(req.query.viewer) || 0;

  const page = Number(req.query.page) || 1;
  const limit = 3; // 🔥 change to 10 later
  const offset = (page - 1) * limit;

  const sql = `
    SELECT
      p.*,
      u.srno,
      u.name,
      u.pic,

      (SELECT COUNT(*)
       FROM post_reactions pr
       WHERE pr.post_id = p.id
      ) AS reactions,

      (SELECT COUNT(*)
       FROM post_comments pc
       WHERE pc.post_id = p.id
      ) AS comments,

      EXISTS (
        SELECT 1
        FROM post_reactions pr2
        WHERE pr2.post_id = p.id
        AND pr2.user_id = ?
      ) AS reacted

    FROM posts p

    JOIN users u ON u.srno = p.user_id

    ORDER BY p.id DESC

    LIMIT ? OFFSET ?
  `;

  db.query(sql, [viewer, limit, offset], (err, rows) => {

    if (err) {
      console.log(err);
      return res.status(500).json({
        success: false,
        message: "Server error"
      });
    }

    res.json({
      success: true,
      posts: rows,
      page,
      hasMore: rows.length === limit
    });
  });
});
// =============================
// REACT POST
// =============================
router.post("/react-post", (req, res) => {

  const db = req.app.get("db");

  const {
    post_id,
    user_id,
    reaction,
  } = req.body;

  const sql = `
    INSERT INTO post_reactions (
      post_id,
      user_id,
      reaction,
      created_at
    )
    VALUES (?, ?, ?, UNIX_TIMESTAMP())

    ON DUPLICATE KEY UPDATE
    reaction = VALUES(reaction)
  `;

  db.query(
    sql,
    [post_id, user_id, reaction],
    (err, result) => {

      if (err) {

        console.log(err);

        return res.status(500).json({
          success: false,
          message: err.message,
        });
      }

      res.json({
        success: true,
      });
    }
  );
});
//who liked post
// =============================
// GET POST LIKES
// =============================
router.get("/post-likes/:postId", (req, res) => {

  const db = req.app.get("db");

  const sql = `
    SELECT
      pr.*,
      u.srno,
      u.name,
      u.pic

    FROM post_reactions pr

    JOIN users u
    ON u.srno = pr.user_id

    WHERE pr.post_id = ?

    ORDER BY pr.id DESC
  `;

  db.query(
    sql,
    [req.params.postId],
    (err, rows) => {

      if (err) {

        console.log(err);

        return res.status(500).json({
          success: false
        });
      }

      res.json({
        success: true,
        likes: rows
      });
    }
  );
});

router.get("/post/:id", (req, res) => {

  const db = req.app.get("db");

  const viewer = Number(req.query.viewer) || 0;
  const postId = Number(req.params.id);

  if (!postId) {
    return res.json({
      success: false
    });
  }

  const sql = `
    SELECT
      p.*,
      u.srno,
      u.name,
      u.pic,

      (
        SELECT COUNT(*)
        FROM post_reactions pr
        WHERE pr.post_id = p.id
      ) AS reactions,

      (
        SELECT COUNT(*)
        FROM post_comments pc
        WHERE pc.post_id = p.id
      ) AS comments,

      EXISTS (
        SELECT 1
        FROM post_reactions pr2
        WHERE pr2.post_id = p.id
        AND pr2.user_id = ?
      ) AS reacted

    FROM posts p

    JOIN users u
    ON u.srno = p.user_id

    WHERE p.id = ?

    LIMIT 1
  `;

  db.query(
    sql,
    [viewer, postId],
    (err, result) => {

      if (err) {
        console.log(err);

        return res.status(500).json({
          success: false,
          error: err
        });
      }

      if (result.length === 0) {
        return res.json({
          success: false,
          message: "Post not found"
        });
      }

      res.json({
        success: true,
        post: result[0]
      });
    }
  );

});
// =============================
// COMMENT POST
// =============================
router.post("/comment-post", (req, res) => {

  const db = req.app.get("db");

  const { post_id,  user_id,  comment, } = req.body;

  
          const text = (comment || "").toLowerCase();
          const found =  badWords.find(word => text.includes(word) );
          if (found) {
            return res.json({
              success: false,
              message: "Inappropriate words not allowed"
            });
          }

  const sql = `
    INSERT INTO post_comments (
      post_id,
      user_id,
      comment,
      created_at
    )
    VALUES (?, ?, ?, UNIX_TIMESTAMP())
  `;

  db.query(
    sql,
    [post_id, user_id, comment],
    (err) => {

      if (err) {

        console.log(err);

        return res.status(500).json({
          success: false,
        });
      }

      res.json({
        success: true,
      });
    }
  );
});
//comment view
router.get("/comments/:post_id", (req, res) => {

  const db = req.app.get("db");

  const sql = `
    SELECT
  pc.*,
  u.srno,
  u.name,
  u.pic,
  FROM_UNIXTIME(pc.created_at) as created_at
FROM post_comments pc
JOIN users u
ON u.srno = pc.user_id
WHERE pc.post_id = ?
ORDER BY pc.id DESC
  `;

  db.query(
    sql,
    [req.params.post_id],
    (err, rows) => {

      if (err) {

        return res.status(500).json({
          success: false,
        });
      }

      res.json({
        success: true,
        comments: rows,
      });
    }
  );
});

// =============================
// CREATE STORY
// =============================
router.post(
  "/create-story",
  upload.single("media"),
  async (req, res) => {

    const db = req.app.get("db");

    const {
      user_id,
    } = req.body;

    let media = null;
    let media_type = null;

    try {

      // =============================
      // MEDIA REQUIRED
      // =============================
      if (!req.file) {

        return res.json({
          success: false,
          message: "Media required",
        });
      }

      // =============================
      // ☁️ UPLOAD TO CLOUDINARY
      // =============================
      console.log(req.file);

      const result = await new Promise((resolve, reject) => {

        const stream = cloudinary.uploader.upload_stream(

          {
            folder: "indiandost/stories",

            resource_type:
              req.file.mimetype.startsWith("video")
                ? "video"
                : "image",

            timeout: 120000,
          },

          (error, result) => {

            if (error) {

              reject(error);

            } else {

              resolve(result);
            }
          }
        );

        streamifier
          .createReadStream(req.file.buffer)
          .pipe(stream);

      });

      console.log(result);

      // =============================
      // 🚫 BLOCK ADULT CONTENT
      // =============================
      if (
        result.moderation &&
        result.moderation[0] &&
        result.moderation[0].status === "rejected"
      ) {

        return res.json({
          success: false,
          message: "Adult / nude content not allowed ❌",
        });
      }

      // =============================
      // SAVE CLOUDINARY URL
      // =============================
      media = result.secure_url;

      media_type =
        req.file.mimetype.startsWith("video")
          ? "video"
          : "image";

      // =============================
      // STORY TIME
      // =============================
      const now =
        Math.floor(Date.now() / 1000);

      const expires =
        now + (24 * 60 * 60);

      // =============================
      // OPTIONAL:
      // DELETE OLD STORY OF USER
      // (only 1 active story)
      // =============================
      /*
      await new Promise((resolve, reject) => {

        db.query(
          `
          DELETE FROM stories
          WHERE user_id = ?
          `,
          [user_id],
          (err) => {

            if (err) {
              reject(err);
            } else {
              resolve();
            }
          }
        );

      });
      */

      // =============================
      // SAVE STORY
      // =============================
      const sql = `
        INSERT INTO stories (
          user_id,
          media,
          media_type,
          created_at,
          expires_at
        )
        VALUES (?, ?, ?, ?, ?)
      `;

      db.query(
        sql,
        [
          user_id,
          media,
          media_type,
          now,
          expires,
        ],
        (err, result2) => {

          if (err) {

            console.log(err);

            return res.status(500).json({
              success: false,
              error: err.message,
            });
          }

          return res.json({
            success: true,
            story_id: result2.insertId,
            media,
          });
        }
      );

    } catch (err) {

      console.log("===== STORY CLOUDINARY ERROR =====");

      console.log(err);

      console.log(err.message);

      console.log("============================");

      return res.status(500).json({
        success: false,
        error: err.message,
      });
    }
  }
);
// =============================
// GET STORIES
// =============================
router.get("/stories", (req, res) => {

  const db = req.app.get("db");

  const now =
    Math.floor(Date.now() / 1000);

  const sql = `
    SELECT
      s.*,
      u.name,
      u.srno,
      u.pic AS photo
    FROM stories s

    JOIN users u
    ON u.srno = s.user_id

    WHERE s.expires_at > ?

    ORDER BY s.id DESC
  `;

  db.query(
    sql,
    [now],
    (err, rows) => {

      if (err) {

        console.log(err);

        return res.status(500).json({
          success: false
        });
      }

      return res.json({
        success: true,
        data: rows
      });
    }
  );
});

export default router;