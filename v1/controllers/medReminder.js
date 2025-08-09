const {
  serverError,
  missingBody,
  resourceNotFound,
  duplicateRecord
} = require("../utils/errors");

const medReminderServices = require("../services/medReminderService");

/**
 * ** METHOD : GET
 * ** DESCRIPTION : GET MEDICINE REMINDER BY ID
 */
const getReminderById = async (req, res) => {
  const id = req.params.id;
  try {
    const result = await medReminderServices.getReminderById(id);

    res.status(200).send({
      message: "success",
      reminder: result
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

/**
 * ** METHOD : PATCH
 * ** DESCRIPTION : UPDATE MEDICINE REMINDER BY ID ,
 * **   update userID with user updating the doseStatus
 * **   doseStatus : 1 - given, 2 - not required
 * ** // the userI
 */
const updateReminder = async (req, res) => {
  const id = req.params.id;
  const userID = req.body.userID;
  const doseStatus = req.body.doseStatus;
  const note = req.body.note;
  const medicineID = req.body.medicineID;
  const medicationTime = req.body.medicationTime;
  try {
    const reminder = await medReminderServices.updateReminder(
      id,
      userID,
      doseStatus,
      note,
      medicineID,
      medicationTime
    );

    res.status(200).send({
      message: "success",
      reminder: reminder
      // result: result
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

module.exports = {
  getReminderById,
  updateReminder
};
