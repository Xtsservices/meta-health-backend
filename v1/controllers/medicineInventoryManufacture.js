const {
  serverError,
  missingBody,
  resourceNotFound,
  duplicateRecord
} = require("../utils/errors");

const medicineInventoryManufactureService = require("../services/medicineInventoryManufactureService");

const getAllManufacture = async (req, res) => {
  try {
    const hospitalID = req.params.hospitalID;
    if (!hospitalID) return missingBody(res, "hospitalID is missing");

    const result = await medicineInventoryManufactureService.getAllManufacture(
      hospitalID
    );

    return res.status(result.status).send(result);
  } catch (error) {
    serverError(res, error.message);
  }
};

module.exports = {
  getAllManufacture
};
