const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");
const prisma = require("../db/prisma");

const create = async (req, res, next) => {
  const { error, value } = taskSchema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    return res.status(400).json({
      message: "Validation failed",
      details: error.details,
    });
  }

  try {
    const task = await prisma.task.create({
      data: {
        title: value.title,
        isCompleted: value.isCompleted || false,
        userId: req.user.id,
        priority: value.priority,
      },

      select: {
        id: true,
        title: true,
        isCompleted: true,
        priority: true,
      },
    });

    return res.status(201).json(task);
  } catch (err) {
    next(err);
  }
};
const bulkCreate = async (req, res, next) => {
  const { tasks } = req.body;

  if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
    return res.status(400).json({
      error: "Invalid request data. Expected an array of tasks.",
    });
  }

  const validTasks = [];

  for (const task of tasks) {
    const { error, value } = taskSchema.validate(task, {
      abortEarly: false,
    });

    if (error) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.details,
      });
    }

    validTasks.push({
      title: value.title,
      isCompleted: value.isCompleted || false,
      priority: value.priority || "medium",
      userId: req.user.id,
    });
  }

  try {
    const result = await prisma.task.createMany({
      data: validTasks,
      skipDuplicates: false,
    });

    return res.status(201).json({
      message: "Bulk task creation successful",
      tasksCreated: result.count,
      totalRequested: validTasks.length,
    });
  } catch (err) {
    return next(err);
  }
};

const index = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  if (page < 1) {
    return res.status(400).json({
      error: "Page must be greater than or equal to 1",
    });
  }

  if (limit < 1 || limit > 100) {
    return res.status(400).json({
      error: "Limit must be between 1 and 100",
    });
  }

  const skip = (page - 1) * limit;

  const whereClause = {
    userId: req.user.id,
  };

  if (req.query.find && req.query.find.trim().length > 0) {
    whereClause.title = {
      contains: req.query.find.trim(),
      mode: "insensitive",
    };
  }

  const tasks = await prisma.task.findMany({
    where: whereClause,
    select: {
      id: true,
      title: true,
      isCompleted: true,
      priority: true,
      createdAt: true,
      User: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    skip: skip,
    take: limit,
    orderBy: {
      createdAt: "desc",
    },
  });

  const totalTasks = await prisma.task.count({
    where: whereClause,
  });
  if (totalTasks === 0) {
    return res.status(404).json({
      message: "No tasks found.",
    });
  }

  const pagination = {
    page: page,
    limit: limit,
    total: totalTasks,
    pages: Math.ceil(totalTasks / limit),
    hasNext: page * limit < totalTasks,
    hasPrev: page > 1,
  };

  return res.status(200).json({
    tasks: tasks,
    pagination: pagination,
  });
};
const show = async (req, res, next) => {
  const id = Number(req.params.id);

  try {
    const task = await prisma.task.findUnique({
      where: {
        id_userId: {
          id,
          userId: req.user.id,
        },
      },
      select: {
        id: true,
        title: true,
        priority: true,
        isCompleted: true,
        User: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!task) {
      return res.status(404).json({ message: "The task was not found." });
    }

    return res.status(200).json(task);
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ message: "The task was not found." });
    }

    return next(err);
  }
};

const update = async (req, res, next) => {
  const { error, value } = patchTaskSchema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    return res.status(400).json({
      message: "Validation failed",
      details: error.details,
    });
  }

  if (Object.keys(value).length === 0) {
    return res.status(400).json({ message: "No fields to update" });
  }

  const id = Number(req.params.id);

  try {
    const task = await prisma.task.update({
      data: value,
      where: {
        id_userId: {
          id,
          userId: req.user.id,
        },
      },
      select: {
        id: true,
        title: true,
        isCompleted: true,
        priority: true,
      },
    });

    return res.status(200).json(task);
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({
        message: "The task was not found.",
      });
    }

    return next(err);
  }
};

const deleteTask = async (req, res, next) => {
  const id = Number(req.params.id);

  try {
    const deletedTask = await prisma.task.delete({
      where: {
        id_userId: {
          id,
          userId: req.user.id,
        },
      },
      select: {
        id: true,
        title: true,
        isCompleted: true,
        priority: true,
      },
    });

    return res.status(200).json(deletedTask);
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({
        message: "The task was not found.",
      });
    }

    return next(err);
  }
};
module.exports = {
  create,
  bulkCreate,
  index,
  show,
  update,
  deleteTask,
};
