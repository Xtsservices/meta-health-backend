const Joi = require("joi");
const transferPatientSchema = Joi.object({
  hospitalID: Joi.number().integer().positive().required(),
  patientID: Joi.number().integer().positive().required(),
  transferType: Joi.number().integer().min(0).max(255),
  bp: Joi.string().max(10).allow(null, ""),
  temp: Joi.number().min(0).allow(null, ""),
  oxygen: Joi.number().integer().min(0).max(255).allow(null, ""),
  pulse: Joi.number().integer().min(0).allow(null, ""),
  hospitalName: Joi.string().allow(null, ""),
  reason: Joi.string().allow(null, ""),
  timelineID: Joi.number().integer().positive().required(),
  newTimelineID: Joi.number().integer().positive().allow(null),
  relativeName: Joi.string().allow(null, "").required()
});

module.exports = {
  transferPatientSchema
};
