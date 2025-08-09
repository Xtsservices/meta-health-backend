const {
  serverError,
  missingBody,
  duplicateRecord,
  resourceNotFound
} = require("../utils/errors");
const pool = require("../db/conn");
const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const crypto = require("crypto");
const axios = require("axios");

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

// Queries
const addTemplateQuery =
  "INSERT INTO templates (hospitalID, userID, templateName, templateType, fileName, fileURL,category) VALUES (?, ?, ?, ?, ?, ?, ?)";
const getTemplatesByHospital = "SELECT * FROM templates WHERE hospitalID = ?";
const deleteTemplateQuery =
  "DELETE FROM templates WHERE id = ? AND hospitalID = ? AND userID = ?";
const getTemplateExist =
  "SELECT * FROM templates WHERE hospitalID = ? AND category=?";
/**
 * Method: POST
 * Description: Add a new template with file upload to S3
 */
const addNewTemplate = async (req, res) => {
  const { hospitalID, userID } = req.params;
  const { templateName, templateType, category } = req.body;
  const file = req.file;

  if (!hospitalID || !userID || !templateName || !templateType || !category) {
    return missingBody(res, "Required fields are missing");
  }

  if (!file) return missingBody(res, "no attachements found");

  try {
    const allowedMimeTypes = ["image/png", "image/jpeg"];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new Error("Only PNG, JPEG, are allowed.");
    }

    // checking template exist with category
    const [results] = await pool.query(getTemplateExist, [
      hospitalID,
      category
    ]); // Correct order of parameters

    if (results.length > 0) {
      return duplicateRecord(res);
    }

    const fileName = `${crypto.randomBytes(16).toString("hex")}-${Date.now()}-${
      file.originalname
    }`;
    const uploadParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype
    };

    await s3Client.send(new PutObjectCommand(uploadParams));

    const fileURL = await getSignedUrl(
      s3Client,
      new GetObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: fileName
      }),
      { expiresIn: 300 }
    );

    const [result] = await pool.query(addTemplateQuery, [
      hospitalID,
      userID,
      templateName,
      templateType,
      fileName,
      fileURL,
      category
    ]);

    res.status(201).send({
      message: "success",
      template: {
        id: result.insertId,
        templateName,
        templateType,
        fileName,
        fileURL,
        category
      }
    });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return duplicateRecord(res);
    }
    serverError(res, err.message);
  }
};

const getproxyimage = async (req, res) => {
  try {
    const imageUrl = req.query.url;
    if (!imageUrl) {
      return res.status(400).json({ message: "Image URL is required" });
    }
    // Fetch the image using axios
    const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
    // Set the correct Content-Type header
    res.set("Content-Type", response.headers["content-type"]);
    res.send(response.data);
  } catch (error) {
    console.error("Error fetching image:", error);
    res.status(500).json({ message: "Error fetching image" });
  }
};

/**
 * Method: GET
 * Description: Get templates by hospitalID,,category and userID
 */
const getTemplates = async (req, res) => {
  const { hospitalID, userID } = req.params;
  if (!hospitalID || !userID) {
    return missingBody(res, "Required fields are missing");
  }

  try {
    const [results] = await pool.query(getTemplatesByHospital, [hospitalID]); // Correct order of parameters

    if (results.length === 0) {
      return res.status(200).send({
        message: "success",
        templates: []
      });
    }

    const templatesWithFileURLs = await Promise.all(
      results.map(async (template) => {
        const fileURL = await getSignedUrl(
          s3Client,
          new GetObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: template.fileName
          }),
          { expiresIn: 86400 } // 86400 seconds = 24 hours = 1 day
        );

        return {
          ...template,
          fileURL
        };
      })
    );

    res.status(200).send({
      message: "success",
      templates: templatesWithFileURLs
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

/**
 * Method: DELETE
 * Description: Delete templates by hospitalID,category and userID
 */
const deleteTemplate = async (req, res) => {
  const { tableid, hospitalID, userID } = req.params;

  if (!hospitalID || !userID || !tableid) {
    return missingBody(res, "Required fields are missing");
  }

  try {
    const [results] = await pool.query(
      "SELECT fileName FROM templates WHERE id = ? AND hospitalID = ? ",
      [tableid, hospitalID]
    );

    if (results.length === 0) {
      return resourceNotFound(res, "Template not found");
    }

    const fileName = results[0].fileName;

    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: AWS_BUCKET_NAME,
        Key: fileName
      })
    );

    await pool.query(deleteTemplateQuery, [tableid, hospitalID, userID]);

    res.status(200).send({
      message: "success"
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

module.exports = {
  addNewTemplate,
  getTemplates,
  deleteTemplate,
  getproxyimage
};
