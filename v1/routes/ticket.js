const express = require("express");
const router = express.Router();
const verifyRoles = require("../middleware/verifyRoles");
const verifyAccess = require("../middleware/verifyAccess");
const roles = require("../utils/roles");
const verifyHospital = require("../middleware/verfiyHospital");
const {
  addNewTicket,
  getHospitalTickets,
  getAllTickets,
  editTicketStatus,
  editTicketPriority,
  getTicketHandlers,
  assignTicket,
  editDueDate,
  sAdminAddComment,
  sAdminGetComments,
  adminAddComment,
  adminGetComments,
  getTicketCount,
  superAdminGetTicketByID,
  adminGetTicketByID,
  getHospitalTicketsForUser
} = require("../controllers/ticket");

/**
 * ** SUPER ADMIN
 * ** list all tickets
 * ** list all ticket handlers(the users assinged to handle tickets)
 * ** change ticket status
 * ** change ticket priority
 * ** assign ticket to a ticket handler
 * ** change due date of ticket
 */
router.route("/").get(verifyAccess, verifyRoles(roles.sAdmin), getAllTickets);

router
  .route("/handlers")
  .get(verifyAccess, verifyRoles(roles.sAdmin), getTicketHandlers);

router
  .route("/count")
  .get(verifyAccess, verifyRoles(roles.sAdmin), getTicketCount);

router
  .route("/:id")
  .get(verifyAccess, verifyRoles(roles.sAdmin), superAdminGetTicketByID);

router
  .route("/:id/status")
  .patch(verifyAccess, verifyRoles(roles.sAdmin), editTicketStatus);

router
  .route("/:id/priority")
  .patch(verifyAccess, verifyRoles(roles.sAdmin), editTicketPriority);

router
  .route("/:id/assign")
  .patch(verifyAccess, verifyRoles(roles.sAdmin), assignTicket);

router
  .route("/:id/dueDate")
  .patch(verifyAccess, verifyRoles(roles.sAdmin), editDueDate);

router
  .route("/:id/comment")
  .get(verifyAccess, verifyRoles(roles.sAdmin), sAdminGetComments)
  .post(verifyAccess, verifyRoles(roles.sAdmin), sAdminAddComment);

router
  .route("/hospital/:hospitalID/:id")
  .get(verifyAccess, verifyHospital, adminGetTicketByID);

router
  .route("/hospital/:hospitalID")
  .get(verifyAccess, verifyHospital, getHospitalTickets)
  .post(verifyAccess, verifyHospital, addNewTicket);

router
  .route("/hospital/:hospitalID/getAllTickets/:userID")
  .get(verifyAccess, verifyHospital, getHospitalTicketsForUser);

router
  .route("/hospital/:hospitalID/:id/comment")
  .get(verifyAccess, verifyHospital, adminGetComments)
  .post(verifyAccess, verifyHospital, adminAddComment);

module.exports = router;
