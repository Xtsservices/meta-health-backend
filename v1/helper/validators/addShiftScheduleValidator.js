const Joi = require("joi");

const staffSchedulesSchema = Joi.object({
  userID: Joi.number().integer().positive().required(),
  departmentID: Joi.number().integer().positive().required(),
  wardID: Joi.number().allow(null, ""),
  fromDate: Joi.date().iso().required(),
  toDate: Joi.date().iso().required(),
  shiftTimings: Joi.string().min(5).max(500).required(), 
  scope: Joi.number().integer().min(0).max(255).required(),
}).options({ abortEarly: false });

module.exports = { staffSchedulesSchema };