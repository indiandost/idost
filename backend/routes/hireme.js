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
const UPLOAD_DIR =
  process.env.UPLOAD_DIR || "uploads";

const FILE_URL =  process.env.FILE_URL ||  `${process.env.BASE_URL}/uploads`;
router.post("/enroll", verifyToken, (req, res) => {

  const userId = req.user.id;

  const {
    service_category,
    service_title,
    rate_type,
    rate_amount,
    description,
    transaction_id
  } = req.body;

  // Validation

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

  if (!transaction_id?.trim()) {
    return res.status(400).json({
      success: false,
      message: "Transaction ID required"
    });
  }

  const checkSql = `
    SELECT id
    FROM hire_me_profiles
    WHERE user_id = ?
    LIMIT 1
  `;

  db.query(
    checkSql,
    [userId],
    (err, rows) => {

      if (err)
        return res.status(500).json({
          success: false,
          message: err.message
        });

      if (rows.length > 0) {

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
          payment_status,
          profile_status
        )
        VALUES
        (
          ?,?,?,?,?,?,
          ?,
          'Pending',
          'Pending'
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
          transaction_id
        ],
        (err, result) => {

          if (err) {

            console.error(err);

            return res.status(500).json({
              success: false,
              message: err.message
            });

          }

          return res.json({
            success: true,
            profileId: result.insertId,
            message:
              "Enrollment submitted successfully. Waiting for verification."
          });

        }
      );

    }
  );

});

router.post(
  "/upload-documents",
  verifyToken,
  upload.fields([
    { name: "service_photo", maxCount: 1 },
    { name: "govt_front", maxCount: 1 },
    { name: "govt_back", maxCount: 1 },
    { name: "payment_screenshot", maxCount: 1 }
  ]),
  async (req, res) => {

    try {

      const userId = req.user.id;

      const profileCheckSql = `
        SELECT id
        FROM hire_me_profiles
        WHERE user_id = ?
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

            const uploadToCloudinary = (
              fileBuffer,
              folder
            ) => {

              return new Promise(
                (resolve, reject) => {

                  const stream =
                    cloudinary.uploader.upload_stream(
                      {
                        folder,
                        resource_type: "auto"
                      },
                      (error, result) => {

                        if (error)
                          reject(error);
                        else
                          resolve(
                            result.secure_url
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

                  return res.status(500).json({
                    success: false,
                    message: err.message
                  });

                }

                return res.json({
                  success: true,
                  message:
                    "Documents uploaded successfully",

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
              message:
                uploadErr.message
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

router.post(
  "/payment-success",
  verifyToken,
  (req, res) => {

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

    const sql = `
      SELECT
        h.*,

        u.name,
        u.email,
        u.mobile,
        u.pic,
        u.city,
        u.state,
        u.gender,
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

router.get(
  "/list",
  (req, res) => {

    const sql = `
      SELECT
        h.*,
        u.name,
        u.pic,
        u.city,
        u.state,
        u.gender
      FROM hire_me_profiles h
      INNER JOIN users u
      ON u.srno=h.user_id

      WHERE
      h.payment_status='Paid'
      AND h.profile_status='Approved'

      ORDER BY h.id DESC
    `;

    db.query(sql, (err, rows) => {

      if (err)
        return res.status(500).json(err);

      res.json(rows);

    });

  }
);

router.get(
  "/profile/:id",
  (req, res) => {

    const sql = `
      SELECT
        h.*,
        u.name,
        u.pic,
        u.city,
        u.state,
        u.gender
      FROM hire_me_profiles h
      INNER JOIN users u
      ON u.srno=h.user_id
      WHERE h.id=?
    `;

    db.query(
      sql,
      [req.params.id],
      (err, rows) => {

        if (err)
          return res.status(500).json(err);

        if (rows.length === 0) {
          return res.status(404).json({
            message: "Profile not found"
          });
        }

        res.json(rows[0]);

      }
    );

  }
);


router.get(
  "/admin/hireme",
  verifyToken,
  (req, res) => {

    const sql = `
     SELECT
h.*,
u.name,
u.email,
u.mobile,
u.pic
FROM hire_me_profiles h
INNER JOIN users u
ON u.srno = h.user_id
ORDER BY h.id DESC
    `;

    db.query(sql, (err, rows) => {

      if (err)
        return res.status(500).json(err);

      res.json(rows);

    });

  }
);

router.post(
  "/hire-request",
  verifyToken,
  (req, res) => {

    const employerId = req.user.id;

    const {
      candidate_id,
      message
    } = req.body;

    if (!candidate_id) {
      return res.status(400).json({
        message: "Candidate required"
      });
    }

    const checkSql = `
      SELECT id
      FROM hire_requests
      WHERE employer_id=?
      AND candidate_id=?
      AND status='Pending'
    `;

    db.query(
      checkSql,
      [employerId, candidate_id],
      (err, rows) => {

        if (err)
          return res.status(500).json(err);

        if (rows.length > 0) {
          return res.status(400).json({
            message:
              "Request already pending"
          });
        }

        const sql = `
          INSERT INTO hire_requests
          (
            employer_id,
            candidate_id,
            message
          )
          VALUES (?,?,?)
        `;

        db.query(
          sql,
          [
            employerId,
            candidate_id,
            message
          ],
          (err, result) => {

            if (err)
              return res.status(500).json(err);

            res.json({
              success: true,
              requestId:
                result.insertId
            });

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

    const sql = `
      SELECT

        hr.*,

        u.name,
        u.pic,
        u.city,
        u.state

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

        if (err)
          return res.status(500).json(err);

        res.json(rows);

      }
    );

  }
);

router.put(
  "/hire-request/:id/accept",
  verifyToken,
  (req, res) => {

    const sql = `
      UPDATE hire_requests
      SET status='Accepted'
      WHERE id=?
      AND candidate_id=?
    `;

    db.query(
      sql,
      [
        req.params.id,
        req.user.id
      ],
      (err) => {

        if (err)
          return res.status(500).json(err);

        res.json({
          success: true,
          message:
            "Request accepted"
        });

      }
    );

  }
);

router.put(
  "/hire-request/:id/reject",
  verifyToken,
  (req, res) => {

    const sql = `
      UPDATE hire_requests
      SET status='Rejected'
      WHERE id=?
      AND candidate_id=?
    `;

    db.query(
      sql,
      [
        req.params.id,
        req.user.id
      ],
      (err) => {

        if (err)
          return res.status(500).json(err);

        res.json({
          success: true,
          message:
            "Request rejected"
        });

      }
    );

  }
);

router.get(
  "/hire-requests/sent",
  verifyToken,
  (req, res) => {

    const sql = `
      SELECT

        hr.*,

        u.name,
        u.pic

      FROM hire_requests hr

      INNER JOIN users u
      ON u.srno = hr.candidate_id

      WHERE hr.employer_id=?

      ORDER BY hr.id DESC
    `;

    db.query(
      sql,
      [req.user.id],
      (err, rows) => {

        if (err)
          return res.status(500).json(err);

        res.json(rows);

      }
    );

  }
);

router.put(
  "/admin/hireme/approve/:id",
  verifyToken,
  (req, res) => {

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

    const sql = `
      UPDATE hire_me_profiles
      SET profile_status='Rejected'
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

export default router;