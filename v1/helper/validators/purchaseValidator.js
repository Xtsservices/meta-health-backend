const Joi = require("joi");

const purchaseSchema = Joi.object({
  hospitalID: Joi.number().integer().required(),
  purchaseDate: Joi.date().iso().required(),
  purchaseType: Joi.string().valid("online", "offline").required(),
  hubCount: Joi.number().integer().min(0).required(),
  deviceCount: Joi.number().integer().min(0).required(),
  totalCost: Joi.number().precision(2).required().min(0)
});

const udpatePurchaseSchema = Joi.object({
  purchaseDate: Joi.date().iso(),
  purchaseType: Joi.string().valid("online", "offline"),
  hubCount: Joi.number().integer().min(0),
  deviceCount: Joi.number().integer().min(0),
  totalCost: Joi.number().precision(2).min(0)
});

module.exports = { purchaseSchema, udpatePurchaseSchema };
