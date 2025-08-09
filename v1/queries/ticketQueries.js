const queryInsertTicket = `INSERT INTO tickets (hospitalID, userID, type, subject, createdBy, module) VALUES (?, ?, ?, ?, ?, ?)`;
// const queryInsertTicket = `INSERT INTO tickets(hospitalID,userID,type,subject,ticketFor,createdBy) VALUES(?,?,?,?,?,?)`;
const querySAdminGetTicketByID = `SELECT tickets.id,hospitals.name as hospitalName,tickets.priority,tickets.status,tickets.type,tickets.subject,tickets.dueDate,
  users.id as assignedID,CONCAT(users.firstName, ' ', users.lastName) AS assignedName
  FROM tickets
  LEFT JOIN hospitals on tickets.hospitalID=hospitals.id
  LEFT JOIN users on tickets.assignedID=users.id
  WHERE tickets.id=?`;

const queryAdminGetTicketByID = `SELECT tickets.id,hospitals.name as hospitalName,tickets.priority,tickets.status,tickets.type,tickets.subject,tickets.dueDate,
  users.id as assignedID,CONCAT(users.firstName, ' ', users.lastName) AS assignedName
  FROM tickets
  LEFT JOIN hospitals on tickets.hospitalID=hospitals.id
  LEFT JOIN users on tickets.assignedID=users.id
  WHERE tickets.hospitalID=? AND tickets.id=?`;

const queryGetTicketsInHospital = `SELECT tickets.id,hospitals.name as hospitalName,tickets.priority,tickets.status,tickets.type,tickets.subject,tickets.dueDate,
    users.id as assignedID,CONCAT(users.firstName, ' ', users.lastName) AS assignedName
    FROM tickets
    LEFT JOIN hospitals on tickets.hospitalID=hospitals.id
    LEFT JOIN users on tickets.assignedID=users.id
    WHERE tickets.hospitalID=?
    ORDER BY tickets.addedOn DESC`;

const queryGetTicketsInHospitalForUser = `SELECT tickets.id,hospitals.name as hospitalName,tickets.priority,tickets.status, tickets.module,tickets.type,tickets.subject,tickets.dueDate,
    users.id as assignedID,CONCAT(users.firstName, ' ', users.lastName) AS assignedName
    FROM tickets
    LEFT JOIN hospitals on tickets.hospitalID=hospitals.id
    LEFT JOIN users on tickets.assignedID=users.id
    WHERE tickets.hospitalID=? AND createdBy=?
    ORDER BY tickets.addedOn DESC`;
const queryGetAllTickets = `SELECT tickets.id,hospitals.name as hospitalName,tickets.priority,tickets.status,tickets.type,tickets.subject,tickets.dueDate,
    users.id as assignedID,CONCAT(users.firstName, ' ', users.lastName) AS assignedName
    FROM tickets
    LEFT JOIN hospitals on tickets.hospitalID=hospitals.id
    LEFT JOIN users on tickets.assignedID=users.id
    ORDER BY tickets.addedOn DESC`;
const queryEditTicketStatus = `UPDATE tickets SET status=?,reason=?,closeStatus=?  WHERE id=?`;
const queryEditTicketPriority = `UPDATE tickets SET priority=? WHERE id=?`;
const queryGetTicketHandlers = `SELECT id,firstName,lastName FROM users WHERE role=?`;
const queryAssignTicket = `UPDATE tickets SET assignedID=? WHERE id=?`;
const queryEditDueDate = `UPDATE tickets SET dueDate=? WHERE id=?`;
const queryInsertComment = `INSERT INTO ticketComment(ticketID,userID,comment) VALUES(?,?,?)`;
const queryGetCommentByID = `SELECT * FROM ticketComment WHERE id=?`;
const queryGetComments = `SELECT ticketComment.id,ticketComment.ticketID,users.id as userID,users.firstName,users.lastName,ticketComment.comment,ticketComment.addedOn FROM ticketComment
    LEFT JOIN users on ticketComment.userID=users.id
    WHERE ticketID=?`;
const queryGetTicketByID = "SELECT * from tickets where id=?";
const queryGetTicketCount = `SELECT status,assignedID,dueDate 
    FROM tickets`;

module.exports = {
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
};
