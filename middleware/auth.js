const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  const token = req.cookies?.jwt;

  if (!token) {
    return res.status(401).json({
      msg: "Unauthorized",
    });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // CSRF protection for non-GET requests
    if (req.method !== "GET") {
      const csrfHeader = req.headers["x-csrf-token"];

      if (!csrfHeader || csrfHeader !== payload.csrfToken) {
        return res.status(401).json({
          msg: "Invalid CSRF token",
        });
      }
    }

    const payload = {
      id: user.id,
      csrfToken: randomUUID(),
    };

    next();
  } catch (error) {
    return res.status(401).json({
      msg: "Invalid token",
    });
  }
};

module.exports = authMiddleware;
