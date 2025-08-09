const ROLES_LIST = require("../utils/roles");

const findUserByEmail = "SELECT * FROM users WHERE email=?";
const findUserByID = "SELECT * FROM users WHERE id=?";
const queryInsertStaff =
  "INSERT INTO users(hospitalID,email,password,departmentID," +
  "role,scope,countryCode,phoneNo,pin,forgotToken," +
  "refreshToken,firstName,lastName,photo,dob," +
  "gender,address,city,state,pinCode,reportTo) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
const queryInsertMultipleStaff =
  "INSERT INTO users(hospitalID,email,password,departmentID," +
  "role,countryCode,phoneNo,pin,forgotToken," +
  "refreshToken,firstName,lastName,dob," +
  "gender,address,city,state,pinCode,reportTo) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";

const queryAdminUpdateUserProfile = `
  UPDATE users
  SET departmentID = ?,
    role = ?,
    countryCode = ?,
    phoneNo = ?,
    firstName = ?,
    lastName = ?,
    photo = ?,
    dob = ?,
    gender = ?,
    address = ?,
    city = ?,
    state = ?,
    pinCode = ?
  WHERE hospitalID = ? AND id = ?
`;

const queryUpdateUserProfile = `
  UPDATE users
  SET countryCode = ?,
    phoneNo = ?,
    firstName = ?,
    lastName = ?,
    photo = ?,
    dob = ?,
    gender = ?,
    address = ?,
    city = ?,
    state = ?,
    pinCode = ?
  WHERE  id = ?
`;

const queryGetUserCountByRole = `SELECT COUNT(*) AS count FROM users WHERE hospitalID=? AND role=?`;

const queryInsertAdmin =
  "INSERT INTO users(hospitalID,email,password," +
  "role,countryCode,phoneNo,pin,forgotToken," +
  "refreshToken,firstName,lastName,photo,dob," +
  "gender,address,city,state,pinCode) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
const updateRefreshToken = "UPDATE users SET refreshToken=? WHERE id=?";
const queryGetUserByIDOnly =
  "SELECT id,departmentID,email,role,countryCode,phoneNo," +
  "firstName,lastName,photo,dob,gender,address,city," +
  "state,pinCode FROM users WHERE id=?";
const queryGetUserByID =
  "SELECT id,departmentID,email,role,countryCode,phoneNo," +
  "firstName,lastName,photo,dob,gender,address,city," +
  "state,pinCode FROM users WHERE hospitalID=? AND id=?";
const queryGetAllUsersInHospital =
  "SELECT id,departmentID,email," +
  "role,countryCode,phoneNo," +
  "firstName,lastName,photo,dob," +
  "gender,address,city,state,pinCode,addedOn FROM users WHERE hospitalID=? AND role!=?";

const queryGetUserListByRole = `SELECT id,departmentID,firstName,lastName,role,photo FROM users WHERE hospitalID=? AND role=?`;

const queryGetUsersInHospital = (role) =>
  `SELECT users.id,firstName,lastName , departments.name AS departmentName FROM users LEFT JOIN departments ON users.departmentID = departments.id WHERE users.hospitalID=? ${
    role == ROLES_LIST.admin
      ? `AND role <> ${ROLES_LIST.sAdmin}`
      : `AND role IN (${ROLES_LIST.doctor}, ${ROLES_LIST.nurse}, ${ROLES_LIST.staff})`
  }`;

const queryChangePassword =
  "UPDATE users SET password=? WHERE hospitalID=? AND id=?";

  const queryInsertCustomerCareUser = `
  INSERT INTO users (
  email, password, role, scope, countryCode, phoneNo, 
  firstName, lastName, photo, dob, gender, address,
  pinCode,  multiState, multiDist, multiCity
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `

const querygetAllCustomerCareUsers = `
select * from users where role=?
`;

module.exports = {
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
};
