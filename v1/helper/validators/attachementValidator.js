const Joi = require("joi");

const attachementSchema = Joi.object({
  timeLineID: Joi.number().integer().required(),
  userID: Joi.number().integer().required(),
  fileName: Joi.string().min(3).max(100).required(),
  givenName: Joi.string().min(3).max(100),
  mimeType: Joi.string().min(3).max(50).required(),
  attachement: Joi.string().min(3).max(50).required()
});

module.exports = { attachementSchema };
