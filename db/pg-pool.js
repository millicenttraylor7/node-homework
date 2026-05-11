const { Pool } = require("pg");
require("dotenv").config();

const connectionString =
  process.env.NODE_ENV === "test"
    ? process.env.TEST_DATABASE_URL
    : process.env.DATABASE_URL;

const pool = new Pool({
  connectionString,
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
});
module.exports = pool;
