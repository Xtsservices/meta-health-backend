const pool = require("../db/conn");

const {
  findUserByEmail,
  queryGetUserByIDOnly,
  findUserByID,
  queryInsertStaff,
  queryInsertMultipleStaff,
  queryAdminUpdateUserProfile,
  queryUpdateUserProfile,
  queryGetUserCountByRole,
  queryInsertAdmin,
  updateRefreshToken,
  queryGetUserByID,
  queryGetAllUsersInHospital,
  queryGetUserListByRole,
  queryGetUsersInHospital,
  queryChangePassword,
  queryInsertCustomerCareUser,
  querygetAllCustomerCareUsers
} = require("../queries/userQueries");

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const roles = require("../utils/roles");
const {
  schema,
  updateUserSchema,
  adminUpdateUserSchema,
  adminUpdateStaffSchema,
  customerCareschema
} = require("../helper/validators/userValidator");

const { passwordSchema } = require("../helper/validators/passwordValidator");
const { adminSchema } = require("../helper/validators/adminValidator");
const SCOPE_LIST = require("../utils/scope");

const AWS_BUCKET_NAME = process.env.AWS_BUCKET_NAME;
const AWS_BUCKET_REGION = process.env.AWS_BUCKET_REGION;
const AWS_ACCESS_KEY = process.env.AWS_ACCESS_KEY;
const AWS_SECRET_KEY = process.env.AWS_SECRET_KEY;
const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand
} = require("@aws-sdk/client-s3");

const s3Client = new S3Client({
  region: process.env.AWS_BUCKET_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY
  }
});

const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const crypto = require("crypto");
const ROLES_LIST = require("../utils/roles");

const generateFileName = (bytes = 16) =>
  crypto.randomBytes(bytes).toString("hex");

async function getAllUsersFromHospital(hospitalID, id) {
  try {
    const results = await pool.query(queryGetAllUsersInHospital, [
      hospitalID,
      roles.admin
    ]);
    const users = results[0];
    const usersWithSignedURLs = await Promise.all(
      users.map(async (user) => {
        if (user.photo) {
          const imageURL = await getSignedUrl(
            s3Client,
            new GetObjectCommand({
              Bucket: process.env.AWS_BUCKET_NAME,
              Key: user.photo
            }),
            { expiresIn: 300 }
          );
          user.imageURL = imageURL;
        }
        return user;
      })
    );

    return usersWithSignedURLs;
  } catch (err) {
    throw new Error(err.message);
  }
}

async function emailLogin(email, password) {
  try {
    const results = await pool.query(findUserByEmail, [email.toLowerCase()]);
    if (results[0].length === 0) {
      throw new Error("No Account Exists");
    }

    const foundUser = results[0][0];
    const result = bcrypt.compareSync(password, foundUser.password);

    if (!result) {
      throw new Error("Invalid password");
    }

    const jwtAccessExpireTime = "7d";
    const jwtRefreshExpireTime = "30d"; // TODO change it to 1 year in prod
    const accessToken = jwt.sign(
      {
        info: {
          id: foundUser.id,
          hID: foundUser.hospitalID,
          group: foundUser.role
        }
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: jwtAccessExpireTime }
    );

    const refreshToken = jwt.sign(
      {
        info: {
          id: foundUser.id,
          hID: foundUser.hospitalID,
          group: foundUser.role
        }
      },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: jwtRefreshExpireTime }
    );

    await pool.query(updateRefreshToken, [refreshToken, foundUser.id]);

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
    }

    return {
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
      token: accessToken,
      refreshToken: refreshToken,
      imageURL: imageURL
    };
  } catch (err) {
    throw new Error(err.message);
  }
}

async function checkUser(hospitalID, userID) {
  //currently no functionality
}

async function loginMobileUserEmail(email, password) {
  try {
    const results = await pool.query(findUserByEmail, [email.toLowerCase()]);
    if (results[0].length == 0) {
      throw new Error("No Account Exists");
    }

    const foundUser = results[0][0];
    const result = bcrypt.compareSync(password, foundUser.password);
    if (!result) {
      throw new Error("invalid password");
    }

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
    }
    foundUser.photo = imageURL || null;
    const jwtAccessExpireTime = "30d";
    const acessToken = jwt.sign(
      {
        info: {
          id: foundUser.id,
          hID: foundUser.hospitalID,
          group: foundUser.role
        }
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: jwtAccessExpireTime }
    );

    return {
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
      token: acessToken,
      statusCode: 200
    };
  } catch (err) {
    throw new Error(err.message);
  }
}

async function getUserDetailById(id) {
  try {
    const results = await pool.query(queryGetUserByIDOnly, [id]);

    if (results[0].length == 0) {
      throw new Error("No Account Exists");
    }

    const foundUser = results[0][0];

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
    }

    return foundUser;
  } catch (err) {
    throw new Error(err.message);
  }
}

async function getUser(hospitalID, id) {
  try {
    const results = await pool.query(queryGetUserByID, [hospitalID, id]);

    if (results[0].length == 0) {
      throw new Error("No Account Exists");
    }

    const foundUser = results[0][0];

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
    }

    return foundUser;
  } catch (err) {
    throw new Error(err.message);
  }
}

async function updateUserProfile(id, data, reqFile) {
  try {
    const validateData = await updateUserSchema.validateAsync(data);
    const results = await pool.query(findUserByID, [id]);
    const foundUser = results[0][0];
    if (!foundUser) {
      throw new Error("No User Found");
    }

    const updateData = {
      countryCode: validateData.countryCode,
      phoneNo: validateData.phoneNo,
      firstName: validateData.firstName,
      lastName: validateData.lastName,
      dob: validateData.dob,
      gender: validateData.gender,
      address: validateData.address,
      city: validateData.city,
      state: validateData.state,
      pinCode: validateData.pinCode
    };

    const file = reqFile;
    let fileName = null;
    if (file) {
      if (file.mimetype !== "image/png" && file.mimetype !== "image/jpeg") {
        throw new Error("only images allowed");
      }
      fileName = generateFileName();
      const uploadParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Body: file.buffer,
        Key: fileName,
        ContentType: file.mimetype
      };
      await s3Client.send(new PutObjectCommand(uploadParams));
      updateData.photo = fileName;
    } else {
      if (!data.image) {
        updateData.photo = null;
      } else {
        updateData.photo = foundUser.photo;
      }
    }

    await pool.query(queryUpdateUserProfile, [
      updateData.countryCode,
      updateData.phoneNo,
      updateData.firstName,
      updateData.lastName,
      updateData.photo,
      updateData.dob,
      updateData.gender,
      updateData.address,
      updateData.city,
      updateData.state,
      updateData.pinCode,
      id
    ]);

    let imageURL = null;
    if (updateData.photo) {
      imageURL = await getSignedUrl(
        s3Client,
        new GetObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: updateData.photo
        }),
        { expiresIn: 300 }
      );
    }

    return {
      email: foundUser.email.toLowerCase(),
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
      imageURL: imageURL
    };
  } catch (err) {
    if (err.isJoi === true) throw new Error(`JOI : ${err.message}`);
    throw new Error(err.message);
  }
}

async function adminUpdateUserProfile(
  hospitalID,
  id,
  reqBodyData,
  reqBodyFile
) {
  try {
    const validateData = await adminUpdateUserSchema.validateAsync(reqBodyData);

    const rolesArray = [roles.doctor, roles.nurse, roles.staff];
    const roleCheck = rolesArray.includes(validateData.role); // only doctor, nurse and staff allowed here

    if (!roleCheck) {
      throw new Error("user with this role cannot be updated here");
    }

    const results = await pool.query(findUserByID, [id]);
    const foundUser = results[0][0];
    if (!foundUser) {
      throw new Error("No User Found");
    }

    const file = reqBodyFile;
    let fileName = null;
    if (file) {
      if (file.mimetype !== "image/png" && file.mimetype !== "image/jpeg") {
        throw new Error("only images allowed");
      }
      fileName = generateFileName();
      const uploadParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Body: file.buffer,
        Key: fileName,
        ContentType: file.mimetype
      };
      await s3Client.send(new PutObjectCommand(uploadParams));
    }
    const updateData = {
      departmentID: validateData.departmentID,
      role: validateData.role,
      countryCode: validateData.countryCode,
      phoneNo: validateData.phoneNo,
      firstName: validateData.firstName,
      lastName: validateData.lastName,
      photo: fileName || foundUser.photo,
      dob: validateData.dob,
      gender: validateData.gender,
      address: validateData.address,
      city: validateData.city,
      state: validateData.state,
      pinCode: validateData.pinCode
    };
    await pool.query(queryAdminUpdateUserProfile, [
      updateData.departmentID,
      updateData.role,
      updateData.countryCode,
      updateData.phoneNo,
      updateData.firstName,
      updateData.lastName,
      updateData.photo,
      updateData.dob,
      updateData.gender,
      updateData.address,
      updateData.city,
      updateData.state,
      updateData.pinCode,
      hospitalID,
      id
    ]);

    let imageURL = null;
    if (updateData.photo) {
      imageURL = await getSignedUrl(
        s3Client,
        new GetObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: updateData.photo
        }),
        { expiresIn: 300 }
      );
    }

    return {
      email: foundUser.email.toLowerCase(),
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
      imageURL: imageURL
    };
  } catch (err) {
    if (err.isJoi === true) throw new Error(`JOI : ${err.message}`);
    throw new Error(err.message);
  }
}

async function createStaff(hospitalID, reqBodyData, reqbodyfile) {
  try {
    const result = await schema.validateAsync(reqBodyData);

    const {
      email,
      password,
      departmentID,
      role,
      scope,
      countryCode,
      phoneNo,
      pin,
      forgotToken,
      refreshToken,
      firstName,
      lastName,
      dob,
      gender,
      address,
      city,
      state,
      pinCode,
      reportTo
    } = result;

    const scope_required = [roles.doctor, roles.headNurse, roles.staff];
    const scopeArray = Object.values(SCOPE_LIST);

    if (role !== roles.nurse && scope_required.includes(Number(role))) {
      if (!scope) {
        throw new Error("scope missing");
      }
      scope.split("#").forEach((el) => {
        if (!scopeArray.includes(Number(el))) {
          throw new Error("Some of the scopes are not allowed");
        }
      });
    }

    const rolesArray = [
      roles.doctor,
      roles.nurse,
      roles.headNurse,
      roles.staff,
      roles.management,
      roles.reception
    ];

    if (!rolesArray.includes(role)) {
      throw new Error("user with this role cannot be created here");
    }

    const results = await pool.query(findUserByEmail, [email]);
    if (results[0].length != 0) {
      throw new Error("Email Already Exists");
    }

    const file = reqbodyfile;
    let fileName = null;

    if (file) {
      if (file.mimetype !== "image/png" && file.mimetype !== "image/jpeg") {
        throw new Error("only images allowed");
      }
      fileName = generateFileName();
      const uploadParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Body: file.buffer,
        Key: fileName,
        ContentType: file.mimetype
      };
      await s3Client.send(new PutObjectCommand(uploadParams));
    }

    const pass = bcrypt.hashSync(password, 10);

    const response = await pool.query(queryInsertStaff, [
      hospitalID,
      email,
      pass,
      departmentID,
      role,
      scope,
      countryCode,
      phoneNo,
      pin,
      forgotToken,
      refreshToken,
      firstName,
      lastName,
      fileName,
      dob,
      gender,
      address,
      city,
      state,
      pinCode,
      reportTo
    ]);



    let imageURL;
    if (fileName) {
      imageURL = await getSignedUrl(
        s3Client,
        new GetObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: fileName
        }),
        { expiresIn: 300 }
      );
    }

    if (
      role === ROLES_LIST.doctor ||
      role === ROLES_LIST.nurse ||
      role === ROLES_LIST.headNurse
    ) {
      const queryInsert = `
        INSERT INTO users (
          name,
          email,
          password,
          createdOn,
          lastUpdated,
          active,
          role, 
          hospitalID,
          state,
          city,
          address
        ) VALUES (?, ?, ?, NOW(), NOW(), 1,   ?, ?, ?, ?, ?);
      `;
    
    
    }
    
    return {
      id: response[0].insertId,
      hospitalID: hospitalID,
      email: email.toLowerCase(),
      departmentID: departmentID,
      role: role,
      scope: scope,
      countryCode: countryCode,
      phoneNo: phoneNo,
      firstName: firstName,
      lastName: lastName,
      photo: fileName,
      dob: dob,
      gender: gender,
      address: address,
      city: city,
      state: state,
      pinCode: pinCode,
      imageURL: imageURL
    };
  } catch (err) {
    if (err.isJoi === true) {
      throw new Error(err.message);
    }
    throw new Error(err.message);
  }
}

const formatDate = (dateStr) => {
  const [day, month, year] = dateStr.split("-");
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
};

async function createMultipleStaff(hospitalID, staffData) {
  try {
    let connection;
    const resData = [];

    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();
      await Promise.all(
        staffData.data?.map(async (singleData, index) => {
          singleData.dob = formatDate(singleData.dob);
          const result = await schema.validateAsync(singleData);
          const {
            email,
            password,
            departmentID,
            role,
            countryCode,
            phoneNo,
            pin,
            forgotToken,
            refreshToken,
            firstName,
            lastName,
            dob,
            gender,
            address,
            city,
            state,
            pinCode,
            reportTo
          } = result;

          const rolesArray = [roles.doctor, roles.nurse, roles.headNurse, roles.staff];
          const roleCheck = rolesArray.includes(role); // only doctor, nurse and staff allowed here
          if (!roleCheck) {
            throw new Error("User with this role cannot be created here");
          }

          if (!email || !firstName || !lastName || !departmentID || !password) {
            throw new Error("Some fields are missing");
          }

          const results = await connection.query(findUserByEmail, [email]);
          if (results[0].length !== 0) {
            throw new Error("Email Already Exists");
          }

          const pass = bcrypt.hashSync(password, 10);
          const response = await connection.query(queryInsertMultipleStaff, [
            hospitalID,
            email,
            pass,
            departmentID,
            role,
            countryCode,
            phoneNo,
            pin,
            forgotToken,
            refreshToken,
            firstName,
            lastName,
            dob,
            gender,
            address,
            city,
            state,
            pinCode,
            reportTo
          ]);

          resData.push({
            id: response[0].insertId,
            hospitalID: hospitalID,
            email: email.toLowerCase(),
            departmentID: departmentID,
            role: role,
            countryCode: countryCode,
            phoneNo: phoneNo,
            firstName: firstName,
            lastName: lastName,
            dob: dob,
            gender: gender,
            address: address,
            city: city,
            state: state,
            pinCode: pinCode
          });
        })
      );

      await connection.commit();
      return resData;
    } catch (err) {
      if (connection) {
        await connection.rollback();
      }
      throw err;
    } finally {
      if (connection) {
        connection.release();
      }
    }
  } catch (err) {
    throw new Error(err.message);
  }
}

async function changeUserPassword(hospitalID, id, password) {
  try {
    await passwordSchema.validateAsync({ password });
    const result = await pool.query(queryGetUserByID, [hospitalID, id]);
    if (result[0].length === 0) throw new Error("no user exists");
    await pool.query(queryChangePassword, [
      bcrypt.hashSync(password, 10),
      hospitalID,
      id
    ]);

    const message = "success";
    return message;
  } catch (err) {
    if (err.isJoi === true) throw new Error("joi : " + err.message);
    throw new Error(err.message);
  }
}

async function updateSelfUserPassword(hospitalID, id, password) {
  try {
    await passwordSchema.validateAsync({ password });
    const result = await pool.query(queryGetUserByID, [hospitalID, id]);
    if (result[0].length === 0) throw new Error("no user exists");
    await pool.query(queryChangePassword, [
      bcrypt.hashSync(password, 10),
      hospitalID,
      id
    ]);

    const message = "success";
    return message;
  } catch (err) {
    if (err.isJoi === true) throw new Error("joi : " + err.message);
    throw new Error(err.message);
  }
}

async function getUserCountByRole(hospitalID, role) {
  try {
    const allowedRoles = [roles.doctor, roles.nurse, roles.staff];
    const result = allowedRoles.includes(parseInt(role));

    if (!result) {
      throw new Error("unknown role");
    }

    const results = await pool.query(queryGetUserCountByRole, [
      hospitalID,
      role
    ]);

    return results[0][0].count;
  } catch (err) {
    throw new Error(err.message);
  }
}

async function getUserListByRole(hospitalID, role) {
  try {
    const results = await pool.query(queryGetUserListByRole, [
      hospitalID,
      parseInt(role)
    ]);
    const users = results[0];
    const usersWithSignedURLs = await Promise.all(
      users.map(async (user) => {
        if (user.photo) {
          const imageURL = await getSignedUrl(
            s3Client,
            new GetObjectCommand({
              Bucket: process.env.AWS_BUCKET_NAME,
              Key: user.photo
            }),
            { expiresIn: 300 }
          );
          user.imageURL = imageURL;
        }
        return user;
      })
    );

    return usersWithSignedURLs;
  } catch (err) {
    throw new Error(err.message);
  }
}

async function getUsersListFromHospitals(hospitalID, role) {
  try {
    const results = await pool.query(queryGetUsersInHospital(role), [
      hospitalID
    ]);

    return results[0];
  } catch (err) {
    throw new Error(err.message);
  }
}



async function addCustomerCareUser(reqBodyData, reqbodyfile) {
  try {

    // Validate request body
    const result = await customerCareschema.validateAsync(reqBodyData);

    // Destructure request body data
    const {
      email,
      password,
      countryCode,
      phoneNo,
      firstName,
      lastName,
      dob,
      gender,
      address,
      pinCode,
      multiState,
      multiDist,
      multiCity
    } = result;

    const role = 8888
    // Ensure the user being added is a Customer Care user
    if (role !== roles.customerCare) {
      throw new Error("Only Customer Care users can be added");
    }

    // Handle multiState, multiDist, multiCity logic
    let finalMultiState, finalMultiDist, finalMultiCity;

    // Process multiState
    if (!multiState || multiState.length === 0 || multiState.every(s => s === 'all')) {
      finalMultiState = ['all'];
      finalMultiDist = ['all'];
      finalMultiCity = ['all'];
    } else {
      finalMultiState = [...new Set(multiState)];

      // Process multiDist
      if (!multiDist || multiDist.length === 0 || multiDist.every(d => d === 'all')) {
        finalMultiDist = ['all'];
        finalMultiCity = ['all'];
      } else {
        finalMultiDist = [...new Set(multiDist)];

        // Process multiCity
        if (!multiCity || multiCity.length === 0 || multiCity.every(c => c === 'all')) {
          finalMultiCity = ['all'];
        } else {
          finalMultiCity = [...new Set(multiCity)];
        }
      }
    }



    // Use all scopes from SCOPE_LIST
    const scopeArray = Object.values(SCOPE_LIST);
    const scope = scopeArray.join("#");


    // Check if email already exists
    const results = await pool.query(findUserByEmail, [email]);
    if (results[0].length != 0) {
      throw new Error("Email Already Exists");
    }

    // Handle file upload (photo)
    const file = reqbodyfile;
    let fileName = null;

    if (file) {
      if (file.mimetype !== "image/png" && file.mimetype !== "image/jpeg") {
        throw new Error("only images allowed");
      }
      fileName = generateFileName();
      const uploadParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Body: file.buffer,
        Key: fileName,
        ContentType: file.mimetype
      };
      await s3Client.send(new PutObjectCommand(uploadParams));
    }
    // Hash password
    const hashedPassword = bcrypt.hashSync(password, 10);

    // Insert user into the database
    const response = await pool.query(queryInsertCustomerCareUser, [
      email,
      hashedPassword,
      role,
      scope,
      countryCode,
      phoneNo,
      firstName,
      lastName,
      fileName,
      dob,
      gender,
      address,
      pinCode,
      JSON.stringify(finalMultiState),
      JSON.stringify(finalMultiDist),
      JSON.stringify(finalMultiCity)
    ]);

    // Generate signed URL for the uploaded photo (if exists)
    let imageURL;
    if (fileName) {
      imageURL = await getSignedUrl(
        s3Client,
        new GetObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: fileName
        }),
        { expiresIn: 300 }
      );
    }

    return {
      id: response[0].insertId, // MySQL returns insertId in the response object
      email: email.toLowerCase(),
      role: role,
      scope: scope,
      countryCode: countryCode,
      phoneNo: phoneNo,
      firstName: firstName,
      lastName: lastName,
      photo: fileName,
      dob: dob,
      gender: gender,
      address: address,
      pinCode: pinCode,
      multiState: finalMultiState,
      multiDist: finalMultiDist,
      multiCity: finalMultiCity,
      imageURL: imageURL,
    };
  } catch (err) {
    if (err.isJoi === true) {
      throw new Error(err.message);
    }
    throw new Error(err.message);
  }
}

async function updateCustomerCareUser(userId, reqBodyData, reqbodyfile) {
  try {
    // Validate request body
    const result = await customerCareschema.validateAsync(reqBodyData);

    // Destructure request body data
    const {
      email,
      password,
      countryCode,
      phoneNo,
      firstName,
      lastName,
      dob,
      gender,
      address,
      pinCode,
      multiState,
      multiDist,
      multiCity
    } = result;

    const role = 8888;
    // Ensure the user being updated is a Customer Care user
    if (role !== roles.customerCare) {
      throw new Error("Only Customer Care users can be updated");
    }

    // Handle multiState, multiDist, multiCity logic
    let finalMultiState, finalMultiDist, finalMultiCity;

    // Process multiState
    if (!multiState || multiState.length === 0 || multiState.every(s => s === 'all')) {
      finalMultiState = ['all'];
      finalMultiDist = ['all'];
      finalMultiCity = ['all'];
    } else {
      finalMultiState = [...new Set(multiState)];

      // Process multiDist
      if (!multiDist || multiDist.length === 0 || multiDist.every(d => d === 'all')) {
        finalMultiDist = ['all'];
        finalMultiCity = ['all'];
      } else {
        finalMultiDist = [...new Set(multiDist)];


        // Process multiCity
        if (!multiCity || multiCity.length === 0 || multiCity.every(c => c === 'all')) {
          finalMultiCity = ['all'];
        } else {
          finalMultiCity = [...new Set(multiCity)];
        }
      }
    }

    // Use all scopes from SCOPE_LIST
    const scopeArray = Object.values(SCOPE_LIST);
    const scope = scopeArray.join("#");

    // Check if user exists
    const userCheck = await pool.query(findUserById, [userId]);
    if (userCheck[0].length === 0) {
      throw new Error("User not found");
    }

    // Check if email is being updated to an existing email
    if (email && email.toLowerCase() !== userCheck[0][0].email) {
      const emailCheck = await pool.query(findUserByEmail, [email]);
      if (emailCheck[0].length !== 0) {
        throw new Error("Email already in use");
      }
    }

    // Handle file upload (photo)
    let fileName = userCheck[0][0].photo;
    if (reqbodyfile) {
      if (reqbodyfile.mimetype !== "image/png" && reqbodyfile.mimetype !== "image/jpeg") {
        throw new Error("Only images allowed");
      }
      fileName = generateFileName();
      const uploadParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Body: reqbodyfile.buffer,
        Key: fileName,
        ContentType: reqbodyfile.mimetype
      };
      await s3Client.send(new PutObjectCommand(uploadParams));
    }

    // Hash password if provided
    let hashedPassword = userCheck[0][0].password;
    if (password) {
      hashedPassword = bcrypt.hashSync(password, 10);
    }

    // Update user in the database
    const response = await pool.query(queryUpdateCustomerCareUser, [
      email.toLowerCase(),
      hashedPassword,
      role,
      scope,
      countryCode,
      phoneNo,
      firstName,
      lastName,
      fileName,
      dob,
      gender,
      address,
      pinCode,
      JSON.stringify(finalMultiState),
      JSON.stringify(finalMultiDist),
      JSON.stringify(finalMultiCity),
      userId
    ]);

    // Generate signed URL for the uploaded photo (if exists)
    let imageURL;
    if (fileName) {
      imageURL = await getSignedUrl(
        s3Client,
        new GetObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: fileName
        }),
        { expiresIn: 300 }
      );
    }

    return {
      id: userId,
      email: email.toLowerCase(),
      role: role,
      scope: scope,
      countryCode: countryCode,
      phoneNo: phoneNo,
      firstName: firstName,
      lastName: lastName,
      photo: fileName,
      dob: dob,
      gender: gender,
      address: address,
      pinCode: pinCode,
      multiState: finalMultiState,
      multiDist: finalMultiDist,
      multiCity: finalMultiCity,
      imageURL: imageURL,
    };
  } catch (err) {
    if (err.isJoi === true) {
      throw new Error(err.message);
    }
    throw new Error(err.message);
  }
}

const findUserById = "SELECT * FROM users WHERE id = ?";

const queryUpdateCustomerCareUser = `
  UPDATE users SET
    email = ?, password = ?, role = ?, scope = ?, countryCode = ?, phoneNo = ?,
    firstName = ?, lastName = ?, photo = ?, dob = ?, gender = ?, address = ?,
    pinCode = ?, multiState = ?, multiDist = ?, multiCity = ?
  WHERE id = ?
`;


async function getAllCustomerCareUsers(){
  try {
    const results = await pool.query(querygetAllCustomerCareUsers, [ROLES_LIST.customerCare]);

    const users = results[0];
    const usersWithSignedURLs = await Promise.all(
      users.map(async (user) => {
        if (user.photo) {
          const imageURL = await getSignedUrl(
            s3Client,
            new GetObjectCommand({
              Bucket: process.env.AWS_BUCKET_NAME,
              Key: user.photo
            }),
            { expiresIn: 300 }
          );
          user.photo = imageURL;
        }
        return user;
      })
    );

    return usersWithSignedURLs;

  } catch (err) {
    throw new Error(err.message);
  }
}

async function getHospitalsListForCCE(userID) {
  try {
    // Query to get user data with hospital IDs
    const queryGetHospitalsForCCE = `SELECT * FROM users WHERE id = ?`;
    const [users] = await pool.query(queryGetHospitalsForCCE, [userID]);

    // Check if user exists
    if (!users || users.length === 0) {
      throw new Error('User not found');
    }

    // Get hospital IDs from user
    const hospitalIds = users[0].hospitalIds;

    // Check if hospitalIds exists and is not empty
    if (!hospitalIds || hospitalIds.length === 0) {
      return []; // Return empty array if no hospital IDs
    }

    // Query to get hospitals
    const queryGetHospitals = `SELECT * FROM hospitals WHERE id IN (?)`;
    const [hospitals] = await pool.query(queryGetHospitals, [hospitalIds]);

    // Query to count vital alerts per hospital
    const queryGetVitalCounts = `
      SELECT 
        pt.hospitalID,
         COUNT(DISTINCT pt.patientID) as vitalCount
      FROM patientTimeLine pt
      LEFT JOIN vitalAlerts va ON pt.id = va.timeLineID
      WHERE pt.hospitalID IN (?)
       AND va.datetime >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
       AND pt.patientEndStatus  IS  NULL
      GROUP BY pt.hospitalID;
    `;
    const [vitalCounts] = await pool.query(queryGetVitalCounts, [hospitalIds]);

     // Map hospitals with their vital counts, including all hospital columns
     const result = hospitals.map(hospital => ({
      ...hospital,
      vitalCount: vitalCounts.find(count => count.hospitalID === hospital.id)?.vitalCount || 0
    }));

    return result;
  } catch (err) {
    throw new Error(`Failed to fetch hospitals: ${err.message}`);
  }
}

async function DeactivateCCE(userId) {
  try {
    // Validate userId
    if (!userId || isNaN(userId)) {
      throw new Error("Invalid user ID");
    }

    // Check if user exists
    const userCheck = await pool.query(findUserById, [userId]);
    if (userCheck[0].length === 0) {
      throw new Error("User not found");
    }

    // Deactivate the user
    const query = `UPDATE users SET isDeactivated = 1 WHERE id = ?`; // Fixed typo: isDiactivated -> isDeactivated
    await pool.query(query, [userId]);

    return { message: "success" }; // Match frontend expectation
  } catch (err) {
    throw new Error(err.message || "Failed to deactivate user");
  }
}

async function ReactivateCCE(userId) {
  try {
    // Validate userId
    if (!userId || isNaN(userId)) {
      throw new Error("Invalid user ID");
    }

    // Check if user exists
    const userCheck = await pool.query(findUserById, [userId]);
    if (userCheck[0].length === 0) {
      throw new Error("User not found");
    }

    // Deactivate the user
    const query = `UPDATE users SET isDeactivated = 0 WHERE id = ?`; // Fixed typo: isDiactivated -> isDeactivated
    await pool.query(query, [userId]);

    return { message: "success" }; // Match frontend expectation
  } catch (err) {
    throw new Error(err.message || "Failed to deactivate user");
  }
}


module.exports = {
  getAllUsersFromHospital,
  emailLogin,
  checkUser,
  loginMobileUserEmail,
  getUserDetailById,
  getUser,
  updateUserProfile,
  adminUpdateUserProfile,
  createStaff,
  createMultipleStaff,
  changeUserPassword,
  updateSelfUserPassword,
  getUserCountByRole,
  getUserListByRole,
  getUsersListFromHospitals,
  addCustomerCareUser,
  getAllCustomerCareUsers,
  getHospitalsListForCCE,
  updateCustomerCareUser,
  DeactivateCCE,
  ReactivateCCE
};
