const Joi = require("joi");

const hospitalSchema = Joi.object({
  name: Joi.string().max(100).required(),
  parent: Joi.string().max(100).allow(null, ""),
  website: Joi.string().max(100).uri().allow(null, ""),
  phoneNo: Joi.string().max(20).required(),
  email: Joi.string().max(100).email().allow(null, ""),
  address: Joi.string().max(255).required(),
  city: Joi.string().max(50).required(),
  district:Joi.string().max(50).required(),
  state: Joi.string().max(50).required(),
  country: Joi.string().max(50).required(),
  pinCode: Joi.string().max(15).required()
});

const updateHospitalSchema = Joi.object({
  name: Joi.string().max(100).allow(null, ""),
  parent: Joi.string().max(100).allow(null, ""),
  website: Joi.string().max(100).uri().allow(null, ""),
  phoneNo: Joi.string().max(20).allow(null, ""),
  email: Joi.string().max(100).email().allow(null, ""),
  address: Joi.string().max(255).allow(null, ""),
  city: Joi.string().max(50).allow(null, ""),
  state: Joi.string().max(50).allow(null, ""),
  district:Joi.string().max(50).allow(null, ""),
  country: Joi.string().max(50).allow(null, ""),
  pinCode: Joi.string().max(15).allow(null, "")
});

module.exports = { hospitalSchema, updateHospitalSchema };
