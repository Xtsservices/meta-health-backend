const Joi = require("joi");

const pocusSchema = Joi.object({
  userID: Joi.number().integer().positive().required(),
  abdomen: Joi.string().allow(null, ""),
  abg: Joi.string().allow(null, ""),
  cxr: Joi.string().allow(null, ""),
  ecg: Joi.string().allow(null, ""),
  heart: Joi.string().allow(null, ""),
  ivc: Joi.string().allow(null, ""),
  leftPleuralEffusion: Joi.string().allow(null, ""),
  leftPneumothorax: Joi.string().allow(null, ""),
  rightPleuralEffusion: Joi.string().allow(null, ""),
  rightPneumothorax: Joi.string().allow(null, "")
});

module.exports = { pocusSchema };
