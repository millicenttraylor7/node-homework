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
        userId: global.user_id,
      },
      select: {
        id: true,
        title: true,
        isCompleted: true,
      },
    });

    return res.status(201).json(task);
  } catch (err) {
    next(err);
  }
};

const index = async (req, res) => {
  const tasks = await prisma.task.findMany({
    where: {
      userId: global.user_id,
    },
    select: {
      id: true,
      title: true,
      isCompleted: true,
    },
  });

  if (tasks.length === 0) {
    return res.status(404).json({ message: "Tasks not found" });
  }

  return res.status(200).json(tasks);
};

const show = async (req, res, next) => {
  const id = Number(req.params.id);

  try {
    const task = await prisma.task.findUnique({
      where: {
        id_userId: {
          id,
          userId: global.user_id,
        },
      },
      select: {
        id: true,
        title: true,
        isCompleted: true,
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
          userId: global.user_id,
        },
      },
      select: {
        id: true,
        title: true,
        isCompleted: true,
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
          userId: global.user_id,
        },
      },
      select: {
        id: true,
        title: true,
        isCompleted: true,
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
  index,
  show,
  update,
  deleteTask,
};
