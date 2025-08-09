const {
  serverError,
  missingBody,
  resourceNotFound,
  duplicateRecord,
  notAllowed
} = require("../utils/errors");
const pool = require("../db/conn");

const patientUtils = require("../utils/patientUtils");
const { pocusSchema } = require("../helper/validators/pocusValidator");

const pocusService = require("../services/pocusService");

const addPocus = async (req, res) => {
  const timeLineID = req.params.timeLineID;
  const data = {
    userID: req.body.userID,
    abdomen: req.body.abdomen,
    abg: req.body.abg,
    cxr: req.body.cxr,
    ecg: req.body.ecg,
    heart: req.body.heart,
    ivc: req.body.ivc,
    leftPleuralEffusion: req.body.leftPleuralEffusion,
    leftPneumothorax: req.body.leftPneumothorax,
    rightPleuralEffusion: req.body.rightPleuralEffusion,
    rightPneumothorax: req.body.rightPneumothorax
  };

  try {
    await pocusSchema.validateAsync(data);
    // if (!data.abdomen) return missingBody(res, "missing abdomen value");

    // if (!data.abg) return missingBody(res, "missing abg value");

    // if (!data.cxr) return missingBody(res, "missing cxr value");

    // if (!data.ecg) return missingBody(res, "missing ecg value");

    // if (!data.heart) return missingBody(res, "missing heart value");

    // if (!data.ivc) return missingBody(res, "missing ivc value");

    // if (!data.leftPleuralEffusion) return missingBody(res, "missing leftPleuralEffusion value");

    // if (!data.leftPneumothorax) return missingBody(res, "missing leftPneumothorax value");

    // if (!data.rightPleuralEffusion) return missingBody(res, "missing rightPleuralEffusion value");

    // if (!data.rightPneumothorax) return missingBody(res, "missing rightPneumothorax value");

    const result = await pocusService.addPocusService(timeLineID, data);
    console.log("result=====", result);

    res.status(200).send({
      message: "success",
      pocus: result
    });
  } catch (err) {
    console.log("err===cotrolers==", err);
    if (err.isJoi === true) return missingBody(res, err.message);
    serverError(res, err.message);
  }

  // res.status(200).json({ message: 'POCUS data added successfully' })
};

const getPocus = async (req, res) => {
  const timeLineID = req.params.timeLineID;
  try {
    const results = await pocusService.getPocus(timeLineID);

    res.status(200).send({
      message: "success",
      pocus: results[0]
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

module.exports = {
  addPocus,
  getPocus
};
