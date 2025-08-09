const Joi = require("joi");

const schema = Joi.object({
  name: Joi.string().min(3).max(50).required(),
  description: Joi.string().allow(null, ""),
  totalBeds: Joi.number().integer().min(0),
  availableBeds: Joi.number().integer().min(0).allow(null),
  Attendees: Joi.string().allow(null, ""),
  floor: Joi.string().min(3).max(500).required(),
  location: Joi.string().allow(null),
  room: Joi.string().min(3).max(500).required(),
  price: Joi.number().integer().min(0),
  amenities: Joi.array().items(Joi.string().min(1)).allow(null)
});

module.exports = { schema };
