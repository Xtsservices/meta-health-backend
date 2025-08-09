const Joi = require("joi");

const prescriptionSchema = Joi.object({
  hospitalID: Joi.number().integer().positive().required(), // hospital ID, primay key
  userID: Joi.number().integer().positive().required(), // user doctor, primay key
  timeLineID: Joi.number().integer().positive().required(), // department primary key
  patientID: Joi.number().integer().positive().required(), // department primary key
  advice: Joi.string().allow(null, ""),
  followUp: Joi.number().integer().min(0).max(255),
  followUpDate: Joi.string().allow(null, ""),
  medicineStartDate: Joi.string().allow(null, ""),
  medicine: Joi.string().allow(null, ""),
  medicineType: Joi.string().allow(null, ""),
  medicineTime: Joi.string().allow(null, ""),
  medicineDuration: Joi.string().allow(null, ""),
  medicineFrequency: Joi.string().allow(null, ""),
  test: Joi.string().allow(null, ""),
  meddosage: Joi.number().integer().max(999),
  dosageUnit: Joi.string().allow(null, "")

  // 1 - discharge success , 2 - DOPR , 3 - Abscond , 4 - left against medical advice , 5 - death
  // diet: Joi.string().allow(null, ""),
  // 0 - no follow up , 1 - follow up true
  // medicineNotes: Joi.string().allow(null, ""),
  // notes: Joi.string().allow(null, ""),
  // diagnosis: Joi.string().allow(null, ""),
});
module.exports = { prescriptionSchema };
