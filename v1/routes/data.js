const express = require("express");
const router = express.Router();
const verifyRoles = require("../middleware/verifyRoles");
const verifyAccess = require("../middleware/verifyAccess");
const roles = require("../utils/roles");
const verifyHospital = require("../middleware/verfiyHospital");
const {
  getFoodAllergies,
  getMedicineAllergies,
  getSymptoms,
  getCancerTypes,
  getBoneProblems,
  getChestConditions,
  getHeartProblems,
  getCardiovascularCoditions,
  getBloodTypes,
  getPincodeDistrictData,
  getRelations,
  getAllTest,
  getAnethesiaAllergyList,
  getSurgeryTypes,
  getLionicCode,
  getAllLionicCodeData,
  administrativeRegions
} = require("../controllers/data");

router.route("/administrativeRegions").get(verifyAccess, administrativeRegions);
router.route("/foodAllergies").get(verifyAccess, getFoodAllergies);
router.route("/surgerytypes").get(verifyAccess, getSurgeryTypes);

router.route("/anesthesia").get(verifyAccess, getAnethesiaAllergyList);

router.route("/symptoms").post(verifyAccess, getSymptoms);
router.route("/lionicCode/:hospitalID").post(verifyAccess, getLionicCode);
router.route("/lionicCode").post(verifyAccess, getAllLionicCodeData);
router.route("/cancerTypes").get(verifyAccess, getCancerTypes);

router.route("/boneProblems").get(verifyAccess, getBoneProblems);

router.route("/bloodGroups").get(verifyAccess, getBloodTypes);

router.route("/relations").get(verifyAccess, getRelations);

router.route("/chestConditions").get(verifyAccess, getChestConditions);

router.route("/medicineAllergies").get(verifyAccess, getMedicineAllergies);

router.route("/heartProblems").get(verifyAccess, getHeartProblems);

router.route("/cardiovascular").get(verifyAccess, getCardiovascularCoditions);
router.route("/pincode/:district").get(verifyAccess, getPincodeDistrictData);
router.route("/getAllTests").post(verifyAccess, getAllTest);

module.exports = router;
