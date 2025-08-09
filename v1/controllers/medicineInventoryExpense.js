const {
  serverError,
  missingBody,
  resourceNotFound,
  duplicateRecord
} = require("../utils/errors");

const medicineInventoryExpenseService = require("../services/medicineInventoryExpenseService");

const AddInventoryExpense = async (req, res) => {
  try {
    const hospitalID = req.params.hospitalID;
    const medicineList = req.body.medicineList;

    if (!hospitalID) return missingBody(res, "hospitalID is missing");
    if (!medicineList) return missingBody(res, "medicineList is missing");

    const result = await medicineInventoryExpenseService.AddInventoryExpense(
      hospitalID,
      medicineList
    );

    return res.status(result.status).send(result);
  } catch (error) {
    serverError(res, error.message);
  }
};

const ReorderOrReplaceMedicine = async (req, res) => {
  try {
    const hospitalID = req.params.hospitalID;
    const medicineList = req.body.medicineList;
    const manufactureData = req.body.manufactureData;

    const mode = req.body.mode;
    if (!hospitalID) return missingBody(res, "hospitalID is missing");
    if (!medicineList) return missingBody(res, "medicineList is missing");

    const result =
      await medicineInventoryExpenseService.ReorderOrReplaceMedicine(
        hospitalID,
        medicineList,
        manufactureData
      );

    return res.status(result.status).send(result);
  } catch (error) {
    serverError(res, error.message);
  }
};

const getInventoryExpenseData = async (req, res) => {
  try {
    const hospitalID = req.params.hospitalID;
    if (!hospitalID) return missingBody(res, "hospitalID is missing");

    const result =
      await medicineInventoryExpenseService.getInventoryExpenseData(hospitalID);

    return res.status(result.status).send(result);
  } catch (error) {
    serverError(res, error.message);
  }
};

module.exports = {
  AddInventoryExpense,
  getInventoryExpenseData,
  ReorderOrReplaceMedicine
};
