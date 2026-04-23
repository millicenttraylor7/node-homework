const express = require("express");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const app = express();

const {
  ValidationError,
  NotFoundError,
  UnauthorizedError,
} = require("./errors");

// request ID middleware
app.use((req, res, next) => {
  req.requestId = uuidv4();
  res.setHeader("X-Request-Id", req.requestId);
  next();
});

// Logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}]: ${req.method} ${req.path} (${req.requestId})`);
  next();
});

// security headers
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  next();
});

// JSON body parser
app.use(express.json({ limit: "1mb" }));

// content type validation
app.use((req, res, next) => {
  if (req.method === "POST") {
    const contentType = req.get("Content-Type");
    if (!contentType || !contentType.includes("application/json")) {
      return res.status(400).json({
        error: "Content-Type must be application/json",
        requestId: req.requestId,
      });
    }
  }
  next();
});

// static files
app.use("/images", express.static(path.join(__dirname, "public/images")));

// ROUTES
app.get("/dogs", (req, res) => {
  res.json({ message: "Dogs list" });
});

app.post("/adopt", (req, res, next) => {
  try {
    const { dogName, name, email } = req.body;

    if (!dogName || !name || !email) {
      throw new ValidationError("Missing required fields");
    }

    const availableDogs = ["Luna", "Sweet Pea"];
    if (!availableDogs.includes(dogName)) {
      throw new NotFoundError("Dog not found or not available");
    }

    res.status(201).json({
      message: `Adoption request received. We will contact you at ${email} for further details.`,
      requestId: req.requestId,
    });
  } catch (err) {
    next(err);
  }
});

app.get("/error", (req, res, next) => {
  next(new Error("Test error"));
});

// error handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  if (statusCode >= 400 && statusCode < 500) {
    console.warn(`WARN: ${err.name} - ${err.message}`);
  } else {
    console.error(`ERROR: Error - ${err.message}`);
  }

  res.status(statusCode).json({
    error: statusCode >= 500 ? "Internal Server Error" : err.message,
    requestId: req.requestId,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    requestId: req.requestId,
  });
});

module.exports = app;
