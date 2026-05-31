const express = require("express");
const jwtMiddleware = require("../middleware/jwtMiddleware");

const router = express.Router();
const { register, logon, logoff } = require("../controllers/userController");

router.route("/register").post(register);
router.route("/logon").post(logon);

router.post("/logoff", jwtMiddleware, logoff);

module.exports = router;
