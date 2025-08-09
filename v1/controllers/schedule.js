const {
  serverError,
  missingBody,
  resourceNotFound,
  duplicateRecord
} = require("../utils/errors");

const scheduleServices = require("../services/scheduleService");

const viewSchedule = async (req, res) => {
  try {
    const hospitalID = req.params.hospitalID;
    const userId = req.params.userId;
    if (!hospitalID) return missingBody(res, "Hospital id missing");
    if (!userId) return missingBody(res, "userId is missing");

    const result = await scheduleServices.viewSchedule(hospitalID, userId);

    if (result.status != 200) {
      return res.status(result.status).send({
        message: result.message
      });
    }
    return res.status(200).send(result);
  } catch (error) {
    serverError(res, error.message);
  }
};

const addSchedule = async (req, res) => {
  try {
    const hospitalID = req.params.hospitalID;
    const userId = req.params.userId;
    const patientTimeLineId = req.params.patientTimeLineId;
    const patientID = req.params.patientID;
    const startTime = req.body.startTime;
    const endTime = req.body.endTime;
    const roomId = req.body.roomId;
    const attendees = req.body.attendees;
    const baseURL = req.body.baseURL;
    const token = req.headers.Authorization;

    if (!hospitalID) return missingBody(res, "Hospital id missing");
    if (!userId) return missingBody(res, "userId is missing");
    if (!patientTimeLineId)
      return missingBody(res, "patientTimeLineId is missing");
    if (!startTime) return missingBody(res, "startTime is missing");
    if (!endTime) return missingBody(res, "endTime is missing");
    if (!roomId) return missingBody(res, "roomId is missing");
    if (!attendees) return missingBody(res, "attendees is missing");
    if (!patientID) return missingBody(res, "patientID is missing");
    if (!baseURL) return missingBody(res, "baseURL missing");

    const result = await scheduleServices.addSchedule(
      hospitalID,
      userId,
      patientTimeLineId,
      startTime,
      endTime,
      roomId,
      attendees,
      patientID,
      baseURL,
      token
    );
    if (result.status != 201) {
      return res.status(result.status).send({
        message: result.message
      });
    }
    return res.status(201).send(result);
  } catch (error) {
    serverError(res, error.message);
  }
};

module.exports = {
  viewSchedule,
  addSchedule
};
