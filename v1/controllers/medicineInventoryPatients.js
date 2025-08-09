const {
  serverError,
  missingBody,
  resourceNotFound,
  duplicateRecord
} = require("../utils/errors");

const medicineInventoryPatientsService = require("../services/medicineInventoryPatientsService");

const addPatientWithOrder = async (req, res) => {
  try {
    const hospitalID = req.params.hospitalID;
    const medicineList = JSON.parse(req.body.medicineList);
    const patientData = JSON.parse(req.body.patientData);
    const userID = req.body.userID;
    const paymentMethod = JSON.parse(req.body.paymentMethod);
    const discount = JSON.parse(req.body.discount);
    const selectedFile = req.files;

    if (!hospitalID) return missingBody(res, "hospitalID is missing");
    if (!medicineList) return missingBody(res, "medicineList is missing");
    if (!userID) return missingBody(res, "userID is missing");
    if (!paymentMethod) return missingBody(res, "paymentMethod is missing");
    if (!discount) return missingBody(res, "discount is missing");
    if (!selectedFile) return missingBody(res, "selectedFile is missing");

    console.log("selectedFile", selectedFile);

    const result = await medicineInventoryPatientsService.addPatientWithOrder(
      hospitalID,
      medicineList,
      patientData,
      userID,
      paymentMethod,
      discount,
      selectedFile
    );

    return res.status(result.status).send(result);
  } catch (error) {
    serverError(res, error.message);
  }
};

const addWalkinPatients = async (req, res) => {
  try {
    const hospitalID = req.params.hospitalID;
    const department = req.params.department;
    const testsList = JSON.parse(req.body.testsList);
    const patientData = JSON.parse(req.body.patientData);
    const userID = req.body.userID;
    const paymentMethod = JSON.parse(req.body.paymentMethod);
    const discount = JSON.parse(req.body.discount);
    const files = req.files;

    if (!hospitalID) return missingBody(res, "hospitalID is missing");
    if (!testsList) return missingBody(res, "testsList is missing");
    if (!userID) return missingBody(res, "userID is missing");
    if (!paymentMethod) return missingBody(res, "paymentMethod is missing");
    if (!discount) return missingBody(res, "discount is missing");

    const result = await medicineInventoryPatientsService.addWalkinPatients(
      hospitalID,
      testsList,
      patientData,
      userID,
      paymentMethod,
      discount,
      files,
      department
    );

    return res.status(result.status).send(result);
  } catch (error) {
    serverError(res, error.message);
  }
};
module.exports = {
  addPatientWithOrder,
  addWalkinPatients
};
