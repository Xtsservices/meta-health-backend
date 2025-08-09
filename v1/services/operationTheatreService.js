const pool = require("../db/conn");
const { addDoctor } = require("../services/doctorService");
const {
  queryInsertNewRowOt,
  queryChecktimeLineIdExist,
  queryGetQueryStatus,
  queryInsertphysicalExamination,
  queryInsertpreopRecord,
  queryInsertanesthesiaRecord,
  queryInsertpostopRecord,
  queryGetPatientDetailsByType,
  queryGetOtStatus,
  queryGetOtData,
  queryUpdateStatus,
  queryInsertphysicalExaminationRedZone,
  queryGetOTPatientTypeCount,
  queryGetSurgeryTypes,
  queryGetApprovedRejected,
  querygetSurgeonSurgeryTypesInfo,
  querygetpostopRecord,
  queryInsertpreopRecordApproved
} = require("../queries/operationTheatreQueries");
const { queryInsertPatientDoctor } = require("../queries/doctorQueries");
const {
  queryCheckPatientTimeLinePresent,
  queryCheckPatientTimeLine
} = require("../queries/patientTimeLine");
const { doctor } = require("../utils/roles");

const addNewEntryOt = async (
  hospitalID,
  patientTimeLineId,
  patientType,
  surgeryType
) => {
  try {
    // Check whether patientTimeLine exists
    let [result] = await pool.query(queryCheckPatientTimeLinePresent, [
      patientTimeLineId,
      hospitalID
    ]);
    if (result.length === 0) {
      return { status: 404, message: "Timeline not found or already exists" };
    }

    // Check whether patientTimeLine exists in OT table
    [result] = await pool.query(queryChecktimeLineIdExist, [patientTimeLineId]);
    if (result.length > 0) {
      return {
        status: 403,
        message: "OperationTheatre Timeline already exists"
      };
    }

    // Insert new row into OT table
    [result] = await pool.query(queryInsertNewRowOt, [
      patientTimeLineId,
      hospitalID,
      patientType,
      surgeryType
    ]);
    return {
      message: "success",
      status: 201
    };
  } catch (error) {
    return { status: 500, message: error.message };
  }
};

const getAlerts = async (hospitalID, status) => {
  try {
    let [result] = await pool.query(queryGetQueryStatus, [status, hospitalID]);
    if (result.length === 0) {
      return { status: 403, message: "No Patient Found" };
    }
    return {
      status: 200,
      data: result
    };
  } catch (error) {
    return { status: 500, message: error.message };
  }
};

const getSurgeryTypes = async (hospitalID, year, month) => {
  try {
    let [result] = await pool.query(queryGetSurgeryTypes, [
      hospitalID,
      year,
      month || "", // Pass an empty string if the month is not provided
      month || ""
    ]);

    return {
      status: 200,
      data: result
    };
  } catch (error) {
    return { status: 500, message: error.message };
  }
};

// =========for surgeon===
const getSurgeonSurgeryTypesInfo = async (hospitalID, userID, year, month) => {
  try {
    let [result] = await pool.query(querygetSurgeonSurgeryTypesInfo, [
      hospitalID,
      userID,
      year,
      month || "", // Pass an empty string if the month is not provided
      month || ""
    ]);

    return {
      status: 200,
      data: result
    };
  } catch (error) {
    return { status: 500, message: error.message };
  }
};

const getApprovedRejected = async (hospitalID, userID, year, month) => {
  try {
    let [result] = await pool.query(queryGetApprovedRejected, [
      userID,
      hospitalID,
      year,
      month || "", // Pass an empty string if the month is not provided
      month || ""
    ]);

    return {
      status: 200,
      data: result
    };
  } catch (error) {
    return { status: 500, message: error.message };
  }
};
const addPhysicalExamination = async (
  patientTimeLineId,
  physicalExaminationData
) => {
  try {
    let [result] = await pool.query(queryInsertphysicalExamination, [
      JSON.stringify(physicalExaminationData),
      patientTimeLineId
    ]);
    if (result.affectedRows > 0) {
      return {
        message: "Success",
        status: 201
      };
    }
  } catch (error) {
    return { status: 500, message: error.message };
  }
};

const addPreopRecord = async (
  patientTimeLineId,
  preopRecordData,
  status,
  rejectReason,
  userID,
  hospitalID
) => {
  try {
    let updateQueryOt =
      status === "rejected"
        ? queryInsertpreopRecord
        : queryInsertpreopRecordApproved;
    const timestamp = new Date();

    let [result] = await pool.query(updateQueryOt, [
      JSON.stringify(preopRecordData),
      status,
      timestamp,
      rejectReason,
      patientTimeLineId
    ]);

    if (result.affectedRows > 0) {
      let connection = await pool.getConnection();

      const doctorResponse = await addDoctor(
        connection,
        patientTimeLineId,
        userID,
        "secondary",
        hospitalID,
        "anesthesia for Surgery",
        "anesthetic"
      );
      if (doctorResponse.status == 201) {
        return {
          message: "Success",
          status: 201
        };
      } else {
        return { status: 500, message: "Failed to add anesthetic" };
      }
    } else {
      return { status: 500, message: "Failed to add anesthetic" };
    }
  } catch (error) {
    return { status: 500, message: error.message };
  }
};

const addPostopRecord = async (patientTimeLineId, postopRecordData) => {
  try {
    let [result] = await pool.query(queryInsertpostopRecord, [
      JSON.stringify(postopRecordData),
      patientTimeLineId
    ]);
    if (result.affectedRows > 0) {
      return {
        message: "Success",
        status: 201
      };
    }
  } catch (error) {
    return { status: 500, message: error.message };
  }
};

const getPostopRecord = async (hospitalID, patientTimeLineId) => {
  try {
    let [result] = await pool.query(querygetpostopRecord, [
      hospitalID,
      patientTimeLineId
    ]);
    if (result.length > 0) {
      console.log("resu", result);
      return {
        message: "Success",
        status: 200,
        data: result
      };
    }
  } catch (error) {
    return { status: 500, message: error.message };
  }
};

const addAnesthesiaRecord = async (patientTimeLineId, anesthesiaRecordData) => {
  try {
    let [result] = await pool.query(queryInsertanesthesiaRecord, [
      JSON.stringify(anesthesiaRecordData),
      patientTimeLineId
    ]);
    if (result.affectedRows > 0) {
      return {
        message: "Success",
        status: 201
      };
    }
  } catch (error) {
    return { status: 500, message: error.message };
  }
};

const addPatientforOT = async (
  hospitalID,
  patientTimeLineId,
  doctorId,
  category,
  purpose,
  scope
) => {
  try {
    let [result] = await connection.query(queryInsertPatientDoctor, [
      patientTimeLineId,
      doctorId,
      purpose,
      category,
      hospitalID,
      scope
    ]);
    return {
      message: "success",
      status: 201,
      insertId: result.insertId,
      data: result
    };
  } catch (error) {
    return { status: 500, message: error.message };
  }
};

const getPatientOTAnesthetistEmergency = async (hospitalID, userID) => {
  try {
    let [result] = await pool.query(queryGetPatientDetailsByType, [
      "approved",
      "emergency",
      hospitalID,
      userID
    ]);
    if (result.length === 0) {
      return { status: 404, message: "No Patient Found" };
    }
    const patients = result;
    const patientsWithPhotos = patients.map((patient) => {
      patient.doctorName = patient.firstName + " " + patient.lastName;
      return patient;
    });
    return {
      status: 200,
      patients: patientsWithPhotos
    };
  } catch (error) {
    return { status: 500, message: error.message };
  }
};

const getPatientOTAnesthetistElective = async (hospitalID, userID) => {
  try {
    let [result] = await pool.query(queryGetPatientDetailsByType, [
      "approved",
      "elective",
      hospitalID,
      userID
    ]);
    if (result.length === 0) {
      return { status: 404, message: "No Patient Found" };
    }
    const patients = result;
    const patientsWithPhotos = patients.map((patient) => {
      patient.doctorName = patient.firstName + " " + patient.lastName;
      return patient;
    });
    return {
      status: 200,
      patients: patientsWithPhotos
    };
  } catch (error) {
    return { status: 500, message: error.message };
  }
};

const getPatientOTSurgeonEmergency = async (hospitalID, userID) => {
  try {
    let [result] = await pool.query(queryGetPatientDetailsByType, [
      "scheduled",
      "emergency",
      hospitalID,
      userID
    ]);
    if (result.length === 0) {
      return { status: 404, message: "No Patient Found" };
    }
    const patients = result;
    const patientsWithPhotos = patients.map((patient) => {
      patient.doctorName = patient.firstName + " " + patient.lastName;
      return patient;
    });
    return {
      status: 200,
      patients: patientsWithPhotos
    };
  } catch (error) {
    return { status: 500, message: error.message };
  }
};

const getPatientOTSurgeonElective = async (hospitalID, userID) => {
  try {
    let [result] = await pool.query(queryGetPatientDetailsByType, [
      "scheduled",
      "elective",
      hospitalID,
      userID
    ]);
    if (result.length === 0) {
      return { status: 404, message: "No Patient Found" };
    }
    const patients = result;
    const patientsWithPhotos = patients.map((patient) => {
      patient.doctorName = patient.firstName + " " + patient.lastName;
      return patient;
    });
    return {
      status: 200,
      patients: patientsWithPhotos
    };
  } catch (error) {
    return { status: 500, message: error.message };
  }
};

const getStatus = async (patientTimeLineId, hospitalID) => {
  try {
    let [result] = await pool.query(queryGetOtStatus, [
      patientTimeLineId,
      hospitalID
    ]);
    if (result.length === 0) {
      return { status: 404, message: "No Patient Found" };
    }
    return {
      status: 200,
      data: result
    };
  } catch (error) {
    return { status: 500, message: error.message };
  }
};

const getOTData = async (hospitalID, patientTimeLineId) => {
  try {
    let [result] = await pool.query(queryGetOtData, [
      patientTimeLineId,
      hospitalID
    ]);
    if (result.length === 0) {
      return { status: 404, message: "No Patient Found" };
    }
    return {
      status: 200,
      data: result
    };
  } catch (error) {
    return { status: 500, message: error.message };
  }
};

const updateStatus = async (
  status,
  startTime,
  patientTimeLineId,
  hospitalID
) => {
  try {
    let [result] = await pool.query(queryUpdateStatus, [
      status,
      startTime,
      patientTimeLineId,
      hospitalID
    ]);
    if (result.affectedRows < 1) {
      return { status: 404, message: "No Patient Found" };
    }
    return {
      status: 200,
      message: "success"
    };
  } catch (error) {
    return { status: 500, message: error.message };
  }
};

const getOTPatientTypeCount = async (hospitalID, userID, year, month) => {
  console.log("jk", year, month);
  try {
    let [electiveResult] = await pool.query(queryGetOTPatientTypeCount, [
      "approved",
      "elective",
      hospitalID,
      userID,
      year,
      month || "",
      month || ""
    ]);
    let [emergencyResult] = await pool.query(queryGetOTPatientTypeCount, [
      "approved",
      "emergency",
      hospitalID,
      userID,
      year,
      month || "",
      month || ""
    ]);

    return {
      status: 200,
      data: {
        emergency: emergencyResult?.length,
        elective: electiveResult?.length
      }
    };
  } catch (error) {
    return { status: 500, message: error.message };
  }
};

const redzonePhysicalExamination = async (
  hospitalID,
  patientTimeLineId,
  physicalExaminationData
) => {
  try {
    let [result] = await pool.query(queryInsertphysicalExaminationRedZone, [
      JSON.stringify(physicalExaminationData),
      patientTimeLineId,
      hospitalID
    ]);
    if (result.affectedRows > 0) {
      return {
        message: "Success",
        status: 201
      };
    }
  } catch (error) {
    return { status: 500, message: error.message };
  }
};

module.exports = {
  addNewEntryOt,
  getAlerts,
  addPhysicalExamination,
  addPreopRecord,
  addPostopRecord,
  addAnesthesiaRecord,
  addPatientforOT,
  getPatientOTAnesthetistEmergency,
  getPatientOTAnesthetistElective,
  getPatientOTSurgeonEmergency,
  getPatientOTSurgeonElective,
  getStatus,
  getOTData,
  updateStatus,
  getOTPatientTypeCount,
  redzonePhysicalExamination,
  getSurgeryTypes,
  getApprovedRejected,
  getSurgeonSurgeryTypesInfo,
  getPostopRecord
};
