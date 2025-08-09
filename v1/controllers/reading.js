const {
  serverError,
  missingBody,
  resourceNotFound,
  duplicateRecord,
  notAllowed
} = require("../utils/errors");
const readingServices = require("../services/readingServices");

const addNewReading = async (req, res) => {
  const reading = {
    timeLineID: req.params.timeLineID,
    hubID: req.params.hubID,
    deviceID: req.params.deviceID,
    temperature: req.params.temp,
    battery: req.params.battery,
    deviceTime: req.params.deviceTime,
    uploadTime: req.params.uploadTime
  };

  try {
    const result = await readingServices.addNewReading(reading);
    res.status(200).send(result);
  } catch (err) {
    if (err.isJoi === true) {
      return missingBody(res, err.message);
    }
    serverError(res, err.message);
  }
};

const pingRequest = async (req, res) => {
  try {
    // TODO update hub status to online
    const result = await readingServices.pingRequest();
    res.status(200).send({
      message: "success"
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

const addHubLog = async (req, res) => {
  try {
    const result = await readingServices.addHubLog();

    res.status(200).send({
      message: "success"
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

module.exports = {
  addNewReading,
  addHubLog,
  pingRequest
};
