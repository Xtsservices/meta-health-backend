const express = require("express");
const router = express.Router();
const verifyAccess = require("../middleware/verifyAccess");

const {
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
} = require("../controllers/medicineInventoryPatientsOrder");

router
  .route("/:hospitalID/:status/getMedicineInventoryPatientsOrder")
  .get(verifyAccess, getMedicineInventoryPatientsOrder);

router
  .route("/:hospitalID/:status/:patientTimeLineID/updatePatientOrderStatus")
  .post(verifyAccess, updatePatientOrderStatus);

router
  .route("/:hospitalID/getMedicineInventoryPatientsOrderCompletedWithoutReg")
  .get(verifyAccess, getMedicineInventoryPatientsOrderCompletedWithoutReg);

router
  .route(
    "/:hospitalID/:status/:departmemtType/getMedicineInventoryPatientsOrderWithType"
  )
  .get(verifyAccess, getMedicineInventoryPatientsOrderWithType);

router
  .route(
    "/:hospitalID/:departmentType/getMedicineInventoryPatientsOrderCompletedWithRegPatient"
  )
  .get(verifyAccess, getMedicineInventoryPatientsOrderCompletedWithRegPatient);

router
  .route("/:hospitalID/:status/getTestsTaxInvoice")
  .get(verifyAccess, getTestsTaxInvoice);

router
  .route("/:hospitalID/getDepartmentConsumption/:fromDate/:toDate")
  .get(verifyAccess, getDepartmentConsumption);

router
  .route("/:hospitalID/getMedicinesInfo")
  .get(verifyAccess, getMedicinesInfo);

router
  .route("/:hospitalID/getExpiryProductInfo")
  .get(verifyAccess, getExpiryProductInfo);

router
  .route("/:hospitalID/getLowStockProductInfo")
  .get(verifyAccess, getLowStockProductInfo);

module.exports = router;
