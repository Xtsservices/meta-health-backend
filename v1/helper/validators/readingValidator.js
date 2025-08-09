const Joi = require('joi');

const readingsSchema = Joi.object({
  timeLineID:Joi.number().integer().min(1).required(),
  hubID: Joi.number().integer().min(1).required(),
  deviceID: Joi.number().integer().min(1).required(),
  temperature: Joi.number().required(),
  battery: Joi.number().integer().min(0).max(255).required(),
  deviceTime: Joi.number().integer().min(0).required(),
  uploadTime: Joi.number().integer().min(0).required(), 
});

module.exports = {readingsSchema};
