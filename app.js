require("dotenv").config();
const helmet = require("helmet");
const { xss } = require("express-xss-sanitizer");
const rateLimiter = require("express-rate-limit");
const express = require("express");
const cookieParser = require("cookie-parser");
const prisma = require("./db/prisma");
const jwtMiddleware = require("./middleware/jwtMiddleware");
const cors = require("cors");
const taskRouter = require("./routers/taskRoutes");
const notFound = require("./middleware/not-found");
const errorHandler = require("./middleware/error-handler");
const userRouter = require("./routers/userRoutes");
const analyticsRoutes = require("./routers/analyticsRoutes");

const app = express();

app.set("trust proxy", 1);

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "X-CSRF-TOKEN"],
  }),
);

// Middleware
app.use(
  rateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 100,
  }),
);
app.use(helmet());
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(xss());

app.use((req, res, next) => {
  console.log("Method:", req.method);
  console.log("Path:", req.path);
  console.log("Query:", req.query);
  console.log("------------------------");

  next();
});

app.get("/", (req, res) => {
  res.json({ message: "Hello, World!" });
});

app.get("/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", db: "connected" });
  } catch (err) {
    res.status(500).json({
      status: "error",
      db: "not connected",
      error: err.message,
    });
  }
});

app.post("/testpost", (req, res) => {
  res.json({ message: "POST request received!" });
});

// Public routes
app.use("/api/users", userRouter);

// Protected routes
app.use("/api/analytics", jwtMiddleware, analyticsRoutes);
app.use("/api/tasks", jwtMiddleware, taskRouter);

// Error handling
app.use(notFound);
app.use(errorHandler);

const port = process.env.PORT || 3000;

const server = app.listen(port, () =>
  console.log(`Server is listening on port ${port}...`),
);

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Port ${port} is already in use.`);
  } else {
    console.error("Server error:", err);
  }
  process.exit(1);
});

let isShuttingDown = false;

async function shutdown(code = 0) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log("Shutting down gracefully...");

  try {
    await new Promise((resolve) => server.close(resolve));
    console.log("HTTP server closed.");

    await prisma.$disconnect();
    console.log("Prisma disconnected");
  } catch (err) {
    console.error("Error during shutdown:", err);
    code = 1;
  } finally {
    console.log("Exiting process...");
    process.exit(code);
  }
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
  shutdown(1);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection:", reason);
  shutdown(1);
});

module.exports = { app, server };
