const pool = require("../db/conn");
const {
  ticketSchema,
  ticketStatusSchema,
  ticketPrioritySchema,
  ticketAssignedSchema,
  dueDateSchema,
  ticketCommentSchema
} = require("../helper/validators/ticketValidator");

const { priority, status, ticketFor } = require("../utils/tickets");
const roles = require("../utils/roles");

const {
  queryInsertTicket,
  querySAdminGetTicketByID,
  queryAdminGetTicketByID,
  queryGetTicketsInHospital,
  queryGetTicketsInHospitalForUser,
  queryGetAllTickets,
  queryEditTicketStatus,
  queryEditTicketPriority,
  queryGetTicketHandlers,
  queryAssignTicket,
  queryEditDueDate,
  queryInsertComment,
  queryGetCommentByID,
  queryGetComments,
  queryGetTicketByID,
  queryGetTicketCount
} = require("../queries/ticketQueries");

async function getAllTickets() {
  try {
    const [results] = await pool.query(queryGetAllTickets);
    return results;
  } catch (err) {
    throw new Error(err.message);
  }
}

async function getTicketHandlers() {
  try {
    const [results] = await pool.query(queryGetTicketHandlers, [roles.sAdmin]);
    return results;
  } catch (err) {
    throw new Error(err.message);
  }
}

async function getTicketCount() {
  try {
    const [result] = await pool.query(queryGetTicketCount);
    let open = 0,
      pending = 0,
      overDue = 0,
      assigned = 0;
    result.forEach((item, index) => {
      if (item.status == status.Open) {
        ``;
        open++;
        if (item.dueDate) {
          const date = new Date();
          console.log(`data: ${date}`);
          console.log(`dueDate: ${item.dueDate}`);
          if (date > item.dueDate) {
            overDue++;
          }
        }
        if (item.assignedID) {
          assigned++;
        } else {
          pending++;
        }
      }
    });

    return {
      Total_Tickets: result.length,
      Open: open,
      Pending: pending,
      Overdue: overDue,
      Assigned: assigned
    };
  } catch (err) {
    if (err.isJoi) throw new Error(`joi:${err.message}`);
    throw new Error(err.message);
  }
}

async function superAdminGetTicketByID(id) {
  try {
    const [results] = await pool.query(querySAdminGetTicketByID, [id]);
    return results[0];
  } catch (err) {
    throw new Error(err.message);
  }
}

async function editTicketStatus(id, data) {
  try {
    await ticketStatusSchema.validateAsync(data);
    const [result] = await pool.query(queryEditTicketStatus, [
      data.status,
      data.reason,
      data.closeStatus,
      id
    ]);

    if (!result.changedRows) {
      throw new Error("Failed to update");
    }

    return result;
  } catch (err) {
    if (err.isJoi) throw new Error(`joi:${err.message}`);
    throw new Error(err.message);
  }
}

async function editTicketPriority(id, data) {
  try {
    await ticketPrioritySchema.validateAsync(data);
    const [result] = await pool.query(queryEditTicketPriority, [
      data.priority,
      id
    ]);

    if (!result.changedRows) {
      throw new Error("Failed to update");
    }

    return result;
  } catch (err) {
    if (err.isJoi) throw new Error(`joi:${err.message}`);
    throw new Error(err.message);
  }
}

async function assignTicket(id, data) {
  try {
    await ticketAssignedSchema.validateAsync(data);
    const [result] = await pool.query(queryAssignTicket, [data.assignedID, id]);
    if (!result.changedRows) {
      throw new Error("Failed to update");
    }

    return result;
  } catch (err) {
    if (err.isJoi) throw new Error(`joi:${err.message}`);
    throw new Error(err.message);
  }
}

async function editDueDate(id, data) {
  try {
    await dueDateSchema.validateAsync(data);
    const [result] = await pool.query(queryEditDueDate, [data.dueDate, id]);
    if (!result.changedRows) {
      throw new Error("Failed to update");
    }

    return result;
  } catch (err) {
    if (err.isJoi) throw new Error(`joi:${err.message}`);
    throw new Error(err.message);
  }
}

async function sAdminGetComments(ticketID) {
  try {
    const [results] = await pool.query(queryGetComments, [ticketID]);

    return results;
  } catch (err) {
    throw new Error(err.message);
  }
}

async function sAdminAddComment(data) {
  try {
    await ticketCommentSchema.validateAsync(data);
    const [foundTicket] = await pool.query(queryGetTicketByID, [data.id]);

    if (!foundTicket[0]) {
      throw new Error("ticket not found");
    }
    if (foundTicket.status == status.Closed) {
      throw new Error("ticket is closed");
    }

    const [result] = await pool.query(queryInsertComment, [
      data.id,
      data.userID,
      data.comment
    ]);

    if (!result.insertId) {
      throw new Error("Failed to add comment");
    }

    const [comment] = await pool.query(queryGetCommentByID, [result.insertId]);

    return comment[0];
  } catch (err) {
    if (err.isJoi) throw new Error(`joi:${err.message}`);
    throw new Error(err.message);
  }
}

async function adminGetTicketByID(hospitalID, id) {
  try {
    const [results] = await pool.query(queryAdminGetTicketByID, [
      hospitalID,
      id
    ]);

    return results[0];
  } catch (err) {
    throw new Error(err.message);
  }
}

async function getHospitalTickets(hospitalID) {
  try {
    const [results] = await pool.query(queryGetTicketsInHospital, [hospitalID]);
    return results;
  } catch (err) {
    throw new Error(err.message);
  }
}

async function addNewTicket(data) {
  try {
    await ticketSchema.validateAsync(data);
    const [result] = await pool.query(queryInsertTicket, [
      data.hospitalID,
      data.userID,
      data.type,
      data.subject,
      // data.ticketFor,
      data.createdBy,
      data.module
    ]);
    if (!result.insertId) {
      throw new Error("Failed to add Ticket");
    }

    const [ticket] = await pool.query(queryGetTicketByID, [result.insertId]);

    return ticket[0];
  } catch (err) {
    if (err.isJoi) throw new Error(`joi:${err.message}`);
    throw new Error(err.message);
  }
}

async function getHospitalTicketsForUser(hospitalID, userID) {
  try {
    const [results] = await pool.query(queryGetTicketsInHospitalForUser, [
      hospitalID,
      userID
    ]);

    return results;
  } catch (err) {
    throw new Error(err.message);
  }
}

async function adminGetComments(id) {
  try {
    const [foundTicket] = await pool.query(queryGetTicketByID, [id]);
    if (!foundTicket[0]) {
      throw new Error("ticket not found");
    }

    if (foundTicket[0].hospitalID !== req.hospitalID) {
      throw new Error("Hospital, Not Matching");
    }

    const [results] = await pool.query(queryGetComments, [id]);

    return results;
  } catch (err) {
    throw new Error(err.message);
  }
}

async function adminAddComment(data) {
  try {
    await ticketCommentSchema.validateAsync(data);
    const [foundTicket] = await pool.query(queryGetTicketByID, [data.id]);

    if (!foundTicket[0]) throw new Error("ticket not found");

    if (foundTicket[0].hospitalID !== req.hospitalID)
      throw new Error("Hospital method Not Matching");

    if (foundTicket[0].status === status.Closed)
      throw new Error("ticket is closed");

    const [result] = await pool.query(queryInsertComment, [
      data.id,
      data.userID,
      data.comment
    ]);

    if (!result.insertId) throw new Error("Failed to add comment");

    const [comment] = await pool.query(queryGetCommentByID, [result.insertId]);

    return comment[0];
  } catch (err) {
    if (err.isJoi) throw new Error(`joi:${err.message}`);
    throw new Error(err.message);
  }
}

module.exports = {
  getAllTickets,
  getTicketHandlers,
  getTicketCount,
  superAdminGetTicketByID,
  editTicketStatus,
  editTicketPriority,
  assignTicket,
  editDueDate,
  sAdminGetComments,
  sAdminAddComment,
  adminGetTicketByID,
  getHospitalTickets,
  addNewTicket,
  getHospitalTicketsForUser,
  adminGetComments,
  adminAddComment
};
