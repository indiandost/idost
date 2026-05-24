import jwt from "jsonwebtoken";

const JWT_SECRET = "my_super_secret_key";

export const verifyToken = (req, res, next) => {

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {

    return res.json({
      success: false,
      message: "No token provided"
    });

  }

  const token = authHeader.split(" ")[1];

  try {

    const decoded = jwt.verify(token, JWT_SECRET);

    req.user = decoded;

    next();

  } catch (err) {

    return res.json({
      success: false,
      message: "Invalid or expired token"
    });

  }

};