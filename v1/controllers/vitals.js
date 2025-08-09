const {
  serverError,
  missingBody,
  resourceNotFound,
  duplicateRecord,
  notAllowed
} = require("../utils/errors");
const pool = require("../db/conn");

const patientUtils = require("../utils/patientUtils");
const { vitalsSchema } = require("../helper/validators/vitalValidator");

const vitalsService = require("../services/vitalsService");

/**
 * ** METHOD : POST
 * ** DESCRIPTION : ADD VITALS
 */
const addVitals = async (req, res) => {
  //respiratoryRate max 40
  const timeLineID = req.body.timeLineID;
  const data = {
    userID: req.body.userID,
    patientID: req.body.patientID,
    pulse: req.body.pulse,
    pulseTime: req.body.pulseTime,
    temperature: req.body.temperature,
    temperatureTime: req.body.temperatureTime,
    oxygen: req.body.oxygen,
    oxygenTime: req.body.oxygenTime,
    hrv: req.body.hrv,
    hrvTime: req.body.hrvTime,
    respiratoryRate: req.body.respiratoryRate,
    respiratoryRateTime: req.body.respiratoryRateTime,
    bp: req.body.bp,
    bpTime: req.body.bpTime,
    ward: req.body.ward,
    age: req.body.age
  };
  try {
    await vitalsSchema.validateAsync(data);
    if (data.pulse) {
      if (!data.pulseTime) return missingBody(res, "missing pulse Time");
    }
    if (data.temperature) {
      if (!data.temperatureTime)
        return missingBody(res, "missing temperature time");
    }
    if (data.oxygen) {
      if (!data.oxygenTime) return missingBody(res, "missing oxygen time");
    }
    if (data.respiratoryRate) {
      if (!data.respiratoryRateTime)
        return missingBody(res, "missing respiratoryRate time");
    }
    if (data.bp) {
      if (!data.bpTime) return missingBody(res, "missing bp time");
    }
    if (data.hrv) {
      if (!data.hrvTime) return missingBody(res, "missing hrv time");
    }

    const result = await vitalsService.addVitalsService(timeLineID, data);

    res.status(201).send({
      message: "success",
      vital: result
    });
  } catch (err) {
    if (err.isJoi === true) return missingBody(res, err.message);
    serverError(res, err.message);
  }
};

/**
 * ** METHOD : GET
 * ** DESCRIPTION : GET ALL VITALS
 */
const getAllVitals = async (req, res) => {
  const patientID = req.params.patientID;
  try {
    const results = await vitalsService.getAllVitals(patientID);

    res.status(200).send({
      message: "success",
      vitals: results[0]
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

const getVitalFunctions = async (req, res) => {
  try {
    const patientID = req.params.patientID;
    // const hospitalID = req.params.hospitalID;

    const results = await vitalsService.getVitalFunctions(
      patientID,
      // hospitalID
    );

    res.status(200).send({
      message: "success",
      pulse: results.pulse,
      temperature: results.temperature,
      oxygen: results.oxygen,
      bp: results.bp,
      respiratoryRate:results.respiratoryRate,
      hrv:results.hrv
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

// const getallvitalsbypatientid = async (req, res) => {
//   const { patientID } = req.params;
//   const { date } = req.query; 
// console.log("datelool",date)
//   try {
//     let query, params;

//     if (date) {
     
//       query = `
//         SELECT * FROM vitals 
//         WHERE  patientID = ? AND DATE(addedOn) = ?
//       `;
//       params = [ patientID, date];
//     } else {
     
//       query = `
//         SELECT * FROM vitals 
//         WHERE patientID = ?
//       `;
//       params = [patientID];
//     }

//     const [results] = await pool.query(query, params);
//     console.log("results",results)

//     res.status(200).json({ message: "success", vitals: results });
//   } catch (err) {
//     console.error("Error fetching vitals:", err);
//     res.status(500).json({ success: false, message: "Internal server error" });
//   }
// };


const getallvitalsbypatientid = async (req, res) => {
  const patientId = req.params.patientID;
  const { startDate, endDate } = req.query;
  try {
    let query;
    let params;

    console.log(`Received request for patientID: ${patientId}, startDate: ${startDate}, endDate: ${endDate}`);

    if (startDate && endDate) {
      query = `SELECT * FROM vitals WHERE patientID = ? AND DATE(addedOn) BETWEEN ? AND ?`;
      params = [patientId, startDate, endDate];
    } else {
      query = `SELECT * FROM vitals WHERE patientID = ?`;
      params = [patientId];
    }

    const [result] = await pool.query(query, params);

    console.log(`Query result length: ${result.length}`);

    // Send the response with fetched result
    if (result.length === 0) {
      return res.status(200).json({
        message: "success",
        vitals: [],
      });
    }

    res.status(200).json({
      message: "success",
      vitals: result,
    });
  } catch (err) {
    console.error("Error in getAllVitalsByPatientId:", err.message);
    return serverError(res, err.message);
  }
};


/**
 * ** METHOD : GET
 * ** DESCRIPTION : GET SINGLE VITAL
 */
const getSingleVital = async (req, res) => {
  const patientID = req.params.patientID;
  const vital = req.query.vital;
  const date = req.query.date;

  if (!vital) {
    return missingBody(res, "missing query");
  }

  if (!date) {
    return missingBody(res, "Missing date query parameter");
  }

  try {
    const result = await vitalsService.getSingleVital(patientID, vital, date);

    res.status(200).send({
      message: "success",
      vitals: result[0],
      size: result[0].length
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

const getSingleVitalHospital = async (req, res) => {
  const patientID = req.params.patientID;
  const vital = req.query.vital;
 
 
  if (!vital) {
    return missingBody(res, "missing query");
  }
 
 
 
  try {
    const result = await vitalsService.getSingleVitalHospital(patientID, vital);
 
    res.status(200).send({
      message: "success",
      vitals: result[0],
      size: result[0].length
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

/**
 * ** METHOD : GET
 * ** DESCRIPTION : GET ALL VITALS
 */
const getLatestVitals = async (req, res) => {
  try {
    const patientID = req.params.patientID;
    const result = await vitalsService.getLatestVitals(patientID);

    res.status(200).send({
      message: "success",
      vitals: {
        givenTemperature: result.givenTemperature,
        deviceTemperature: result.deviceTemperature,
        givenTemperatureTime: result.givenTemperatureTime || null,
        deviceTemperatureTime: result.deviceTemperatureTime || null,
        pulse: result.pulse || 0,
        pulseTime: result.pulseTime || null,
        oxygen: result.oxygen || 0,
        oxygenTime: result.oxygenTime || null,
        bp: result.bp || "",
        bpTime: result.bpTime || null
      }
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

const getHomecarePatientVitalFunctions = async (req, res) => {
  try {
    const patientID = req.params.patientID;

    const results = await vitalsService.getHomecareVitalFunctions(patientID);

    res.status(200).send({
      message: "success",
      heartRate: results.heartRate,
      temperature: results.temperature,
      spo2: results.spo2,
      respiratoryRate: results.respiratoryRate,
      heartRateVariability: results.heartRateVariability,
      batteryPercentage: results.batteryPercentage
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

const getHomeCarePatient = async (req, res) => {
  const patientID = req.params.patientID;
  const vital = req.query.vital;
  const date = req.query.date;

  console.log("Date",date);

  if (!vital) {
    return missingBody(res, "missing query");
  }

  if (!date) {
    return missingBody(res, "Missing date query parameter");
  }

  try {
    const result = await vitalsService.getHomeCarePatient(patientID, vital, date);

    res.status(200).send({
      message: "success",
      vitals: result[0],
      size: result[0].length
    });
  } catch (err) {
    serverError(res, err.message);
  }
};


module.exports = {
  addVitals,
  getAllVitals,
  getVitalFunctions,
  getSingleVital,
  getLatestVitals,
  getallvitalsbypatientid,
  getHomecarePatientVitalFunctions,
  getHomeCarePatient,
  getSingleVitalHospital
};
