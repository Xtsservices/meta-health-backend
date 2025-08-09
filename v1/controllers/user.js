const {
  serverError,
  missingBody,
  resourceNotFound,
  duplicateRecord,
  notAllowed,
  unauthorized
} = require("../utils/errors");
const pool = require("../db/conn");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const roles = require("../utils/roles");
const {
  schema,
  updateUserSchema,
  adminUpdateUserSchema,
  adminUpdateStaffSchema
} = require("../helper/validators/userValidator");
const { passwordSchema } = require("../helper/validators/passwordValidator");
const { adminSchema } = require("../helper/validators/adminValidator");

const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const crypto = require("crypto");
const ROLES_LIST = require("../utils/roles");
const SCOPE_LIST = require("../utils/scope");

const userServices = require("../services/userServices");
const { findUserByEmail } = require("../queries/userQueries");
const { deleteUserAccount } = require("../utils/mail");

const queryGetUserByID =
  "SELECT id,departmentID,email,role,countryCode,phoneNo," +
  "firstName,lastName,photo,dob,gender,address,city," +
  "state,pinCode FROM users WHERE hospitalID=? AND id=?";

const AWS_BUCKET_NAME = process.env.AWS_BUCKET_NAME;
const AWS_BUCKET_REGION = process.env.AWS_BUCKET_REGION;
const AWS_ACCESS_KEY = process.env.AWS_ACCESS_KEY;
const AWS_SECRET_KEY = process.env.AWS_SECRET_KEY;
// console.log(AWS_BUCKET_REGION)

const s3Client = new S3Client({
  region: AWS_BUCKET_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY,
    secretAccessKey: AWS_SECRET_KEY
  }
});

const generateFileName = (bytes = 16) =>
  crypto.randomBytes(bytes).toString("hex");
/**
 * ** METHOD : POST
 * ** DESCRIPTION : ADD NEW STAFF USER
 */
const createStaff = async (req, res) => {
  try {
    const hospitalID = req.params.hospitalID;
    const reqBodyData = req.body;
    const reqbodyfile = req.file;

    const createdStaff = await userServices.createStaff(
      hospitalID,
      reqBodyData,
      reqbodyfile
    );

    res.status(201).send({
      message: "success",
      data: { ...createdStaff }
    });

    console.log("insert-9");
  } catch (err) {
    if (err.isJoi === true) return missingBody(res, err.message);
    serverError(res, err.message);
  }
};

const createMultipleStaff = async (req, res) => {
  try {
    const hospitalID = req.params.hospitalID;
    const data = req.body;

    const createdMultiStaff = await userServices.createMultipleStaff(
      hospitalID,
      data
    );

    return res.status(201).send({
      message: "success",
      data: createdMultiStaff
    });
  } catch (err) {
    if (err.isJoi === true) return missingBody(res, err.message);
    return serverError(res, err.message);
  }
};



/**
 * ** METHOD : DELETE
 * ** DESCRIPTION : USER raised  deleteuser 
 */

const deleteuser = async (req, res) => {
  try {
    const { email, phoneNumber, app } = req.body;
    console.log("email",email)

    if (!email || !phoneNumber || !app) {
      return res.status(400).json({ error: "Email, Phone Number, and App are required" });
    }

    // Check if email exists
    const [emailExist] = await pool.query(findUserByEmail, [email]);
    if (!emailExist || emailExist.length === 0) {
      return res.status(400).json({ error: "Email not Registered" });
    }

    // Send delete account email
    await deleteUserAccount({
      userEmail: email,
      phone: phoneNumber,
      app: app,
    });

    return res.status(200).json({ message: "Delete account request sent successfully" });
  } catch (error) {
    console.error("Delete user error:", error.message);
    return res.status(500).json({ error: error.message });
  }
};


/**
 * ** METHOD : POST
 * ** DESCRIPTION : USER LOGIN BY EMAIL
 */
const emailLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email) return missingBody(res, "Email missing");
    if (!password) return missingBody(res, "Password missing");

    const foundUser = await userServices.emailLogin(email, password);

    // Set the refreshToken cookie
    res.cookie("jwt", foundUser.refreshToken, {
      httpOnly: true,
      maxAge: 1 * 60 * 60 * 1000
    }); // secure = true for https

    // Send the response back to the client
    return res.status(200).send({
      message: "success",
      id: foundUser.id,
      hospitalID: foundUser.hospitalID,
      departmentID: foundUser.departmentID,
      role: foundUser.role,
      scope: foundUser.scope,
      email: foundUser.email,
      countryCode: foundUser.countryCode,
      phoneNo: foundUser.phoneNo,
      firstName: foundUser.firstName,
      lastName: foundUser.lastName,
      photo: foundUser.photo,
      dob: foundUser.dob,
      gender: foundUser.gender,
      address: foundUser.address,
      city: foundUser.city,
      state: foundUser.state,
      pinCode: foundUser.pinCode,
      addedOn: foundUser.addedOn,
      lastUpdated: foundUser.lastUpdated,
      token: foundUser.token,
      imageURL: foundUser.imageURL
    });
  } catch (err) {
    return serverError(res, err.message);
  }
};

/**
 * ** METHOD : GET
 * ** DESCRIPTION : GET USER only byID
 */
const getUserDetailById = async (req, res) => {
  try {
    const id = req.params.id;

    const foundUser = await userServices.getUserDetailById(id);

    res.status(200).send({
      message: "success",
      user: foundUser
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

/**
 * ** METHOD : GET
 * ** DESCRIPTION : GET USER BY ID
 */
const getUser = async (req, res) => {
  try {
    const hospitalID = req.params.hospitalID;
    const id = req.params.id;

    const foundUser = await userServices.getUser(hospitalID, id);

    res.status(200).send({
      message: "success",
      user: foundUser
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

/**
 * ** METHOD : GET
 * ** DESCRIPTION : GET TOTAL COUNT OF USERS BY ROLE
 */

const getUserCountByRole = async (req, res) => {
  const hospitalID = req.params.hospitalID;
  const role = req.params.role;

  try {
    const results = await userServices.getUserCountByRole(hospitalID, role);

    res.status(200).send({
      message: "success",
      count: results
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

/**
 * ** METHOD : GET
 * ** DESCRIPTION : GET ALL USERS IN HOSPITAL EXCEPT HOSPITAL ADMIN
 */
const getAllUsersFromHospital = async (req, res) => {
  try {
    const hospitalID = req.params.hospitalID;
    const id = req.params.id;

    const usersWithSignedURLs = await userServices.getAllUsersFromHospital(
      hospitalID,
      id
    );

    res.status(200).send({
      message: "success",
      users: usersWithSignedURLs
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

/**
 * ** METHOD : POST
 * ** MOBILE LOGIN : USER MOBILE LOGIN BY EMAIL
 */
const loginMobileUserEmail = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email) return missingBody(res, "Email missing");
    if (!password) return missingBody(res, "Password missing");

    const foundUser = await userServices.loginMobileUserEmail(email, password);

    res.status(200).send({
      id: foundUser.id,
      hospitalID: foundUser.hospitalID,
      departmentID: foundUser.departmentID,
      email: foundUser.email,
      role: foundUser.role,
      countryCode: foundUser.countryCode,
      phoneNo: foundUser.phoneNo,
      firstName: foundUser.firstName,
      lastName: foundUser.lastName,
      photo: foundUser.photo,
      dob: foundUser.dob,
      gender: foundUser.gender,
      address: foundUser.address,
      city: foundUser.city,
      state: foundUser.state,
      pinCode: foundUser.pinCode,
      addedOn: foundUser.addedOn,
      lastUpdated: foundUser.lastUpdated,
      token: foundUser.token,
      statusCode: 200
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

/**
 * ** METHOD : POST
 * ** DESCRIPTION :  ADMIN CHANGE HOSPITAL STAFF PASSWORD
 */
const changeUserPassword = async (req, res) => {
  console.log("admin change password");
  const hospitalID = req.params.hospitalID;
  const id = req.body.id;
  const password = req.body.password;

  try {
    if (!id) return missingBody(res, "missing userID");
    if (!password) return missingBody(res, "missing new password");

    await userServices.changeUserPassword(hospitalID, id, password);

    res.status(200).send({
      message: "success"
    });
  } catch (err) {
    if (err.isJoi === true) return missingBody(res, "joi : " + err.message);
    serverError(res, err.message);
  }
};

/**
 * ** METHOD : PATCH
 * ** DESCRIPTION : UPDATE USER PROFILE DETAILS
 */
const updateUserProfile = async (req, res) => {
  const data = {
    countryCode: req.body.countryCode,
    phoneNo: req.body.phoneNo,
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    dob: req.body.dob,
    image: req.body.image,
    gender: req.body.gender,
    address: req.body.address,
    city: req.body.city,
    state: req.body.state,
    pinCode: req.body.pinCode
  };

  try {
    const hospitalID = req.params.hospitalID;
    const id = req.params.id;
    const reqFile = req.file;
    const updateData = await userServices.updateUserProfile(
      id,
      data,
      reqFile
    );

    res.status(200).send({
      message: "success",
      data: {
        id: id,
        hospitalID: hospitalID,
        email: updateData.email.toLowerCase(),
        departmentID: updateData.departmentID,
        role: updateData.role,
        countryCode: updateData.countryCode,
        phoneNo: updateData.phoneNo,
        firstName: updateData.firstName,
        lastName: updateData.lastName,
        photo: updateData.photo,
        dob: updateData.dob,
        gender: updateData.gender,
        address: updateData.address,
        city: updateData.city,
        state: updateData.state,
        pinCode: updateData.pinCode,
        imageURL: updateData.imageURL
      }
    });
  } catch (err) {
    if (err.isJoi === true) return missingBody(res, `JOI : ${err.message}`);
    serverError(res, err.message);
  }
};

/**
 * ** METHOD : PATCH
 * ** DESCRIPTION : ADMIN UPDATE USER PROFILE DETAILS
 */
const adminUpdateUserProfile = async (req, res) => {
  try {
    const hospitalID = req.params.hospitalID;
    const id = req.params.id;
    const reqBodyData = req.body;
    const reqBodyFile = req.file;
    const updateData = await userServices.adminUpdateUserProfile(
      hospitalID,
      id,
      reqBodyData,
      reqBodyFile
    );

    res.status(200).send({
      message: "success",
      user: {
        id: id,
        hospitalID: hospitalID,
        email: updateData.email.toLowerCase(),
        departmentID: updateData.departmentID,
        role: updateData.role,
        countryCode: updateData.countryCode,
        phoneNo: updateData.phoneNo,
        firstName: updateData.firstName,
        lastName: updateData.lastName,
        photo: updateData.photo,
        dob: updateData.dob,
        gender: updateData.gender,
        address: updateData.address,
        city: updateData.city,
        state: updateData.state,
        pinCode: updateData.pinCode,
        imageURL: updateData.imageURL
      }
    });
  } catch (err) {
    if (err.isJoi === true) return missingBody(res, `JOI : ${err.message}`);
    serverError(res, err.message);
  }
};

/**
 * ** METHOD : PATCH
 * ** DESCRIPTION : UPDATE SELF USER PASSWORD
 */
const updateSelfUserPassword = async (req, res) => {
  console.log("update self password");
  const hospitalID = req.params.hospitalID;
  const id = req.params.id;
  const password = req.body.password;

  try {
    if (!id) return missingBody(res, "missing userID");
    if (!password) return missingBody(res, "missing new password");

    await userServices.updateSelfUserPassword(hospitalID, id, password);

    res.status(200).send({
      message: "success"
    });
  } catch (err) {
    if (err.isJoi === true) return missingBody(res, "joi : " + err.message);
    serverError(res, err.message);
  }
};

/**
 * ** METHOD : GET
 * ** DESCRIPTION : MONTHLY SUMMARY
 */
const getMonthlySummary = async (req, res) => {};

/**
 * ** METHOD : GET
 * ** DESCRIPTION : GET USERS LIST BY ROLE
 */

const getUserListByRole = async (req, res) => {
  const hospitalID = req.params.hospitalID;
  const role = req.params.role;
  try {
    const results = await userServices.getUserListByRole(hospitalID, role);

    res.status(200).send({
      message: "success",
      users: results
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

const checkUser = async (req, res) => {
  const hospitalID = req.hospitalID;
  const userID = req.userID;
  try {
    const results = await pool.query(queryGetUserByID, [hospitalID, userID]);
    if (results[0].length == 0)
      return resourceNotFound(res, "No Account Exists");
    res.status(200).send({
      message: "success"
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

/**
 * ** METHOD : PATCH
 * ** DESCRIPTION : ADMIN UPDATE STAFF
 */
const adminUpdateStaff = async (req, res) => {
  const id = req.params.id;
  const hospitalID = req.params.hospitalID;
  const data = {
    departmentID: req.body.departmentID,
    role: req.body.role,
    countryCode: req.body.countryCode,
    phoneNo: req.body.phoneNo,
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    dob: req.body.dob,
    gender: req.body.gender,
    address: req.body.address,
    city: req.body.city,
    state: req.body.state,
    city: req.body.city,
    state: req.body.state,
    pinCode: req.body.pinCode,
    image: req.body.image
  };
  try {
    const validData = await adminUpdateStaffSchema.validateAsync(data);
    const dataArray = [];
    const conditions = [];
    for (const key in validData) {
      if (data[key] !== null && data[key] !== undefined && key !== "image") {
        conditions.push(`${key} = ?`);
        dataArray.push(data[key]);
      }
    }
    const file = req.file;
    let fileName = null;
    if (file) {
      if (file.mimetype !== "image/png" && file.mimetype !== "image/jpeg") {
        return notAllowed(res, "only images allowed");
      }
      fileName = generateFileName();
      const uploadParams = {
        Bucket: AWS_BUCKET_NAME,
        Body: file.buffer,
        Key: fileName,
        ContentType: file.mimetype
      };
      await s3Client.send(new PutObjectCommand(uploadParams));
      conditions.push(`photo = ?`);
      dataArray.push(fileName);
    } else {
      if (!data.image) {
        conditions.push(`photo = ?`);
        dataArray.push(null);
      }
    }
    const query = `UPDATE users SET ${conditions.join(
      ","
    )} WHERE hospitalID=? AND id=?`;
    dataArray.push(hospitalID);
    dataArray.push(id);

    const [updateProfile] = await pool.query(query, dataArray);
    console.log("============updateProfile==========", updateProfile);
    if (!updateProfile.changedRows) {
      throw new Error("Failed to update");
    }
    // get User
    const [user] = await pool.query(queryGetUserByID, [hospitalID, id]);
    const foundUser = user[0];

    let imageURL;
    if (foundUser.photo) {
      imageURL = await getSignedUrl(
        s3Client,
        new GetObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: foundUser.photo
        }),
        { expiresIn: 300 }
      );
      foundUser.imageURL = imageURL || null;
      // console.log(imageURL)
    }
    res.status(200).send({
      message: "success",
      user: foundUser
    });
  } catch (err) {
    if (err.joi) return serverError(res, `joi : ${err.message}`);
    serverError(res, err.message);
  }
};

const getUsersListFromHospitals = async (req, res) => {
  const hospitalID = req.params.hospitalID;
  const role = req.params.role;
  try {
    const results = await userServices.getUsersListFromHospitals(
      hospitalID,
      role
    );

    return res.status(200).send({
      message: "success",
      users: results
    });
  } catch (err) {
    serverError(res, err.message);
  }
};


const addCustomerCareUser = async (req, res) => {
  try {
    const reqBodyData = req.body;
    const reqbodyfile = req.file;

    const createdCustomerCareUser = await userServices.addCustomerCareUser(
      reqBodyData,
      reqbodyfile
    );

    res.status(201).send({
      message: "success",
      data: { ...createdCustomerCareUser }
    });

  } catch (err) {
    if (err.isJoi === true) return missingBody(res, err.message);
    serverError(res, err.message);
  }
};

const updateCustomerCareUser = async (req, res) => {
  try {
    const reqBodyData = req.body;
    const reqbodyfile = req.file;
    const userId = req.params.id;

    const updatedCustomerCareUser = await userServices.updateCustomerCareUser(
      userId,
      reqBodyData,
      reqbodyfile
    );

    res.status(200).send({
      message: "success",
      data: { ...updatedCustomerCareUser }
    });

  } catch (err) {
    if (err.isJoi === true) return missingBody(res, err.message);
    serverError(res, err.message);
  }
};

const getAllCustomerCareUsers = async (req, res) => {
 
  try {
    console.log("loop")
    const results = await userServices.getAllCustomerCareUsers();

    return res.status(200).send({
      message: "success",
      users: results
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

const getHospitalsListForCCE = async (req, res) => {
 const userID = req.userID
  try {
    const results = await userServices.getHospitalsListForCCE(
      userID,
    );

    return res.status(200).send({
      message: "success",
      hospitals: results
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

const DeactivateCCE = async (req, res) => {
  try {
   
    const userId = req.params.id;

    const updatedCustomerCareUser = await userServices.DeactivateCCE(
      userId,
    );

    res.status(200).send({
      message: "success",
      data: { ...updatedCustomerCareUser }
    });

  } catch (err) {
    if (err.isJoi === true) return missingBody(res, err.message);
    serverError(res, err.message);
  }
};

const ReactivateCCE = async (req, res) => {
  try {
   
    const userId = req.params.id;

    const updatedCustomerCareUser = await userServices.ReactivateCCE(
      userId,
    );

    res.status(200).send({
      message: "success",
      data: { ...updatedCustomerCareUser }
    });

  } catch (err) {
    if (err.isJoi === true) return missingBody(res, err.message);
    serverError(res, err.message);
  }
};



module.exports = {
  createStaff,
  deleteuser,
  emailLogin,
  getUserDetailById,
  getUser,
  getAllUsersFromHospital,
  loginMobileUserEmail,
  changeUserPassword,
  updateUserProfile,
  adminUpdateUserProfile,
  updateSelfUserPassword,
  getUserCountByRole,
  getUserListByRole,
  checkUser,
  adminUpdateStaff,
  createMultipleStaff,
  getUsersListFromHospitals,
  addCustomerCareUser,
  getAllCustomerCareUsers,
  getHospitalsListForCCE,
  updateCustomerCareUser,
  DeactivateCCE,
  ReactivateCCE
};
