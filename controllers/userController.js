const { StatusCodes } = require("http-status-codes");
const { userSchema } = require("../validation/userSchema");
const crypto = require("crypto");
const util = require("util");
const scrypt = util.promisify(crypto.scrypt);

const prisma = require("../db/prisma");

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = await scrypt(password, salt, 64);

  return `${salt}:${derivedKey.toString("hex")}`;
}

async function comparePassword(inputPassword, storedHash) {
  const [salt, key] = storedHash.split(":");

  const keyBuffer = Buffer.from(key, "hex");
  const derivedKey = await scrypt(inputPassword, salt, 64);

  return crypto.timingSafeEqual(keyBuffer, derivedKey);
}

const register = async (req, res, next) => {
  if (!req.body) req.body = {};

  const { error, value } = userSchema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      error: "Validation failed",
      details: error.details,
    });
  }

  try {
    const hashedPassword = await hashPassword(value.password);

    const { name, email } = value;

    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name,
          email,
          hashedPassword,
        },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
      });

      const welcomeTaskData = [
        {
          title: "Complete your profile",
          userId: newUser.id,
          priority: "medium",
        },
        {
          title: "Add your first task",
          userId: newUser.id,
          priority: "high",
        },
        {
          title: "Explore the app",
          userId: newUser.id,
          priority: "low",
        },
      ];

      await tx.task.createMany({
        data: welcomeTaskData,
      });

      const welcomeTasks = await tx.task.findMany({
        where: {
          userId: newUser.id,
          title: {
            in: welcomeTaskData.map((task) => task.title),
          },
        },
        select: {
          id: true,
          title: true,
          isCompleted: true,
          userId: true,
          priority: true,
        },
      });

      return {
        user: newUser,
        welcomeTasks,
      };
    });

    global.user_id = result.user.id;

    return res.status(StatusCodes.CREATED).json({
      user: result.user,
      welcomeTasks: result.welcomeTasks,
      transactionStatus: "success",
    });
  } catch (err) {
    if (err.name === "PrismaClientKnownRequestError" && err.code === "P2002") {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: "Email already registered",
      });
    }

    return next(err);
  }
};

const logon = async (req, res, next) => {
  let { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      error: "Email and password are required",
    });
  }

  try {
    email = email.toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        hashedPassword: true,
      },
    });

    if (!user) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        error: "Authentication Failed",
      });
    }

    const isMatch = await comparePassword(password, user.hashedPassword);

    if (!isMatch) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        error: "Authentication Failed",
      });
    }

    global.user_id = user.id;

    return res.status(StatusCodes.OK).json({
      name: user.name,
      email: user.email,
    });
  } catch (err) {
    next(err);
  }
};

const logoff = (req, res) => {
  global.user_id = null;

  return res.sendStatus(StatusCodes.OK);
};

module.exports = {
  register,
  logon,
  logoff,
};
