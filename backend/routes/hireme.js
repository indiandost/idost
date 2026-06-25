import express from "express";

import fetch from "node-fetch";
import { verifyToken } from "../middlewares/auth.js";
import upload from "../middlewares/upload.js";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import streamifier from "streamifier";
const router = express.Router();
dotenv.config();

// ========================
// Helper Functions
// ========================
const getPublicIdFromUrl = (url) => {
  if (!url) return null;

  const uploadIndex = url.indexOf("/upload/");
  if (uploadIndex === -1) return null;

  let publicId = url.substring(uploadIndex + 8);

  publicId = publicId.replace(/^v\d+\//, "");
  publicId = publicId.replace(/\.[^/.]+$/, "");

  return publicId;
};
const deleteCloudinaryFile = async (url) => {
  const publicId = getPublicIdFromUrl(url);
  console.log("URL:", url);
  console.log("PUBLIC ID:", publicId);

  if (!publicId) return;
  try {
    const result =  await cloudinary.uploader.destroy(publicId);
    console.log("DELETE RESULT:", result);
  } catch (err) {
    console.error("DELETE ERROR:", err);
  }
};

const UPLOAD_DIR =
  process.env.UPLOAD_DIR || "uploads";

const FILE_URL =  process.env.FILE_URL ||  `${process.env.BASE_URL}/uploads`;
router.post("/enroll", verifyToken, (req, res) => {
    const db = req.app.get("db");
    const userId = req.user.id;

    const {
        service_category,
        service_title,
        rate_type,
        rate_amount,
        description,
        transaction_id,
        payment_verify_option,
        agreement_accepted
    } = req.body;

    if (!agreement_accepted) {
        return res.status(400).json({
            success: false,
            message: "Please accept agreement"
        });
    }

    if (
        !payment_verify_option ||
        !["now", "later"].includes(payment_verify_option)
    ) {
        return res.status(400).json({
            success: false,
            message: "Invalid payment option"
        });
    }

    if (!service_category?.trim()) {
        return res.status(400).json({
            success: false,
            message: "Service category required"
        });
    }

    if (!service_title?.trim()) {
        return res.status(400).json({
            success: false,
            message: "Service title required"
        });
    }

    if (!description?.trim()) {
        return res.status(400).json({
            success: false,
            message: "Description required"
        });
    }

    if (!rate_amount || Number(rate_amount) <= 0) {
        return res.status(400).json({
            success: false,
            message: "Valid price required"
        });
    }

    // ONLY FOR VERIFY NOW
    /* if (
       payment_verify_option === "now" &&
       !transaction_id?.trim()
     ) {
       return res.status(400).json({
         success: false,
         message: "Transaction ID required"
       });
     }*/

    const checkSql = `
    SELECT id
    FROM hire_me_profiles
    WHERE user_id=?
    LIMIT 1
  `;

    db.query(checkSql, [userId], (err, rows) => {

        if (err) {
            return res.status(500).json({
                success: false,
                message: err.message
            });
        }

        if (rows.length) {
            return res.status(400).json({
                success: false,
                message: "Already enrolled"
            });
        }

        const sql = `
      INSERT INTO hire_me_profiles
      (
        user_id,
        service_category,
        service_title,
        rate_type,
        rate_amount,
        description,
        transaction_id,
        payment_verify_option,
        agreement_accepted,
        payment_status,
        profile_status
      )
      VALUES
      (
        ?,?,?,?,?,?,
        ?,?,?,?,
        ?
      )
    `;

        db.query(
            sql,
            [
                userId,
                service_category,
                service_title,
                rate_type,
                rate_amount,
                description,
                transaction_id || "",
                payment_verify_option,
                1,
                payment_verify_option === "now" ?
                "Pending" :
                "Not Submitted",
                "Pending"
            ],
            (err, result) => {

                if (err) {
                    return res.status(500).json({
                        success: false,
                        message: err.message
                    });
                }

                return res.json({
                    success: true,
                    profileId: result.insertId,
                    message: payment_verify_option ===
                        "now" ?
                        "Enrollment submitted. Payment verification pending." :
                        "Enrollment submitted. You can upload payment details later."
                });

            }
        );

    });

});

router.post(
    "/submit-payment",
    verifyToken,
    upload.single("payment_screenshot"),
    async (req, res) => {

        try {
            const db = req.app.get("db");
            const userId = req.user.id;
            const {
                transaction_id
            } = req.body;

            if (!transaction_id?.trim()) {
                return res.status(400).json({
                    success: false,
                    message: "Transaction ID required"
                });
            }
            if (!req.file) {
              return res.status(400).json({
                success:false,
                message:"Payment screenshot required"
              });
            }
            let paymentScreenshotUrl = null;

            if (req.file) {

                paymentScreenshotUrl =
                    await new Promise((resolve, reject) => {

                        const stream =
                            cloudinary.uploader.upload_stream({
                                    folder: "hireme/payment",
                                    resource_type: "auto"
                                },
                                (error, result) => {

                                    if (error)
                                        reject(error);
                                    else
                                        resolve(result.secure_url);

                                }
                            );

                        streamifier
                            .createReadStream(req.file.buffer)
                            .pipe(stream);

                    });

            }

            const sql = `
        UPDATE hire_me_profiles
        SET
          transaction_id=?,
          payment_screenshot=?,
          payment_status='Pending',
          updated_at=NOW()
        WHERE user_id=?
      `;

            db.query(
                sql,
                [
                    transaction_id,
                    paymentScreenshotUrl,
                    userId
                ],
                (err) => {

                    if (err) {
                        return res.status(500).json({
                            success: false,
                            message: err.message
                        });
                    }

                    return res.json({
                        success: true,
                        message: "Payment submitted successfully"
                    });

                }
            );

        } catch (err) {

            return res.status(500).json({
                success: false,
                message: err.message
            });

        }

    }
);

router.post(
    "/upload-documents",
    verifyToken,
    upload.fields([{
            name: "service_photo",
            maxCount: 1
        },
        {
            name: "govt_front",
            maxCount: 1
        },
        {
            name: "govt_back",
            maxCount: 1
        },
        {
            name: "payment_screenshot",
            maxCount: 1
        }
    ]),
    async (req, res) => {

        try {
            const db = req.app.get("db");
            const userId = req.user.id;

           const profileCheckSql = `
SELECT
  id,
  service_photo,
  govt_id_front,
  govt_id_back
FROM hire_me_profiles
WHERE user_id=?
LIMIT 1
`;

            db.query(
                profileCheckSql,
                [userId],
                async (checkErr, rows) => {

                    if (checkErr) {
                        return res.status(500).json({
                            success: false,
                            message: checkErr.message
                        });
                    }

                    if (!rows.length) {
                        return res.status(404).json({
                            success: false,
                            message: "Enrollment not found"
                        });
                    }

                    try {
                        const profile = rows[0];
                        const uploadToCloudinary = (
                            fileBuffer,
                            folder
                        ) => {

                            return new Promise(
                                (resolve, reject) => {

                                    const stream =
                                        cloudinary
                                        .uploader
                                        .upload_stream({
                                                folder,
                                                resource_type: "auto"
                                            },
                                            (error,
                                                result
                                            ) => {

                                                if (
                                                    error
                                                )
                                                    reject(
                                                        error
                                                    );
                                                else
                                                    resolve(
                                                        result
                                                        .secure_url
                                                    );

                                            }
                                        );

                                    streamifier
                                        .createReadStream(
                                            fileBuffer
                                        )
                                        .pipe(stream);

                                }
                            );

                        };

                        let servicePhotoUrl = null;
                        let govtFrontUrl = null;
                        let govtBackUrl = null;
                        let paymentScreenshotUrl = null;

                        // Service Photo

                        if (
                            req.files?.service_photo?.[0]
                        ) {
await deleteCloudinaryFile(
  profile.service_photo
);
                            servicePhotoUrl =
                                await uploadToCloudinary(
                                    req.files
                                    .service_photo[0]
                                    .buffer,
                                    "hireme/service"
                                );

                        }

                        // Govt Front

                        if (
                            req.files?.govt_front?.[0]
                        ) {
await deleteCloudinaryFile(
  profile.govt_id_front
);
                            govtFrontUrl =
                                await uploadToCloudinary(
                                    req.files
                                    .govt_front[0]
                                    .buffer,
                                    "hireme/govt"
                                );

                        }

                        // Govt Back

                        if (
                            req.files?.govt_back?.[0]
                        ) {
await deleteCloudinaryFile(
  profile.govt_id_back
);
                            govtBackUrl =
                                await uploadToCloudinary(
                                    req.files
                                    .govt_back[0]
                                    .buffer,
                                    "hireme/govt"
                                );

                        }

                        // Payment Screenshot

                        if (
                            req.files?.payment_screenshot?.[0]
                        ) {

                            paymentScreenshotUrl =
                                await uploadToCloudinary(
                                    req.files
                                    .payment_screenshot[0]
                                    .buffer,
                                    "hireme/payment"
                                );

                        }

                        const govt_id_type =
                            req.body.govt_id_type || "";

                        const sql = `
              UPDATE hire_me_profiles
              SET

                service_photo =
                COALESCE(
                  ?,
                  service_photo
                ),

                govt_id_type = ?,

                govt_id_front =
                COALESCE(
                  ?,
                  govt_id_front
                ),

                govt_id_back =
                COALESCE(
                  ?,
                  govt_id_back
                ),

                payment_screenshot =
                COALESCE(
                  ?,
                  payment_screenshot
                ),

                updated_at = NOW()

              WHERE user_id = ?
            `;

                        db.query(
                            sql,
                            [
                                servicePhotoUrl,
                                govt_id_type,
                                govtFrontUrl,
                                govtBackUrl,
                                paymentScreenshotUrl,
                                userId
                            ],
                            (err) => {

                                if (err) {

                                    console.error(err);

                                    return res.status(500)
                                        .json({
                                            success: false,
                                            message: err
                                                .message
                                        });

                                }

                                return res.json({
                                    success: true,
                                    message: "Documents uploaded successfully",

                                    data: {
                                        servicePhotoUrl,
                                        govtFrontUrl,
                                        govtBackUrl,
                                        paymentScreenshotUrl
                                    }
                                });

                            }
                        );

                    } catch (uploadErr) {

                        console.error(uploadErr);

                        return res.status(500).json({
                            success: false,
                            message: uploadErr.message
                        });

                    }

                }
            );

        } catch (err) {

            console.error(err);

            return res.status(500).json({
                success: false,
                message: err.message
            });

        }

    }
);

router.put(
  "/update-profile",
  verifyToken,
  (req, res) => {

    const db = req.app.get("db");
    const userId = req.user.id;

    const {
      service_category,
      service_title,
      rate_type,
      rate_amount,
      description
    } = req.body;

    if (!service_category?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Service category required"
      });
    }

    if (!service_title?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Service title required"
      });
    }

    if (!description?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Description required"
      });
    }

    if (
      !rate_amount ||
      Number(rate_amount) <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid price required"
      });
    }

    const checkSql = `
      SELECT
        id,
        profile_status
      FROM hire_me_profiles
      WHERE user_id=?
      LIMIT 1
    `;

    db.query(
      checkSql,
      [userId],
      (err, rows) => {

        if (err) {
          return res.status(500).json({
            success: false,
            message: err.message
          });
        }

        if (!rows.length) {
          return res.status(404).json({
            success: false,
            message: "Profile not found"
          });
        }

        const sql = `
          UPDATE hire_me_profiles
          SET
            service_category=?,
            service_title=?,
            rate_type=?,
            rate_amount=?,
            description=?,
            updated_at=NOW()
          WHERE user_id=?
        `;

        db.query(
          sql,
          [
            service_category,
            service_title,
            rate_type,
            rate_amount,
            description,
            userId
          ],
          (err) => {

            if (err) {
              return res.status(500).json({
                success: false,
                message: err.message
              });
            }

            return res.json({
              success: true,
              message:
                "Profile updated successfully"
            });

          }
        );

      }
    );

  }
);

router.post(
  "/payment-success",
  verifyToken,
  (req, res) => {
 const db = req.app.get("db");
    const userId = req.user.id;

    const {
      transaction_id
    } = req.body;

    const sql = `
      UPDATE hire_me_profiles
      SET
      payment_status='Paid',
      transaction_id=?
      WHERE user_id=?
    `;

    db.query(
      sql,
      [
        transaction_id,
        userId
      ],
      (err) => {

        if (err)
          return res.status(500).json(err);

        res.json({
          success: true
        });

      }
    );

  }
);

router.get(
  "/my-profile",
  verifyToken,
  (req, res) => {
 const db = req.app.get("db");
    const sql = `
      SELECT
        h.*,

        u.name,
        u.email,
        u.telephone,
        u.pic,
        u.city,
        u.state,
        u.sex as gender,
        u.dob

      FROM hire_me_profiles h
      INNER JOIN users u
        ON u.srno = h.user_id

      WHERE h.user_id = ?
      LIMIT 1
    `;

    db.query(
      sql,
      [req.user.id],
      (err, rows) => {

        if (err) {
          console.error(err);
          return res.status(500).json({
            success: false,
            message: "Database error"
          });
        }

        res.json(
          rows.length > 0
            ? rows[0]
            : null
        );

      }
    );

  }
);

/*router.get(
  "/list",
  (req, res) => {

    const db = req.app.get("db");

    const sql = `
    SELECT
    h.*,
    u.name,
    u.pic,
    u.city,
    u.state,
    u.sex AS gender,
    ROUND(
      COALESCE(AVG(hr.rating),0),
      1
    ) AS avg_rating,
    COUNT(hr.id) AS total_reviews
FROM hire_me_profiles h
INNER JOIN users u
ON u.srno = h.user_id
LEFT JOIN hire_reviews hr
ON hr.to_user = h.user_id
WHERE
    h.profile_status='Approved'
    AND h.payment_status='Approved'
GROUP BY h.id

ORDER BY h.id DESC;
    `;

    db.query(sql, (err, rows) => {

      if (err) {
        return res.status(500).json({
          success: false,
          message: err.message
        });
      }

      return res.json(rows);

    });

  }
);*/
router.get("/list", (req, res) => {
  const db = req.app.get("db");

  const {
    keyword,
    category,
    city,
    state,
    minRating,
    minPrice,
    maxPrice,
    sort,
    lat,
    lng,
    radius
  } = req.query;

  let where = `
    h.profile_status='Approved'
    AND h.payment_status='Approved'
  `;

  if (keyword) {
    where += `
      AND (
        u.name LIKE '%${keyword}%'
        OR h.service_title LIKE '%${keyword}%'
        OR h.description LIKE '%${keyword}%'
      )
    `;
  }

  if (category) {
    where += ` AND h.service_category='${category}'`;
  }

  if (city) {
    where += ` AND u.city LIKE '%${city}%'`;
  }

  if (state) {
    where += ` AND u.state LIKE '%${state}%'`;
  }

  if (minPrice) {
    where += ` AND h.rate_amount >= ${Number(minPrice)}`;
  }

  if (maxPrice) {
    where += ` AND h.rate_amount <= ${Number(maxPrice)}`;
  }

  // Distance Calculation
  let distanceSelect = "";

  if (lat && lng) {
    distanceSelect = `
      ,
      (
        6371 * acos(
          cos(radians(${lat}))
          * cos(radians(u.latitude))
          * cos(radians(u.longitude) - radians(${lng}))
          + sin(radians(${lat}))
          * sin(radians(u.latitude))
        )
      ) AS distance
    `;
  }

  // HAVING conditions
  let havingConditions = [];

  if (minRating) {
    havingConditions.push(
      `ROUND(COALESCE(AVG(hr.rating),0),1) >= ${Number(minRating)}`
    );
  }

  if (radius && lat && lng) {
    havingConditions.push(
      `distance <= ${Number(radius)}`
    );
  }

  const havingClause =
    havingConditions.length > 0
      ? `HAVING ${havingConditions.join(" AND ")}`
      : "";

  // Sorting
  let orderBy = "h.id DESC";

  switch (sort) {
    case "rating":
      orderBy = "avg_rating DESC";
      break;

    case "price_low":
      orderBy = "h.rate_amount ASC";
      break;

    case "price_high":
      orderBy = "h.rate_amount DESC";
      break;

    case "nearest":
      if (lat && lng) {
        orderBy = "distance ASC";
      }
      break;

    default:
      orderBy = "h.id DESC";
  }

  const sql = `
    SELECT
      h.*,
      u.name,
      u.pic,
      u.city,
      u.state,
      u.latitude,
      u.longitude,
      ROUND(COALESCE(AVG(hr.rating),0),1) AS avg_rating,
      COUNT(hr.id) AS total_reviews
      ${distanceSelect}

    FROM hire_me_profiles h

    INNER JOIN users u
      ON u.srno = h.user_id

    LEFT JOIN hire_reviews hr
      ON hr.to_user = h.user_id

    WHERE ${where}

    GROUP BY h.id

    ${havingClause}

    ORDER BY ${orderBy}
  `;

  console.log(sql);

  db.query(sql, (err, rows) => {
    if (err) {
      console.error(err);

      return res.status(500).json({
        success: false,
        message: err.message
      });
    }

    res.json(rows);
  });
});

router.get(
  "/profile/:id",
  (req, res) => {

    const db = req.app.get("db");

    const sql = `
      SELECT

        h.id,
        h.user_id,
        h.service_category,
        h.service_title,
        h.rate_type,
        h.rate_amount,
        h.description,
        h.service_photo,
        h.govt_id_type,
        h.profile_status,
        h.payment_status,
        h.created_at,

        u.name,
        u.pic,
        u.city,
        u.state,
        u.sex AS gender,
        u.telephone as mobile,
        
ROUND(
  AVG(hr.rating),
  1
) AS avg_rating,

COUNT(hr.id) AS total_reviews

      FROM hire_me_profiles h

      INNER JOIN users u
      ON u.srno = h.user_id
LEFT JOIN hire_reviews hr
ON hr.to_user=h.user_id
      WHERE
        h.id = ?
        AND h.profile_status = 'Approved'
        AND h.payment_status = 'Approved'

      LIMIT 1
    `;

    db.query(
      sql,
      [req.params.id],
      (err, rows) => {

        if (err) {

          console.error(err);

          return res.status(500).json({
            success: false,
            message: "Server error"
          });

        }

        if (!rows.length) {

          return res.status(404).json({
            success: false,
            message: "Profile not found"
          });

        }

        return res.json({
          success: true,
          profile: rows[0]
        });

      }
    );

  }
);

// GET /api/hire-reviews/:userId

router.get("/hire-reviews/:userId", (req, res) => {

    const db = req.app.get("db");
    const { userId } = req.params;

    const sql = `
        SELECT
            hr.id,
            hr.request_id,
            hr.rating,
            hr.comment,
            hr.created_at,

            u.srno,
            u.name AS reviewer_name,
            u.pic AS reviewer_pic,
            u.city

        FROM hire_reviews hr

        LEFT JOIN users u
            ON u.srno = hr.from_user

        WHERE hr.to_user = ?

        ORDER BY hr.created_at DESC
    `;

    db.query(sql, [userId], (err, rows) => {

        if (err) {
            console.error("Hire Reviews Error:", err);

            return res.status(500).json({
                success: false,
                message: "Failed to fetch reviews"
            });
        }

        res.json({
            success: true,
            total: rows.length,
            reviews: rows
        });

    });

});

router.get(
  "/admin/hireme",
  verifyToken,
  (req, res) => {

    const db = req.app.get("db");
    // Optional admin check    
  /*  if (req.user.user !== "raj") {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    } 
*/
    const sql = `
      SELECT
        h.*,

        u.name,
        u.email,
        u.telephone,
        u.pic

      FROM hire_me_profiles h

      INNER JOIN users u
      ON u.srno = h.user_id

      ORDER BY h.id DESC
    `;

    db.query(sql, (err, rows) => {

      if (err) {
        return res.status(500).json({
          success: false,
          message: err.message
        });
      }

      return res.json({
        success: true,
        total: rows.length,
        data: rows
      });

    });

  }
);

router.post(
  "/hire-request",
  verifyToken,
  (req, res) => {

    const db = req.app.get("db");

    const employerId = req.user.id;

    const {
      candidate_id,
      message
    } = req.body;

    if (!candidate_id) {
      return res.status(400).json({
        success: false,
        message: "Candidate required"
      });
    }

    if (!message?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message required"
      });
    }

    if (Number(candidate_id) === Number(employerId)) {
      return res.status(400).json({
        success: false,
        message: "You cannot hire yourself"
      });
    }

    const candidateSql = `
      SELECT
        id,
        user_id
      FROM hire_me_profiles
      WHERE user_id=?
      AND profile_status='Approved'
      AND payment_status='Approved'
      LIMIT 1
    `;

    db.query(
      candidateSql,
      [candidate_id],
      (candidateErr, candidateRows) => {

        if (candidateErr) {

          console.error(candidateErr);

          return res.status(500).json({
            success: false,
            message: "Server error"
          });

        }

        if (!candidateRows.length) {

          return res.status(404).json({
            success: false,
            message: "Professional not found"
          });

        }

        const checkSql = `
          SELECT id
          FROM hire_requests
          WHERE employer_id=?
          AND candidate_id=?
          AND status='Pending'
          LIMIT 1
        `;

        db.query(
          checkSql,
          [
            employerId,
            candidate_id
          ],
          (err, rows) => {

            if (err) {

              console.error(err);

              return res.status(500).json({
                success: false,
                message: "Server error"
              });

            }

            if (rows.length) {

              return res.status(400).json({
                success: false,
                message:
                  "Request already pending"
              });

            }

            const insertSql = `
              INSERT INTO hire_requests
              (
                employer_id,
                candidate_id,
                message,
                status,
                created_at
              )
              VALUES
              (
                ?,?,?,?,
                NOW()
              )
            `;

            db.query(
              insertSql,
              [
                employerId,
                candidate_id,
                message.trim(),
                "Pending"
              ],
              (insertErr, result) => {

                if (insertErr) {

                  console.error(insertErr);

                  return res.status(500).json({
                    success: false,
                    message: "Server error"
                  });

                }

                return res.json({
                  success: true,
                  requestId: result.insertId,
                  message:
                    "Hire request sent successfully"
                });

              }
            );

          }
        );

      }
    );

  }
);

router.get(
  "/hire-requests/my",
  verifyToken,
  (req, res) => {

    const db = req.app.get("db");
/*
    const sql = `
      SELECT

        hr.id,
        hr.message,
        hr.status,
        hr.created_at,
        hr.action_at,
        u.srno,
        u.name,
        u.pic,
        u.city,
        u.state,
        u.telephone as mobile
      FROM hire_requests hr

      INNER JOIN users u
      ON u.srno = hr.employer_id

      WHERE hr.candidate_id=?

      ORDER BY hr.id DESC
    `;

    db.query(
      sql,
      [req.user.id],
      (err, rows) => {

        if (err) {
          console.error(err);
          return res.status(500).json({
            success:false,
            message:"Server error"
          });
        }

        res.json({
          success:true,
          requests:rows
        });

      }
    );*/
   const sql = `
SELECT

  hr.id,
  hr.message,
  hr.status,
  hr.created_at,
  hr.action_at,

  u.srno,
  u.name,
  u.pic,
  u.city,
  u.state,

  CASE
    WHEN hr.status='Accepted'
    THEN u.telephone
    ELSE NULL
  END AS mobile,

  IF(r.id IS NULL, 0, 1) AS reviewed,

  r.rating,
  r.comment,
  r.created_at AS review_date,

  COALESCE(rv.avg_rating, 0) AS avg_rating,
  COALESCE(rv.total_reviews, 0) AS total_reviews

FROM hire_requests hr

INNER JOIN users u
ON u.srno = hr.employer_id

LEFT JOIN hire_reviews r
ON r.request_id = hr.id
AND r.from_user = ?

LEFT JOIN (
    SELECT
        to_user,
        ROUND(AVG(rating), 1) AS avg_rating,
        COUNT(*) AS total_reviews
    FROM hire_reviews
    GROUP BY to_user
) rv
ON rv.to_user = hr.employer_id

WHERE hr.candidate_id = ?

ORDER BY hr.id DESC
`;

db.query(
  sql,
  [
    req.user.id, // reviewer
    req.user.id  // candidate
  ],
  (err, rows) => {

    if (err) {
      console.error(err);
      return res.status(500).json({
        success:false,
        message:"Server error"
      });
    }

    res.json({
      success:true,
      requests:rows
    });

  }
);

  }
);

router.put(
  "/hire-request/:id/accept",
  verifyToken,
  (req, res) => {

    const db = req.app.get("db");

    const sql = `
      UPDATE hire_requests
SET  status='Accepted',  action_at=NOW()
WHERE  id=?  AND candidate_id=?  AND status='Pending'`;

    db.query(
      sql,
      [
        req.params.id,
        req.user.id
      ],
      (err,result) => {

        if (err) {
          console.error(err);
          return res.status(500).json({
            success:false,
            message:"Server error"
          });
        }

        if(!result.affectedRows){
          return res.status(400).json({
            success:false,
            message:"Request already processed"
          });
        }

        res.json({
          success:true,
          message:"Request accepted"
        });

      }
    );

  }
);

router.put(
  "/hire-request/:id/reject",
  verifyToken,
  (req, res) => {

    const db = req.app.get("db");

    const sql = `
      UPDATE hire_requests
      SET status='Rejected',  action_at=NOW()
      WHERE
        id=?
        AND candidate_id=?
        AND status='Pending'
    `;

    db.query(
      sql,
      [
        req.params.id,
        req.user.id
      ],
      (err,result) => {

        if (err) {
          console.error(err);
          return res.status(500).json({
            success:false,
            message:"Server error"
          });
        }

        if(!result.affectedRows){
          return res.status(400).json({
            success:false,
            message:"Request already processed"
          });
        }

        res.json({
          success:true,
          message:"Request rejected"
        });

      }
    );

  }
);

router.get(
  "/hire-requests/sent",
  verifyToken,
  (req, res) => {

    const db = req.app.get("db");

  const sql = `
SELECT

  hr.id,
  hr.message,
  hr.status,
  hr.created_at,
  hr.action_at,

  u.name,
  u.pic,
  u.city,
  u.state,
  u.telephone AS mobile,

  h.service_title,
  h.service_category,

  IF(r.id IS NULL, 0, 1) AS reviewed,

  r.rating,
  r.comment,
  r.created_at AS review_date

FROM hire_requests hr

INNER JOIN users u
ON u.srno = hr.candidate_id

LEFT JOIN hire_me_profiles h
ON h.user_id = hr.candidate_id

LEFT JOIN hire_reviews r
ON r.request_id = hr.id
AND r.from_user = ?

WHERE hr.employer_id = ?

ORDER BY hr.id DESC
`;

    db.query(
      sql,
      [req.user.id, req.user.id],
      (err, rows) => {

        if (err) {

          console.error(err);

          return res.status(500).json({
            success:false,
            message:"Server error"
          });

        }

        res.json({
          success:true,
          requests:rows
        });

      }
    );

  }
);

router.put(
  "/admin/hireme/approve/:id",
  verifyToken,
  (req, res) => {
 const db = req.app.get("db");
    const sql = `
      UPDATE hire_me_profiles
      SET
      profile_status='Approved',
      govt_verified=1
      WHERE id=?
    `;

    db.query(
      sql,
      [req.params.id],
      (err) => {

        if (err)
          return res.status(500).json(err);

        res.json({
          success: true
        });

      }
    );

  }
);

router.put(
  "/admin/hireme/reject/:id",
  verifyToken,
  (req, res) => {

    const db = req.app.get("db");

    const { id } = req.params;
    const { rejection_reason } = req.body;

    if (!rejection_reason?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Rejection reason required"
      });
    }

    const sql = `
      UPDATE hire_me_profiles
      SET
        profile_status='Rejected',
        rejection_reason=?,
        updated_at=NOW()
      WHERE id=?
    `;

    db.query(
      sql,
      [rejection_reason, id],
      (err) => {

        if (err) {
          return res.status(500).json({
            success: false,
            message: err.message
          });
        }

        return res.json({
          success: true,
          message: "Profile rejected"
        });

      }
    );

  }
);

router.post(
  "/resubmit",
  verifyToken,
  (req, res) => {

    const db = req.app.get("db");
    const userId = req.user.id;

    const sql = `
      UPDATE hire_me_profiles
      SET
        profile_status='Pending',
        rejection_reason='',
        updated_at=NOW()
      WHERE user_id=?
    `;

    db.query(sql, [userId], (err, result) => {

      if (err) {
        return res.status(500).json({
          success: false,
          message: err.message
        });
      }

      return res.json({
        success: true,
        message: "Profile resubmitted successfully"
      });

    });

  }
);

router.put(
  "/admin/hireme/payment/:id",
  verifyToken,
  (req, res) => {

    const db = req.app.get("db");

    const { id } = req.params;
    const { status } = req.body;

    if (
      !["Approved", "Rejected"].includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid status"
      });
    }

    const sql = `
      UPDATE hire_me_profiles
      SET
        payment_status=?,
        updated_at=NOW()
      WHERE id=?
    `;

    db.query(
      sql,
      [status, id],
      (err) => {

        if (err) {
          return res.status(500).json({
            success: false,
            message: err.message
          });
        }

        return res.json({
          success: true,
          message:
            status === "Approved"
              ? "Payment approved"
              : "Payment rejected"
        });

      }
    );

  }
);

router.post(
  "/hire-review",
  verifyToken,
  (req, res) => {

    const db = req.app.get("db");

    const userId = req.user.id;

    const {
      request_id,
      rating,
      comment
    } = req.body;

    if (
      !request_id ||
      !rating
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Request ID and rating required"
      });
    }

    if (
      Number(rating) < 1 ||
      Number(rating) > 5
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Rating must be between 1 and 5"
      });
    }

    const checkSql = `
      SELECT
        *
      FROM hire_requests
      WHERE
        id=?
        AND status='Accepted'
        AND (
          employer_id=?
          OR candidate_id=?
        )
      LIMIT 1
    `;

    db.query(
      checkSql,
      [
        request_id,
        userId,
        userId
      ],
      (err, rows) => {

        if (err) {
          return res.status(500).json({
            success: false,
            message: err.message
          });
        }

        if (!rows.length) {
          return res.status(404).json({
            success: false,
            message:
              "Request not found"
          });
        }

        const request =
          rows[0];

        const toUser =
          request.employer_id ===
          userId
            ? request.candidate_id
            : request.employer_id;

        const insertSql = `
          INSERT INTO hire_reviews
          (
            request_id,
            from_user,
            to_user,
            rating,
            comment
          )
          VALUES
          (
            ?,?,?,?,?
          )
        `;

        db.query(
          insertSql,
          [
            request_id,
            userId,
            toUser,
            rating,
            comment || ""
          ],
          (err, result) => {

            if (
              err &&
              err.code ===
                "ER_DUP_ENTRY"
            ) {
              return res.status(400)
                .json({
                  success: false,
                  message:
                    "You already reviewed this request"
                });
            }

            if (err) {
              return res.status(500)
                .json({
                  success: false,
                  message:
                    err.message
                });
            }

            return res.json({
              success: true,
              reviewId:
                result.insertId,
              message:
                "Review submitted successfully"
            });

          }
        );

      }
    );

  }
);

router.get(
  "/hire-reviews/:userId",
  (req, res) => {

    const db = req.app.get("db");

    const sql = `
      SELECT

      r.*,

      u.name,
      u.pic

      FROM hire_reviews r

      INNER JOIN users u
      ON u.srno = r.from_user

      WHERE r.to_user=?

      ORDER BY r.id DESC
    `;

    db.query(
      sql,
      [req.params.userId],
      (err, rows) => {

        if (err)
          return res.status(500)
            .json(err);

        res.json(rows);

      }
    );

  }
);

export default router;