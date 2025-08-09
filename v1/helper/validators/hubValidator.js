const Joi = require("joi");

const schema = Joi.object({
  hubName: Joi.string().min(3).max(50),
  hubCustomName: Joi.string().min(3).max(50),
  hubAddress: Joi.string().min(3).max(50).required(),
  hubProtocolAddress: Joi.string().min(3).max(50).required()
});

module.exports = { schema };
