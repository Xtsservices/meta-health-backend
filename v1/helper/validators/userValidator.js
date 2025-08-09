const Joi = require("joi");

const schema = Joi.object({
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
  departmentID: Joi.number().integer().allow(null, ""),
  role: Joi.number().integer().required(),
  scope: Joi.string().max(255).allow(null, ""),
  countryCode: Joi.string().max(10).allow(null, ""),
  phoneNo: Joi.string().max(20).allow(null, ""),
  firstName: Joi.string().max(50).allow(null, ""),
  lastName: Joi.string().max(50).allow(null, ""),
  dob: Joi.date(),
  gender: Joi.number(), // 1 -male, 2- female
  address: Joi.string().max(100).allow(null, ""),
  city: Joi.string().max(50).allow(null, ""),
  state: Joi.string().max(50).allow(null, ""),
  pinCode: Joi.number().integer(),
  reportTo: Joi.number().integer().allow(null, ""),
});

const updateUserSchema = Joi.object({
  countryCode: Joi.string().max(10).allow(null, ""),
  phoneNo: Joi.string().max(20).allow(null, ""),
  firstName: Joi.string().max(50).allow(null, ""),
  lastName: Joi.string().max(50).allow(null, ""),
  dob: Joi.date(),
  gender: Joi.number(), // 1 -male, 2- female
  address: Joi.string().max(100).allow(null, ""),
  city: Joi.string().max(50).allow(null, ""),
  state: Joi.string().max(50).allow(null, ""),
  pinCode: Joi.number().integer(),
  image: Joi.string().allow(null, "")
});

const adminUpdateUserSchema = Joi.object({
  departmentID: Joi.number().integer(),
  role: Joi.number().integer(),
  countryCode: Joi.string().max(10).allow(null, ""),
  phoneNo: Joi.string().max(20).allow(null, ""),
  firstName: Joi.string().max(50).allow(null, ""),
  lastName: Joi.string().max(50).allow(null, ""),
  dob: Joi.date(),
  gender: Joi.number(), // 1 -male, 2- female
  address: Joi.string().max(100).allow(null, ""),
  city: Joi.string().max(50).allow(null, ""),
  state: Joi.string().max(50).allow(null, ""),
  pinCode: Joi.number().integer()
});

const adminUpdateStaffSchema = Joi.object({
  departmentID: Joi.number().integer().allow(null, 0),
  role: Joi.number().integer().allow(null, 0),
  countryCode: Joi.string().max(10).allow(null, ""),
  phoneNo: Joi.string().max(20).allow(null, ""),
  firstName: Joi.string().max(50).allow(null, ""),
  lastName: Joi.string().max(50).allow(null, ""),
  dob: Joi.date().allow(null),
  gender: Joi.number().max(2).allow(null, 0), // 1 -male, 2- female
  address: Joi.string().max(100).allow(null, ""),
  city: Joi.string().max(50).allow(null, ""),
  state: Joi.string().max(50).allow(null, ""),
  pinCode: Joi.number().integer().allow(null, 0),
  image: Joi.string().allow(null, "")
});

const customerCareschema = Joi.object({
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
  countryCode: Joi.string().max(10).allow(null, ""),
  phoneNo: Joi.string().max(20).allow(null, ""),
  firstName: Joi.string().max(50).allow(null, ""),
  lastName: Joi.string().max(50).allow(null, ""),
  dob: Joi.date(),
  gender: Joi.number(), // 1 -male, 2- female
  address: Joi.string().max(100).allow(null, ""),
  pinCode: Joi.number().integer(),
  multiState: Joi.array().items(Joi.string().trim().min(1)).allow(null).default([]),
  multiDist: Joi.array().items(Joi.string().trim().min(1)).allow(null).default([]),
  multiCity: Joi.array().items(Joi.string().trim().min(1)).allow(null).default([]),
});

module.exports = {
  schema,
  updateUserSchema,
  adminUpdateUserSchema,
  adminUpdateStaffSchema,
  customerCareschema
};
