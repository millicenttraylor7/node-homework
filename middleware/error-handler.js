const { StatusCodes } = require("http-status-codes");

const errorHandler = (err, req, res, next) => {
  if (err.name === "PrismaClientInitializationError") {
    console.error("Couldn't connect to the database. Is it running?");
  }

  console.error(err);

  if (!res.headersSent) {
    return res
      .status(err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
      .json({
        message: err.message || "Internal Server Error",
      });
  }

  next(err);
};

module.exports = errorHandler;
