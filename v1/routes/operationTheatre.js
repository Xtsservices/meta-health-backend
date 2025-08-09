const express = require("express");
const router = express.Router();
const verifyAccess = require("../middleware/verifyAccess");
const verfiyHospital = require("../middleware/verfiyHospital");
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const {
  addNewEntryOt,
  getAlerts,
  addPhysicalExamination,
  addPreopRecord,
  addPostopRecord,
  addAnesthesiaRecord,
  addPatientforOT,
  getPatientOTAnesthetistEmergency,
  getPatientOTAnesthetistElective,
  getPatientOTSurgeonEmergency,
  getPatientOTSurgeonElective,
  getStatus,
  getOTData,
  getOTPatientTypeCount,
  redzonePhysicalExamination,
  getSurgeryTypes,
  getApprovedRejected,
  getSurgeonSurgeryTypesInfo,
  getPostopRecord,
  redzonePhysicalExaminationImage,
  getredzonePhysicalExaminationImage
} = require("../controllers/operationTheatre");

router
  .route("/:hospitalID/:patientTimeLineId")
  .post(verifyAccess, verfiyHospital, addNewEntryOt);

router
  .route("/:hospitalID/:status/getAlerts")
  .get(verifyAccess, verfiyHospital, getAlerts);

router
  .route("/:hospitalID/surgeryTypes")
  .get(verifyAccess, verfiyHospital, getSurgeryTypes);
// =========for surgeon========
router
  .route("/:hospitalID/surgeonSurgeryTypes")
  .get(verifyAccess, verfiyHospital, getSurgeonSurgeryTypesInfo);

router
  .route("/:hospitalID/approvedRejected")
  .get(verifyAccess, verfiyHospital, getApprovedRejected);

router
  .route("/:hospitalID/:patientTimeLineId/physicalExamination")
  .post(verifyAccess, verfiyHospital, addPhysicalExamination);

// WE ARE ADDING THIS FOR TEMPROARY PURPOSE WILL NEED TO RETHINK ON THIS
router
  .route("/:hospitalID/:patientTimeLineId/redzone/physicalExamination")
  .post(verifyAccess, verfiyHospital, redzonePhysicalExamination);

router
  .route(
    "/:hospitalID/:patientTimeLineId/:patientID/redzone/physicalExaminationImage"
  )
  .post(
    verifyAccess,
    verfiyHospital,
    upload.single("photo"),
    redzonePhysicalExaminationImage
  );

router
  .route(
    "/:hospitalID/:patientTimeLineId/:patientID/redzone/physicalExaminationImage"
  )
  .get(
    verifyAccess,
    upload.single("photo"),
    getredzonePhysicalExaminationImage
  );

router
  .route("/:hospitalID/:patientTimeLineId/:userID/preopRecord")
  .post(verifyAccess, verfiyHospital, addPreopRecord);

router
  .route("/:hospitalID/:patientTimeLineId/postopRecord")
  .post(verifyAccess, verfiyHospital, addPostopRecord);

router
  .route("/:hospitalID/:patientTimeLineId/postopRecord")
  .get(verifyAccess, verfiyHospital, getPostopRecord);

router
  .route("/:hospitalID/:patientTimeLineId/anesthesiaRecord")
  .post(verifyAccess, verfiyHospital, addAnesthesiaRecord);

router
  .route("/:hospitalID/requestAcceptAnesthesia")
  .post(verifyAccess, verfiyHospital, addPatientforOT);

router
  .route("/:hospitalID/allocateSurgon")
  .post(verifyAccess, verfiyHospital, addPatientforOT);

router
  .route("/:hospitalID/:userID/getPatient/anesthetist/emergency")
  .get(verifyAccess, verfiyHospital, getPatientOTAnesthetistEmergency);

router
  .route("/:hospitalID/:userID/getPatient/anesthetist/elective")
  .get(verifyAccess, verfiyHospital, getPatientOTAnesthetistElective);

router
  .route("/:hospitalID/:userID/getPatient/surgeon/emergency")
  .get(verifyAccess, verfiyHospital, getPatientOTSurgeonEmergency);

router
  .route("/:hospitalID/:userID/getPatient/surgeon/elective")
  .get(verifyAccess, verfiyHospital, getPatientOTSurgeonElective);

router
  .route("/:hospitalID/:patientTimeLineId/getStatus")
  .get(verifyAccess, verfiyHospital, getStatus);

router
  .route("/:hospitalID/:patientTimeLineId/getOTData")
  .get(verifyAccess, verfiyHospital, getOTData);

router
  .route("/:hospitalID/getOTPatientTypeCount")
  .get(verifyAccess, verfiyHospital, getOTPatientTypeCount);

module.exports = router;
