const Joi = require("joi");

const patientTimeLineSchema = Joi.object({
  hospitalID: Joi.number().integer().positive().required(), // hospital ID, primay key
  // userID: Joi.number().integer().positive().required(), // user doctor, primay key
  departmentID: Joi.number().integer().positive().required(), // department primary key
  wardID: Joi.number().integer().allow(null, ""),
  // 1 - outpatient,2 - inpatient, 3 - emergency , 21 - discharged
  patientStartStatus: Joi.number().integer().min(0).max(255).required(),
  // 1 - discharge success , 2 - DOPR , 3 - Abscond , 4 - left against medical advice , 5 - death
  dischargeType: Joi.number().integer().min(0).max(255),
  diet: Joi.string().allow(null, ""),
  advice: Joi.string().allow(null, ""),
  // 0 - no follow up , 1 - follow up true
  followUp: Joi.number().integer().min(0).max(255),
  followUpDate: Joi.string().allow(null, ""),
  icd: Joi.string().allow(null, ""), // icd
  zone: Joi.number().integer().min(0).max(255)
});

const dischargeSchema = Joi.object({
  // 1 - discharge success , 2 - DOPR , 3 - Abscond , 4 - left against medical advice , 5 - death
  dischargeType: Joi.number().integer().min(0).max(255).required(),
  diet: Joi.string().allow(null, ""),
  advice: Joi.string().allow(null, ""),
  diagnosis: Joi.string().allow(null, ""),
  prescription: Joi.string().allow(null, ""),
  // 0 - no follow up , 1 - follow up true
  followUp: Joi.number().integer().min(0).max(255),
  followUpDate: Joi.string().allow(null, ""),
  icd: Joi.string().allow(null, "") // icd
});

const updateTimeLineSchema = Joi.object({
  userID: Joi.number().integer().positive(), //not required for update opertion
  wardID: Joi.number().integer().positive()
});

// const patientTimelineData = {
//   userID: 123,
//   departmentID: 456,
//   pStartStatus: 1,
//   dischargeType: 2,
//   dischargeSummary: 'Patient discharged on schedule.',
//   followUp: 1,
//   followUpDate: '2023-07-15',
//   icd: 'A00.1, B01.2, C02.3'
// };

// const { error, value } = patientTimeLineSchema.validate(patientTimelineData);

// if (error) {
//   console.error('Validation error:', error.details);
// } else {
//   console.log('Data is valid:', value);
// }

module.exports = {
  patientTimeLineSchema,
  dischargeSchema,
  updateTimeLineSchema
};
