const express = require("express");
const router = express.Router();
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const verifyRoles = require("../middleware/verifyRoles");
const verifyAccess = require("../middleware/verifyAccess");
const verifySelf = require("../middleware/verfiySelf");
const roles = require("../utils/roles");
const verifyHospital = require("../middleware/verfiyHospital");
const {
  getAllHeadNurseFromHospital,
  getnursedashboardcounts,
  addleaves,
  getAttendanceLogs,
  getnursepatients,
  getpatientsmedicationalerts,
  getHeadNurseAllNurseFromHospital,
  addshiftschedule,
  getmyshiftschedule,
  getstaffleaves,
  getshiftschedule,
  deletestaffleave,
  deleteshiftschedule,
  getNurseAlerts,
  getstaffleavesCount,
  nurseHandshake,
} = require("../controllers/nurseControllers");

// get all head nurse based on hospital id
router
  .route("/getheadnurse/:hospitalID")
  .get(verifyAccess, verifyHospital, getAllHeadNurseFromHospital);

// get all  nurse and headnurse
router
  .route("/getallnurse/:hospitalID")
  .get(verifyAccess, verifyHospital, getHeadNurseAllNurseFromHospital);

// get getnursedashboardcounts based on hospital id
router
  .route("/getnursedashboardcounts/:hospitalID/:role")
  .get(verifyAccess, verifyHospital, getnursedashboardcounts);

//addLeaves for staff
router
  .route("/addleaves/:hospitalID")
  .post(verifyAccess, verifyHospital, addleaves);

//getstaffleaves for staff
router
  .route("/getstaffleaves/:hospitalID")
  .get(verifyAccess, verifyHospital, getstaffleaves);


//get total, pending, approved leaves for staff
router
  .route("/getstaffleavesCount/:hospitalID")
  .get(verifyAccess, verifyHospital, getstaffleavesCount);

//delete Leaves for staff
router
  .route("/deletestaffleave/:hospitalID/:rowId")
  .delete(verifyAccess, verifyHospital, deletestaffleave);

// get staff attandance logs head nurse based on hospital id
router
  .route("/getattendancelogs/:hospitalID/:departmentID")
  .get(verifyAccess, verifyHospital, getAttendanceLogs);

// get all patients based on hospital id and role
router
  .route("/getnursepatients/:hospitalID/:role")
  .get(verifyAccess, verifyHospital, getnursepatients);

// get medication and missed alerts based on hospital id
router
  .route("/getpatientsmedicationalerts/:hospitalID/:role")
  .get(verifyAccess, verifyHospital, getpatientsmedicationalerts);

//addschedule for nurse and headnurse for staff
//editID will come for edit(addshiftschedule) and delete
router
  .route("/shiftschedule/:hospitalID")
  .post(verifyAccess, verifyHospital, addshiftschedule)
  .get(verifyAccess, verifyHospital, getshiftschedule);
 
  router
  .route("/deleteshiftschedule/:hospitalID/:rowId")
  .delete(verifyAccess, verifyHospital, deleteshiftschedule)

//get schedule for nurse and headnurse for staff for calender for individual users
router
  .route("/getmyshiftschedule/:hospitalID")
  .get(verifyAccess, verifyHospital, getmyshiftschedule);


//get alerts  for nurse and headnurse 
router
.route(`/alerts/:hospitalID/:role`)
.get(verifyAccess, verifyHospital, getNurseAlerts);

router
.route(`/nurseHandShake/:hospitalID/:role/:wardID`)
.get(verifyAccess, verifyHospital, nurseHandshake);
module.exports = router;
