const Joi = require("joi");

const testSchema = Joi.object({
  timeLineID: Joi.number().integer().required(),
  patientID: Joi.number().integer().required(),
  userID: Joi.number().integer().required(),
  test: Joi.string().required(),
  loinc_num_: Joi.string().required(),
  department: Joi.string().required(),
  testID: Joi.number().integer().required()
});

// Joi schema validation for test pricing
const testPricingSchema = Joi.object({
  testName: Joi.string().required(),
  lonicCode: Joi.string().required(),
  hsn: Joi.string().required(),
  gst: Joi.number().integer().min(0).max(100).required(),
  testPrice: Joi.number().positive().required(),
  id: Joi.number().positive().required()
});

module.exports = { testSchema, testPricingSchema };
