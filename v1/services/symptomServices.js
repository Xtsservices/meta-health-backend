const pool = require("../db/conn");
const { symptomSchema } = require("../helper/validators/symptomValidator");
const {
  queryExistingSymptoms,
  insertsymptoms,
  queryGetAllSymptoms,
  queryGetSymptomByID,
  queryDeleteSymptomByID,
  queryGetSymptomsByID
} = require("../queries/symptomQueries");

/**
 * *** METHOD : POST
 * *** DESCRIPTION : insert symptoms list
 */
async function insertSymptomsList(timeLineID, userID, symptoms, patientID) {
  try {
    console.log("====================start=====================1");
    const validatedsymptoms = await Promise.all(
      symptoms.map(async (item) => {
        item.timeLineID = timeLineID;
        item.userID = userID;
        item.patientID = patientID;
        return await symptomSchema.validateAsync(item);
      })
    );
    console.log("====================start=====================2");

    const existingsymptoms = await pool.query(queryExistingSymptoms, [
      timeLineID,
      symptoms.map((item) => item.symptom)
    ]);
    // console.log(`existing symptoms : ${existingsymptoms[0][0].count}`)
    const existingCount = existingsymptoms[0][0].count;
    if (existingCount > 0)
      throw new Error("one or more symptoms with same name exist");

    const values = validatedsymptoms.map((item) => {
      return [
        item.timeLineID,
        item.userID,
        item.patientID,
        item.symptom.toLowerCase(),
        item.duration,
        item.durationParameter,
        item.conceptID,
        new Date() // Use current timestamp
      ];
    });
    console.log(`values = ${values}`);

    // Insert all symptoms into the database
    const addedSymptoms = await pool.query(insertsymptoms, [values]);
    const ids = [];
    for (let i = 0; i < values.length; i++) {
      ids.push(addedSymptoms[0].insertId + i);
    }
    const results = await pool.query(queryGetSymptomsByID, [ids]);

    return results[0];
  } catch (err) {
    if (err.isJoi === true) {
      throw new Error(err.message);
    }
    throw new Error(err.message);
  }
}

/**
 * *** METHOD : GET
 * *** DESCRIPTION : get all symptoms from timeLineID
 */
async function getAllSymptoms(patientID) {
  try {
    const results = await pool.query(queryGetAllSymptoms, [patientID]);

    return results[0];
  } catch (err) {
    throw new Error(err.message);
  }
}

/**
 * *** METHOD : GET
 * *** DESCRIPTION : get symptom from symptomID
 */
async function getSymptomFromID(timeLineID, symptomID) {
  try {
    const results = await pool.query(queryGetSymptomByID, [
      timeLineID,
      symptomID
    ]);

    return results[0][0];
  } catch (err) {
    throw new Error(err.message);
  }
}

/**
 * *** METHOD : DELETE
 * *** DESCRIPTION : delete symptom from symptomID
 */
async function deleteSymptomFromID(timeLineID, symptomID) {
  try {
    const results = await pool.query(queryDeleteSymptomByID, [
      timeLineID,
      symptomID
    ]);
    const { affectedRows } = results[0];
    if (!affectedRows) throw new Error("failed to delete");
    const message = "Success";
    return message;
  } catch (err) {
    throw new ErrorError(err.message);
  }
}

module.exports = {
  insertSymptomsList,
  getAllSymptoms,
  getSymptomFromID,
  deleteSymptomFromID
};
