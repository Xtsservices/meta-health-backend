const {
  serverError,
  missingBody,
  resourceNotFound,
  duplicateRecord,
  notAllowed
} = require("../utils/errors");
const pool = require("../db/conn");
const {
  ticketSchema,
  ticketStatusSchema,
  ticketPrioritySchema,
  ticketAssignedSchema,
  dueDateSchema,
  ticketCommentSchema
} = require("../helper/validators/ticketValidator");

const ticketServices = require("../services/ticketServices");
const { priority, status, ticketFor } = require("../utils/tickets");

/**
 * *** METHOD : POST
 * *** DESCRIPTION : HOSPITAL ADMIN ADD NEW TICKET
 */

const addNewTicket = async (req, res) => {
  const data = {
    hospitalID: req.params.hospitalID,
    userID:
      req.body.ticketFor == ticketFor.self
        ? req.body.createdBy
        : req.body.userID,
    type: req.body.type,
    subject: req.body.subject,
    // ticketFor: req.body.ticketFor,
    createdBy: req.body.createdBy,
    module: req.body.module
  };
  // console.log("bosy data", data);
  try {
    const ticket = await ticketServices.addNewTicket(data);

    res.status(201).send({
      message: "success",
      ticket: ticket
    });
  } catch (err) {
    if (err.isJoi) return missingBody(res, `joi: ${err.message}`);
    serverError(res, err.message);
  }
};

/**
 * ** METHOD : GET
 * ** DESCRIPITION : HOSPITAL ADMIN GET ALL TICKETS
 */
const getHospitalTickets = async (req, res) => {
  const hospitalID = req.params.hospitalID;
  try {
    const results = await ticketServices.getHospitalTickets(hospitalID);

    res.status(200).send({
      message: "success",
      tickets: results
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

const getHospitalTicketsForUser = async (req, res) => {
  const hospitalID = req.params.hospitalID;
  const userID = req.params.userID;
  try {
    const results = await ticketServices.getHospitalTicketsForUser(
      hospitalID,
      userID
    );

    res.status(200).send({
      message: "success",
      tickets: results
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

/**
 * ** METHOD : GET
 * ** DESCRIPTION : SUPER ADMIN GET ALL TICKETS
 */
const getAllTickets = async (req, res) => {
  try {
    const results = await ticketServices.getAllTickets();
    res.status(200).send({
      message: "success",
      tickets: results
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

/**
 * ** METHOD : GET
 * ** DESCRIPITON : SUPER ADMIN GET TICKET BY ID
 */
const superAdminGetTicketByID = async (req, res) => {
  const id = req.params.id;
  try {
    if (!id) return missingBody(res, "id missing");

    const results = await ticketServices.superAdminGetTicketByID(id);
    res.status(200).send({
      message: "success",
      ticket: results
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

/**
 * ** METHOD : GET
 * ** DESCRIPITON :  ADMIN GET TICKET BY ID
 */
const adminGetTicketByID = async (req, res) => {
  const id = req.params.id;
  const hospitalID = req.params.hospitalID;
  try {
    const results = await ticketServices.adminGetTicketByID(hospitalID, id);

    res.status(200).send({
      message: "success",
      ticket: results
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

/**
 * ** METHOD : GET
 * ** DESCRIPTION : GET AVAILABLE TICKET HANDLERS
 */
const getTicketHandlers = async (req, res) => {
  try {
    const results = await ticketServices.getTicketHandlers();

    res.status(200).send({
      message: "success",
      users: results
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

/**
 * ** METHOD : PATCH
 * ** DESCRIPTION : SUPER ADMIN CHANGE STATUS
 */
const editTicketStatus = async (req, res) => {
  const id = req.params.id;

  const data = {
    status: req.body.status,
    reason: req.body.reason,
    closeStatus: req.body.closeStatus || null
  };

  try {
    const result = await ticketServices.editTicketStatus(id, data);
    res.status(200).send({
      message: "success",
      result
    });
  } catch (err) {
    if (err.message.startsWith("joi:")) {
      return missingBody(res, err.message);
    }
    serverError(res, err.message);
  }
};

/**
 * ** METHOD : PATCH
 * ** DESCRIPTION : SUPER ADMIN CHANGE PRIORITY
 */
const editTicketPriority = async (req, res) => {
  const id = req.params.id;
  const data = {
    priority: req.body.priority
  };
  try {
    await ticketPrioritySchema.validateAsync(data);
    const result = await ticketServices.editTicketPriority(id, data);

    res.status(200).send({
      message: "success",
      result
    });
  } catch (err) {
    if (err.isJoi) return missingBody(res, `joi:${err.message}`);
    serverError(res, err.message);
  }
};

/**
 * ** METHOD : PATCH
 * ** DESCRIPTION : SUPER ADMIN CHANGE ASSIGNED TO
 */
const assignTicket = async (req, res) => {
  const id = req.params.id;
  const data = {
    assignedID: req.body.assignedID
  };
  try {
    const result = await ticketServices.assignTicket(id, data);

    res.status(200).send({
      message: "success",
      result
    });
  } catch (err) {
    if (err.isJoi) return missingBody(res, `joi:${err.message}`);
    serverError(res, err.message);
  }
};

/**
 * ** METHOD : GET
 * ** DESCRIPTION : GET TICKET COUNT
 */
const getTicketCount = async (req, res) => {
  try {
    const result = await ticketServices.getTicketCount();

    res.status(200).send({
      message: "success",
      ...result
    });
  } catch (err) {
    if (err.isJoi) return missingBody(res, `joi:${err.message}`);
    serverError(res, err.message);
  }
};

/**
 * ** METHOD : PATCH
 * ** DESCRIPTON :  EDIT DUE DATE
 */
const editDueDate = async (req, res) => {
  const id = req.params.id;
  const data = {
    dueDate: req.body.dueDate
  };
  try {
    const result = await ticketServices.editDueDate(id, data);

    res.status(200).send({
      message: "success",
      result
    });
  } catch (err) {
    if (err.isJoi) return missingBody(res, `joi:${err.message}`);
    serverError(res, err.message);
  }
};

/**
 * *************** COMMENTS **********************
 */
/**
 * METHOD : GET
 * DESCRIPTION : SUPER ADMIN GET ALL COMMENTS IN TICKET
 */
const sAdminGetComments = async (req, res) => {
  const ticketID = req.params.id;
  try {
    const results = await ticketServices.sAdminGetComments(ticketID);

    res.status(200).send({
      message: "success",
      comments: results
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

/**
 * MEHTOD : POST
 * DESCRIPTION : SUPER ADMIN ADD NEW COMMENT
 */
const sAdminAddComment = async (req, res) => {
  const data = {
    id: req.params.id,
    userID: req.userID,
    comment: req.body.comment
  };

  try {
    const comment = await ticketServices.sAdminAddComment(data);

    res.status(200).send({
      message: "success",
      comment: comment
    });
  } catch (err) {
    if (err.isJoi) return missingBody(res, `joi:${err.message}`);
    serverError(res, err.message);
  }
};

/**
 * ** METHOD : GET
 * ** DESCRIPTION : ADMIN ADD COMMENT
 */
const adminAddComment = async (req, res) => {
  const data = {
    id: req.params.id,
    userID: req.userID,
    comment: req.body.comment
  };
  try {
    const comment = await ticketServices.adminAddComment(data);

    res.status(200).send({
      message: "success",
      comment: comment
    });
  } catch (err) {
    if (err.isJoi) return missingBody(res, `joi:${err.message}`);
    serverError(res, err.message);
  }
};

/**
 * METHOD : GET
 * DESCRIPTION : SUPER ADMIN GET ALL COMMENTS IN TICKET
 */
const adminGetComments = async (req, res) => {
  const id = req.params.id;
  try {
    const results = await ticketServices.adminGetComments(id);

    res.status(200).send({
      message: "success",
      comments: results
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

module.exports = {
  addNewTicket,
  getHospitalTickets,
  getAllTickets,
  getTicketHandlers,
  editTicketStatus,
  editTicketPriority,
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
};
