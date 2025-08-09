const Joi = require("joi");

const medicalHistorySchema = Joi.object({
  patientID: Joi.number().integer().positive().required(),
  userID: Joi.number().integer().positive().required(),
  givenName: Joi.string().max(50),
  givenPhone: Joi.string().max(20),
  givenRelation: Joi.string().max(50),
  bloodGroup: Joi.string().max(3),
  bloodPressure: Joi.string().max(10),
  disease: Joi.string().allow("").max(65535),
  foodAllergy: Joi.string().allow("").max(65535),
  medicineAllergy: Joi.string().allow("").max(65535),
  anaesthesia: Joi.string().allow("").max(65535),
  meds: Joi.string().allow("").max(65535),
  selfMeds: Joi.string().allow("").max(65535),
  chestCondition: Joi.string().allow("").max(65535),
  neurologicalDisorder: Joi.string().allow("").max(65535),
  heartProblems: Joi.string().allow("").max(65535),
  infections: Joi.string().allow("").max(65535),
  mentalHealth: Joi.string().allow("").max(65535),
  drugs: Joi.string().allow("").max(65535),
  pregnant: Joi.string().allow("").max(65535),
  hereditaryDisease: Joi.string().allow("").max(65535),
  lumps: Joi.string().allow("").max(65535),
  cancer: Joi.string().allow("").max(65535),
  familyDisease: Joi.string().allow("").max(65535)
});

module.exports = { medicalHistorySchema };
