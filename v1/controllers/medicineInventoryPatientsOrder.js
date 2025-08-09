const {
  serverError,
  missingBody,
  resourceNotFound,
  duplicateRecord
} = require("../utils/errors");

const medicineInventoryPatientsOrderService = require("../services/medicineInventoryPatientsOrderService");
const pool = require("../db/conn");
const getMedicineInventoryPatientsOrder = async (req, res) => {
  try {
    const hospitalID = req.params.hospitalID;
    const status = req.params.status;
    if (!hospitalID) return missingBody(res, "hospitalID is missing");
    if (!status) return missingBody(res, "status is missing");

    const result =
      await medicineInventoryPatientsOrderService.getMedicineInventoryPatientsOrder(
        hospitalID,
        status
      );

    return res.status(result.status).send(result);
  } catch (error) {
    serverError(res, error.message);
  }
};

const updatePatientOrderStatus = async (req, res) => {
  try {
    const hospitalID = req.params.hospitalID;
    const patientTimeLineID = req.params.patientTimeLineID;
    const status = req.params.status;
    const reasons = req.body.reasons || {};
    const updatedQuantities = req.body.updatedQuantities || {};
    const rejectReason = req.body.rejectReason;
    const paymentMethod = req.body.paymentMethod;
    const { dueAmount, paidAmount, totalAmount, nurseID } = req.body;

    if (!hospitalID) return missingBody(res, "hospitalID is missing");
    if (!status) return missingBody(res, "status is missing");
    if (!patientTimeLineID)
      return missingBody(res, "patientTimeLineID is missing");

    const result =
      await medicineInventoryPatientsOrderService.updatePatientOrderStatus(
        hospitalID,
        status,
        patientTimeLineID,
        reasons,
        updatedQuantities,
        rejectReason,
        nurseID,
        dueAmount,
        paidAmount,
        totalAmount,
        paymentMethod
      );

    return res.status(result.status).send(result);
  } catch (error) {
    serverError(res, error.message);
  }
};

const getMedicineInventoryPatientsOrderWithType = async (req, res) => {
  try {
    const hospitalID = req.params.hospitalID;
    const status = req.params.status;
    const departmemtType = req.params.departmemtType;
    if (!hospitalID) return missingBody(res, "hospitalID is missing");
    if (!status) return missingBody(res, "status is missing");
    if (!departmemtType) return missingBody(res, "departmemtType is missing");

    const result =
      await medicineInventoryPatientsOrderService.getMedicineInventoryPatientsOrderWithType(
        hospitalID,
        status,
        departmemtType
      );

    return res.status(result.status).send(result);
  } catch (error) {
    serverError(res, error.message);
  }
};

const getMedicineInventoryPatientsOrderCompletedWithRegPatient = async (
  req,
  res
) => {
  try {
    const hospitalID = req.params.hospitalID;
    let { startDate, endDate } = req.query;
    const departmentType = req.params.departmentType;
    if (!hospitalID) return missingBody(res, "hospitalID is missing");
    if (!departmentType) return missingBody(res, "departmentType is missing");
    if (!endDate) {
      endDate = startDate;
    }

    const result =
      await medicineInventoryPatientsOrderService.getMedicineInventoryPatientsOrderCompletedWithRegPatient(
        hospitalID,
        departmentType,
        startDate,
        endDate
      );

    return res.status(result.status).send(result);
  } catch (error) {
    serverError(res, error.message);
  }
};

const getTestsTaxInvoice = async (req, res) => {
  try {
    const hospitalID = req.params.hospitalID;
    // const status = req.params.status;
    if (!hospitalID) return missingBody(res, "hospitalID is missing");

    const result =
      await medicineInventoryPatientsOrderService.getTestsTaxInvoice(
        hospitalID
      );

    return res.status(result.status).send(result);
  } catch (error) {
    serverError(res, error.message);
  }
};

const getDepartmentConsumption = async (req, res) => {
  try {
    const hospitalID = req.params.hospitalID;
    const fromDate = req.params.fromDate;
    const toDate = req.params.toDate;

    if (!hospitalID || !fromDate)
      return missingBody(res, "hospitalID is missing");

    const result =
      await medicineInventoryPatientsOrderService.getDepartmentConsumption(
        hospitalID,
        fromDate,
        toDate
      );

    return res.status(result.status).send(result);
  } catch (error) {
    serverError(res, error.message);
  }
};

const getMedicinesInfo = async (req, res) => {
  try {
    const { hospitalID } = req.params;
    let { fromDate, toDate } = req.query;

    console.log("fromDate:", fromDate);

    // Validate required parameters
    if (!hospitalID || !fromDate) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required parameters" });
    }

    // If toDate is not provided, use fromDate
    if (!toDate) {
      toDate = fromDate;
    }

    const result = await medicineInventoryPatientsOrderService.getMedicinesInfo(
      hospitalID,
      fromDate,
      toDate
    );
    return res.status(result.status).send(result);
  } catch (error) {
    console.error("Error fetching stock summary:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const getExpiryProductInfo = async (req, res) => {
  try {
    const hospitalID = req.params.hospitalID;
    if (!hospitalID) return missingBody(res, "hospitalID is missing");

    const result =
      await medicineInventoryPatientsOrderService.getExpiryProductInfo(
        hospitalID
      );
    return res.status(result.status).send(result);
  } catch (error) {
    serverError(res, error.message);
  }
};

const getLowStockProductInfo = async (req, res) => {
  try {
    const hospitalID = req.params.hospitalID;
    if (!hospitalID) return missingBody(res, "hospitalID is missing");

    const result =
      await medicineInventoryPatientsOrderService.getLowStockProductInfo(
        hospitalID
      );

    return res.status(result.status).send(result);
  } catch (error) {
    serverError(res, error.message);
  }
};

const getMedicineInventoryPatientsOrderCompletedWithoutReg = async (
  req,
  res
) => {
  try {
    const hospitalID = req.params.hospitalID;
    let { startDate, endDate } = req.query;

    if (!hospitalID) return missingBody(res, "hospitalID is missing");
    if (startDate && !endDate) {
      endDate = startDate;
    }

    const result =
      await medicineInventoryPatientsOrderService.getMedicineInventoryPatientsOrderCompletedWithoutReg(
        hospitalID,
        startDate,
        endDate
      );

    return res.status(result.status).send(result);
  } catch (error) {
    serverError(res, error.message);
  }
};

module.exports = {
  getMedicineInventoryPatientsOrder,
  updatePatientOrderStatus,
  getMedicineInventoryPatientsOrderWithType,
  getDepartmentConsumption,
  getMedicinesInfo,
  getExpiryProductInfo,
  getLowStockProductInfo,
  getMedicineInventoryPatientsOrderCompletedWithoutReg,
  getMedicineInventoryPatientsOrderCompletedWithRegPatient,
  getTestsTaxInvoice
};
