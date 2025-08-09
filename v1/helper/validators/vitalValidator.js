const Joi = require("joi");

const vitalsSchema = Joi.object({
  userID: Joi.number().integer().positive().required(),
  patientID: Joi.number().integer().positive().required(),
  pulse: Joi.number().integer().min(0),
  pulseTime: Joi.date().allow(null, ""),
  temperature: Joi.number().min(0),
  temperatureTime: Joi.date().allow(null, ""),
  oxygen: Joi.number().integer().min(0).max(255),
  oxygenTime: Joi.date().allow(null, ""),
  hrv: Joi.number().integer().min(0).max(255),
  hrvTime: Joi.date().allow(null, ""),
  respiratoryRate: Joi.number().integer().min(0).max(40),
  respiratoryRateTime: Joi.date().allow(null, ""),
  bp: Joi.string().max(10).allow(null, ""),
  bpTime: Joi.date().allow(null, ""),
  ward: Joi.string().max(500).allow(null, ""),
  age: Joi.number().integer().min(0)
});

module.exports = { vitalsSchema };
