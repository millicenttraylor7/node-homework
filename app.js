const express = require("express");
const app = express();
const prisma = require("./db/prisma");

const authMiddleware = require("./middleware/auth");
const taskRouter = require("./routers/taskRoutes");
const notFound = require("./middleware/not-found");
const errorHandler = require("./middleware/error-handler");
const userRouter = require("./routers/userRoutes");

// Globals
global.user_id = null;
global.users = [];
global.tasks = [];

// Middleware to parse JSON request bodies
app.use(express.json({ limit: "1kb" }));

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

// Protected task routes
app.use("/api/tasks", authMiddleware, taskRouter);

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
