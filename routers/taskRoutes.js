const express = require("express");

const {
  create,
  bulkCreate,
  index,
  show,
  update,
  deleteTask,
} = require("../controllers/taskController");

const router = express.Router();

router.post("/bulk", bulkCreate);

/**
 * @swagger
 * /api/tasks:
 *   get:
 *     summary: Get all tasks
 *     tags:
 *       - Tasks
 *     responses:
 *       200:
 *         description: List of tasks
 */

router.route("/").get(index).post(create);

router.route("/:id").get(show).patch(update).delete(deleteTask);

module.exports = router;
