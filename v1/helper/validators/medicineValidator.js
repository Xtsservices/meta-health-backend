const Joi = require("joi");

const medicineSchema = Joi.object({
  timeLineID: Joi.number().integer().required(),
  patientID: Joi.number().integer().required(),
  userID: Joi.number().integer().required(),
  medicineType: Joi.number().integer().required(),
  medicineName: Joi.string().max(255).required(),
  daysCount: Joi.number().integer().required(),
  doseCount: Joi.number().integer().required(),
  Frequency: Joi.number().integer().required(),
  medicationTime: Joi.string().max(1000).required(),
  doseTimings: Joi.string().allow("").max(5000).required(), // Hour:Min , comma seperated (9:30,12:30)
  notes: Joi.string().allow("").max(5000), // comma seperated(note 1, null,note 2)
});

// TEST //
// Validate an object against the schema
// const validateMedicine = (medicine) => {
//   return medicineSchema.validate(medicine);
// };

// const medicine = {
//   timeLineID: 1,
//   userID: 2,
//   medicineType: 1,
//   medicineName: 'Example Medicine',
//   daysCount: 7,
//   doseCount: 3,
//   medicationTime: '10:00 AM',
//   days: '1,2',
//   doseTimings: '9:30, 10:00',
//   notes: 'Take with water,null'
// };

// const { error, value } = validateMedicine(medicine);

// if (error) {
//   console.log('Validation error:', error.details);
// } else {
//   console.log('Validation passed. Medicine:', value);
// }

module.exports = { medicineSchema };
