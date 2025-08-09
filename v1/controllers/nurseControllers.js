const {
  serverError,
  missingBody,
  resourceNotFound,
  duplicateRecord,
  notAllowed,
} = require("../utils/errors");
const pool = require("../db/conn");
const { getAllHeadNurseFromHospitalQuery } = require("../queries/nurseQueries");

const nurseServices = require("../services/nurseService");
const ROLES_LIST = require("../utils/roles");

/**
 * ** METHOD : GET
 * ** DESCRIPTION : GET all head nurses based on hospital id
 */
const getAllHeadNurseFromHospital = async (req, res) => {
  try {
    const hospitalID = req.params.hospitalID;

    if (!hospitalID) return missingBody(res, "hospitalID required");

    const result = await nurseServices.getAllHeadNurseFromHospital(hospitalID);

    res.status(200).send({
      message: "success",
      data: result,
    });
  } catch (err) {
    serverError(res, err.message);
  }
};



/**
 * ** METHOD : GET
 * ** DESCRIPTION : GET head nurse and all nurses based on hospital id
 */
const getHeadNurseAllNurseFromHospital = async (req, res) => {
  try {
    const userID = req.userID

    const result = await nurseServices.getHeadNurseAllNurseFromHospital(userID);

    res.status(200).send({
      message: "success",
      data: result,
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

/**
 * ** METHOD : GET
 * ** DESCRIPTION : GET all counts for nurse dashboard
 */
const getnursedashboardcounts = async (req, res) => {
  try {
    const hospitalID = req.params.hospitalID;
    const role = req.params.role;
    const userID = req.userID;

    if (!hospitalID) return missingBody(res, "hospitalID required");
    if (!role) return missingBody(res, "departmentID required");

    const result = await nurseServices.getnursedashboardcounts(
      hospitalID,
      role,
      userID
    );

    res.status(200).send({
      message: "success",
      data: result,
    });
  } catch (err) {
    serverError(res, err.message);
  }
};


/**
 * ** METHOD : POST
 * ** DESCRIPTION : addLeaves for staff
 */
const addleaves = async (req, res) => {
  try {
    const hospitalID = req.params.hospitalID;
    const leavesdata = req.body
    const approvedBy = req.userID

    if (!hospitalID) return missingBody(res, "hospitalID required");

    const result = await nurseServices.addleaves(
      hospitalID,
      approvedBy,
      leavesdata
    );

    res.status(200).send({
      message: "success",
      data: result,
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

/**
 * ** METHOD : GET
 * ** DESCRIPTION : GET getstaffleaves based 
 */
const getstaffleaves = async (req, res) => {
  try {
    const hospitalID = req.params.hospitalID;
    const userID = req.userID;

    if (!hospitalID) return missingBody(res, "hospitalID required");

    const result = await nurseServices.getstaffleaves(
      hospitalID,
      userID
    );

    res.status(200).send({
      message: "success",
      data: result,
    });
  } catch (err) {
    serverError(res, err.message);
  }
};


/**
 * ** METHOD : GET
 * ** DESCRIPTION : GET getstaffleavesCount 
 */
const getstaffleavesCount = async (req, res) => {
  try {
    const hospitalID = req.params.hospitalID;
    const userID = req.userID;

    if (!hospitalID) return missingBody(res, "hospitalID required");

    const result = await nurseServices.getstaffleavesCount(
      hospitalID,
      userID
    );

    res.status(200).send({
      message: "success",
      data: result,
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

/**
 * ** METHOD : DELETE
 * ** DESCRIPTION : delete staff leave within one hour only allow to delete from addedon.
 */
const deletestaffleave = async (req, res) => {
  try {
    const hospitalID = req.params.hospitalID;
    const rowId = req.params.rowId;

    if (!hospitalID) return missingBody(res, "hospitalID required");
    if (!rowId) return missingBody(res, "rowId required");

    const result = await nurseServices.deletestaffleave(
      hospitalID,
      rowId
    );

    res.status(200).send({
      message: "success",
      data: result,
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

/**
 * ** METHOD : GET
 * ** DESCRIPTION : GET getAttendanceLogs for nurse dashboard
 */
const getAttendanceLogs = async (req, res) => {
  try {
    const hospitalID = req.params.hospitalID;
    const departmentID = req.params.departmentID;
    const userID = req.userID;

    if (!hospitalID) return missingBody(res, "hospitalID required");
    if (!departmentID) return missingBody(res, "departmentID required");

    const result = await nurseServices.getAttendanceLogs(
      hospitalID,
      userID
    );

    res.status(200).send({
      message: "success",
      data: result,
    });
  } catch (err) {
    serverError(res, err.message);
  }
};


/**
 * ** METHOD : GET
 * ** DESCRIPTION : GET all patients  for nurse dashboard
 */
const getnursepatients = async (req, res) => {
  try {
    const hospitalID = req.params.hospitalID;
    const role = req.params.role;
    const userID = req.userID;

    if (!hospitalID) return missingBody(res, "hospitalID required");

    const result = await nurseServices.getnursepatients(
      hospitalID,
      userID,
      role
    );

    res.status(200).send({
      message: "success",
      data: result,
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

/**
 * ** METHOD : GET
 * ** DESCRIPTION : GET all patients  for nurse dashboard
 */
const getpatientsmedicationalerts = async (req, res) => {
  try {
    const hospitalID = req.params.hospitalID;
    const role = req.params.role;
    const userID = req.userID;

    if (!hospitalID) return missingBody(res, "hospitalID required");

    const result = await nurseServices.getpatientsmedicationalerts(
      hospitalID,
      userID,
      role
    );

    res.status(200).send({
      message: "success",
      data: result,
    });
  } catch (err) {
    serverError(res, err.message);
  }
};


/**
 * ** METHOD : POST
 * ** DESCRIPTION : addshiftschedule for staff
 */
const addshiftschedule = async (req, res) => {
  try {
    const hospitalID = req.params.hospitalID;
    const addedBy = req.userID;
    const data = req.body;
    const { editID } = req.query;

    if (!hospitalID) return missingBody(res, "hospitalID required");
    if (!data) return missingBody(res, "shift schedule data required");

    const result = await nurseServices.addshiftschedule(
      hospitalID,
      addedBy,
      data,
      editID
    );

    res.status(200).send({
      message: "success",
      data: result,
    });
  } catch (err) {
    serverError(res, err.message);
  }
};



/**
 * ** METHOD : GET
 * ** DESCRIPTION : GET getshiftschedule all for head nurse
 */
const getshiftschedule = async (req, res) => {
  try {
    const hospitalID = req.params.hospitalID;
    const userID = req.userID

    const result = await nurseServices.getshiftschedule(hospitalID, userID);

    res.status(200).send({
      message: "success",
      data: result,
    });
  } catch (err) {
    serverError(res, err.message);
  }
};



/**
 * ** METHOD : DELETE 
 * ** DESCRIPTION : deleteshiftschedule within 1hour
 */
const deleteshiftschedule = async (req, res) => {
  try {
    const hospitalID = req.params.hospitalID;
    const rowId = req.params.rowId;

    if (!hospitalID) return missingBody(res, "hospitalID required");
    if (!rowId) return missingBody(res, "rowId required");

    const result = await nurseServices.deleteshiftschedule(hospitalID, rowId);

    res.status(200).send({
      message: "success",
      data: result,
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

/**
 * ** METHOD : GET
 * ** DESCRIPTION : GET getmyshiftschedule
 */
const getmyshiftschedule = async (req, res) => {
  try {
    const hospitalID = req.params.hospitalID;
    const userID = req.userID

    const result = await nurseServices.getmyshiftschedule(hospitalID, userID);

    res.status(200).send({
      message: "success",
      data: result,
    });
  } catch (err) {
    serverError(res, err.message);
  }
};


const getNurseAlerts = async (req, res) => {
  try {
    const hospitalID = req.params.hospitalID;
    const role = req.params.role;
    const userID = req.userID;

    if (!hospitalID) return missingBody(res, "hospitalID required");
    if (!role) return missingBody(res, "departmentID required");

    const result = await nurseServices.getNurseAlerts(
      hospitalID,
      role,
      userID
    );

    res.status(200).send({
      message: "success",
      data: result,
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

const nurseHandshake = async (req, res) => {
  try {
    const { hospitalID, role, wardID, timelineID } = req.params
    const userID = req.userID
    const handshakingBy = req.body.handshakingBy;
    const handshakingfrom = req.body.handshakingfrom;
    const handshakingTo = req.body.handshakingTo;
    const reason = req.body.reason;

    if (!hospitalID) return missingBody(res, "Hospital id missing");
    if (!timelineID) return missingBody(res, "timelineID missing");
    if (!handshakingBy) return missingBody(res, "handshakingBy missing");
    if (!handshakingfrom) return missingBody(res, "handshakingfrom missing");
    if (!handshakingTo) return missingBody(res, "handshakingTo missing");
    if (!reason) return missingBody(res, "reason missing");

    const result = await nurseServices.nurseHandshake(hospitalID,
      timelineID,
      handshakingBy,
      handshakingfrom,
      handshakingTo,
      reason,
    role);
    res.status(200).send({
      message: "success",
      data: result,
    })

  } catch (err) {
    serverError(res, err.message);
  }
}
module.exports = {
  getAllHeadNurseFromHospital,
  getnursedashboardcounts,
  addleaves,
  getAttendanceLogs,
  getnursepatients,
  getpatientsmedicationalerts,
  getHeadNurseAllNurseFromHospital,
  addshiftschedule,
  getmyshiftschedule,
  getstaffleaves,
  getshiftschedule,
  deletestaffleave,
  deleteshiftschedule,
  getNurseAlerts,
  getstaffleavesCount,
  nurseHandshake
};
