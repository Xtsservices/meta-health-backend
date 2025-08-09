const {
  serverError,
  missingBody,
  resourceNotFound,
  notAllowed
} = require("../utils/errors");

const followUpServices = require("../services/followUpService");

const getAllFollowUp = async (req, res) => {
  const timelineID = req.params.timelineID;

  try {
    const result = await followUpServices.getAllFollowUp(timelineID);
    res.status(200).send({
      message: "success",
      followUp: result[0][0]
    });
  } catch (err) {
    serverError(res, err.message);
  }
};
const getAllActiveFollowUp = async (req, res) => {
  const hospitalID = req.params.hospitalID;
  const userID = req.userID;
  try {
    const result = await followUpServices.getAllActiveFollowUp(
      hospitalID,
      userID
    );
    res.status(200).send({
      message: "success",
      followUps: result[0]
    });
  } catch (err) {
    serverError(res, err.message);
  }
};
module.exports = {
  getAllFollowUp,
  getAllActiveFollowUp
};
