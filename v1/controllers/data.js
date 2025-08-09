const {
  serverError,
  missingBody,
  resourceNotFound,
  duplicateRecord,
  notAllowed
} = require("../utils/errors");
const { foodAllergies, medcineAllergies } = require("../data/allergies");
const { symptoms } = require("../data/symptoms");
const {
  cancerTypes,
  cardioVascular,
  heartProblems,
  boneProblems,
  chestConditions
} = require("../data/problems");
const { uniqueMedicineArray } = require("../data/medicines");
const { bloodGroups } = require("../data/bloodGroups");
const { relations } = require("../data/relations");
const { anesthesia_allergy_list } = require("../data/anethesia");
const dataServices = require("../services/dataService");
const pool = require("../db/conn");
const { uniqueSurgeryArray } = require("../data/surgeryTypes");

const administrativeRegions = async (req, res) => {
  try {
    const statesQuery = `
      SELECT DISTINCT stateCode, state
      FROM administrativeRegions
      ORDER BY state ASC
    `;

    const districtsQuery = `
      SELECT DISTINCT districtCode, district, stateCode, state
      FROM administrativeRegions
      ORDER BY district ASC
    `;

    const citiesQuery = `
      SELECT DISTINCT cityCode, city, districtCode, district, stateCode, state
      FROM administrativeRegions
      ORDER BY city ASC
    `;

    // Run all 3 queries in parallel
    const [states] = await pool.query(statesQuery);
    const [districts] = await pool.query(districtsQuery);
    const [cities] = await pool.query(citiesQuery);

    res.status(200).send({
      message: "success",
      states,
      districts,
      cities
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

/**
 * *** METHOD :  GET
 * *** DESCRIPTION : GET FOOD ALLERGIES
 */
const getFoodAllergies = async (req, res) => {
  try {
    res.status(200).send({
      message: "success",
      foodAllergies: foodAllergies
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

/**
 * ** METHOD : GET
 * ** DESCRIPTION : GET MEDICINE ALLERGIES
 */
const getMedicineAllergies = async (req, res) => {
  try {
    res.status(200).send({
      message: "success",
      medcineAllergies: medcineAllergies
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

const getAnethesiaAllergyList = async (req, res) => {
  try {
    res.status(200).send({
      message: "success",
      anesthesia: anesthesia_allergy_list
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

/**
 * *** METHOD :  GET
 * *** DESCRIPTION : GET SYMPTOMS
 */
const getSymptoms = async (req, res) => {
  const { text } = req.body;
  const fetch_Symptom = `SELECT id, concept_id, type_id, term
  FROM searchsymptoms_term_all
  WHERE LOWER(term) LIKE LOWER('${text}%') LIMIT 100`;
  try {
    const results = await pool.query(fetch_Symptom);
    res.status(200).send({
      message: "success",
      symptoms: results[0]
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

const getAllLionicCodeData = async (req, res) => {
  const { text } = req.body;
  // const fetch_lionic2 = `SELECT *
  // FROM loinc_terms
  // WHERE LOWER(long_common_name_) LIKE LOWER('${text}%') LIMIT 100`;

  const fetch_lionic = `SELECT *
  FROM LabTests
  WHERE LOWER(LOINC_Name) LIKE LOWER('${text}%') LIMIT 100`;
  try {
    const results = await pool.query(fetch_lionic);
    res.status(200).send({
      message: "success",
      data: results[0]
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

const getLionicCode = async (req, res) => {
  const { hospitalID } = req.params;
  if (!hospitalID) return missingBody(res, "hospitalID is missing");

  const { text } = req.body;

  const fetchLabAccess = `SELECT scope FROM users where role = 9999 and hospitalID = ?`;

  const fetchLabTestsQuery = `SELECT *
  FROM LabTests
  WHERE LOWER(LOINC_Name) LIKE LOWER('${text}%') LIMIT 100`;

  const fetchLabQueryPathologyRadiology = `SELECT LabTests.*
  FROM LabTests
   LEFT JOIN labTestPricing ON LabTests.id = labTestPricing.labTestID
  WHERE labTestPricing.hospitalID =? AND LOWER(LabTests.LOINC_Name) LIKE LOWER('${text}%') LIMIT 100`;

  const fetchLabQueryPathologyOrRadiology = `SELECT LabTests.*
  FROM LabTests
   LEFT JOIN labTestPricing ON LabTests.id = labTestPricing.labTestID
  WHERE labTestPricing.hospitalID =? AND LabTests.Department=? AND LOWER(LabTests.LOINC_Name) LIKE LOWER('${text}%') LIMIT 100`;

  try {
    let [response] = await pool.query(fetchLabAccess, [hospitalID]);

    if (response[0].scope == null) {
      const results = await pool.query(fetchLabTestsQuery);
      res.status(200).send({
        message: "success",
        data: results[0]
      });
    } else {
      let scopeSplit = response[0].scope.split("#");

      if (scopeSplit.includes("5009") && !scopeSplit.includes("5010")) {
        // If user has ONLY Pathology (5009) access
        const results = await pool.query(fetchLabQueryPathologyOrRadiology, [
          hospitalID,
          "pathology"
        ]);
        res.status(200).send({
          message: "success",
          data: results[0]
        });
      } else if (scopeSplit.includes("5010") && !scopeSplit.includes("5009")) {
        // If user has ONLY Radiology (5010) access
        const results = await pool.query(fetchLabQueryPathologyOrRadiology, [
          hospitalID,
          "radiology"
        ]);
        res.status(200).send({
          message: "success",
          data: results[0]
        });
      } else if (scopeSplit.includes("5009") && scopeSplit.includes("5010")) {
        // If user has Pathology (5009) and Radiology (5010) access, fetch data based on hopital id
        const results = await pool.query(fetchLabQueryPathologyRadiology, [
          hospitalID
        ]);

        res.status(200).send({
          message: "success",
          data: results[0]
        });
      } else {
        const results = await pool.query(fetchMedicineQuery);
        res.status(200).send({
          message: "success",
          data: results[0]
        });
      }
    }
  } catch (err) {
    serverError(res, err.message);
  }
};

const getAllTest = async (req, res) => {
  const { text } = req.body;
  // const fetch_test = `SELECT name
  // FROM TestList
  // WHERE LOWER(name) LIKE LOWER('%${text}%');`;

  const fetch_test = `SELECT *
  FROM LabTests
  WHERE LOWER(LOINC_Name) LIKE LOWER('%${text}%');`;

  try {
    const results = await pool.query(fetch_test);
    res.status(200).send({
      message: "success",
      data: results[0]
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

/**
 * *** METHOD :  GET
 * *** DESCRIPTION : GET CANCER TYPES
 */
const getCancerTypes = async (req, res) => {
  try {
    res.status(200).send({
      message: "success",
      cancerTypes: cancerTypes
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

/**
 * *** METHOD :  GET
 * *** DESCRIPTION : GET BONE PROBLEMS
 */
const getBoneProblems = async (req, res) => {
  try {
    res.status(200).send({
      message: "success",
      boneProblems: boneProblems
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

/**
 * ** METHOD :  GET
 * ** DESCRIPTION : GET CHEST CONDITIONS
 */
const getChestConditions = async (req, res) => {
  try {
    res.status(200).send({
      message: "success",
      boneProblems: chestConditions
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

/**
 * ** METHOD :  GET
 * ** DESCRIPTION : GET CARDIOVASCULAR CONDITIONS
 */
const getCardiovascularCoditions = async (req, res) => {
  try {
    res.status(200).send({
      message: "success",
      boneProblems: cardioVascular
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

/**
 * ** METHOD :  GET
 * ** DESCRIPTION : GET HEART PROBLEMS
 */
const getHeartProblems = async (req, res) => {
  try {
    res.status(200).send({
      message: "success",
      boneProblems: heartProblems
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

/**
 * *** METHOD :  GET
 * *** DESCRIPTION : GET BONE GROUPS
 */
const getBloodTypes = async (req, res) => {
  try {
    res.status(200).send({
      message: "success",
      bloodGroups: bloodGroups
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

/**
 * *** METHOD :  GET
 * *** DESCRIPTION : GET RELATIONS
 */
const getRelations = async (req, res) => {
  try {
    res.status(200).send({
      message: "success",
      relations: relations
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

const getPincodeDistrictData = async (req, res) => {
  try {
    const district = req.params.district;
    if (!district) return missingBody(res, "district missing");
    const result = await dataServices.getPincodeDistrictData(district);
    res.status(200).send({
      message: "success",
      data: result[0]
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

/**
 * *** METHOD :  GET
 * *** DESCRIPTION : GET BONE GROUPS
 */
const getSurgeryTypes = async (req, res) => {
  try {
    res.status(200).send({
      message: "success",
      surgeryTypes: uniqueSurgeryArray
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

module.exports = {
  administrativeRegions,
  getAllLionicCodeData,
  getFoodAllergies,
  getMedicineAllergies,
  getSymptoms,
  getCancerTypes,
  getBoneProblems,
  getChestConditions,
  getHeartProblems,
  getCardiovascularCoditions,
  getBloodTypes,
  getRelations,
  getPincodeDistrictData,
  getAllTest,
  getAnethesiaAllergyList,
  getSurgeryTypes,
  getLionicCode
};
