const {
  serverError,
  missingBody,
  resourceNotFound,
  duplicateRecord
} = require("../utils/errors");
const pool = require("../db/conn");
const doctorService = require("../services/doctorService");
const { queryFetchDoctorsByDoctorID } = require("../queries/doctorQueries");

const addDoctor = async (req, res) => {
  let connection;
  try {
    const hospitalID = req.params.hospitalID;
    const patientTimeLineId = req.body.patientTimeLineId;
    const doctorId = req.body.doctorId;
    const category = req.body.category;
    const purpose = req.body.purpose;
    const scope = req.body.scope;

    if (!hospitalID) return missingBody(res, "Hospital id missing");
    if (!patientTimeLineId)
      return missingBody(res, "patientTimeLineId missing");
    if (!doctorId) return missingBody(res, "doctorId missing");
    if (!category) return missingBody(res, "category missing");
    if (!purpose) return missingBody(res, "purpose missing");
    if (!scope) return missingBody(res, "scope missing");

    connection = await pool.getConnection();
    const result = await doctorService.addDoctor(
      connection,
      patientTimeLineId,
      doctorId,
      category,
      hospitalID,
      purpose,
      scope
    );
    if (result.status != 201) {
      connection.rollback();
      return res.status(result.status).send({
        message: result.message
      });
    } else {
      connection.commit();
    }

    const [result2] = await connection.query(queryFetchDoctorsByDoctorID, [
      patientTimeLineId,
      hospitalID,
      doctorId
    ]);
    return res.status(200).send({
      message: "success",
      doctor: result2
    });
  } catch (err) {
    serverError(res, err.message);
  } finally {
    if (connection) connection.release();
  }
};

const fetchAllDoctor = async (req, res) => {
  let connection = null;
  try {
    const hospitalID = req.params.hospitalID;
    const patientTimeLineId = req.params.timelineID;

    if (!hospitalID) return missingBody(res, "Hospital id missing");
    if (!patientTimeLineId)
      return missingBody(res, "patientTimeLineId missing");

    connection = await pool.getConnection();
    const result = await doctorService.fetchAllDoctor(
      connection,
      patientTimeLineId,
      hospitalID
    );
    if (result.status != 200) {
      connection.rollback();
      return res.status(result.status).send({
        message: result.message
      });
    } else {
      connection.commit();
    }
    return res.status(200).send({
      message: "success",
      data: result.data
    });
  } catch (err) {
    serverError(res, err.message);
  } finally {
    connection.release();
  }
};

const removeDoctorbyId = async (req, res) => {
  let connection = null;
  try {
    const hospitalID = req.params.hospitalID;
    const patientTimeLineId = req.params.timelineID;
    const doctorId = req.params.doctorId;

    if (!hospitalID) return missingBody(res, "Hospital id missing");
    if (!patientTimeLineId)
      return missingBody(res, "patientTimeLineId missing");
    if (!doctorId) return missingBody(res, "doctorId missing");

    connection = await pool.getConnection();
    const result = await doctorService.removeDoctorbyId(
      connection,
      patientTimeLineId,
      doctorId,
      hospitalID
    );
    if (result.status != 200) {
      connection.rollback();
      return res.status(result.status).send({
        message: result.message
      });
    } else {
      connection.commit();
    }
    return res.status(200).send({
      message: "success"
    });
  } catch (err) {
    serverError(res, err.message);
  } finally {
    connection.release();
  }
};

const removeAllDoctor = async (req, res) => {
  let connection = null;
  try {
    const hospitalID = req.params.hospitalID;
    const patientTimeLineId = req.params.timelineID;

    if (!hospitalID) return missingBody(res, "Hospital id missing");
    if (!patientTimeLineId)
      return missingBody(res, "patientTimeLineId missing");

    connection = await pool.getConnection();
    const result = await doctorService.removeAllDoctor(
      connection,
      patientTimeLineId,
      hospitalID
    );
    if (result.status != 200) {
      connection.rollback();
      return res.status(result.status).send({
        message: result.message
      });
    } else {
      connection.commit();
    }
    return res.status(200).send({
      message: "success"
    });
  } catch (err) {
    serverError(res, err.message);
  } finally {
    connection.release();
  }
};

const TransferPatientDoctorbyId = async (req, res) => {
  let connection = null;
  try {
    const hospitalID = req.params.hospitalID;
    const timelineID = req.params.timelineID;
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

    connection = await pool.getConnection();
    const result = await doctorService.TransferPatientDoctorbyId(
      connection,
      hospitalID,
      timelineID,
      handshakingBy,
      handshakingfrom,
      handshakingTo,
      reason
    );
    if (result.status != 200) {
      connection.rollback();
      return res.status(result.status).send({
        message: result.message
      });
    } else {
      connection.commit();
    }
    return res.status(200).send({
      message: "success"
    });
  } catch (err) {
    serverError(res, err.message);
  } finally {
    connection.release();
  }
};

const TransferAllPatientDoctor = async (req, res) => {
  let connection = null;
  try {
    const hospitalID = req.params.hospitalID;
    const handshakingBy = req.body.handshakingBy;
    const handshakingfrom = req.body.handshakingfrom;
    const handshakingTo = req.body.handshakingTo;
    const reason = req.body.reason;

    if (!hospitalID) return missingBody(res, "Hospital id missing");
    if (!handshakingBy) return missingBody(res, "handshakingBy missing");
    if (!handshakingfrom) return missingBody(res, "handshakingfrom missing");
    if (!handshakingTo) return missingBody(res, "handshakingTo missing");
    if (!reason) return missingBody(res, "reason missing");

    connection = await pool.getConnection();
    const result = await doctorService.TransferAllPatientDoctor(
      connection,
      hospitalID,
      handshakingBy,
      handshakingfrom,
      handshakingTo,
      reason
    );
    if (result.status != 200) {
      connection.rollback();
      return res.status(result.status).send({
        message: result.message
      });
    } else {
      connection.commit();
    }
    return res.status(200).send({
      message: "success"
    });
  } catch (err) {
    serverError(res, err.message);
  } finally {
    connection.release();
  }
};

/**
 * ** METHOD : GET
 * ** DESCRIPTION : GET USER BY ID
 */
const getAllNurses = async (req, res) => {
  try {
    const hospitalID = req.params.hospitalID;
    if (!hospitalID) return missingBody(res, "Hospital id missing");

    const response = await doctorService.getAllNurses(hospitalID);

    return res.status(200).send({
      message: "success",
      data: response
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

const DoctorAppointmentSchedule = async (req, res) => {
  let connection;
  try {
    const hospitalID = req.params.hospitalID;

    const { slotTimings, dayToggles, addedBy, doctorID } = req.body.data;

    // Validate the required fields
    if (!hospitalID) return missingBody(res, "Hospital id missing");
    if (!slotTimings) return missingBody(res, "slotTimings missing");
    if (!dayToggles) return missingBody(res, "dayToggles missing");
    if (!addedBy) return missingBody(res, "addedBy missing");
    if (!doctorID) return missingBody(res, "doctorID missing");

    // Open a new connection to the database
    connection = await pool.getConnection();

    // Insert into DoctorAppointmentSchedule table
    const query = `
      INSERT INTO DoctorAppointmentSchedule (doctorID, slotTimings, dayToggles, addedOn, updatedOn, addedBy,hospitalID)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?,?)
    `;

    const values = [
      doctorID,
      JSON.stringify(slotTimings), // Store slotTimings as a JSON string
      JSON.stringify(dayToggles), // Store dayToggles as a JSON string
      addedBy,
      hospitalID
    ];

    const result = await connection.query(query, values);

    return res.status(201).send({
      message: "success",
      scheduleId: result.insertId // Return the newly created schedule ID
    });
  } catch (err) {
    serverError(res, err.message);
  } finally {
    if (connection) connection.release();
  }
};

const getDoctorAppointmentsdata = async (req, res) => {
  try {
    const hospitalID = req.params.hospitalID;
    const doctorID = req.params.doctorID;
    console.log("doctorIDol", doctorID);

    if (!hospitalID) return missingBody(res, "Hospital id missing");

    const response = await doctorService.getAllgetDoctorAppointmentsdata(
      doctorID,
      hospitalID
    );

    return res.status(200).send({
      message: "success",
      data: response
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

module.exports = {
  addDoctor,
  fetchAllDoctor,
  removeDoctorbyId,
  removeAllDoctor,
  TransferPatientDoctorbyId,
  TransferAllPatientDoctor,
  getAllNurses,
  DoctorAppointmentSchedule,
  getDoctorAppointmentsdata
};
