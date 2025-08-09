const express = require("express");
const router = express.Router();
const {
  createStaff,
  emailLogin,
  getUserDetailById,
  getUser,
  getAllUsersFromHospital,
  loginMobileUserEmail,
  changeUserPassword,
  updateUserProfile,
  adminUpdateUserProfile,
  updateSelfUserPassword,
  getUserCountByRole,
  getUserListByRole,
  checkUser,
  adminUpdateStaff,
  createMultipleStaff,
  getUsersListFromHospitals,
  getAllNurses,
  deleteuser,
  addCustomerCareUser,
  getAllCustomerCareUsers,
  getHospitalsListForCCE,
  updateCustomerCareUser,
  DeactivateCCE,
  ReactivateCCE,
} = require("../controllers/user");

const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const verifyRoles = require("../middleware/verifyRoles");
const verifyAccess = require("../middleware/verifyAccess");
const verifySelf = require("../middleware/verfiySelf");
const roles = require("../utils/roles");
const verifyHospital = require("../middleware/verfiyHospital");


//get list of hospitals for cce
router
  .route("/hospitalsListForCCE")
  .get(verifyAccess,  verifyRoles(roles.customerCare), getHospitalsListForCCE);


// Deactivate
router.route("/deactivate/:id").patch(
  verifyAccess,
  verifyRoles(roles.sAdmin), // only Super Admin can access
  DeactivateCCE
);

// Reactivate
router.route("/reactivate/:id").patch(
  verifyAccess,
  verifyRoles(roles.sAdmin), // only Super Admin can access
  ReactivateCCE
);

// get all  CustomerCareUsers 
router
  .route("/getAllCustomerCareUsers")
  .get(verifyAccess, getAllCustomerCareUsers);

  router.route("/editCustomerCareUser/:id").patch(
    verifyAccess,
    verifyRoles(roles.sAdmin), // only Super Admin can access
    upload.single("photo"),
    updateCustomerCareUser
  );
  

router.route("/:id").get(verifyAccess, getUserDetailById);

router
  .route("/gettallstaff/:hospitalID")
  .get(
    verifyAccess,
    verifyRoles(roles.admin),
    verifyHospital,
    getAllUsersFromHospital
  );

router.route("/emailLogin").post(emailLogin);
router.route("/deleteuser").post(deleteuser);

router.route("/checkUser").post(verifyAccess, checkUser);

router.route("/mobileEmailLogin").post(loginMobileUserEmail);

router
  .route("/:hospitalID/:id")
  .get(verifyAccess, verifyHospital, getUser)
  .patch(
    verifyAccess,
    verifyHospital,
    verifySelf,
    upload.single("photo"),
    updateUserProfile
  );

router
  .route("/:hospitalID/admin/:id")
  .patch(
    verifyAccess,
    verifyHospital,
    verifyRoles(roles.admin),
    upload.single("photo"),
    adminUpdateUserProfile
  );

router
  .route("/:hospitalID/createStaff")
  .post(
    verifyAccess,
    verifyRoles(roles.admin),
    verifyHospital,
    upload.single("photo"),
    createStaff
  );

router
  .route("/:hospitalID/createMultipleStaff")
  .post(
    verifyAccess,
    verifyRoles(roles.admin),
    verifyHospital,
    createMultipleStaff
  );

router
  .route("/:hospitalID/changePassword/admin")
  .patch(
    verifyAccess,
    verifyRoles(roles.admin),
    verifyHospital,
    changeUserPassword
  );

router
  .route("/:hospitalID/changePassword/:id")
  .patch(verifyAccess, verifyHospital, verifySelf, updateSelfUserPassword);

router
  .route("/:hospitalID/count/:role")
  .get(
    verifyAccess,
    verifyRoles(roles.admin),
    verifyHospital,
    getUserCountByRole
  );

router
  .route("/:hospitalID/list/:role")
  .get(verifyAccess, verifyHospital, getUserListByRole);

router
  .route("/:hospitalID/usersList/:role")
  .get(verifyAccess, verifyHospital, getUsersListFromHospitals);

// addCustomerCareUser all scopes , multiple hospitals
router.route("/addCustomerCareUser").post(
  verifyAccess,
  verifyRoles(roles.sAdmin), // only Super Admin can access
  upload.single("photo"),
  addCustomerCareUser
);


//===============pending=================
router
  .route("/:hospitalID/editStaff/:id")
  .patch(
    verifyAccess,
    verifyRoles(roles.admin),
    verifyHospital,
    upload.single("photo"),
    adminUpdateStaff
  );
//===============pending=================

module.exports = router;
