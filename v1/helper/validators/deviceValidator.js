const Joi = require("joi");

const schema = Joi.object({
  deviceName: Joi.string().min(3).max(50).required(),
  deviceCustomName: Joi.string().min(3).max(50),
  deviceAddress: Joi.string().min(3).max(50).required()
});

module.exports = { schema };
