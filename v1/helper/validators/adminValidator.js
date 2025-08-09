const Joi = require("joi");

const adminSchema = Joi.object({
  email: Joi.string().email().min(3).max(100).required(),
  password: Joi.string()
    .min(8)
    .max(100)
    .required()
    .pattern(
      new RegExp(
        "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]+$"
      )
    ),
  countryCode: Joi.string().min(0).max(10).allow(null, ""),
  phoneNo: Joi.string().max(20).allow(null, ""),
  firstName: Joi.string().max(50).required(),
  lastName: Joi.string().max(50).allow(null, ""),
  dob: Joi.date().allow(null, ""),
  gender: Joi.number().max(2).required(), // 1 -male, 2- female
  address: Joi.string().max(100).allow(null, ""),
  city: Joi.string().max(50).allow(null, ""),
  state: Joi.string().max(50).allow(null, ""),
  pinCode: Joi.number().integer().allow(null, ""),
  scope: Joi.string().required()
});

const adminUpdateSchema = Joi.object({
  countryCode: Joi.string().min(0).max(10).allow(null, ""),
  phoneNo: Joi.string().max(20).allow(null, ""),
  firstName: Joi.string().max(50).allow(null, ""),
  lastName: Joi.string().max(50).allow(null, ""),
  dob: Joi.date().allow(null, ""),
  gender: Joi.number().max(2).allow(null, ""), // 1 -male, 2- female
  address: Joi.string().max(100).allow(null, ""),
  city: Joi.string().max(50).allow(null, ""),
  state: Joi.string().max(50).allow(null, ""),
  pinCode: Joi.number().integer().allow(null, "")
});

module.exports = { adminSchema, adminUpdateSchema };
