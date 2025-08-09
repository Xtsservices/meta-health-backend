const Joi = require("joi");

const ticketSchema = Joi.object({
  hospitalID: Joi.number().integer().min(1).required(),
  userID: Joi.number().integer().min(1).required(),
  type: Joi.string().max(100).required(),
  subject: Joi.string().max(1000).required(),
  // ticketFor: Joi.number().integer().min(1).required(),
  createdBy: Joi.number().integer().min(1).required(),
  module: Joi.string().max(255).required()
});

const ticketStatusSchema = Joi.object({
  status: Joi.number().valid(0, 1, 2).required(),
  reason: Joi.string().max(1000).required().allow("", null),
  closeStatus: Joi.number().integer().min(1).allow(null)
});

const ticketPrioritySchema = Joi.object({
  priority: Joi.number().valid(0, 1, 2).required()
});

const ticketAssignedSchema = Joi.object({
  assignedID: Joi.number().integer().min(1).required()
});

const dueDateSchema = Joi.object({
  dueDate: Joi.date().format("iso").required()
});

const ticketCommentSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
  userID: Joi.number().integer().positive().required(),
  comment: Joi.string().required()
});

module.exports = {
  ticketSchema,
  ticketStatusSchema,
  ticketPrioritySchema,
  ticketAssignedSchema,
  dueDateSchema,
  ticketCommentSchema
};
