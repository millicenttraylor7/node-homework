const { StatusCodes } = require("http-status-codes");
const { userSchema } = require("../validation/userSchema");
const crypto = require("crypto");
const util = require("util");
const scrypt = util.promisify(crypto.scrypt);
const pool = require("../db/pg-pool");

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
    // CHECK FOR EXISTING EMAIL
    const existingUser = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [value.email],
    );

    if (existingUser.rows.length > 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: "Email already registered",
      });
    }

    const hashed_password = await hashPassword(value.password);

    const user = await pool.query(
      `INSERT INTO users (email, name, hashed_password)
       VALUES ($1, $2, $3)
       RETURNING id, email, name`,
      [value.email, value.name, hashed_password],
    );

    global.user_id = user.rows[0].id;

    return res.status(StatusCodes.CREATED).json({
      name: user.rows[0].name,
      email: user.rows[0].email,
    });
  } catch (e) {
    return next(e);
  }
};
const logon = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (result.rows.length === 0) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        error: "Authentication Failed",
      });
    }

    const storedUser = result.rows[0];

    const isMatch = await comparePassword(password, storedUser.hashed_password);

    if (!isMatch) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        error: "Authentication Failed",
      });
    }

    global.user_id = storedUser.id;

    return res.status(StatusCodes.OK).json({
      name: storedUser.name,
      email: storedUser.email,
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
