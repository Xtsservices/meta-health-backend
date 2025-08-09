const {
  serverError,
  missingBody,
  resourceNotFound,
  duplicateRecord,
  notAllowed,
  unauthorized
} = require("../utils/errors");
const pool = require("../db/conn");
const {
  triageSchema,
  triageFormSchema
} = require("../helper/validators/triageValidator");
const {
  patientTimeLineSchema
} = require("../helper/validators/patientTimeLineValidator");
const { patientStatus } = require("../utils/patientUtils");
const queryInsertPatientTimeLine = `INSERT INTO patientTimeLine (hospitalID,patientID,
    patientStartStatus,zone) 
    VALUES (?,?,?,?)`;
const querySetID = "SET @patientID = LAST_INSERT_ID()";
const querypatientActiveTimeline = `SELECT id FROM patientTimeLine where patientID=? AND hospitalID=? AND patientEndStatus IS NULL`;

const queryUpdatePatientByID = `UPDATE patients SET zone=?,isViewed=0
     WHERE hospitalID = ? AND id = ?`;

const queryUpdatePatientTimelineWardByID = `
     UPDATE patientTimeLine 
     SET wardID = ? , zone = ?
     WHERE hospitalID = ? AND patientID = ?
 `;

const insertTriage = async (req, res) => {
  let connection;
  const triageData = req.body;
  const patientID = req.params.patientID;
  const hospitalID = req.params.hospitalID;
  const wardID = parseInt(triageData.ward, 10);
  const zone = parseInt(triageData.zone);
  try {
    // Validate the triage data

    connection = await pool.getConnection();
    await connection.beginTransaction();
    const [timeline] = await connection.query(querypatientActiveTimeline, [
      patientID,
      hospitalID
    ]);
    if (!timeline[0].id) {
      return notAllowed(res, "patient already has an active timeline");
    }
    // SQL query to insert the triage record
    // const patientTimelineData = {
    //   hospitalID,
    //   patientID: patientID,
    //   patientStartStatus: patientStatus.emergency,
    //   zone: triageData.zone,
    // };
    // const response = await connection.query(
    //   queryInsertPatientTimeLine,
    //   Object.values(patientTimelineData)
    // );
    // await connection.query(querySetID);
    const sql = "INSERT INTO triageForm SET ?";
    triageData.patientTimelineID = timeline[0].id;
    const { error, value } = triageFormSchema.validate(triageData);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    await connection.query(sql, triageData);
    await connection.query(queryUpdatePatientByID, [
      zone,
      hospitalID,
      patientID
    ]);
    await connection.query(queryUpdatePatientTimelineWardByID, [
      wardID,
      triageData.zone,
      hospitalID,
      patientID
    ]);
    await connection.commit();
    res.status(200).send({ message: "success" });
  } catch (err) {
    await connection.rollback();
    return serverError(res, { message: err.message });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

function getTriageByTimelineID(req, res) {
  // Get the timelineID from the request parameters
  const timelineID = req.params.timelineID;

  // SQL query to retrieve triage records by timelineID
  const sql = "SELECT * FROM triageForm WHERE patientTimelineID = ?";

  // Execute the SQL query
  connection.query(sql, [timelineID], (err, results) => {
    if (err) {
      //   console.error("Error retrieving triage records:", err);
      return serverError(res, "Something went wrong");
    }
    // Check if any triage records were found
    if (results.length === 0) {
      return resourceNotFound(res, "No result found");
    }
    // Return triage records
    return res.status(200).send({ results, message: "success" });
  });
}

module.exports = { insertTriage, getTriageByTimelineID };
