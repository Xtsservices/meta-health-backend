const express = require("express");
const router = express.Router();
const {
  createShift,
  createRooster,
  createLeaveEntries,
  cancelLeave,
  getStaffStatus,
  getRoosterListByMonthAndYear,
  deactivateShift,
  getAllShifts,
  updateRooster
} = require("../controllers/rooster");
const verifyRoles = require("../middleware/verifyRoles");
const verifyAccess = require("../middleware/verifyAccess");
const roles = require("../utils/roles");
const verifyHospital = require("../middleware/verfiyHospital");

// Routes
// router.use(verifyAccess, verifyRoles(roles.management));

router.post("/:hospitalID", createRooster);
router.post("/shift/:hospitalID", verifyHospital, createShift);
router.post("/leave/:hospitalID", createLeaveEntries);
router.delete("/leave/:hospitalID", cancelLeave);
router.get("/:year/:month/:hospitalID", getRoosterListByMonthAndYear);
router.get("/shifts/:hospitalID", getAllShifts); // New route for getting all shifts
router.patch("/shifts/deactivate/:hospitalID/:shiftID", deactivateShift);
router.post("/:hospitalID/:roosterID", updateRooster);

//the below code have error like
// Error getting staff status: Error: Unknown column 'shift_date' in 'where clause'
router.get("/staffStatus/:hospitalID", getStaffStatus);

module.exports = router;
