const {
  serverError,
  missingBody,
  resourceNotFound,
  duplicateRecord
} = require("../utils/errors");

const medicineInventoryLogsService = require("../services/medicineInventoryLogsService");

const editMedicineInventoryData = async (req, res) => {
  try {
    const hospitalID = req.params.hospitalID;
    const rowId = req.params.rowId;
    const medicineList = req.body.medicineList;

    if (!hospitalID) return missingBody(res, "hospitalID is missing");
    if (!medicineList) return missingBody(res, "medicineList is missing");

    const result = await medicineInventoryLogsService.editMedicineInventoryData(
      hospitalID,
      medicineList,
      rowId
    );
    return res.status(result.status).send(result);
  } catch (error) {
    serverError(res, error.message);
  }
};

const addInventoryLogs = async (req, res) => {
  try {
    const hospitalID = req.params.hospitalID;
    const medicineList = req.body.medicineList;
    const user = req.body.user;

    if (!hospitalID) return missingBody(res, "hospitalID is missing");
    if (!medicineList) return missingBody(res, "medicineList is missing");
    if (!user) return missingBody(res, "user is missing");

    const result = await medicineInventoryLogsService.addInventoryLogs(
      hospitalID,
      medicineList,
      user
    );
    console.log("result--",result)
    return res.status(result.status).send(result);
  } catch (error) {
    serverError(res, error.message);
  }
};

const getInventoryLogs = async (req, res) => {
  try {
    const hospitalID = req.params.hospitalID;

    if (!hospitalID) return missingBody(res, "hospitalID is missing");

    const result = await medicineInventoryLogsService.getInventoryLogs(
      hospitalID
    );
console.log("response===", result)
    return res.status(result.status).send(result);
  } catch (error) {
    serverError(res, error.message);
  }
};

module.exports = {
  editMedicineInventoryData,
  addInventoryLogs,
  getInventoryLogs
};
