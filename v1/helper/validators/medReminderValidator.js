const Joi = require("joi");

const reminderSchema = Joi.object({
  medicineID: Joi.number().integer().required(),
  dosageTime: Joi.date().timestamp().required()
});

const updateReminderSchema = Joi.object({
  userID: Joi.number().integer().required(),
  // 0 - created, 1 - completed, 2 - not required
  doseStatus: Joi.number().integer().valid(1, 2).required(),
  note: Joi.string().allow(null, "")
});

module.exports = { reminderSchema, updateReminderSchema };
