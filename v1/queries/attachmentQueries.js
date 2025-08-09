const queryGetAttachmentsByTimeLine =
  "SELECT * FROM attachments WHERE patientID=?";

const queryGetConsentAttachmentsByTimeLine =
  "SELECT * FROM consentformAttachments WHERE patientID=?";
const queryGetAttachmentsByTickets =
  "SELECT * FROM ticketAttachments WHERE ticketID=?";
const checkTimeLineID =
  "SELECT id,patientEndStatus FROM patientTimeLine WHERE id=?";
const queryInsertAttachments =
  "INSERT INTO attachments(timeLineID,patientID,testID,userID,fileName,givenName,mimeType,category) " +
  "VALUES ?";
const queryInsertConsentAttachments =
  "INSERT INTO consentformAttachments(timeLineID,patientID,userID,fileName,givenName,mimeType,category) " +
  "VALUES ?";
const checkTicketID = "SELECT id FROM tickets WHERE id=?";
const queryInsertTicketAttachments =
  "INSERT INTO ticketAttachments(ticketID,fileName,givenName,mimeType) " +
  "VALUES ?";
const queryGetAttachmentByID = "SELECT * FROM attachments WHERE id=?";
const queryDeleteAttachmentByID = "DELETE FROM attachments WHERE id=?";

const queryGetConsentAttachmentByID =
  "SELECT * FROM consentformAttachments WHERE id=?";
const queryDeleteConsentAttachmentByID =
  "DELETE FROM consentformAttachments WHERE id=?";

module.exports = {
  queryGetAttachmentsByTimeLine,
  queryGetConsentAttachmentsByTimeLine,
  queryGetAttachmentsByTickets,
  checkTimeLineID,
  queryInsertAttachments,
  queryInsertConsentAttachments,
  checkTicketID,
  queryInsertTicketAttachments,
  queryGetAttachmentByID,
  queryDeleteAttachmentByID,
  queryGetConsentAttachmentByID,
  queryDeleteConsentAttachmentByID
};
