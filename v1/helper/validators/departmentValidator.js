const Joi = require("joi");

const schema = Joi.object({
  name: Joi.string().min(3).max(50).required(),
  description: Joi.string().allow(null, "")
});

module.exports = { schema };
