const {
  serverError,
  missingBody,
  resourceNotFound,
  duplicateRecord
} = require("../utils/errors");

const hospitalService = require("../services/hospitalService");

const pool = require("../db/conn");
const bcrypt = require("bcrypt");
const {
  hospitalSchema,
  updateHospitalSchema
} = require("../helper/validators/hospitalValidator");
const {
  adminSchema,
  adminUpdateSchema
} = require("../helper/validators/adminValidator");
const roles = require("../utils/roles");
const { v4: uuidv4 } = require("uuid");
const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

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

const queryInsertHospital = `INSERT INTO hospitals(name,parent,address,country,state,district,city,pinCode,email,phoneNo,website) 
    VALUES(?,?,?,?,?,?,?,?,?,?,?)`;
const queryGetHospitalByID = `SELECT * FROM hospitals WHERE id=? AND isDeleted=?`;
const queryGetAllHospitals = `
  SELECT hospitals.*,Count(hubs.id) as hub_count,Count(devices.id) as device_count FROM hospitals
  LEFT JOIN hubs ON hospitals.id=hubs.hospitalID
  LEFT JOIN devices ON hubs.id=devices.hubID
  GROUP BY hospitals.id`;
const queryGetRecentHospitals = `SELECT * FROM hospitals WHERE isDeleted=? ORDER BY addedOn DESC LIMIT 10`;
const queryUpdateDelete = `UPDATE hospitals SET isDeleted=? WHERE id=?`;
const queryInsertAdmin = `
    INSERT INTO users(email,password,countryCode,phoneNo,firstName,lastName,dob,gender,
        address,city,state,pincode,hospitalID,role,photo,scope) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
const queryFindUserByEmail = "SELECT email FROM users WHERE email=?";
const queryFindUserByID = `SELECT id,hospitalID,role,email,countryCode,phoneNo,firstName,lastName,dob,gender,
    address,city,state,pincode,photo,addedOn FROM users WHERE id=?`;
const queryGetAdmins = `SELECT id,hospitalID,role,email,countryCode,phoneNo,firstName,lastName,dob,gender,
    address,city,state,pincode,photo,addedOn FROM users
    WHERE hospitalID=? AND role=? AND isDeleted=?`;
const queryGetAdminByID = `SELECT id,hospitalID,role,email,countryCode,phoneNo,firstName,lastName,dob,gender,
    address,city,state,pincode,photo,addedOn FROM users
    WHERE id=? AND isDeleted=?`;
// const queryGetCounts = `(SELECT 'Table1' AS TableName, COUNT(*) AS Count FROM patients)
// UNION
// (SELECT 'Table2' AS TableName, COUNT(*) AS Count FROM users)
// UNION
// (SELECT 'Table3' AS TableName, COUNT(*) AS Count FROM patients)`

const queryCountHospitals = `SELECT 'Hospitals' AS tables, COUNT(*) AS Count FROM hospitals`;
const queryCountUsers = `SELECT 'Users' AS tables, COUNT(*) AS Count FROM users`;
const queryCountPatients = `SELECT 'Patients' AS tables, COUNT(*) AS Count FROM patients`;

const isDeleted = {
  default: 0,
  deleted: 1
};

/**
 * *** METHOD : POST
 * *** DESCRIPTION : Add new hospital
 */
const addNewHospital = async (req, res) => {
  const data = {
    name: req.body.name,
    parent: req.body.parent,
    address: req.body.address,
    country: req.body.country,
    state: req.body.state,
    district:req.body.district,
    city: req.body.city,
    pinCode: req.body.pinCode,
    email: req.body.email,
    phoneNo: req.body.phoneNo,
    website: req.body.website
  };
  try {
    const resultData = await hospitalSchema.validateAsync(data);
    console.log("resultData",resultData)
    const {
      name,
      parent,
      address,
      country,
      state,
      district,
      city,
      pinCode,
      email,
      phoneNo,
      website
    } = resultData;
    const [added] = await pool.query(queryInsertHospital, [
      name,
      parent,
      address,
      country,
      state,
      district,
      city,
      pinCode,
      email,
      phoneNo,
      website
    ]);
    const id = added.insertId;
    const [result] = await pool.query(queryGetHospitalByID, [
      id,
      isDeleted.default
    ]);

    res.status(201).send({
      message: "success",
      hospital: result[0]
    });
  } catch (err) {
    if (err.isJoi === true) return missingBody(res, err.message);
    serverError(res, err.message);
  }
};

/**
 * *** METHOD : GET
 * *** DESCRIPTION : get hospital by id
 */
const getHospital = async (req, res) => {
  const id = req.params.hospitalID;
  try {
    const [result] = await pool.query(queryGetHospitalByID, [
      id,
      isDeleted.default
    ]);
    if (!result[0]) return resourceNotFound(res, "No Hopital exists");
    res.status(200).send({
      message: "success",
      hospital: result[0]
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

/**
 * ** METHOD : GET
 * ** DESCRIPTION : get all hospitals
 */
const getAllHospitals = async (req, res) => {
  try {
    const results = await pool.query(queryGetAllHospitals);
    res.status(200).send({
      message: "success",
      hospitals: results[0]
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

/**
 * ** METHOD : GET
 * ** DESCRIPTION : get all hospitals
 */
const getRecentHospitals = async (req, res) => {
  try {
    const results = await pool.query(queryGetRecentHospitals, [
      isDeleted.default
    ]);
    res.status(200).send({
      message: "success",
      hospitals: results[0]
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

/**
 * ** METHOD : PUT
 * ** DESCRIPTION : update hospital record
 */
const updateHospitalRecord = async (req, res) => {
  const data = {
    name: req.body.name,
    parent: req.body.parent,
    address: req.body.address,
    country: req.body.country,
    state: req.body.state,
    city: req.body.city,
    pinCode: req.body.pinCode,
    email: req.body.email,
    phoneNo: req.body.phoneNo,
    website: req.body.website
  };
  const id = req.params.hospitalID;
  try {
    await updateHospitalSchema.validateAsync(data);
    const queryParams = [];
    const queryArray = [];
    let query = "UPDATE hospitals SET ";
    Object.keys(data).forEach((key) => {
      if (data[key]) {
        queryArray.push(`${key}=?`);
        queryParams.push(data[key]);
      }
    });
    if (queryParams.length == 0) return missingBody(res, "no data to update");
    query += queryArray.join(",");
    query += " WHERE id=? AND isDeleted=?";
    queryParams.push(id);
    queryParams.push(isDeleted.default);
    // console.log(`query ${query}`);
    // console.log(`query ${queryParams}`);
    const [update] = await pool.query(query, queryParams);
    console.log(`updata : ${JSON.stringify(update)}`);
    if (!update.changedRows) return serverError(res, "Failed to update");
    const [updatedRecord] = await pool.query(queryGetHospitalByID, [
      id,
      isDeleted.default
    ]);
    res.status(200).send({
      message: "success",
      hospital: updatedRecord[0],
      query: query
    });
  } catch (err) {
    if (err.isJoi === true) return missingBody(res, err.message);
    serverError(res, err.message);
  }
};

/**
 * ** METHOD : DELETE
 * ** DESCRIPTION : DELETE HOSPITAL
 */
// TODO remove users from logging in
const deleteHospital = async (req, res) => {
  const id = req.params.hospitalID;
  try {
    const [result] = await pool.query(queryUpdateDelete, [
      isDeleted.deleted,
      id
    ]);
    if (!result.changedRows) return serverError(res, "Failed to update");
    res.status(200).send({
      message: "success"
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

/**
 * ** METHOD : POST
 * ** DESCRIPTION : CREATE ADMIN ACCOUNT
 */
const createAdmin = async (req, res) => {
  const data = {
    email: req.body.email,
    password: req.body.password,
    countryCode: req.body.countryCode,
    phoneNo: req.body.phoneNo,
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    dob: req.body.dob,
    gender: req.body.gender,
    address: req.body.address,
    city: req.body.city,
    state: req.body.state,
    pinCode: req.body.pinCode,
    scope: req.body.scope
  };
  // console.log(`body : ${JSON.stringify(req.body)}`)
  try {
    const hospitalID = req.params.hospitalID;
    console.log(`hospitalID : ${hospitalID}`);
    console.log("data Scope", data.scope);
    console.log("data Scope typeof", typeof data.scope);

    await adminSchema.validateAsync(data);

    console.log("CHECK EGCKE");

    const results = await pool.query(queryFindUserByEmail, [data.email]);
    if (results[0].length != 0) return duplicateRecord(res, "Account Exists");
    const file = req.file;
    let fileName = null;
    if (file) {
      if (file.mimetype !== "image/png" && file.mimetype !== "image/jpeg") {
        return notAllowed(res, "only images allowed");
      }
      fileName = uuidv4();
      const uploadParams = {
        Bucket: AWS_BUCKET_NAME,
        Body: file.buffer,
        Key: fileName,
        ContentType: file.mimetype
      };
      await s3Client.send(new PutObjectCommand(uploadParams));
    }
    const pass = bcrypt.hashSync(data.password, 10);

    const [insert] = await pool.query(queryInsertAdmin, [
      data.email,
      pass,
      data.countryCode,
      data.phoneNo,
      data.firstName,
      data.lastName,
      data.dob,
      data.gender,
      data.address,
      data.city,
      data.state,
      data.pinCode,
      hospitalID,
      roles.admin,
      fileName,
      data.scope
    ]);
    const [result] = await pool.query(queryGetAdminByID, [
      insert.insertId,
      isDeleted.default
    ]);
    console.log(`result : ${JSON.stringify(result[0])}`);
    let imageURL;
    if (result[0].photo) {
      imageURL = await getSignedUrl(
        s3Client,
        new GetObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: result[0].photo
        }),
        { expiresIn: 3600 }
      );
      result[0].imageURL = imageURL;
    }
    res.status(201).send({
      message: "success",
      admin: result[0]
    });
  } catch (err) {
    if (err.isJoi === true) return missingBody(res, err.message);
    serverError(res, err.message);
  }
};

/**
 * ** METHOD : GET
 * ** DESCRIPTON : GET ALL ADMINS
 */
const getAdmins = async (req, res) => {
  const hospitalID = req.params.hospitalID;
  try {
    const [results] = await pool.query(queryGetAdmins, [
      hospitalID,
      roles.admin,
      isDeleted.default
    ]);
    const adminsWithSignedURLs = await Promise.all(
      results.map(async (user) => {
        if (user.photo) {
          const imageURL = await getSignedUrl(
            s3Client,
            new GetObjectCommand({
              Bucket: process.env.AWS_BUCKET_NAME,
              Key: user.photo
            }),
            { expiresIn: 3600 }
          );
          user.imageURL = imageURL;
        }
        return user;
      })
    );
    res.status(200).send({
      message: "success",
      admins: adminsWithSignedURLs
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

/**
 * ** METHOD : GET
 * ** DESCRIPTON : GET ADMIN BY ID
 */
const getAdminByID = async (req, res) => {
  const id = req.params.adminID;
  try {
    const [result] = await pool.query(queryGetAdminByID, [
      id,
      isDeleted.default
    ]);
    console.log(`result : ${JSON.stringify(result[0])}`);
    if (result[0].photo) {
      const imageURL = await getSignedUrl(
        s3Client,
        new GetObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: result[0].photo
        }),
        { expiresIn: 3600 }
      );
      result[0].imageURL = imageURL;
    }
    res.status(200).send({
      message: "success",
      admin: result[0]
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

/**
 * ** METHOD : PATCH
 * ** DESCRIPTION : UPDATE ADMINS
 */
const updateAdmin = async (req, res) => {
  const id = req.params.adminID;
  const data = {
    countryCode: req.body.countryCode,
    phoneNo: req.body.phoneNo,
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    dob: req.body.dob,
    gender: req.body.gender,
    address: req.body.address,
    city: req.body.city,
    state: req.body.state,
    pinCode: req.body.pinCode
  };
  const image = req.body.image; // TODO check if image can be null
  try {
    await adminUpdateSchema.validateAsync(data);
    const queryParams = [];
    const queryArray = [];
    let query = "UPDATE users SET ";
    Object.keys(data).forEach((key) => {
      if (data[key]) {
        queryArray.push(`${key}=?`);
        queryParams.push(data[key]);
      }
    });
    const file = req.file;
    let fileName = null;
    if (file) {
      if (file.mimetype !== "image/png" && file.mimetype !== "image/jpeg") {
        return notAllowed(res, "only images allowed");
      }
      fileName = uuidv4();
      const uploadParams = {
        Bucket: AWS_BUCKET_NAME,
        Body: file.buffer,
        Key: fileName,
        ContentType: file.mimetype
      };
      await s3Client.send(new PutObjectCommand(uploadParams));
    }
    if (queryParams.length == 0 && fileName == null && image == null)
      return missingBody(res, "no data to update");
    if (fileName) {
      queryArray.push("photo=?");
      queryParams.push(fileName);
    }
    query += queryArray.join(",");
    query += " WHERE id=? AND isDeleted=?";
    queryParams.push(id);
    queryParams.push(isDeleted.default);
    console.log(`query ${query}`);
    console.log(`query ${queryParams}`);
    const [update] = await pool.query(query, queryParams);
    console.log(`updata : ${JSON.stringify(update)}`);
    if (!update.changedRows) return serverError(res, "Failed to update");
    const [updatedRecord] = await pool.query(queryGetAdminByID, [
      id,
      isDeleted.default
    ]);
    if (updatedRecord[0].photo) {
      const imageURL = await getSignedUrl(
        s3Client,
        new GetObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: updatedRecord[0].photo
        }),
        { expiresIn: 3600 }
      );
      updatedRecord[0].imageURL = imageURL;
    }
    res.status(200).send({
      message: "success",
      admin: updatedRecord[0]
    });
  } catch (err) {
    if (err.isJoi === true) return missingBody(res, err.message);
    serverError(res, err.message);
  }
};

/**
 * ** METHOD : GET
 * ** DESCRIPTION : GET COUNT OF HOSPITALS,STAFF PATIENTS
 */
const getCount = async (req, res) => {
  console.log(`count`);
  try {
    const result = await hospitalService.getCount();
    res.status(200).send({
      message: "success",
      count: result
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

module.exports = {
  addNewHospital,
  getHospital,
  getAllHospitals,
  getRecentHospitals,
  updateHospitalRecord,
  deleteHospital,
  createAdmin,
  getAdmins,
  getAdminByID,
  updateAdmin,
  getCount
};
