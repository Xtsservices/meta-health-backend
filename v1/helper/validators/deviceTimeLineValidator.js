const Joi = require("joi");

const deviceTimeLinesSchema = Joi.object({
  patientID: Joi.number().integer().positive().required(),
  deviceID: Joi.number().integer().positive().required(),
  addUserID: Joi.number().integer().positive().required()
});

const updateDeviceTimeLinesSchema = Joi.object({
  patientID: Joi.number().integer().positive().required(),
  removeUserID: Joi.number().integer().positive().required()
});

module.exports = { deviceTimeLinesSchema, updateDeviceTimeLinesSchema };
