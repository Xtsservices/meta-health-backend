const {
  queryGetAttachmentsByTimeLine,
  queryGetAttachmentsByTickets,
  checkTimeLineID,
  queryInsertAttachments,
  checkTicketID,
  queryInsertTicketAttachments,
  queryGetAttachmentByID,
  queryDeleteAttachmentByID,
  queryInsertConsentAttachments,
  queryGetConsentAttachmentsByTimeLine,
  queryDeleteConsentAttachmentByID,
  queryGetConsentAttachmentByID
} = require("../queries/attachmentQueries");
const {
  serverError,
  missingBody,
  resourceNotFound,
  duplicateRecord,
  notAllowed
} = require("../utils/errors");
const pool = require("../db/conn");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand
} = require("@aws-sdk/client-s3");
const patientUtils = require("../utils/patientUtils");
const crypto = require("crypto");
const generateFileName = (bytes = 16) =>
  crypto.randomBytes(bytes).toString("hex");

const AWS_BUCKET_NAME = process.env.AWS_BUCKET_NAME;
const AWS_BUCKET_REGION = process.env.AWS_BUCKET_REGION;
const AWS_ACCESS_KEY = process.env.AWS_ACCESS_KEY;
const AWS_SECRET_KEY = process.env.AWS_SECRET_KEY;

const s3Client = new S3Client({
  region: AWS_BUCKET_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY,
    secretAccessKey: AWS_SECRET_KEY
  }
});

/**
 * ** METHOD : GET
 * ** DESCRIPTION : get attachment by id
 */
const getAttachmentById = async (id) => {
  const result = await pool.query(queryGetAttachmentByID, [id]);
  const attachment = result[0][0];
  if (!attachment) throw new Error("Failed to get attachment");
  const fileURL = await getSignedUrl(
    s3Client,
    new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: attachment.givenName
    }),
    { expiresIn: 300 }
  );
  attachment.fileURL = fileURL || null;
  return attachment;
};

/**
 * ** METHOD :GET
 * ** DESCRIPTION : get all attachments from timeLineID
 */
const getAllAttachmentsInTimeLine = async (patientID) => {
  const results = await pool.query(queryGetAttachmentsByTimeLine, [patientID]);
  const attachments = await Promise.all(
    results[0].map(async (item) => {
      const fileURL = await getSignedUrl(
        s3Client,
        new GetObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: item.givenName
        }),
        { expiresIn: 300 }
      );
      item.fileURL = fileURL || null;
      return item;
    })
  );
  return attachments;
};

const getAllConsentformAttachmentsInTimeLine = async (patientID) => {
  const results = await pool.query(queryGetConsentAttachmentsByTimeLine, [
    patientID
  ]);
  const attachments = await Promise.all(
    results[0].map(async (item) => {
      const fileURL = await getSignedUrl(
        s3Client,
        new GetObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: item.givenName
        }),
        { expiresIn: 300 }
      );
      item.fileURL = fileURL || null;
      return item;
    })
  );
  return attachments;
};

const getAllAttachmentsInTickets = async (ticketID) => {
  const results = await pool.query(queryGetAttachmentsByTickets, [ticketID]);
  const attachments = await Promise.all(
    results[0].map(async (item) => {
      const fileURL = await getSignedUrl(
        s3Client,
        new GetObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: item.givenName
        }),
        { expiresIn: 300 }
      );
      item.fileURL = fileURL || null;
      return item;
    })
  );
  return attachments;
};
const deleteAttachement = async (id) => {
  const result = await pool.query(queryGetAttachmentByID, [id]);
  const attachment = result[0][0];
  if (!attachment) throw new Error("Failed to get attachment");
  const delAttachement = await pool.query(queryDeleteAttachmentByID, [id]);
  const delRow = delAttachement[0].affectedRows;
  return delRow;
};

const deleteConsentAttachement = async (id) => {
  const result = await pool.query(queryGetConsentAttachmentByID, [id]);
  const attachment = result[0][0];
  if (!attachment) throw new Error("Failed to get attachment");
  const delAttachement = await pool.query(queryDeleteConsentAttachmentByID, [
    id
  ]);
  const delRow = delAttachement[0].affectedRows;
  return delRow;
};

/**
 * *** METHOD : POST
 * *** DESCRIPTION : insert attachements
 */
// const addAttachments = async(timeLineID,userID,category,files) => {
// console.log("files=============================",files)
//   //checking that report exists
//   const reportsData = getAllAttachmentsInTimeLine(timeLineID)

//     const timeLine = await pool.query(checkTimeLineID, [timeLineID]);
//     const t = timeLine[0][0];
//     if (!t) throw new Error("TimeLineID does not exist");
//     if (t.patientEndStatus === patientUtils.patientStatus.discharged)
//       throw new Error("TimeLine has already ended");
//     const uploadPromises = files.map(async (file) => {
//       if (file) {
//         if (
//           file.mimetype !== "image/png" &&
//           file.mimetype !== "image/jpeg" &&
//           file.mimetype !== "application/pdf"
//         ) {
//           throw new Error( "only images and pdf allowed");
//         }
//         const fileName = generateFileName();
//         const uploadParams = {
//           Bucket: AWS_BUCKET_NAME,
//           Body: file.buffer,
//           Key: fileName,
//           ContentType: file.mimetype,
//         };
//         await s3Client.send(new PutObjectCommand(uploadParams));
//         return [
//           timeLineID,
//           userID,
//           file.originalname,
//           fileName,
//           file.mimetype,
//           category,
//         ];
//       }
//     });
//     const records = await Promise.all(uploadPromises);
//     records.map((item) => {
//       console.log(item);
//     });
//     const results = await pool.query(queryInsertAttachments, [records]);
//     console.log("results[0]==============",results[0])
//     const attachements = await Promise.all(
//       records.map(async (attachment, index) => {
//         const id = results[0].insertId + index;
//         const fileURL = await getSignedUrl(
//           s3Client,
//           new GetObjectCommand({
//             Bucket: process.env.AWS_BUCKET_NAME,
//             Key: attachment[3],
//           }),
//           { expiresIn: 300 }
//         );

//         return {
//           id,
//           timeLineID: attachment[0],
//           userID: attachment[1],
//           fileName: attachment[2],
//           givenName: attachment[3],
//           mimeType: attachment[4],
//           fileURL: fileURL || null,
//           category,
//         };
//       })
//     );
//     return attachements;
// }

// ====================start attatch-------------------
const addAttachments = async (
  timeLineID,
  patientID,
  userID,
  category,
  files,
  testID
) => {
  const timeLine = await pool.query(checkTimeLineID, [timeLineID]);
  const t = timeLine[0][0];
  if (!t) throw new Error("TimeLineID does not exist");
  if (!testID) {
    if (t.patientEndStatus === patientUtils.patientStatus.discharged)
      throw new Error("TimeLine has already ended");
  }

  const uploadPromises = files.map(async (file) => {
    console.log("file.mimetype======================", files);
    const allowedMimeTypes = [
      "image/png",
      "image/jpeg",
      "application/pdf",
      "audio/mpeg",
      "video/mp4"
    ];

    if (file) {
      if (!allowedMimeTypes.includes(file.mimetype)) {
        throw new Error("only images, pdf, mp3 allowed");
      }

      // Check if filename already exists
      const checkFileNameQuery =
        "SELECT * FROM attachments WHERE fileName = ? AND patientID=?";
      const fileNameCheck = await pool.query(checkFileNameQuery, [
        file.originalname,
        patientID
      ]);
      if (fileNameCheck[0].length > 0) {
        throw new Error(`File name "${file.originalname}" already exists`);
      }

      const fileName = generateFileName();
      const uploadParams = {
        Bucket: AWS_BUCKET_NAME,
        Body: file.buffer,
        Key: fileName,
        ContentType: file.mimetype
      };
      await s3Client.send(new PutObjectCommand(uploadParams));

      return [
        timeLineID,
        patientID,
        testID,
        userID,
        file.originalname,
        fileName,
        file.mimetype,
        category
      ];
    }
  });

  const records = await Promise.all(uploadPromises);
  records.map((item) => {
    console.log(item);
  });

  const results = await pool.query(queryInsertAttachments, [records]);
  console.log("results[0]==============", results[0]);

  const attachements = await Promise.all(
    records.map(async (attachment, index) => {
      const id = results[0].insertId + index;
      const fileURL = await getSignedUrl(
        s3Client,
        new GetObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: attachment[3]
        }),
        { expiresIn: 300 }
      );

      return {
        id,
        timeLineID: attachment[0],
        patientID: attachment[1],
        testID: attachment[2],
        userID: attachment[3],
        fileName: attachment[4],
        givenName: attachment[5],
        mimeType: attachment[6],
        fileURL: fileURL || null,
        category
      };
    })
  );

  return attachements;
};

const addWalkinAttachments = async (
  walkinID,
  userID,
  category,
  files,
  loincCode
) => {
  const checkWalkinIDQuery = `select * from walkinPatientsTests where id=?`;
  const [walkin] = await pool.query(checkWalkinIDQuery, [walkinID]);

  if (!walkin.length) throw new Error("walkinID does not exist");

  const uploadPromises = files.map(async (file) => {
    const allowedMimeTypes = [
      "image/png",
      "image/jpeg",
      "application/pdf",
      "audio/mpeg",
      "video/mp4"
    ];

    if (file) {
      if (!allowedMimeTypes.includes(file.mimetype)) {
        throw new Error("only images, pdf, mp3 allowed");
      }

      // Check if filename already exists
      const checkFileNameQuery =
        "SELECT * FROM walkinTestAttachments WHERE fileName = ? AND walkinId=?";
      const fileNameCheck = await pool.query(checkFileNameQuery, [
        file.originalname,
        walkinID
      ]);
      if (fileNameCheck[0].length > 0) {
        throw new Error(`File name "${file.originalname}" already exists`);
      }

      const fileName = generateFileName();
      const uploadParams = {
        Bucket: AWS_BUCKET_NAME,
        Body: file.buffer,
        Key: fileName,
        ContentType: file.mimetype
      };
      await s3Client.send(new PutObjectCommand(uploadParams));

      return [
        walkinID,
        userID,
        file.originalname,
        fileName,
        file.mimetype,
        category,
        loincCode
      ];
    }
  });

  const records = await Promise.all(uploadPromises);
  records.map((item) => {
    console.log(item);
  });

  const queryInsertAttachments = `
      INSERT INTO walkinTestAttachments 
      (walkinId, userID, fileName, givenName, mimeType, category, loincCode) 
      VALUES ?
    `;
  const results = await pool.query(queryInsertAttachments, [records]);
  console.log("results[0]==============", results[0]);

  const attachements = await Promise.all(
    records.map(async (attachment, index) => {
      const id = results[0].insertId + index;
      const fileURL = await getSignedUrl(
        s3Client,
        new GetObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: attachment[3]
        }),
        { expiresIn: 300 }
      );

      return {
        id,
        walkinID: attachment[0],
        userID: attachment[1],
        fileName: attachment[2],
        givenName: attachment[3],
        mimeType: attachment[4],
        fileURL: fileURL || null,
        category,
        loincCode: attachment[6] // ✅ Return loincCode
      };
    })
  );

  return attachements;
};

const addConsentformAttachments = async (
  timeLineID,
  patientID,
  userID,
  category,
  files
) => {
  const timeLine = await pool.query(checkTimeLineID, [timeLineID]);
  const t = timeLine[0][0];
  if (!t) throw new Error("TimeLineID does not exist");
  if (t.patientEndStatus === patientUtils.patientStatus.discharged)
    throw new Error("TimeLine has already ended");

  const uploadPromises = files.map(async (file) => {
    console.log("file.mimetype======================", files);
    const allowedMimeTypes = [
      "image/png",
      "image/jpeg",
      "application/pdf",
      "audio/mpeg",
      "video/mp4"
    ];

    if (file) {
      if (!allowedMimeTypes.includes(file.mimetype)) {
        throw new Error("only images, pdf, mp3 allowed");
      }

      // Check if filename already exists
      const checkFileNameQuery =
        "SELECT * FROM consentformAttachments WHERE fileName = ? AND patientID=?";
      const fileNameCheck = await pool.query(checkFileNameQuery, [
        file.originalname,
        patientID
      ]);
      if (fileNameCheck[0].length > 0) {
        throw new Error(`File name "${file.originalname}" already exists`);
      }

      const fileName = generateFileName();
      const uploadParams = {
        Bucket: AWS_BUCKET_NAME,
        Body: file.buffer,
        Key: fileName,
        ContentType: file.mimetype
      };
      await s3Client.send(new PutObjectCommand(uploadParams));
      return [
        timeLineID,
        patientID,
        userID,
        file.originalname,
        fileName,
        file.mimetype,
        category
      ];
    }
  });

  const records = await Promise.all(uploadPromises);
  records.map((item) => {
    console.log(item);
  });

  const results = await pool.query(queryInsertConsentAttachments, [records]);
  console.log("results[0]==============", results[0]);

  const attachements = await Promise.all(
    records.map(async (attachment, index) => {
      const id = results[0].insertId + index;
      const fileURL = await getSignedUrl(
        s3Client,
        new GetObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: attachment[3]
        }),
        { expiresIn: 300 }
      );

      return {
        id,
        timeLineID: attachment[0],
        patientID: attachment[1],
        userID: attachment[2],
        fileName: attachment[3],
        givenName: attachment[4],
        mimeType: attachment[5],
        fileURL: fileURL || null,
        category
      };
    })
  );

  return attachements;
};

const addTicketAttachments = async (ticketID, files) => {
  const ticket = await pool.query(checkTicketID, [ticketID]);
  const t = ticket[0][0];
  if (!t) throw new Error("TicketId does not exist");
  if (files.length > 3)
    throw new Error(
      "Maximum Limit exceeded, cannot upload more than 3 images at a time"
    );
  const uploadPromises = files.map(async (file) => {
    if (file) {
      if (file.mimetype !== "image/png" && file.mimetype !== "image/jpeg") {
        throw new Error("only images allowed");
      }
      const fileName = generateFileName();
      const uploadParams = {
        Bucket: AWS_BUCKET_NAME,
        Body: file.buffer,
        Key: fileName,
        ContentType: file.mimetype
      };
      await s3Client.send(new PutObjectCommand(uploadParams));
      return [ticketID, file.originalname, fileName, file.mimetype];
    }
  });
  const records = await Promise.all(uploadPromises);
  records.map((item) => {
    console.log(item);
  });
  const results = await pool.query(queryInsertTicketAttachments, [records]);
  const attachements = await Promise.all(
    records.map(async (attachment, index) => {
      const id = results[0].insertId + index;
      const fileURL = await getSignedUrl(
        s3Client,
        new GetObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: attachment[2]
        }),
        { expiresIn: 300 }
      );
      return {
        id,
        ticketID: attachment[0],
        fileName: attachment[1],
        givenName: attachment[2],
        mimeType: attachment[3],
        fileURL: fileURL || null
      };
    })
  );
  return attachements;
};

module.exports = {
  getAllAttachmentsInTimeLine,
  getAllConsentformAttachmentsInTimeLine,
  getAllAttachmentsInTickets,
  addAttachments,
  addTicketAttachments,
  getAttachmentById,
  deleteAttachement,
  deleteConsentAttachement,
  addConsentformAttachments,
  addWalkinAttachments
};
