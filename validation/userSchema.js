const Joi = require("joi");

const userSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().required(),

  name: Joi.string().trim().min(3).max(30).required(),

  password: Joi.string()
    .trim()
    .min(8)
    .pattern(/^(?=.*\d).+$/)
    .required()
    .messages({
      "string.pattern.base": "Password must contain at least one number.",
    }),
});

module.exports = { userSchema };
