const express = require("express");
const router = express.Router();
const verifyRoles = require("../middleware/verifyRoles");
const verifyAccess = require("../middleware/verifyAccess");
const roles = require("../utils/roles");
const verifyHospital = require("../middleware/verfiyHospital");
const {
  addAttachments,
  addConsentformAttachments,
  getAttachmentById,
  getAllAttachmentsInTimeLine,
  getAllConsentformAttachmentsInTimeLine,
  addTicketAttachments,
  getAllAttachmentsInTickets,
  deleteAttachement,
  deleteConsentAttachement,
  addWalkinAttachments,
  getProxyFile,
} = require("../controllers/attachment");
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
router
  .route("/tickets/:hospitalID/:ticketID")
  .post(
    verifyAccess,
    verifyHospital,
    upload.array("files"),
    addTicketAttachments
  )
  .get(verifyAccess, verifyHospital, getAllAttachmentsInTickets);
router
  .route("/:hospitalID/all/:patientID")
  .get(verifyAccess, getAllAttachmentsInTimeLine);

//walkin
router
  .route("/:hospitalID/:walkinID/:userID/walkinAttachment")
  .post(
    verifyAccess,
    verifyHospital,
    upload.array("files"),
    addWalkinAttachments
  );

router
  .route("/:hospitalID/:timeLineID/:patientID/:userID")
  .post(verifyAccess, verifyHospital, upload.array("files"), addAttachments);

router
  .route("/:hospitalID/:timeLineID/:patientID/:userID/consentform")
  .post(
    verifyAccess,
    verifyHospital,
    upload.array("files"),
    addConsentformAttachments
  );
router
  .route("/:hospitalID/all/:patientID/consentform")
  .get(verifyAccess, verifyHospital, getAllConsentformAttachmentsInTimeLine);

router
  .route("/:hospitalID/:id")
  .delete(verifyAccess, verifyHospital, deleteAttachement);

router
  .route("/:hospitalID/:id/consentform")
  .delete(verifyAccess, verifyHospital, deleteConsentAttachement);

router.get("/proxypdf", getProxyFile);

module.exports = router;
