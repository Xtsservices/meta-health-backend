const {
  serverError,
  missingBody,
  resourceNotFound,
  duplicateRecord,
  notAllowed
} = require("../utils/errors");
const attachmentServices = require("../services/attachmentService");

const axios = require("axios");

/**
 * *** METHOD : POST
 * *** DESCRIPTION : insert attachements
 */
const addAttachments = async (req, res) => {
  const patientID = req.params.patientID;
  const timeLineID = req.params.timeLineID;
  const userID = req.params.userID;
  const category = req.body.category;
  const files = req.files;
  const { testID } = req.query;

  if (!category) return missingBody(res, "Category missing");
  if (!patientID) return missingBody(res, "patientID missing");
  if (!timeLineID) return missingBody(res, "timeLineID missing");
  if (!userID) return missingBody(res, "missing userID");
  if (!files || files.length === 0)
    return missingBody(res, "no attachements found");

  try {
    const attachements = await attachmentServices.addAttachments(
      timeLineID,
      patientID,
      userID,
      category,
      files,
      testID
    );
    res.status(200).send({
      message: "success",
      attachements: attachements
    });
    // }
  } catch (err) {
    if (err.isJoi === true) {
      return missingBody(res, err.message);
    }
    serverError(res, err.message);
  }
};

const addWalkinAttachments = async (req, res) => {
  const walkinID = req.params.walkinID;
  const userID = req.params.userID;
  const category = req.body.category;
  const files = req.files;
  const { testID } = req.query;

  if (!category) return missingBody(res, "Category missing");
  if (!walkinID) return missingBody(res, "walkinID missing");
  if (!userID) return missingBody(res, "missing userID");
  if (!files || files.length === 0)
    return missingBody(res, "no attachements found");

  try {
    const attachements = await attachmentServices.addWalkinAttachments(
      walkinID,
      userID,
      category,
      files,
      testID
    );
    res.status(200).send({
      message: "success",
      attachements: attachements
    });
    // }
  } catch (err) {
    if (err.isJoi === true) {
      return missingBody(res, err.message);
    }
    serverError(res, err.message);
  }
};

const addConsentformAttachments = async (req, res) => {
  const patientID = req.params.patientID;
  const timeLineID = req.params.timeLineID;
  const userID = req.params.userID;
  const category = req.body.category;
  const files = req.files;

  if (!category) return missingBody(res, "Category missing");
  if (!patientID) return missingBody(res, "patientID missing");
  if (!timeLineID) return missingBody(res, "timeLineID missing");
  if (!userID) return missingBody(res, "missing userID");
  if (!files || files.length === 0)
    return missingBody(res, "no attachements found");

  try {
    const attachements = await attachmentServices.addConsentformAttachments(
      timeLineID,
      patientID,
      userID,
      category,
      files
    );
    res.status(200).send({
      message: "success",
      attachements: attachements
    });
    // }
  } catch (err) {
    if (err.isJoi === true) {
      return missingBody(res, err.message);
    }
    serverError(res, err.message);
  }
};

/**
 * ** METHOD : GET
 * ** DESCRIPTION : get attachment by id
 */
const getAttachmentById = async (req, res) => {
  const id = req.params.id;
  if (!id) return missingBody(res, "missing id");
  try {
    const attachment = await attachmentServices.getAttachmentById(id);
    res.status(200).send({
      message: "success",
      attachment: attachment
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

/**
 * ** METHOD :GET
 * ** DESCRIPTION : get all attachments from timeLineID
 */
const getAllAttachmentsInTimeLine = async (req, res) => {
  const patientID = req.params.patientID;
  if (!patientID) return missingBody(res, "missing patientID");
  try {
    const attachments = await attachmentServices.getAllAttachmentsInTimeLine(
      patientID
    );
    res.status(200).send({
      message: "success",
      attachments: attachments
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

const getAllConsentformAttachmentsInTimeLine = async (req, res) => {
  const patientID = req.params.patientID;
  if (!patientID) return missingBody(res, "missing patientID");
  try {
    const attachments =
      await attachmentServices.getAllConsentformAttachmentsInTimeLine(
        patientID
      );
    res.status(200).send({
      message: "success",
      attachments: attachments
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

const getAllAttachmentsInTickets = async (req, res) => {
  const ticketID = req.params.ticketID;
  if (!ticketID) return missingBody(res, "missing ticketID");
  try {
    const attachments = await attachmentServices.getAllAttachmentsInTickets(
      ticketID
    );
    res.status(200).send({
      message: "success",
      attachments: attachments
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

const deleteAttachement = async (req, res) => {
  const id = req.params.id;
  if (!id) return missingBody(res, "missing id");
  try {
    const delRow = await attachmentServices.deleteAttachement(id);
    if (delRow === 1) {
      res.status(200).send({
        message: "success"
      });
    } else {
      serverError(res, "Failed to delete");
    }
  } catch (err) {
    serverError(res, err.message);
  }
};

const deleteConsentAttachement = async (req, res) => {
  const id = req.params.id;
  if (!id) return missingBody(res, "missing id");
  try {
    const delRow = await attachmentServices.deleteConsentAttachement(id);
    if (delRow === 1) {
      res.status(200).send({
        message: "success"
      });
    } else {
      serverError(res, "Failed to delete");
    }
  } catch (err) {
    serverError(res, err.message);
  }
};

const addTicketAttachments = async (req, res) => {
  const ticketID = req.params.ticketID;
  const files = req.files;
  if (!ticketID) return missingBody(res, "Missing ticketID");
  if (!files || files.length === 0)
    return missingBody(res, "no attachements found");
  try {
    const attachements = await attachmentServices.addTicketAttachments(
      ticketID,
      files
    );
    res.status(200).send({
      message: "success",
      attachements: attachements
    });
  } catch (err) {
    if (err.isJoi === true) {
      return missingBody(res, err.message);
    }
    serverError(res, err.message);
  }
};

const getProxyFile = async (req, res) => {
  try {
    const fileUrl = req.query.url;
    const mimeType = req.query.mimeType; 

    console.log("file type",mimeType);

    if (!fileUrl) {
      return res.status(400).json({ message: "File URL is required" });
    }

    // Fetch the file using axios
    const response = await axios.get(fileUrl, { responseType: "arraybuffer" });

    // Set the correct Content-Type header based on the mimeType
    res.set("Content-Type", mimeType || "application/octet-stream");
    res.send(response.data);
  } catch (error) {
    console.error("Error fetching file:", error);
    res.status(500).json({ message: "Error fetching file" });
  }
};

module.exports = {
  addAttachments,
  addConsentformAttachments,
  getAttachmentById,
  getAllAttachmentsInTimeLine,
  getAllConsentformAttachmentsInTimeLine,
  deleteAttachement,
  deleteConsentAttachement,
  addTicketAttachments,
  getAllAttachmentsInTickets,
  addWalkinAttachments,
  getProxyFile,
};
