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

    let user = null;

    try {
      user = await prisma.user.create({
        data: {
          name,
          email,
          hashedPassword,
        },
        select: {
          id: true,
          name: true,
          email: true,
        },
      });
    } catch (err) {
      if (
        err.name === "PrismaClientKnownRequestError" &&
        err.code === "P2002"
      ) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          error: "Email already registered",
        });
      } else {
        return next(err);
      }
    }

    global.user_id = user.id;

    return res.status(StatusCodes.CREATED).json({
      name: user.name,
      email: user.email,
    });
  } catch (e) {
    return next(e);
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
