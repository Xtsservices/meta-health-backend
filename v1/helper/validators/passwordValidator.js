const Joi = require("joi");

const passwordSchema = Joi.object({
  password: Joi.string()
    .min(8)
    .max(100)
    .required()
    .pattern(
      new RegExp(
        "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]+$"
      )
    )
});

module.exports = { passwordSchema };
