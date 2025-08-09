const {
  serverError,
  missingBody,
  resourceNotFound,
  duplicateRecord
} = require("../utils/errors");

const medicineInventoryServices = require("../services/medicineInventoryService");

const changeIsActiveStatus = async (req, res) => {
  try {
    const rowID = req.params.rowid;
    if (!rowID) return missingBody("rowID is missing");
    const result = await medicineInventoryServices.changeIsActiveStatus(rowID);

    return res.status(result.status).send(result);
  } catch (error) {
    serverError(error);
  }
};

const getMedicineInventory = async (req, res) => {
  try {
    const hospitalID = req.params.hospitalID;
    if (!hospitalID) return missingBody("hospitalID is missing");
    const result = await medicineInventoryServices.getMedicineInventory(
      hospitalID
    );

    return res.status(result.status).send(result);
  } catch (error) {
    serverError(error);
  }
};

const postMedicineInventory = async (req, res) => {
  try {
    const hospitalID = req.params.hospitalID;
    const newStock = req.body;
    if (!hospitalID) return missingBody("hospitalID is missing");
    if (!newStock) return missingBody("data is missing");

    const result = await medicineInventoryServices.postMedicineInventory(
      hospitalID,
      newStock
    );
    return res.status(result.status);
  } catch (error) {
    serverError(error);
  }
};

module.exports = {
  changeIsActiveStatus,
  getMedicineInventory,
  postMedicineInventory
};
