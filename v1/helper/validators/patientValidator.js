const Joi = require("joi");

const patientSchema = Joi.object({
  hospitalID: Joi.number().integer().positive().required(),
  pID: Joi.string().max(50).required(),
  pUHID: Joi.number().integer(),
  ptype: Joi.number().integer().min(0).max(255).required(), // 1- outpatient , 2- inpatient , 3- emergency,21 - discharged
  zone: Joi.number().integer().min(0).max(255),
  category: Joi.number().integer().min(0).max(255).required(), // 1- neonate , 2- child , 3- adult
  dob: Joi.date(),
  gender: Joi.number().integer().min(0).max(255), // 1 - male , 2 -female
  age: Joi.string(),
  weight: Joi.number().min(0),
  height: Joi.number().min(0).max(255),
  pName: Joi.string().max(50).required(),
  phoneNumber: Joi.string().max(20).allow(null, ""),
  email: Joi.string().email().max(50).allow(null, ""),
  address: Joi.string().max(100).allow(null, ""),
  city: Joi.string().max(50).allow(null, ""),
  state: Joi.string().max(50).allow(null, ""),
  pinCode: Joi.string().max(20).allow(null, ""),
  referredBy: Joi.string().max(50).allow(null, ""),
  insurance: Joi.number().integer().valid(0, 1),
  insuranceCompany: Joi.string().max(100).allow(null, ""),
  insuranceNumber: Joi.string().max(100).allow(null, ""),
  insurance: Joi.number().integer().valid(0, 1),
  addedBy: Joi.number().required()
});

const updatePatientSchema = Joi.object({
  pUHID: Joi.number().integer(),
  category: Joi.number().integer().min(0).max(255), // 1- neonate , 2- child , 3- adult
  dob: Joi.date(),
  gender: Joi.number().integer().min(0).max(255), // 1 - male , 2 -female
  weight: Joi.number().min(0),
  height: Joi.number().min(0).max(255),
  pName: Joi.string().max(50),
  phoneNumber: Joi.string().max(20).allow(null, ""),
  email: Joi.string().email().max(50).allow(null, ""),
  address: Joi.string().max(100).allow(null, ""),
  age: Joi.string(),
  city: Joi.string().max(50).allow(null, ""),
  state: Joi.string().max(50).allow(null, ""),
  pinCode: Joi.string().max(20).allow(null, ""),
  referredBy: Joi.string().max(50).allow(null, ""),
  insurance: Joi.number().integer().valid(0, 1),
  insuranceCompany: Joi.string().max(100).allow(null, ""),
  insuranceNumber: Joi.string().max(100).allow(null, ""),
  ptype: Joi.number().integer().min(0).max(255),
  zone: Joi.number().integer().min(0).max(255)
});

const dateValidation = Joi.object({
  date: Joi.date().iso()
});

// TEST
// const patientData = {
//     pID: '123456',
//     pUHID: 123456,
//     ptype: 2,
//     dob: '2000-01-01',
//     gender: 1,
//     weight: 70,
//     height: 180,
//     pName: 'John Doe',
//     phoneNumber: '1234567890',
//     email: 'john.doe@example.com',
//     address: '123 Main Street',
//     city: 'New York',
//     state: 'NY',
//     pinCode: '12345',
//     referredBy: 'Dr. Smith'
//   };

//   const { error, value } = patientSchema.validate(patientData);

//   if (error) {
//     console.error('Validation error:', error.details);
//   } else {
//     console.log('Data is valid:', value);
//   }

module.exports = { patientSchema, updatePatientSchema, dateValidation };
