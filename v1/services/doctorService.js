const pool = require("../db/conn");
const {
  queryInsertPatientDoctor,
  queryInsertPatientDoctorForHanshake,
  queryDoctors,
  queryDeactivateExistingDoctors,
  queryFetchDoctorsByPatientTimelineID,
  queryDeactivateALLDoctors,
  queryUpdateDoctorStatusById,
  queryUpdateAllDoctorStatus,
  queryGetDoctorStatusById,
  queryInsertDoctorHandover,
  queryGetAllDoctorStatus,
  queryInsertBulkPatientDoctor,
  queryInsertBulkDoctorHandover,
  queryGetAllNurse,
  queryGetAllAppoinmentsList,
  queryUpdatePatientIsViewed
} = require("../queries/doctorQueries");

const {
  queryCheckPatientTimeLinePresent,
  queryCheckPatientTimeLine
} = require("../queries/patientTimeLine");
const { status } = require("../utils/tickets");

const addDoctor = async (
  connection,
  patientTimeLineId,
  doctorId,
  category,
  hospitalID,
  purpose,
  sentScope
) => {
  const scope = sentScope ? sentScope : "doctor";
  try {
    // Check whether patientTimeLine exists
    let [result] = await connection.query(queryCheckPatientTimeLinePresent, [
      patientTimeLineId,
      hospitalID
    ]);

    if (result.length === 0) {
      return { status: 404, message: "Timeline not found or not active" };
    }
    // Check whether a primary doctor already exists for the patient
    console.log("Before quering doctor:::::::");
    [existingDoctors] = await connection.query(queryDoctors, [
      patientTimeLineId,
      hospitalID
    ]);
    if (category === "primary") {
      const primaryDoctor = existingDoctors.find(
        (el) => el.category == "primary" && el.active == true
      );
      if (primaryDoctor) {
        throw new Error("primary doctor already exist");
      }
    }
    ///////////////////////Check whether doctor with the userID provided already exist/////////////////
    const currentDoctor = existingDoctors.find(
      (el) => el.doctorID == doctorId && el.active == true
    );
    if (currentDoctor) {
      throw new Error("doctor already exist");
    } else {
      // Insert the new doctor record
      console.log("before inserting patient doctor:::");
      [result] = await connection.query(queryInsertPatientDoctor, [
        patientTimeLineId,
        doctorId,
        purpose,
        category,
        scope,
        hospitalID
      ]);

      //update isViewed is 0 (to display patient in latest patient list)
      const queryUpdateIsViewedByPatientTimelineId = `
    UPDATE patients p
    JOIN patientTimeLine pt ON p.id = pt.patientID
    SET p.isViewed = 0
    WHERE pt.id = ?;
`;
      const [updatePatient] = await connection.query(
        queryUpdateIsViewedByPatientTimelineId,
        [patientTimeLineId]
      );
      return {
        message: "success",
        status: 201,
        insertId: result.insertId,
        data: result
      };
    }
  } catch (error) {
    throw new Error(error.message);
  }
};

const removeDoctorbyId = async (
  connection,
  patientTimeLineId,
  doctorId,
  hospitalID
) => {
  try {
    // Check whether patientTimeLine exists
    let [result] = await connection.query(queryCheckPatientTimeLine, [
      patientTimeLineId,
      hospitalID
    ]);
    if (result.length === 0) {
      return { status: 403, message: "Timeline not found" };
    }
    // update the doctor active status
    [result] = await connection.query(queryDeactivateExistingDoctors, [
      patientTimeLineId,
      doctorId,
      hospitalID
    ]);

    return { status: 200 };
  } catch (error) {
    return { status: 500, message: error.message };
  }
};

const fetchAllDoctor = async (connection, patientTimeLineId, hospitalID) => {
  try {
    // Fetch all doctors with the given patientTimeLineID
    const [result] = await connection.query(
      queryFetchDoctorsByPatientTimelineID,
      [patientTimeLineId, hospitalID]
    );
    return { status: 200, data: result };
  } catch (error) {
    return { status: 500, message: error.message };
  }
};

const removeAllDoctor = async (connection, patientTimeLineId, hospitalID) => {
  try {
    // update the doctor active status
    [result] = await connection.query(queryDeactivateALLDoctors, [
      patientTimeLineId,
      hospitalID
    ]);
    return { status: 200 };
  } catch (error) {
    return { status: 500, message: error.message };
  }
};

const TransferPatientDoctorbyId = async (
  connection,
  hospitalID,
  timelineID,
  handshakingBy,
  handshakingFrom,
  handshakingTo,
  reason
) => {
  try {
    // Check whether patientTimeLine exists

    let [result] = await connection.query(queryCheckPatientTimeLinePresent, [
      timelineID,
      hospitalID
    ]);
    if (result.length === 0) {
      return { status: 403, message: "Timeline not found" };
    }
    if (handshakingBy == handshakingTo)
      return {
        status: 401,
        message: "Handshake to the same doctor is not allowed"
      };
    const [queryResult] = await connection.query(queryGetDoctorStatusById, [
      handshakingFrom,
      timelineID,
      hospitalID
    ]);
    const [updateResult] = await connection.query(queryUpdateDoctorStatusById, [
      reason,
      handshakingFrom,
      timelineID,
      hospitalID
    ]);

    if (!updateResult.changedRows) {
      return {
        status: 500,
        message: `update failed while handshaking with doctor id : ${handshakingFrom}`
      };
    }
    // Add the patient to the transfered doctor and Insert the new doctor record
    [insertResult] = await connection.query(
      queryInsertPatientDoctorForHanshake,
      [
        timelineID,
        handshakingTo,
        queryResult[0].category,
        hospitalID,
        queryResult[0].scope
      ]
    );

    // Add to maintain the logs
    const [logResult] = await connection.query(queryInsertDoctorHandover, [
      hospitalID,
      timelineID,
      handshakingFrom,
      handshakingTo,
      handshakingBy,
      reason
    ]);
    console.log("log result..", logResult);

    // Update isViewed to 0 in the patients table
    const [isViewedUpdateResult] = await connection.query(
      queryUpdatePatientIsViewed,
      [timelineID, hospitalID]
    );

    if (!isViewedUpdateResult.changedRows) {
      return {
        status: 500,
        message: `Failed to update isViewed for patient with timelineID: ${timelineID}`
      };
    }
    return { status: 200, data: logResult };
  } catch (error) {
    return { status: 500, message: error.message };
  }
};

const TransferAllPatientDoctor = async (
  connection,
  hospitalID,
  handshakingBy,
  handshakingFrom,
  handshakingTo,
  reason
) => {
  try {
    // fetch the patient with doctor active
    const [queryResult] = await connection.query(queryGetAllDoctorStatus, [
      handshakingFrom,
      hospitalID
    ]);
    if (queryResult.length === 0) {
      return {
        status: 403,
        message: `No patient to transfer while handshaking with doctor id : ${handshakingFrom}`
      };
    }

    // update the doctor active status
    const [updateResult] = await connection.query(queryUpdateAllDoctorStatus, [
      handshakingFrom,
      hospitalID
    ]);
    if (updateResult.affectedRows !== queryResult.length) {
      return {
        status: 500,
        message: `update failed while handshaking with doctor id : ${handshakingFrom}`
      };
    }

    // bulk insert to improve latency
    const newRecords = queryResult.map((row) => [
      row.patientTimeLineID,
      handshakingTo,
      row.purpose,
      row.category,
      hospitalID
    ]);

    // Add the patient to the transfered doctor and Insert the new doctor record
    const [insertResult] = await connection.query(
      queryInsertBulkPatientDoctor,
      [newRecords]
    );
    if (insertResult.affectedRows !== newRecords.length) {
      return {
        status: 500,
        message: `Insertion failed for patientTimeLineId: ${row.patientTimeLineId} to doctor id: ${handshakingTo}`
      };
    }

    // Add to maintain the logs
    const logRecords = queryResult.map((row) => [
      hospitalID,
      row.patientTimeLineID,
      handshakingFrom,
      handshakingTo,
      handshakingBy,
      reason
    ]);

    const [logResult] = await connection.query(queryInsertBulkDoctorHandover, [
      logRecords
    ]);

    if (logResult.affectedRows !== logRecords.length) {
      return {
        status: 500,
        message: `Log insertion failed for patientTimeLineId: ${row.patientTimeLineId}`
      };
    }

    return { status: 200, data: logResult };
  } catch (error) {
    return { status: 500, message: error.message };
  }
};

const getAllNurses = async (hospitalID) => {
  try {
    const [response] = await pool.query(queryGetAllNurse, [hospitalID]);
    return response;
  } catch (error) {
    return { status: 500, message: error.message };
  }
};

const getAllgetDoctorAppointmentsdata = async (doctorID, hospitalID) => {
  try {
    const [response] = await pool.query(queryGetAllAppoinmentsList, [
      doctorID,
      hospitalID
    ]);
    return response;
  } catch (error) {
    return { status: 500, message: error.message };
  }
};

module.exports = {
  addDoctor,
  removeDoctorbyId,
  fetchAllDoctor,
  removeAllDoctor,
  TransferPatientDoctorbyId,
  TransferAllPatientDoctor,
  getAllNurses,
  getAllgetDoctorAppointmentsdata
};
