const {
  serverError,
  missingBody,
  resourceNotFound,
  duplicateRecord
} = require("../utils/errors");
const operationTheatreService = require("../services/operationTheatreService");
const pool = require("../db/conn");
const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const crypto = require("crypto");

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

const generateFileName = (bytes = 16) =>
  crypto.randomBytes(bytes).toString("hex");

const addNewEntryOt = async (req, res) => {
  try {
    const hospitalID = req.params.hospitalID;
    const patientTimeLineId = req.params.patientTimeLineId;
    const patientType = req.body.patientType;
    const surgeryType = req.body.surgeryType;

    if (!hospitalID) return missingBody(res, "Hospital id missing");
    if (!patientTimeLineId)
      return missingBody(res, "patientTimeLineId is missing");
    if (!patientType) return missingBody(res, "patientType missing");
    if (!surgeryType) return missingBody(res, "surgeryType missing");

    const result = await operationTheatreService.addNewEntryOt(
      hospitalID,
      patientTimeLineId,
      patientType,
      surgeryType
    );
    if (result.status != 201) {
      return res.status(result.status).send({
        message: result.message
      });
    }
    return res.status(201).send(result);
  } catch (error) {
    serverError(res, error.message);
  }
};

const getAlerts = async (req, res) => {
  try {
    const hospitalID = req.params.hospitalID;
    const status = req.params.status;
    if (!hospitalID) return missingBody(res, "Hospital id missing");
    if (!status) return missingBody(res, "status is missing");

    const result = await operationTheatreService.getAlerts(hospitalID, status);
    if (result.status != 200) {
      return res.status(result.status).send({
        message: result.message
      });
    }
    return res.status(200).send(result);
  } catch (error) {
    serverError(res, error.message);
  }
};

const getSurgeryTypes = async (req, res) => {
  try {
    const hospitalID = req.params.hospitalID;
    const { year, month } = req.query;

    if (!hospitalID) return missingBody(res, "Hospital id missing");

    const result = await operationTheatreService.getSurgeryTypes(
      hospitalID,
      year,
      month
    );
    if (result.status != 200) {
      return res.status(result.status).send({
        message: result.message
      });
    }
    return res.status(200).send(result);
  } catch (error) {
    serverError(res, error.message);
  }
};

// =========for surgeon==========
const getSurgeonSurgeryTypesInfo = async (req, res) => {
  try {
    const hospitalID = req.params.hospitalID;
    const { year, month } = req.query;
    const userID = req.userID;

    if (!hospitalID) return missingBody(res, "Hospital id missing");

    const result = await operationTheatreService.getSurgeonSurgeryTypesInfo(
      hospitalID,
      userID,
      year,
      month
    );
    if (result.status != 200) {
      return res.status(result.status).send({
        message: result.message
      });
    }
    return res.status(200).send(result);
  } catch (error) {
    serverError(res, error.message);
  }
};

const getApprovedRejected = async (req, res) => {
  try {
    const hospitalID = req.params.hospitalID;
    const userID = req.userID;
    const { year, month } = req.query;

    if (!hospitalID) return missingBody(res, "Hospital id missing");

    const result = await operationTheatreService.getApprovedRejected(
      hospitalID,
      userID,
      year,
      month
    );
    if (result.status != 200) {
      return res.status(result.status).send({
        message: result.message
      });
    }
    return res.status(200).send(result);
  } catch (error) {
    serverError(res, error.message);
  }
};
const addPhysicalExamination = async (req, res) => {
  try {
    const hospitalID = req.params.hospitalID;
    const patientTimeLineId = req.params.patientTimeLineId;
    const physicalExaminationData = req.body.physicalExaminationData;
    if (!hospitalID) return missingBody(res, "Hospital id missing");
    if (!patientTimeLineId)
      return missingBody(res, "patientTimeLineId is missing");
    if (!physicalExaminationData)
      return missingBody(res, "physicalExaminationData is missing");

    const result = await operationTheatreService.addPhysicalExamination(
      patientTimeLineId,
      physicalExaminationData
    );

    if (result.status != 201) {
      return res.status(result.status).send({
        message: result.message
      });
    }
    return res.status(200).send(result);
  } catch (error) {
    serverError(res, error.message);
  }
};

const addPreopRecord = async (req, res) => {
  try {
    const hospitalID = req.params.hospitalID;
    const patientTimeLineId = req.params.patientTimeLineId;
    const userID = req.params.userID;
    const preopRecordData = req.body.preopRecordData;
    const status = req.body.status;
    const rejectReason = req.body.rejectReason;
    if (!hospitalID) return missingBody(res, "Hospital id missing");
    if (!patientTimeLineId)
      return missingBody(res, "patientTimeLineId is missing");
    if (!preopRecordData) return missingBody(res, "preopRecordData is missing");
    if (!status) return missingBody(res, "status is missing");
    if (!userID) return missingBody(res, "userID is missing");

    const result = await operationTheatreService.addPreopRecord(
      patientTimeLineId,
      preopRecordData,
      status,
      rejectReason,
      userID,
      hospitalID
    );

    if (result.status != 201) {
      return res.status(result.status).send({
        message: result.message
      });
    }
    return res.status(200).send(result);
  } catch (error) {
    serverError(res, error.message);
  }
};

const addPostopRecord = async (req, res) => {
  try {
    const hospitalID = req.params.hospitalID;
    const patientTimeLineId = req.params.patientTimeLineId;
    const postopRecordData = req.body.postopRecordData;
    if (!hospitalID) return missingBody(res, "Hospital id missing");
    if (!patientTimeLineId)
      return missingBody(res, "patientTimeLineId is missing");
    if (!postopRecordData)
      return missingBody(res, "postopRecordData is missing");

    const result = await operationTheatreService.addPostopRecord(
      patientTimeLineId,
      postopRecordData
    );

    if (result.status != 201) {
      return res.status(result.status).send({
        message: result.message
      });
    }
    return res.status(200).send(result);
  } catch (error) {
    serverError(res, error.message);
  }
};

const getPostopRecord = async (req, res) => {
  try {
    const hospitalID = req.params.hospitalID;
    const patientTimeLineId = req.params.patientTimeLineId;

    if (!hospitalID) return missingBody(res, "Hospital id missing");
    if (!patientTimeLineId)
      return missingBody(res, "patientTimeLineId is missing");

    const result = await operationTheatreService.getPostopRecord(
      hospitalID,
      patientTimeLineId
    );

    if (result.status != 200) {
      return res.status(result.status).send({
        message: result.message,
        data: result.data
      });
    }
    return res.status(200).send({
      message: result.message,
      data: result.data
    });
  } catch (error) {
    serverError(res, error.message);
  }
};

const addAnesthesiaRecord = async (req, res) => {
  try {
    const hospitalID = req.params.hospitalID;
    const patientTimeLineId = req.params.patientTimeLineId;
    const anesthesiaRecordData = req.body.anesthesiaRecordData;
    if (!hospitalID) return missingBody(res, "Hospital id missing");
    if (!patientTimeLineId)
      return missingBody(res, "patientTimeLineId is missing");
    if (!anesthesiaRecordData)
      return missingBody(res, "anesthesiaRecordData is missing");

    const result = await operationTheatreService.addAnesthesiaRecord(
      patientTimeLineId,
      anesthesiaRecordData
    );

    if (result.status != 201) {
      return res.status(result.status).send({
        message: result.message
      });
    }
    return res.status(201).send(result);
  } catch (error) {
    serverError(res, error.message);
  }
};

const pendingToApprove = async (req, res) => {
  try {
    const hospitalID = req.params.hospitalID;
    const patientTimeLineId = req.params.patientTimeLineId;
    if (!hospitalID) return missingBody(res, "Hospital id missing");
    if (!patientTimeLineId)
      return missingBody(res, "patientTimeLineId missing");

    const result = await operationTheatreService.pendingToApprove(
      hospitalID,
      patientTimeLineId
    );

    if (result.status != 201) {
      return res.status(result.status).send({
        message: result.message
      });
    }
    return res.status(201).send(result);
  } catch (error) {
    serverError(res, error.message);
  }
};

const pendingToReject = async (req, res) => {
  try {
    const hospitalID = req.params.hospitalID;
    const patientTimeLineId = req.params.patientTimeLineId;
    const doctorId = req.body.doctorId;
    if (!hospitalID) return missingBody(res, "Hospital id missing");
    if (!patientTimeLineId)
      return missingBody(res, "patientTimeLineId missing");
    if (!doctorId) return missingBody(res, "doctorId missing");

    const result = await operationTheatreService.pendingToReject(
      hospitalID,
      patientTimeLineId,
      doctorId
    );

    if (result.status != 201) {
      return res.status(result.status).send({
        message: result.message
      });
    }
    return res.status(201).send(result);
  } catch (error) {
    serverError(res, error.message);
  }
};

const addPatientforOT = async (req, res) => {
  try {
    const hospitalID = req.params.hospitalID;
    const patientTimeLineId = req.body.patientTimeLineId;
    const doctorId = req.body.doctorId;
    const category = req.body.category;
    const purpose = req.body.purpose;
    const scope = req.body.scope;

    if (!hospitalID) return missingBody(res, "Hospital id missing");
    if (!patientTimeLineId)
      return missingBody(res, "patientTimeLineId missing");
    if (!doctorId) return missingBody(res, "doctorId missing");
    if (!category) return missingBody(res, "category missing");
    if (!purpose) return missingBody(res, "purpose missing");
    if (!scope) return missingBody(res, "scope missing");

    const result = await operationTheatreService.addPatientforOT(
      hospitalID,
      patientTimeLineId,
      doctorId,
      category,
      purpose,
      scope
    );

    if (result.status != 201) {
      return res.status(result.status).send({
        message: result.message
      });
    }
    return res.status(201).send(result);
  } catch (error) {
    serverError(res, error.message);
  }
};

const getPatientOTAnesthetistEmergency = async (req, res) => {
  try {
    const hospitalID = req.params.hospitalID;
    if (!hospitalID) return missingBody(res, "Hospital id missing");
    const userID = req.params.userID;
    if (!userID) return missingBody(res, "userID missing");

    const result =
      await operationTheatreService.getPatientOTAnesthetistEmergency(
        hospitalID,
        userID
      );
    if (result.status != 200) {
      return res.status(result.status).send({
        message: result.message
      });
    }
    return res.status(200).send(result);
  } catch (error) {
    serverError(res, error.message);
  }
};

const getPatientOTAnesthetistElective = async (req, res) => {
  try {
    const hospitalID = req.params.hospitalID;
    if (!hospitalID) return missingBody(res, "Hospital id missing");
    const userID = req.params.userID;
    if (!userID) return missingBody(res, "userID missing");

    const result =
      await operationTheatreService.getPatientOTAnesthetistElective(
        hospitalID,
        userID
      );
    if (result.status != 200) {
      return res.status(result.status).send({
        message: result.message
      });
    }
    return res.status(200).send(result);
  } catch (error) {
    serverError(res, error.message);
  }
};

const getPatientOTSurgeonEmergency = async (req, res) => {
  try {
    const hospitalID = req.params.hospitalID;
    if (!hospitalID) return missingBody(res, "Hospital id missing");
    const userID = req.params.userID;
    if (!userID) return missingBody(res, "userID missing");

    const result = await operationTheatreService.getPatientOTSurgeonEmergency(
      hospitalID,
      userID
    );
    if (result.status != 200) {
      return res.status(result.status).send({
        message: result.message
      });
    }
    return res.status(200).send(result);
  } catch (error) {
    serverError(res, error.message);
  }
};

const getPatientOTSurgeonElective = async (req, res) => {
  try {
    const hospitalID = req.params.hospitalID;
    if (!hospitalID) return missingBody(res, "Hospital id missing");
    const userID = req.params.userID;
    if (!userID) return missingBody(res, "userID missing");

    const result = await operationTheatreService.getPatientOTSurgeonElective(
      hospitalID,
      userID
    );
    if (result.status != 200) {
      return res.status(result.status).send({
        message: result.message
      });
    }
    return res.status(200).send(result);
  } catch (error) {
    serverError(res, error.message);
  }
};

const getStatus = async (req, res) => {
  try {
    const hospitalID = req.params.hospitalID;
    const patientTimeLineId = req.params.patientTimeLineId;
    if (!hospitalID) return missingBody(res, "Hospital id missing");
    if (!patientTimeLineId)
      return missingBody(res, "patientTimeLineId is missing");

    const result = await operationTheatreService.getStatus(
      patientTimeLineId,
      hospitalID
    );
    if (result.status != 200) {
      return res.status(result.status).send({
        message: result.message
      });
    }
    return res.status(200).send(result);
  } catch (error) {
    serverError(res, error.message);
  }
};

const getOTData = async (req, res) => {
  try {
    const hospitalID = req.params.hospitalID;
    const patientTimeLineId = req.params.patientTimeLineId;
    if (!hospitalID) return missingBody(res, "Hospital id missing");
    if (!patientTimeLineId)
      return missingBody(res, "patientTimeLineId is missing");

    const result = await operationTheatreService.getOTData(
      hospitalID,
      patientTimeLineId
    );
    if (result.status != 200) {
      return res.status(result.status).send({
        message: result.message
      });
    }
    return res.status(200).send(result);
  } catch (error) {
    serverError(res, error.message);
  }
};

const getOTPatientTypeCount = async (req, res) => {
  try {
    const hospitalID = req.params.hospitalID;
    const userID = req.userID;
    const { year, month } = req.query;

    if (!hospitalID) return missingBody(res, "Hospital id missing");

    const result = await operationTheatreService.getOTPatientTypeCount(
      hospitalID,
      userID,
      year,
      month
    );
    if (result.status != 200) {
      return res.status(result.status).send({
        message: result.message
      });
    }
    return res.status(200).send(result);
  } catch (error) {
    serverError(res, error.message);
  }
};

const redzonePhysicalExamination = async (req, res) => {
  try {
    const hospitalID = req.params.hospitalID;
    const patientTimeLineId = req.params.patientTimeLineId;
    const physicalExaminationData = req.body.physicalExaminationData;
    if (!hospitalID) return missingBody(res, "Hospital id missing");
    if (!patientTimeLineId)
      return missingBody(res, "patientTimeLineId is missing");
    if (!physicalExaminationData)
      return missingBody(res, "physicalExaminationData is missing");

    const result = await operationTheatreService.redzonePhysicalExamination(
      hospitalID,
      patientTimeLineId,
      physicalExaminationData
    );

    if (result.status != 201) {
      return res.status(result.status).send({
        message: result.message
      });
    }
    return res.status(200).send(result);
  } catch (error) {
    serverError(res, error.message);
  }
};

const redzonePhysicalExaminationImage = async (req, res) => {
  let connection;
  try {
    const hospitalID = req.params.hospitalID;
    const patientTimeLineId = req.params.patientTimeLineId;
    const userID = req.userID; // From request body
    const patientID = req.params.patientID;

    // Ensure required fields exist
    if (!hospitalID || !patientTimeLineId || !req.file) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const file = req.file;
    const photo = generateFileName(); // Generate a unique file name for the image
    const uploadParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Body: file.buffer,
      Key: photo,
      ContentType: file.mimetype
    };

    // Upload the file to S3
    await s3Client.send(new PutObjectCommand(uploadParams));

    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Check if patientID already exists
    const [existingRecord] = await connection.query(
      "SELECT id FROM physicalexaminationimage WHERE patientid = ?",
      [patientID]
    );

    let recordID;

    if (existingRecord.length > 0) {
      // If record exists, update image
      const updateQuery = `
        UPDATE physicalexaminationimage 
        SET image = ?, userid = ?, addedon = NOW()
        WHERE patientid = ?`;
      await connection.query(updateQuery, [photo, userID, patientID]);
      recordID = existingRecord[0].id;
    } else {
      // If no record exists, insert a new one
      const insertQuery = `
        INSERT INTO physicalexaminationimage (
          hospitalid, image, userid, patientid, patientTimeLineID, addedon
        ) VALUES (?, ?, ?, ?, ?, NOW())
      `;
      const [result] = await connection.query(insertQuery, [
        hospitalID,
        photo,
        userID,
        patientID,
        patientTimeLineId
      ]);
      recordID = result.insertId;
    }

    await connection.commit();

    // Generate a signed URL for accessing the uploaded image
    const imageURL = await getSignedUrl(
      s3Client,
      new GetObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: photo
      }),
      { expiresIn: 300 }
    );

    res.status(201).json({
      message:
        existingRecord.length > 0
          ? "Image updated successfully"
          : "Image uploaded successfully",
      imageURL,
      recordID
    });
  } catch (err) {
    if (connection) await connection.rollback();
    res
      .status(500)
      .json({ message: "Error uploading image", error: err.message });
  } finally {
    if (connection) connection.release();
  }
};

const getredzonePhysicalExaminationImage = async (req, res) => {
  let connection;
  try {
    const { patientID } = req.params; // Extract patientID from URL parameters

    connection = await pool.getConnection();

    // Fetch image record for the given patientID
    const [records] = await connection.query(
      "SELECT image FROM physicalexaminationimage WHERE patientid = ?",
      [patientID]
    );

    if (records.length === 0) {
      return res
        .status(404)
        .json({ message: "No image found for this patient" });
    }

    // Convert Buffer to String
    const imageKey = records[0].image.toString();

    const imageURL = await getSignedUrl(
      s3Client,
      new GetObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: imageKey
      }),
      { expiresIn: 300 }
    );

    res.status(200).json({ message: "Image retrieved successfully", imageURL });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching image", error: err.message });
  } finally {
    if (connection) connection.release();
  }
};

module.exports = {
  addNewEntryOt,
  getAlerts,
  addPhysicalExamination,
  addPreopRecord,
  addPostopRecord,
  addAnesthesiaRecord,
  pendingToApprove,
  pendingToReject,
  addPatientforOT,
  getPatientOTAnesthetistEmergency,
  getPatientOTAnesthetistElective,
  getPatientOTSurgeonEmergency,
  getPatientOTSurgeonElective,
  getStatus,
  getOTData,
  getOTPatientTypeCount,
  redzonePhysicalExamination,
  getSurgeryTypes,
  getApprovedRejected,
  getSurgeonSurgeryTypesInfo,
  getPostopRecord,
  redzonePhysicalExaminationImage,
  getredzonePhysicalExaminationImage
};
