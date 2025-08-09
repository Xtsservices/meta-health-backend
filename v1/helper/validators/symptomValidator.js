const Joi = require("joi");

const symptomSchema = Joi.object({
  timeLineID: Joi.number().integer().required(),
  userID: Joi.number().integer().required(),
  patientID: Joi.number().integer().required(),
  conceptID: Joi.number().integer().required(),
  symptom: Joi.string().min(3).max(100).required(),
  duration: Joi.string().min(1).max(200).allow(null, ""),
  durationParameter: Joi.string().min(1).max(50).required()
});

module.exports = { symptomSchema };
