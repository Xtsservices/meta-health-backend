const {
  serverError,
  missingBody,
  resourceNotFound,
  duplicateRecord,
  notAllowed,
} = require("../utils/errors");
const pool = require("../db/conn");

const bcrypt = require("bcrypt");
const {
  patientSchema,
  updatePatientSchema,
  dateValidation,
} = require("../helper/validators/patientValidator");
const {
  patientTimeLineSchema,
  dischargeSchema,
  updateTimeLineSchema,
} = require("../helper/validators/patientTimeLineValidator");
const { format } = require("date-fns");
const patientUtils = require("../utils/patientUtils");
const dayjs = require("dayjs");
const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const crypto = require("crypto");
const { object, forbidden } = require("joi");
const {
  transferPatientSchema,
} = require("../helper/validators/transferPatientValidator");
const ROLES_LIST = require("../utils/roles");
const doctorService = require("../services/doctorService");
// const { removeAllDoctor } = require("./doctor");
const { addDoctor, removeAllDoctor } = require("../services/doctorService");
const { log } = require("console");
const { findUserByID } = require("../queries/userQueries");

const queryFindPatientByPID =
  "SELECT * FROM patients WHERE hospitalID=? AND pID=?";

const queryUpdatePatientByID = `UPDATE patients SET pUHID=?,category=?, 
    dob=?, gender=?, age=? weight=?, height=?, pName=?, phoneNumber=?, email=?, address=?, city=?, state=?, pinCode=?, referredBy=?,insurance=?,insuranceNumber=?,insuranceCompany=?,photo=?
     WHERE hospitalID = ? AND id = ?`;
const queryUpdatePatientTimeLineByID = `UPDATE patientTimeLine SET userID=? WHERE id=?`;
const queryUpdatePatientTimeLineByIDAddWard = `UPDATE patientTimeLine SET wardID=? WHERE id=?`;
//addedBy for who is adding the patient
const queryInsertPatient2 = `INSERT INTO patients (hospitalID,pID, pUHID, ptype,category, 
    dob, gender, age, weight, height, pName, phoneNumber, email, address, city, state, pinCode, referredBy,insurance,insuranceNumber,insuranceCompany,addedBy,photo) 
    VALUES (?,?, ?,?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?,?,?,?,?,?)`;
const queryInsertPatient = `INSERT INTO patients (hospitalID,pID, pUHID, ptype,category, 
    dob, gender, weight, height, pName, phoneNumber, email, address, city, state, pinCode, referredBy,insurance,insuranceNumber,insuranceCompany,photo) 
    VALUES (?,?, ?,?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?,?,?,?)`;
const querySetID = "SET @patientID = LAST_INSERT_ID()";
const queryInsertPatientTimeLine = `INSERT INTO patientTimeLine (hospitalID,patientID, departmentID,
  patientStartStatus,wardID) 
  VALUES (?,@patientID,?,?,?)`;

const queryInsertPatientTimeLineForTransfer = (patientStatus) => {
  if (patientStatus == patientUtils.patientStatus.inpatient)
    return `INSERT INTO patientTimeLine (hospitalID,patientID,departmentID,patientStartStatus,wardID) 
VALUES (?,?,?,?,?)`;
  else
    return `INSERT INTO patientTimeLine (hospitalID,patientID,departmentID,patientStartStatus) 
VALUES (?,?,?,?)`;
};

const queryInsertTransferPatient = `INSERT INTO transferPatient (hospitalID,patientID,transferType,bp,temp,oxygen,pulse,
        reason,patientTimeLineID,patientNewTimeLineID,hospitalName,relativeName) 
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`;

const queryRevisitPatientTimeLine = (ptype) => {
  if (ptype == patientUtils.patientStatus.inpatient)
    return `INSERT INTO patientTimeLine (hospitalID, patientID,departmentID,
    patientStartStatus,wardID) 
    VALUES (?,?,?,?,?)`;
  else
    return `INSERT INTO patientTimeLine (hospitalID, patientID,departmentID,
    patientStartStatus) 
    VALUES (?,?,?,?)`;
};

//get allpatients for reception based on ptype emergency,ipd,opd,discharged

const geListOfPatientsForReceptoin = `SELECT patients.id, patients.hospitalID, patients.deviceID, patients.pID, patients.pUHID, patients.ptype, 
    patients.category, patients.pName, users.firstName, users.lastName, departments.name as department, patients.dob, 
    patients.gender, patients.weight, patients.height, patients.phoneNumber, patients.email, patients.address, 
    patients.city, patients.state, patients.pinCode, patients.referredBy, patients.photo, patientTimeLine.startTime, 
    patientTimeLine.patientEndStatus, patientTimeLine.patientStartStatus, patientTimeLine.id AS patientTimeLineID, 
    patientTimeLine.wardID, wards.name AS wardName
    FROM patientDoctors 
    INNER JOIN patientTimeLine ON patientDoctors.patientTimeLineID = patientTimeLine.id 
    INNER JOIN patients ON patientTimeLine.patientID = patients.id 
    INNER JOIN users ON patientDoctors.doctorID = users.id 
    INNER JOIN departments ON users.departmentID = departments.id 
    LEFT JOIN wards ON patientTimeLine.wardID = wards.id 
    WHERE patientDoctors.hospitalID = ? 
    AND patientDoctors.active = true 
    AND patientTimeLine.patientEndStatus IS NULL 
    AND patients.ptype=?  
    AND YEAR(patients.addedOn) = ? 
    AND MONTH(patients.addedOn) = ? 
    ORDER BY patients.addedOn DESC`;

// only for inpatients
const queryGetPatientsByType = (role) =>
  role == ROLES_LIST.doctor
    ? `SELECT patients.id, patients.hospitalID, patients.deviceID, patients.pID, patients.pUHID, patients.ptype, 
    patients.category, patients.pName, users.firstName, users.lastName, departments.name as department, patients.dob, 
    patients.gender, patients.weight, patients.height, patients.phoneNumber, patients.email, patients.address, 
    patients.city, patients.state, patients.pinCode, patients.referredBy, patients.photo, patientTimeLine.startTime, 
    patientTimeLine.patientEndStatus, patientTimeLine.patientStartStatus, patientTimeLine.id AS patientTimeLineID, 
    patientTimeLine.wardID, wards.name AS wardName
    FROM patientDoctors 
    INNER JOIN patientTimeLine ON patientDoctors.patientTimeLineID = patientTimeLine.id 
    INNER JOIN patients ON patientTimeLine.patientID = patients.id 
    INNER JOIN users ON patientDoctors.doctorID = users.id 
    INNER JOIN departments ON users.departmentID = departments.id 
    LEFT JOIN wards ON patientTimeLine.wardID = wards.id 
    WHERE patientDoctors.hospitalID = ? AND patientDoctors.active = true AND patientTimeLine.patientEndStatus IS NULL AND patients.ptype=? AND patientDoctors.doctorID = ? AND patients.isViewed =1`
    : `SELECT patients.id, patients.hospitalID, patients.deviceID, patients.pID, patients.pUHID, patients.ptype, 
    patients.category, patients.pName, patients.dob, 
    patients.gender, patients.weight, patients.height, patients.phoneNumber, patients.email, patients.address, 
    patients.city, patients.state, patients.pinCode, patients.referredBy, patients.photo, patientTimeLine.startTime, 
    patientTimeLine.patientEndStatus, patientTimeLine.patientStartStatus, patientTimeLine.id AS patientTimeLineID, 
    patientTimeLine.wardID, wards.name AS wardName,users.firstName,users.lastName
    FROM patients
    INNER JOIN patientTimeLine ON patientTimeLine.patientID = patients.id
    INNER JOIN patientDoctors ON patientDoctors.patientTimeLineID = patientTimeLine.id
    INNER JOIN users ON patientDoctors.doctorID = users.id 
    LEFT JOIN wards ON patientTimeLine.wardID = wards.id 
    WHERE patients.hospitalID = ? AND patientTimeLine.patientEndStatus IS NULL AND patients.ptype=? AND patientDoctors.doctorID =?`;

const queryGetPatientsByTypeAndZone = (
  role
) => `SELECT patients.id,patients.hospitalID,patients.deviceID,patients.pID,patients.zone,patients.isViewed,
        patients.pUHID,patients.ptype,patients.category,patients.pName,patients.dob,patients.gender,
        patients.weight,patients.height,patients.phoneNumber,patients.email,patients.address,
        patients.city,patients.state,patients.pinCode,patients.referredBy,patients.photo,patientTimeLine.startTime,patientTimeLine.patientEndStatus,patientTimeLine.patientStartStatus,
        patientTimeLine.id AS patientTimeLineID,patientTimeLine.wardID,wards.name AS wardName,users.firstName,users.departmentID, users.lastName, departments.name as department
        FROM patients
        INNER JOIN patientTimeLine on patients.id=patientTimeLine.patientID 
        INNER JOIN patientDoctors ON patientDoctors.patientTimeLineID = patientTimeLine.id
        LEFT JOIN users ON patientDoctors.doctorID = users.id 
        LEFT JOIN departments ON departments.id = users.departmentID
        LEFT JOIN wards on patientTimeLine.wardID=wards.id
        WHERE patients.hospitalID=? AND patients.ptype=? AND patients.zone=? AND patientDoctors.doctorID=? AND patientDoctors.active = true  AND patients.isViewed = 1`;

const queryGetPatientsForTriage = `SELECT patients.id,patients.hospitalID,patients.deviceID,patients.pID,patients.zone,patients.pUHID,patients.ptype,patients.category,patients.pName,patients.dob,patients.gender,patients.weight,patients.height,patients.phoneNumber, patients.lastModified,
  patients.email,patients.address,patients.city,patients.state,patients.pinCode,patients.referredBy,patients.photo,users.firstName,users.departmentID,users.lastName,departments.name as department
  FROM patients 
  LEFT JOIN patientTimeLine on patients.id = patientTimeLine.patientID
  LEFT JOIN patientDoctors on patientTimeLine.id = patientDoctors.patientTimeLineID
  LEFT JOIN users on patientDoctors.doctorID = users.id
  LEFT JOIN departments ON departments.id = users.departmentID
  WHERE patients.hospitalID=? AND patients.ptype=${patientUtils.patientStatus.emergency} AND patientDoctors.doctorID =? AND patients.isViewed=1 AND patients.zone IS NULL  order by id desc`;

////To get all patient using ward and department filter

const queryGetPatientByTypeWithFilter = `SELECT patients.id,patients.hospitalID,patients.deviceID,patients.pID,
    patients.pUHID,patients.ptype,patients.category,patients.pName,patients.dob,patients.gender,
    patients.weight,patients.height,patients.phoneNumber,patients.email,patients.address,
    patients.city,patients.state,patients.pinCode,patients.referredBy,patients.photo,patientTimeLine.startTime,
    patientTimeLine.id AS patientTimeLineID,wards.id AS wardID, wards.name AS wardName
    FROM patients
    INNER JOIN patientTimeLine on patients.id=patientTimeLine.patientID 
    INNER JOIN wards on patientTimeLine.wardID=wards.id
    WHERE patients.hospitalID=? AND patients.ptype=? AND patientTimeLine.startTime=patientTimeLine.endTime 
    AND (wardID = ? OR ? IS NULL);`;

const queryGetPatientByTypeAndZoneWithFilter = `SELECT patients.id,patients.hospitalID,patients.deviceID,patients.pID,
    patients.pUHID,patients.ptype,patients.zone,patients.category,patients.pName,patients.dob,patients.gender,
    patients.weight,patients.height,patients.phoneNumber,patients.email,patients.address,
    patients.city,patients.state,patients.pinCode,patients.referredBy,patients.photo,patientTimeLine.startTime,
    patientTimeLine.id AS patientTimeLineID,wards.id AS wardID, wards.name AS wardName
    FROM patients
    INNER JOIN patientTimeLine on patients.id=patientTimeLine.patientID 
    INNER JOIN wards on patientTimeLine.wardID=wards.id
    WHERE patients.hospitalID=? AND patients.ptype=? AND patientTimeLine.startTime=patientTimeLine.endTime AND patients.zone=?`;

// only for inpatients
const queryGetNotificationCount = `select count(*) as count from medicines
      LEFT JOIN medicineReminders ON
      medicines.id=medicineReminders.medicineID
      where medicines.timeLineID=? AND
      medicineReminders.dosageTime>?`;

const queryGetDischargedPatientsForReception = `SELECT DISTINCT patients.id, patients.hospitalID, patients.deviceID, patients.pID,
   patients.pUHID, patients.ptype, patients.category, patients.pName,
   patients.dob, patients.gender, patients.weight, patients.height,
   patients.phoneNumber, patients.email, patients.address, patients.city,
   patients.state, patients.pinCode, patients.referredBy, patients.photo,
   patientTimeLine.startTime,patientTimeLine.endTime,patientTimeLine.dischargeType, patientTimeLine.patientEndStatus,
   patientTimeLine.patientStartStatus, patientTimeLine.id AS patientTimeLineID,
   patientTimeLine.wardID
   FROM patientTimeLine
   JOIN patients ON patientTimeLine.patientID = patients.id
   LEFT JOIN patientDoctors ON patientTimeLine.id = patientDoctors.patientTimeLineID
   WHERE patients.hospitalID = ? 
   AND patientDoctors.active = false
   AND patientTimeLine.patientEndStatus IS NOT NULL 
   AND patientTimeLine.patientStartStatus=? 
    AND YEAR(patientTimeLine.endTime) = ? 
    AND MONTH(patientTimeLine.endTime) = ? 
   ORDER BY patients.addedOn DESC`;

// only for inpatients
const queryGetDischargedPatients = (role) =>
  role == ROLES_LIST.doctor
    ? `SELECT DISTINCT patients.id, patients.hospitalID, patients.deviceID, patients.pID,
   patients.pUHID, patients.ptype, patients.category, patients.pName,
   patients.dob, patients.gender, patients.weight, patients.height,
   patients.phoneNumber, patients.email, patients.address, patients.city,
   patients.state, patients.pinCode, patients.referredBy, patients.photo,
   patientTimeLine.startTime,patientTimeLine.endTime,patientTimeLine.dischargeType, patientTimeLine.patientEndStatus,
   patientTimeLine.patientStartStatus, patientTimeLine.id AS patientTimeLineID,
   patientTimeLine.wardID
   FROM patientTimeLine
   JOIN patients ON patientTimeLine.patientID = patients.id AND patients.ptype = ?
   LEFT JOIN patientDoctors ON patientTimeLine.id = patientDoctors.patientTimeLineID
   WHERE patients.hospitalID = ? 
   AND patientTimeLine.patientEndStatus =21
   AND patientDoctors.doctorID = ? ORDER BY patientTimeLine.startTime DESC`
    : `
   SELECT DISTINCT patients.id, patients.hospitalID, patients.deviceID, patients.pID,
   patients.pUHID, patients.ptype, patients.category, patients.pName,
   patients.dob, patients.gender, patients.weight, patients.height,
   patients.phoneNumber, patients.email, patients.address, patients.city,
   patients.state, patients.pinCode, patients.referredBy, patients.photo,
   patientTimeLine.startTime,patientTimeLine.endTime,patientTimeLine.dischargeType, patientTimeLine.patientEndStatus,
   patientTimeLine.patientStartStatus, patientTimeLine.id AS patientTimeLineID,
   patientTimeLine.wardID
   FROM patientTimeLine
   JOIN patients ON patientTimeLine.patientID = patients.id AND patients.ptype = ?
   WHERE patients.hospitalID = ? 
   AND patientTimeLine.patientEndStatus IS NOT NULL AND patientTimeLine.patientStartStatus=? ORDER BY patientTimeLine.startTime DESC
`;

const queryGetDischargedAndOutpatients = (
  role
) => `SELECT patients.id,patients.hospitalID,patients.deviceID,patients.pID,
        patients.pUHID,patients.ptype,patients.category,patients.pName,patients.dob,patients.gender,
        patients.weight,patients.height,patients.phoneNumber,patients.email,patients.address,
        patients.city,patients.state,patients.pinCode,patients.referredBy,patients.photo,patientTimeLine.startTime,patientTimeLine.endTime,
        patientTimeLine.id AS patientTimeLineID,patientTimeLine.dischargeType,patientTimeLine.diet,
        patientTimeLine.advice,patientTimeLine.followUp,patientTimeLine.followUpDate,patientTimeLine.icd,patientTimeLine.patientEndStatus, patientTimeLine.patientStartStatus 
        FROM patients
        INNER JOIN (
          SELECT patientID, MAX(startTime) AS latestStartTime
          FROM patientTimeLine
          GROUP BY patientID
        ) AS latestTimeline ON patients.id = latestTimeline.patientID
        INNER JOIN patientTimeLine ON patients.id = patientTimeLine.patientID AND patientTimeLine.startTime = latestTimeline.latestStartTime 
        WHERE patients.hospitalID=? AND patients.ptype IN (?)`;

////Get all discharge patients with ward and department filter
const queryGetDischargedPatientsWithFilter = `SELECT patients.id,patients.hospitalID,patients.deviceID,patients.pID,
    patients.pUHID,patients.ptype,patients.category,patients.pName,patients.dob,patients.gender,
    patients.weight,patients.height,patients.phoneNumber,patients.email,patients.address,
    patients.city,patients.state,patients.pinCode,patients.referredBy,patients.photo,patientTimeLine.startTime,patientTimeLine.endTime,
    patientTimeLine.id AS patientTimeLineID,patientTimeLine.dischargeType,patientTimeLine.diet,
    patientTimeLine.advice,patientTimeLine.followUp,patientTimeLine.followUpDate,patientTimeLine.icd
    FROM patients
    INNER JOIN patientTimeLine on patients.id=patientTimeLine.patientID 
    INNER JOIN wards on patientTimeLine.wardID=wards.id
    WHERE patients.hospitalID=? AND patients.ptype=? 
    AND (wardID = ? OR ? IS NULL) ORDER BY patientTimeLine.startTime DESC LIMIT 1`;
const queryGetOpdPreviousPatientList = (role, zone, userID) => {
  let query =
    ROLES_LIST.doctor == role && !zone
      ? `
                SELECT patients.id, patients.hospitalID, patients.deviceID, patients.pID, patients.pUHID, patients.ptype, patients.category, patients.pName, 
                patients.dob, patients.gender, patients.weight, patients.height, patients.lastModified,
                patients.phoneNumber, patients.email, patients.address, patients.city, patients.state, patients.pinCode, patients.referredBy, 
                patients.photo, patientTimeLine.startTime, users.firstName, users.lastName, departments.name AS department
                FROM patients
                LEFT JOIN patientTimeLine ON patients.id = patientTimeLine.patientID
                LEFT JOIN patientDoctors ON patientDoctors.patientTimeLineID = patientTimeLine.id
                LEFT JOIN users ON users.id=patientDoctors.doctorID
                LEFT JOIN departments ON departments.id=users.departmentID
                LEFT JOIN followUp ON followUp.timelineID = patientTimeLine.id
                WHERE patients.hospitalID = ? 
                AND patients.ptype IN (?, 21) -- Filter for dynamic ptype and ptype 21
                AND patients.isViewed = 1
                AND patientDoctors.doctorID= ${userID}
                AND followUp.timelineID IS NULL
                ORDER BY patientTimeLine.startTime DESC ;
              `
      : `
                SELECT patients.id, patients.hospitalID, patients.deviceID, patients.pID, patients.pUHID, patients.ptype, patients.category, patients.pName, 
                patients.dob, patients.gender, patients.weight, patients.height, 
                patients.phoneNumber, patients.email, patients.address, patients.city, patients.state, patients.pinCode, patients.referredBy, 
                patients.photo, patientTimeLine.startTime 
                FROM patients
                INNER JOIN patientTimeLine ON patients.id = patientTimeLine.patientID
                LEFT JOIN followUp ON followUp.timelineID = patientTimeLine.id
                WHERE patients.hospitalID = ? 
                AND patients.ptype = ? 
                AND patients.isViewed = 1
                AND patients.zone = ${zone}
                AND followUp.timelineID IS NULL
                ORDER BY patientTimeLine.startTime DESC 
                LIMIT 10`;

  return query;
};
const queryGetRecentPatientsByType = (role, zone = 0, userID = 0) => {
  let query =
    ROLES_LIST.doctor == role && !zone
      ? `
        SELECT patients.id, patients.hospitalID, patients.deviceID, patients.pID, patients.pUHID, patients.ptype, patients.category, patients.pName, 
        patients.dob, patients.gender, patients.weight, patients.height, 
        patients.phoneNumber, patients.email, patients.address, patients.city, patients.state, patients.pinCode, patients.referredBy, patients.lastModified,
        patients.photo, patientTimeLine.startTime, users.firstName,users.lastName, departments.name AS department
        FROM patients
        INNER JOIN patientTimeLine ON patients.id = patientTimeLine.patientID
        INNER JOIN patientDoctors ON patientDoctors.patientTimeLineID = patientTimeLine.id AND patientDoctors.active=true  
        INNER JOIN users ON users.id=patientDoctors.doctorID
        INNER JOIN departments ON departments.id=users.departmentID
        WHERE patients.hospitalID = ? 
          AND patients.ptype = ? 
          AND patients.isViewed = 0
          AND patientTimeLine.patientEndStatus IS NULL  
          AND patientDoctors.doctorID=${userID}
        ORDER BY patientTimeLine.startTime DESC 
        LIMIT 10
      `
      : ROLES_LIST.doctor == role && zone
        ? `
        SELECT patients.id, patients.hospitalID, patients.deviceID, patients.pID, patients.pUHID, patients.ptype, patients.category, patients.pName, 
        patients.dob, patients.gender, patients.weight, patients.height, 
        patients.phoneNumber, patients.email, patients.address, patients.city, patients.state, patients.pinCode, patients.referredBy, patients.lastModified,
        patients.photo, patientTimeLine.startTime 
        FROM patients
        INNER JOIN patientTimeLine ON patients.id = patientTimeLine.patientID
        INNER JOIN patientDoctors ON patientDoctors.patientTimeLineID = patientTimeLine.id
        WHERE patients.hospitalID = ? 
          AND patients.ptype = ? 
          AND patients.isViewed = 0
          AND patientTimeLine.patientEndStatus IS NULL  
          AND patients.zone = ${zone}
          AND patientDoctors.doctorID=${userID}
        ORDER BY patientTimeLine.startTime DESC 
        LIMIT 10
      `
        : `SELECT patients.id, patients.hospitalID, patients.deviceID, patients.pID, patients.pUHID, patients.ptype, patients.category, patients.pName, 
      patients.dob, patients.gender, patients.weight, patients.height, 
      patients.phoneNumber, patients.email, patients.address, patients.city, patients.state, patients.pinCode, patients.referredBy,  patients.lastModified,
      patients.photo, patientTimeLine.startTime 
      FROM patients
      INNER JOIN patientTimeLine ON patients.id = patientTimeLine.patientID
      WHERE patients.hospitalID = ? 
      AND patients.ptype = ? 
      AND patients.isViewed = 0
      AND patientTimeLine.patientEndStatus IS NULL  
      AND patients.zone = ${zone}
      ORDER BY patientTimeLine.startTime DESC 
      LIMIT 10`;

  return query;
};

// const queryGetRecentPatientsByType = "SELECT * FROM patients WHERE hospitalID=? AND ptype=? ORDER BY lastModified DESC LIMIT 10"
const queryCountPatientsByType =
  "SELECT COUNT(*) FROM patients WHERE hospitalID=? AND ptype=?";
const queryCountAllPatients =
  "SELECT COUNT(*) FROM patients WHERE hospitalID=?";

const queryPatientVisitByDate = `SELECT COUNT(*) AS patientCount
FROM patients
INNER JOIN patientTimeLine ON patients.id = patientTimeLine.patientID
 INNER JOIN patientDoctors 
    ON patientTimeLine.id = patientDoctors.patientTimeLineID
WHERE patients.hospitalID = ?
  AND patientDoctors.doctorID = ? 
  AND patients.addedOn >= ?
  AND patients.addedOn < ?
  AND patientTimeLine.patientStartStatus=${patientUtils.patientStatus.inpatient}
  `;

const queryCountPatientVisitMonthAndYear = `
  SELECT
    COUNT(DISTINCT patientTimeLine.id) AS patient_count_year,
    COUNT(DISTINCT CASE WHEN MONTH(startTime) = MONTH(CURDATE()) THEN patientTimeLine.id END) AS patient_count_month
  FROM patientTimeLine
  INNER JOIN patientDoctors ON patientTimeLine.id = patientDoctors.patientTimeLineID
  WHERE 
    YEAR(startTime) = YEAR(CURDATE()) 
    AND patientTimeLine.hospitalID = ? 
    AND patientTimeLine.patientStartStatus = ? 
    AND patientDoctors.doctorID = ?;
`;

const queryGetLatestTimeLine =
  "SELECT * FROM patientTimeLine WHERE patientID=? ORDER BY startTime DESC LIMIT 1";
// const queryGetCountBetweenDates = "SELECT COUNT(*) AS count FROM patients WHERE hospitalID=? AND ptype=? AND addedOn BETWEEN ? AND ?";
// const queryGetCountBetweenDates =
//   `SELECT COUNT(*) AS count FROM patients WHERE hospitalID=? AND addedOn BETWEEN ? AND ? AND patientTimeLine.patientStartStatus=${patientUtils.patientStatus.inpatient}`;
const queryGetCountBetweenDates = `SELECT COUNT(*) AS count
FROM patients
LEFT JOIN patientTimeLine ON patients.id = patientTimeLine.patientID
WHERE patients.hospitalID = ?
  AND patients.addedOn BETWEEN ? AND ?
  AND patientTimeLine.patientStartStatus = ${patientUtils.patientStatus.inpatient}`;

const queryGetOTCountBetweenDates = `SELECT COUNT(DISTINCT ot.patientTimeLineID) AS patient_count
FROM operationTheatre ot
LEFT JOIN schedule s ON ot.patientTimeLineID = s.patientTimeLineId
WHERE 
    ot.hospitalID = ?
    AND ot.addedOn BETWEEN ? AND ?
    AND ot.patientType = ?
    AND (
        ot.status IN ('pending', 'approved')
        OR (
            ot.status = 'scheduled'
            AND s.endTime > NOW()
        )
    );

`;

const queryUpdatePatient = "UPDATE patients SET ptype=? WHERE id=?";
const queryUpdatePatientIsViewed =
  "UPDATE patients SET ptype=?,isViewed=0 WHERE id=?";
const queryUpdatePatientTimeLine =
  "UPDATE patientTimeLine " +
  "SET patientEndStatus=?,dischargeType=?,diet=?,advice=?,followUp=?,followUpDate=?,icd=?,prescription=?,diagnosis=? " +
  "WHERE id=?";

const queryUpdatePatientTimeLineForTransfer =
  "UPDATE patientTimeLine SET patientEndStatus=?,dischargeType=? WHERE id=?";

const queryGetPatientByID =
  "SELECT * FROM patients WHERE hospitalID=? AND id=?";
const queryGetDepartmentsPercentage = `SELECT departments.name,patients.id FROM patients
    LEFT JOIN patientTimeLine on patients.id=patientTimeLine.patientID
    LEFT JOIN departments ON patientTimeLine.departmentID=departments.id
    WHERE patients.hospitalID=? AND patientTimeLine.patientEndStatus IS null`;

// get patient for discharge and transfer
const queryGetPatientForDischarge = `SELECT patients.id AS patientID,patients.ptype,patientTimeLine.id AS patientTimeLineID, patients.pName, patients.phoneNumber, 
    patientTimeLine.patientStartStatus,patientTimeLine.patientEndStatus,patientTimeLine.wardID AS wardID
    FROM patients 
    LEFT JOIN patientTimeLine
    ON patients.id=patientTimeLine.patientID
    WHERE patients.hospitalID=? AND patientID=? AND patientTimeLine.patientEndStatus is NULL`;

const queryUpdatePatientRevisit = `UPDATE patients 
    SET ptype=? ,isViewed=0
    WHERE hospitalID=? AND id=?`;

const queryCheckDevicePresent = `SELECT patients.deviceID as id,devices.deviceName,devices.deviceCustomName 
    FROM patients 
    LEFT JOIN devices ON patients.deviceID=devices.id
    WHERE patients.hospitalID=? AND patients.id=?`;

const queryGetDevice = `SELECT * FROM devices WHERE id=?`;
const queryGetFullPatientByID = `SELECT patients.id, patients.hospitalID, patients.deviceID, patients.pID,
    patients.pUHID, patients.ptype, patients.category, patients.pName, patients.dob, patients.gender, patients.zone,
    patients.weight, patients.height, patients.phoneNumber, patients.email, patients.address, patients.insurance, patients.insuranceNumber,
    patients.insuranceCompany, patients.city, patients.state, patients.pinCode, patients.referredBy, patients.photo, patientTimeLine.startTime, patientTimeLine.endTime,
    patientTimeLine.id AS patientTimeLineID, patientTimeLine.dischargeType, patientTimeLine.diet, patientTimeLine.wardID,
    patientTimeLine.advice, patientTimeLine.followUp, patientTimeLine.icd, followUp.status AS followUpStatus, followUp.date AS followUpDate, followUp.addedOn AS followUpAddedOn,
    departments.name AS department,users.firstName,users.lastName,operationTheatre.status, patients.addedBy
    FROM patients
    LEFT JOIN patientTimeLine ON patients.id = patientTimeLine.patientID 
    LEFT JOIN departments ON patientTimeLine.departmentID = departments.id 
    LEFT JOIN followUp ON followUp.timelineID = patientTimeLine.id
    LEFT JOIN patientDoctors on patientTimeLine.id = patientDoctors.patientTimeLineID
    LEFT JOIN users on patientDoctors.doctorID = users.id
    LEFT JOIN operationTheatre ON patientTimeLine.id = operationTheatre.patientTimeLineID
    WHERE patients.hospitalID = ? AND patients.id = ?
    ORDER BY patientTimeLine.id DESC LIMIT 1`;

    const queryGetFullPatientByIDWithoutHospital = `SELECT patients.id, patients.hospitalID, patients.deviceID, patients.pID,
    patients.pUHID, patients.ptype, patients.category, patients.pName, patients.dob, patients.gender, patients.zone,
    patients.weight, patients.height, patients.phoneNumber, patients.email, patients.address, patients.insurance, patients.insuranceNumber,
    patients.insuranceCompany, patients.city, patients.state, patients.pinCode, patients.referredBy, patients.photo, patientTimeLine.startTime, patientTimeLine.endTime,
    patientTimeLine.id AS patientTimeLineID, patientTimeLine.dischargeType, patientTimeLine.diet, patientTimeLine.wardID,
    patientTimeLine.advice, patientTimeLine.followUp, patientTimeLine.icd, followUp.status AS followUpStatus, followUp.date AS followUpDate, followUp.addedOn AS followUpAddedOn,
    departments.name AS department,users.firstName,users.lastName,operationTheatre.status, patients.addedBy
    FROM patients
    LEFT JOIN patientTimeLine ON patients.id = patientTimeLine.patientID 
    LEFT JOIN departments ON patientTimeLine.departmentID = departments.id 
    LEFT JOIN followUp ON followUp.timelineID = patientTimeLine.id
    LEFT JOIN patientDoctors on patientTimeLine.id = patientDoctors.patientTimeLineID
    LEFT JOIN users on patientDoctors.doctorID = users.id
    LEFT JOIN operationTheatre ON patientTimeLine.id = operationTheatre.patientTimeLineID
    WHERE  patients.id = ?
    ORDER BY patientTimeLine.id DESC LIMIT 1`;  
const queryGetFullPatientByIDForTriage = `SELECT patients.id,patients.hospitalID,patients.deviceID,patients.pID,
    patients.pUHID,patients.ptype,patients.category,patients.pName,patients.dob,patients.gender,patients.zone,
    patients.weight,patients.height,patients.phoneNumber,patients.email,patients.address,patients.insurance,patients.insuranceNumber,
    patients.insuranceCompany,patients.city,patients.state,patients.pinCode,patients.referredBy,patients.photo,users.firstName,users.lastName,patients.addedOn
    FROM patients 
    LEFT JOIN patientTimeLine on patients.id = patientTimeLine.patientID
    LEFT JOIN patientDoctors on patientTimeLine.id = patientDoctors.patientTimeLineID
    LEFT JOIN users on patientDoctors.doctorID = users.id
    WHERE patients.hospitalID=? AND patients.id=? AND patients.zone is null`;

const queryGetSummary = `SELECT patients.id,
    patientTimeLine.patientStartStatus,
    patientTimeLine.patientEndStatus,
    patientTimeLine.dischargeType,
    patientTimeLine.startTime
    FROM patients 
    LEFT JOIN patientTimeLine on patients.id=patientTimeLine.patientID 
    WHERE patients.hospitalID=? AND patientTimeLine.startTime>?`;

const queryGetPercentageUseOfDevices = `
    SELECT patients.id,patients.deviceID,patientTimeLine.id,
    patientTimeLine.patientStartStatus FROM patients 
    INNER JOIN patientTimeLine ON patients.id=patientTimeLine.patientID 
    WHERE patients.hospitalID=? AND patients.deviceID IS NOT NULL AND patientTimeLine.patientEndStatus IS NULL`;

// const queryGetCalendarCards = `
//   SELECT patients.id,patientTimeLine.patientEndStatus,patientTimeLine.startTime,patientTimeLine.endTime
//   FROM patients
//   LEFT JOIN patientTimeLine ON patientTimeLine.patientID=patients.id
//   WHERE patientTimeLine.patientStartStatus=${patientUtils.patientStatus.inpatient} AND patientTimeLine.startTime = (select MAX(startTime) FROM patientTimeLine WHERE patientID=patients.id)
//   AND patients.hospitalID=?`;

const queryGetCalendarCards = `
  SELECT patients.id, patientTimeLine.patientEndStatus, patientTimeLine.startTime, patientTimeLine.endTime
  FROM patients
  LEFT JOIN patientTimeLine ON patients.id = patientTimeLine.patientID
  INNER JOIN patientDoctors ON patientDoctors.patientTimeLineID = patientTimeLine.id
  WHERE patients.hospitalID = ?
  AND patientDoctors.doctorID = ?
  AND patientTimeLine.patientStartStatus IN (${patientUtils.patientStatus.inpatient}, ${patientUtils.patientStatus.emergency});
`;

const querySetFilterOption = (filter) => `SET @filterOption = '${filter}'`;
const queryPatientCountWithFilter = (filterValue, filter) => {
  let year = new Date().getFullYear();
  let month = new Date().getMonth() + 1;
  if (filter == "year") {
    year = filterValue || new Date().getFullYear();
  }
  if (filter == "month") {
    month = filterValue || new Date().getMonth() + 1;
  }
  return `SELECT
CASE
  WHEN @filterOption = 'year' THEN MONTH(startTime)
  WHEN @filterOption = 'month' THEN DAY(startTime) 
  WHEN @filterOption = 'week' THEN DAYOFWEEK(startTime)
  ELSE NULL
END AS filter_value, COUNT(DISTINCT patientID) AS count
FROM patientTimeLine
WHERE
hospitalID=? AND patientStartStatus=? AND 
CASE
  WHEN @filterOption = 'year' THEN YEAR(startTime) = ${year}
  WHEN @filterOption = 'month' THEN YEAR(startTime) = YEAR(CURDATE()) AND MONTH(startTime) = ${month}
  WHEN @filterOption = 'week' THEN YEAR(startTime) = YEAR(CURDATE()) AND WEEK(startTime) = WEEK(CURDATE()) AND MONTH(startTime) = MONTH(CURDATE())
  ELSE FALSE
END
GROUP BY filter_value;`;
};

const queryPatientCountWithFilterForEmergency = (filterValue, filter, zone) => {
  let year = new Date().getFullYear();
  let month = new Date().getMonth() + 1;
  if (filter == "year") {
    year = filterValue || new Date().getFullYear();
  }
  if (filter == "month") {
    month = filterValue || new Date().getMonth() + 1;
  }
  return `SELECT
  CASE
  WHEN @filterOption = 'year' THEN MONTH(startTime)
  WHEN @filterOption = 'month' THEN DAY(startTime) 
  WHEN @filterOption = 'week' THEN DAYOFWEEK(startTime)
  ELSE NULL
END AS filter_value,
COUNT(DISTINCT patientID) AS count
FROM patientTimeLine
WHERE
hospitalID = ? AND
patientStartStatus = ? AND
zone IN (${zone}) AND
CASE
  WHEN @filterOption = 'year' THEN YEAR(startTime) = ${year}
  WHEN @filterOption = 'month' THEN YEAR(startTime) = YEAR(CURDATE()) AND MONTH(startTime) = ${month}
  WHEN @filterOption = 'week' THEN YEAR(startTime) = YEAR(CURDATE()) AND WEEK(startTime) = WEEK(CURDATE()) AND MONTH(startTime) = MONTH(CURDATE())
  ELSE FALSE
END
GROUP BY filter_value`;
};

// queryallPatientCountByHospital
const queryallPatientCountByHospital = (filter) => {
  let year = new Date().getFullYear();
  let month = new Date().getMonth() + 1;

  if (filter === "year") {
    year = new Date().getFullYear();
  }
  if (filter === "month") {
    month = new Date().getMonth() + 1;
  }

  return `SELECT
  CASE
    WHEN @filterOption = 'year' THEN MONTH(startTime)
    WHEN @filterOption = 'month' THEN DAY(startTime) 
    WHEN @filterOption = 'week' THEN DAYOFWEEK(startTime)
    ELSE NULL
  END AS filter_value, 
  COUNT(DISTINCT patientID) AS count
  FROM patientTimeLine
  WHERE
  hospitalID = ? AND
  CASE
    WHEN @filterOption = 'year' THEN YEAR(startTime) = ${year}
    WHEN @filterOption = 'month' THEN YEAR(startTime) = YEAR(CURDATE()) AND MONTH(startTime) = ${month}
    WHEN @filterOption = 'week' THEN YEAR(startTime) = YEAR(CURDATE()) AND WEEK(startTime) = WEEK(CURDATE()) AND MONTH(startTime) = MONTH(CURDATE())
    ELSE FALSE
  END
  GROUP BY filter_value;`;
};

const queryDepartmentDistribution = `
SELECT
  COUNT(*) AS count,
  departments.name
FROM
  patientTimeLine pt
INNER JOIN
  departments ON pt.departmentID = departments.id
WHERE
  pt.hospitalID = ? 
  AND pt.patientStartStatus = ?
  AND (
    (@filterOption = 'year' AND YEAR(pt.startTime) = YEAR(CURDATE()))
    OR
    (@filterOption = 'month' AND YEAR(pt.startTime) = YEAR(CURDATE()) AND MONTH(pt.startTime) = MONTH(CURDATE()))
    OR
    (@filterOption = 'week' AND YEAR(pt.startTime) = YEAR(CURDATE()) AND WEEK(pt.startTime) = WEEK(CURDATE()) AND MONTH(pt.startTime) = MONTH(CURDATE()))
   OR
    (@filterOption = 'day' AND DATE(pt.startTime) = CURDATE())
    )
GROUP BY
  pt.departmentID, departments.name`;

const queryDecreaseWardBed = `UPDATE wards
SET availableBeds = GREATEST(availableBeds - 1, 0)
WHERE id = ?`;

const queryIncreaseWardBed = `UPDATE wards
SET availableBeds = GREATEST(availableBeds + 1, totalBeds)
WHERE id = ?`;

const queryInsertFollowUp = `INSERT INTO followUp (timelineID,date) VALUES (?,?) `;

// const queryDoctorData =
//   `SELECT count(*), pt.userID, users.firstName, users.lastName FROM patientTimeLine pt INNER JOIN users ON pt.userID=users.id` +
//   `WHERE hospitalID=? ${filtere}`;
const AWS_BUCKET_NAME = process.env.AWS_BUCKET_NAME;
const AWS_BUCKET_REGION = process.env.AWS_BUCKET_REGION;
const AWS_ACCESS_KEY = process.env.AWS_ACCESS_KEY;
const AWS_SECRET_KEY = process.env.AWS_SECRET_KEY;

const s3Client = new S3Client({
  region: AWS_BUCKET_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY,
    secretAccessKey: AWS_SECRET_KEY,
  },
});

const generateFileName = (bytes = 16) =>
  crypto.randomBytes(bytes).toString("hex");

function dateFormat(date) {
  return format(date, "yyyy-MM-dd");
}

// ==========for nvcore add patient and user in nvcore db===========

// Function to map gender values
function mapGender(gender) {
  const genderMap = {
    1: "Male",
    2: "Female",
    3: "Others",
  };
  return genderMap[gender] || "Unknown"; // Default to "Unknown" if invalid
}

function calculateAge(dob) {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }
  return age;
}

/**
 * ** METHOD : POST
 * ** DESCRIPTION : Create new patient with unique patientID in hospital and also patient timeline
 */
const addPatient = async (req, res) => {
  let connection;
  try {
    const hospitalID = req.params.hospitalID;
    const wardID = req.body.wardID;
    const userID = req.body.userID;

    // get docEmail
    const [doctorData] =  await pool.query(findUserByID,[userID])
    const doctorEmail = doctorData[0].email || ""

    // Validate patient information
    const patientData = {
      hospitalID,
      pID: req.body.pID,
      pUHID: req.body.pUHID.replace(/-/g, ''),
      ptype: req.body.ptype,
      category: req.body.category,
      dob: req.body.dob,
      gender: req.body.gender,
      age: req.body.age,
      weight: req.body.weight,
      height: req.body.height,
      pName: req.body.pName,
      phoneNumber: req.body.phoneNumber,
      email: req.body.email,
      address: req.body.address,
      city: req.body.city,
      state: req.body.state,
      pinCode: req.body.pinCode,
      referredBy: req.body.referredBy,
      insurance: parseInt(req.body.insurance, 10) || 0,
      insuranceNumber: req.body.insuranceNumber,
      insuranceCompany: req.body.insuranceCompany,
      addedBy: parseInt(req.body.addedBy, 10),
    };
    // console.log("patients data", patientData);
    const patientValidationResult = await patientSchema.validateAsync(
      patientData
    );
    // if (patientData.ptype == patientUtils.patientStatus.emergency) {
    //   if (!req.body.zone) return missingBody(res, "Zone missing");
    //   if (!Object.values(patientUtils.zoneType).includes(Number(req.body.zone)))
    //     return notAllowed(res, "Invalid zone");
    //   patientData.zone = req.body.zone;
    // }

    // console.log("validated data", patientValidationResult);

    // before add patient need to check mobileNumber and name
    const queryIsPatientDataDuplicate =
      "SELECT * FROM patients where pName=? AND phoneNumber=?";
    const patientName = patientData.pName;
    const patientMobileNum = patientData.phoneNumber;
    const [patientsResult] = await pool.query(queryIsPatientDataDuplicate, [
      patientName,
      patientMobileNum,
    ]);
    const isDuplicateData = patientsResult[0];
    if (isDuplicateData) {
      return missingBody(res, "MobileNumber And Patient Already Exist");
    }

    const file = req.file;
    let photo = null;
    if (file) {
      if (file.mimetype !== "image/png" && file.mimetype !== "image/jpeg") {
        return notAllowed(res, "only images allowed");
      }
      photo = generateFileName();
      const uploadParams = {
        Bucket: AWS_BUCKET_NAME,
        Body: file.buffer,
        Key: photo,
        ContentType: file.mimetype,
      };
      await s3Client.send(new PutObjectCommand(uploadParams));
    }
    //
    patientData.photo = photo;

    // Validate patient timeline information
    // TODO CHECK patientStartStatus
    // TODO userID is always a doctor
    if (
      !wardID &&
      patientData.ptype != patientUtils.patientStatus.outpatient &&
      Number(patientData.ptype) != patientUtils.patientStatus.emergency
    ) {
      return missingBody(res, "WardID is missing");
    }

    const patientTimelineData = {
      hospitalID,
      departmentID: req.body.departmentID,
      patientStartStatus: patientData.ptype,
      wardID,
    };

    if (patientData.ptype != patientUtils.patientStatus.emergency)
      await patientTimeLineSchema.validateAsync(patientTimelineData);

    // Check if patient with the same pID exists in the hospital
    const results = await pool.query(queryFindPatientByPID, [
      hospitalID,
      patientData.pID,
    ]);
    if (results[0].length !== 0) {
      return duplicateRecord(res, "Patient Record Exists");
    }
    // console.log("testing here");
    connection = await pool.getConnection();
    await connection.beginTransaction();
    // console.log("lets insert.....", Object.values(patientData));
    if (wardID) {
      const decreaseWardBeds = await connection.query(queryDecreaseWardBed, [
        wardID,
      ]);

      // console.log("decreased-------------------", decreaseWardBeds);
      if (!decreaseWardBeds[0].changedRows) {
        return notAllowed(res, "Ward reached it's maximum occupancy");
      }
    }

    const response = await connection.query(
      queryInsertPatient2,
      Object.values(patientData)
    );

    // console.log("could it insert");
    await connection.query(querySetID);
    const result = await connection.query(
      queryInsertPatientTimeLine,
      Object.values(patientTimelineData)
    );
    const patientTimeLineId = result[0].insertId;
    const result2 = await addDoctor(
      connection,
      patientTimeLineId,
      userID,
      "primary",
      hospitalID
    );
    if (result2.status != 201) {
      connection.rollback();
      return res.status(result2.status).json({
        message: result2.message,
      });
    }
    await connection.commit();

    // get photo
    let imageURL;
    if (photo) {
      imageURL = await getSignedUrl(
        s3Client,
        new GetObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: photo,
        }),
        { expiresIn: 300 }
      );
      patientData.imageURL = imageURL || null;
    }
    patientData.id = response[0].insertId;
    const [pat] = await pool.query(queryGetFullPatientByID, [
      hospitalID,
      patientData.id,
    ]);
    let sendImageURL;
    if (pat?.[0]?.photo) {
      sendImageURL = await getSignedUrl(
        s3Client,
        new GetObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: pat?.[0]?.photo,
        }),
        { expiresIn: 300 }
      );
      if (pat[0]) pat[0].imageURL = sendImageURL;
    }

    res.status(201).send({
      message: "success",
      patient: pat?.[0],
    });

  } catch (err) {
    if (err.isJoi) {
      return missingBody(res, err.message);
    }
    if (connection) {
      connection.rollback();
    }
    serverError(res, err.message);
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

/**
 * METHOD : PUT
 * ** DESCRIPTION : ADD PATIENT MOBILE
 */
const addPatientMobile = async (req, res) => {
  let connection;
  try {
    const hospitalID = req.params.hospitalID;
    // Validate patient information
    const patientData = {
      hospitalID,
      pID: req.body.pID,
      pUHID: req.body.pUHID,
      ptype: req.body.ptype,
      category: req.body.category,
      dob: req.body.dob,
      gender: req.body.gender,
      weight: req.body.weight,
      height: req.body.height,
      pName: req.body.pName,
      phoneNumber: req.body.phoneNumber,
      email: req.body.email,
      address: req.body.address,
      city: req.body.city,
      state: req.body.state,
      pinCode: req.body.pinCode,
      referredBy: req.body.referredBy,
    };
    // patient validation
    const patientValidationResult = await patientSchema.validateAsync(
      patientData
    );
    // no photo
    patientData.photo = null;
    // TODO CHECK patientStartStatus
    // TODO userID is always a doctor
    const patientTimelineData = {
      userID: req.body.userID,
      departmentID: req.body.departmentID,
      patientStartStatus: patientData.ptype,
    };
    // patient timeLine validation
    await patientTimeLineSchema.validateAsync(patientTimelineData);
    // Check if patient with the same pID exists in the hospital
    const results = await pool.query(queryFindPatientByPID, [
      hospitalID,
      patientData.pID,
    ]);
    if (results[0].length !== 0) {
      return duplicateRecord(res, "Patient Record Exists");
    }
    connection = await pool.getConnection();
    await connection.beginTransaction();
    const response = await connection.query(
      queryInsertPatient,
      Object.values(patientData)
    );
    await connection.query(querySetID);
    await connection.query(
      queryInsertPatientTimeLine,
      Object.values(patientTimelineData)
    );
    await connection.commit();
    patientData.id = response[0].insertId;
    res.status(201).send({
      message: "success",
      patient: patientData,
    });
  } catch (err) {
    if (err.isJoi === true) {
      return missingBody(res, err.message);
    }
    if (connection) {
      connection.rollback();
    }
    serverError(res, err.message);
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

//getAllPatientsByTypeForReception

/**
 * ** METHOD : GET
 * ** DESCRIPTION : get list of patients with type= inpatient,outpatient or emergency,discharged for reception
 * 
 * const patientStatus = {
  outpatient: 1,
  inpatient: 2,
  emergency: 3,
  operationTheatre: 4,
  discharged: 21,
};
 */

const getAllPatientsByTypeForReception = async (req, res) => {
  const hospitalID = req.params.hospitalID;
  const ptype = req.params.ptype;
  const date = req.query.date;
  const parsedDate = dayjs(date);

  // Extract year and month
  const year = parsedDate.year();
  const month = parsedDate.month() + 1;

  const startStatus =
    req.query.patientStartStatus || patientUtils.patientStatus.inpatient;
  try {
    let results;
    if (ptype == patientUtils.patientStatus.discharged) {
      test = await pool.query(queryGetDischargedPatientsForReception, [
        hospitalID,
        startStatus,
        year,
        month,
      ]);
      results = test[0];
    } else {
      let testRes;
      if (ptype != patientUtils.patientStatus.emergency) {
        testRes = await pool.query(geListOfPatientsForReceptoin, [
          hospitalID,
          ptype,
          year,
          month,
        ]);
      } else if (ptype != patientUtils.patientStatus.outpatient) {
        testRes = await pool.query(geListOfPatientsForReceptoin, [
          hospitalID,
          ptype,
          year,
          month,
        ]);
      } else if (ptype != patientUtils.patientStatus.inpatient) {
        testRes = await pool.query(geListOfPatientsForReceptoin, [
          hospitalID,
          ptype,
          year,
          month,
        ]);
      }

      results = await Promise.all(
        testRes[0].map(async (patient) => {
          const date = new Date().toISOString().split("T")[0];
          const ret = await pool.query(queryGetNotificationCount, [
            patient.patientTimeLineID,
            date,
          ]);
          // console.log(`count : ${JSON.stringify(ret[0])}`);
          patient.notificationCount = ret[0][0].count;
          return patient;
        })
      );
    }

    const patients = results;
    const patientsWithPhotos = await Promise.all(
      patients.map(async (patient) => {
        if (patient.photo) {
          const imageURL = await getSignedUrl(
            s3Client,
            new GetObjectCommand({
              Bucket: process.env.AWS_BUCKET_NAME,
              Key: patient.photo,
            }),
            { expiresIn: 300 }
          );
          patient.photo = imageURL;
        }
        patient.doctorName = patient.firstName + " " + patient.lastName;
        return patient;
      })
    );

    res.status(200).send({
      message: "success",
      // testRes:testRes[0],
      patients: patientsWithPhotos,
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

/**
 * ** METHOD : GET
 * ** DESCRIPTION : get list of patients with type= inpatient,outpatient or emergency,discharged
 */
const getAllPatientsByType = async (req, res) => {
  const hospitalID = req.params.hospitalID;
  const ptype = req.params.ptype;
  const role = req.query.role || ROLES_LIST.nurse;
  const zone = req.query.zone || 0;
  const userID = req.userID;
  console.log("ptypelk", ptype, role);
  const startStatus =
    req.query.patientStartStatus || patientUtils.patientStatus.inpatient;
  try {
    let results;
    if (ptype == patientUtils.patientStatus.discharged) {
      test = await pool.query(queryGetDischargedPatients(role), [
        ptype,
        hospitalID,
        // startStatus,
        userID,
      ]);
      results = test[0];
    } else {
      let testRes;
      if (ptype != patientUtils.patientStatus.emergency) {
        testRes = await pool.query(queryGetPatientsByType(role), [
          hospitalID,
          ptype, ////Make it an array
          userID,
        ]);
        console.log("Patients By Type Data:", testRes[0]);
      } else if (
        ptype
          .split("$")
          .map((el) => Number(el))
          .includes(patientUtils.patientStatus.outpatient)
      ) {
        testRes = await pool.query(queryGetDischargedAndOutpatients(role), [
          hospitalID,
          ptype.split("$").map((el) => Number(el)),
          userID,
        ]);
        results = test[0];
      } else if (ptype == patientUtils.patientStatus.emergency) {
        if (!zone) return notAllowed(res, "Zone missing");
        testRes = await pool.query(queryGetPatientsByTypeAndZone(role), [
          hospitalID,
          ptype, ////Make it an array
          zone,
          userID,
        ]);
      }
      results = await Promise.all(
        testRes[0].map(async (patient) => {
          const date = new Date().toISOString().split("T")[0];
          const ret = await pool.query(queryGetNotificationCount, [
            patient.patientTimeLineID,
            date,
          ]);
          // console.log(`count : ${JSON.stringify(ret[0])}`);
          patient.notificationCount = ret[0][0].count;
          return patient;
        })
      );
    }
    const patients = results;
    const patientsWithPhotos = await Promise.all(
      patients.map(async (patient) => {
        if (patient.photo) {
          const imageURL = await getSignedUrl(
            s3Client,
            new GetObjectCommand({
              Bucket: process.env.AWS_BUCKET_NAME,
              Key: patient.photo,
            }),
            { expiresIn: 300 }
          );
          patient.imageURL = imageURL;
        }
        patient.doctorName = patient.firstName + " " + patient.lastName;
        return patient;
      })
    );

    res.status(200).send({
      message: "success",
      // testRes:testRes[0],
      patients: patientsWithPhotos,
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

const getAllPatientsByTypeWithFilter = async (req, res) => {
  const hospitalID = req.params.hospitalID;
  const ptype = req.params.ptype;
  const departmentID = req.body.departmentID || null;
  const wardID = req.body.wardID || null;
  const zone = req.body.zone;
  // console.log(`ptype : ${ptype}`)
  try {
    let results;
    if (ptype == patientUtils.patientStatus.discharged) {
      console.log("discharged patients");
      test = await pool.query(queryGetDischargedPatientsWithFilter, [
        hospitalID,
        ptype,
        wardID,
        wardID,
      ]);
      results = test[0];
    } else {
      // console.log("other patients");
      let testRes;
      if (!ptype == patientUtils.patientStatus.emergency)
        testRes = await pool.query(queryGetPatientByTypeWithFilter, [
          hospitalID,
          ptype,
          wardID,
          wardID,
        ]);
      else
        testRes = await pool.query(queryGetPatientByTypeAndZoneWithFilter, [
          hospitalID,
          ptype,
          zone,
        ]);
      results = await Promise.all(
        testRes[0].map(async (patient) => {
          const date = new Date().toISOString().split("T")[0];
          const ret = await pool.query(queryGetNotificationCount, [
            patient.patientTimeLineID,
            date,
          ]);
          // console.log(`count : ${JSON.stringify(ret[0])}`);
          patient.notificationCount = ret[0][0].count;
          return patient;
        })
      );
    }

    const patients = results;
    const patientsWithPhotos = await Promise.all(
      patients.map(async (patient) => {
        if (patient.photo) {
          const imageURL = await getSignedUrl(
            s3Client,
            new GetObjectCommand({
              Bucket: process.env.AWS_BUCKET_NAME,
              Key: patient.photo,
            }),
            { expiresIn: 300 }
          );
          patient.imageURL = imageURL;
        }
        patient.doctorName = patient.firstName + " " + patient.lastName;
        return patient;
      })
    );
    res.status(200).send({
      message: "success",
      patients: patientsWithPhotos,
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

const getpatientsForTriage = async (req, res) => {
  try {
    const hospitalID = req.params.hospitalID;
    const ptype = req.params.ptype;
    const userID = req.userID;
    console.log("userIDk", userID);
    const testRes = await pool.query(queryGetPatientsForTriage, [
      hospitalID,
      userID,
    ]);
    const patientsWithPhotos = await Promise.all(
      testRes[0].map(async (patient) => {
        if (patient.photo) {
          const imageURL = await getSignedUrl(
            s3Client,
            new GetObjectCommand({
              Bucket: process.env.AWS_BUCKET_NAME,
              Key: patient.photo,
            }),
            { expiresIn: 300 }
          );
          patient.imageURL = imageURL;
        }
        patient.doctorName = patient.firstName + " " + patient.lastName;
        return patient;
      })
    );
    res.status(200).send({
      message: "success",
      patients: patientsWithPhotos,
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

/**
 * ** METHOD : GET
 * ** DESCRIPTION : get list of 10 recently modified patients with type = inpatient, oupatient or emergency
 */
const getRecentPatientsByType = async (req, res) => {
  const hospitalID = req.params.hospitalID;
  const ptype = req.params.ptype;
  const role = req.query.role || ROLES_LIST.nurse;
  const userID = req.userID;
  const zone = req.query.zone;
  const category = req.query.category;
  let results;
  // console.log(queryGetRecentPatientsByType(role, zone));
  // ptye emercrbecyb and patinet line shouklf not actrive exist nhi krta
  // limit 10
  try {
    if (category == "triage") {
      const query = `SELECT patients.id, patients.hospitalID, patients.deviceID, patients.pID, patients.pUHID, patients.ptype, patients.category, patients.pName, 
      patients.dob, patients.gender, patients.weight, patients.height, 
      patients.phoneNumber, patients.email, patients.address, patients.city, patients.state, patients.pinCode, patients.referredBy, patients.lastModified, 
      patients.photo, users.firstName,users.lastName
     FROM 
    patients
INNER JOIN 
    patientTimeLine ON patients.id = patientTimeLine.patientID
    INNER JOIN 
    patientDoctors ON patientTimeLine.id = patientDoctors.patientTimeLineID
    INNER JOIN users ON users.id=patientDoctors.doctorID
      WHERE patients.hospitalID = ? 
      AND patients.ptype = 3
      AND patients.isViewed = 0
      AND patients.zone is null
       AND patientDoctors.doctorID = ? 
      order by id desc
      LIMIT 10`;

      results = await pool.query(query, [hospitalID, userID]);
    } else {
      results = await pool.query(
        queryGetRecentPatientsByType(role, zone, userID),
        [hospitalID, ptype]
      );
    }
    const patients = results[0];
    const patientsWithPhotos = await Promise.all(
      patients.map(async (patient) => {
        if (patient.photo) {
          const imageURL = await getSignedUrl(
            s3Client,
            new GetObjectCommand({
              Bucket: process.env.AWS_BUCKET_NAME,
              Key: patient.photo,
            }),
            { expiresIn: 300 }
          );
          patient.imageURL = imageURL;
        }
        patient.doctorName = patient.firstName + " " + patient.lastName;
        return patient;
      })
    );
    console.log("patientswithphotos===", patientsWithPhotos);
    res.status(200).send({
      message: "success",
      patients: patientsWithPhotos,
    });
  } catch (err) {
    serverError(res, err.message);
  }
};
const getOpdPreviousPatientsList = async (req, res) => {
  const hospitalID = req.params.hospitalID;
  const ptype = req.params.ptype;
  const role = req.query.role || ROLES_LIST.nurse;
  const userID = req.query.userID;
  const zone = req.query.zone;
  const category = req.query.category;
  let results;

  try {
    results = await pool.query(
      queryGetOpdPreviousPatientList(role, zone, userID),
      [hospitalID, ptype]
    );
    console.log(
      "queryGetOpdPreviousPatientList",
      queryGetOpdPreviousPatientList
    );
    const patients = results[0];
    const patientsWithPhotos = await Promise.all(
      patients.map(async (patient) => {
        if (patient.photo) {
          const imageURL = await getSignedUrl(
            s3Client,
            new GetObjectCommand({
              Bucket: process.env.AWS_BUCKET_NAME,
              Key: patient.photo,
            }),
            { expiresIn: 300 }
          );
          patient.imageURL = imageURL;
        }
        patient.doctorName = patient.firstName + " " + patient.lastName;
        return patient;
      })
    );
    res.status(200).send({
      message: "success",
      patients: patientsWithPhotos,
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

const getNotificationCount = async (req, res) => {
  try {
  } catch (err) {
    serverError(res, err.message);
  }
};
/**
 * ** METHOD : GET
 * ** DESCRIPTION : get count of patients based on type = inpatient,outpatient or emergency
 */
const getPatientCountByType = async (req, res) => {
  const hospitalID = req.params.hospitalID;
  const ptype = req.params.ptype;
  try {
    const results = await pool.query(queryCountPatientsByType, [
      hospitalID,
      ptype,
    ]);
    // console.log(`result : ${JSON.stringify(results)}`)
    res.status(200).send({
      message: "success",
      count: results[0][0]["COUNT(*)"],
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

const getCountOfPatientsByZone = async (req, res) => {
  const hospitalID = req.params.hospitalID;
  const filter = req.params.selectedZoneDataFilter || "Day";
  console.log("filtern", filter);
  try {
    const queryPatientCountForZone = `
    SELECT 
        pt.zone, 
        COUNT(*) AS patient_count
    FROM
        patientTimeLine AS pt
    WHERE
        pt.hospitalID = 178
        AND pt.patientStartStatus = 3
        AND pt.zone IS NOT NULL
         AND (
              ('${filter}' = 'Day' AND DATE(pt.startTime) = CURDATE())
              OR 
              ('${filter}' = 'Week' AND YEAR(pt.startTime) = YEAR(CURDATE()) AND WEEK(pt.startTime) = WEEK(CURDATE()))
              OR 
              ('${filter}' = 'Month' AND YEAR(pt.startTime) = YEAR(CURDATE()) AND MONTH(pt.startTime) = MONTH(CURDATE()))
          )
    GROUP BY 
        pt.zone;
`;

    const results = await pool.query(queryPatientCountForZone, [hospitalID]);
    // console.log(`result : ${JSON.stringify(results)}`)
    res.status(200).send({
      message: "success",
      count: results[0],
    });
  } catch (err) {
    serverError(res, err.message);
  }
};
/**
 * ** METHOD : GET
 * ** DESCRIPTION : get total patients in hospital
 */
const getTotalPatientCount = async (req, res) => {
  const hospitalID = req.params.hospitalID;
  try {
    const results = await pool.query(queryCountAllPatients, [hospitalID]);
    res.status(200).send({
      message: "success",
      count: results[0][0]["COUNT(*)"],
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

/**
 * ** METHOD : GET
 * ** DESCRIPTION : get patient visit count based on year and month
 * ** if year = -1 , current year patient visit is returned
 * ** if month = -1 current month patient visit is retured
 * ** both cannot be -1
 */
const getPatientCountByMonthYear = async (req, res) => {
  const hospitalID = req.params.hospitalID;
  // console.log(`hospitalID : ${hospitalID}`)
  const year = parseInt(req.params.year);
  const month = parseInt(req.params.month);
  const userID = req.userID;

  let startDate, endDate;

  if (year === -1) {
    // Get new patient visit count this month
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    startDate = new Date(currentYear, currentMonth, 1);
    endDate = new Date(currentYear, currentMonth + 1, 1);
  } else if (month === -1) {
    // Get new patient visit count this year
    startDate = new Date(year, 0, 1);
    endDate = new Date(year + 1, 0, 1);
  } else {
    startDate = new Date(year, month, 1);
    endDate = new Date(year, month + 1, 1);
  }

  try {
    const results = await pool.query(queryPatientVisitByDate, [
      hospitalID,
      userID,
      dateFormat(startDate),
      dateFormat(endDate),
    ]);
    const patientCount = results[0][0].patientCount;
    res.status(200).send({
      message: "success",
      count: patientCount,
      startDate: dateFormat(startDate),
      endDate: dateFormat(endDate),
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

const getPatientVisitCountByMonthYear = async (req, res) => {
  /////////Provide ptype in query////////////////////////
  const hospitalID = req.params.hospitalID;
  const ptype = req.query.ptype;
  const zone = req.query.zone;
  const userID = req.userID;

  try {
    let results;
    if (ptype != patientUtils.patientStatus.emergency) {
      results = await pool.query(queryCountPatientVisitMonthAndYear, [
        hospitalID,
        ptype,
        userID,
      ]);
    } else {
      if (!zone) return res.status(400).send({ message: "zone missing" });
      const queryCountPatientVisitMonthAndYearForEmergency = `
  SELECT
    COUNT(DISTINCT patientID) AS patient_count_year,
    COUNT(DISTINCT CASE WHEN MONTH(patientTimeLine.startTime) = MONTH(CURDATE()) THEN patientID END) AS patient_count_month
  FROM patientTimeLine
  INNER JOIN patientDoctors ON patientTimeLine.id = patientDoctors.patientTimeLineID
  WHERE 
    YEAR(patientTimeLine.startTime) = YEAR(CURDATE()) 
    AND patientTimeLine.hospitalID = ? 
    AND patientTimeLine.patientStartStatus = ? 
    AND patientDoctors.doctorID = ? 
    AND zone IN (${zone});
`;

      results = await pool.query(
        queryCountPatientVisitMonthAndYearForEmergency,
        [hospitalID, ptype, userID]
      );
    }

    res.status(200).send({
      message: "success",
      count: results[0],
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

/**
 *** METHOD : GET
 *** DESCRIPTION : get patient by id and join the latest timeline
 ***
 */
const getPatientByID = async (req, res) => {
  // console.log("get patient by id")
  const hospitalID = req.params.hospitalID;
  const id = req.params.id;
  const userID = req.userID; 
  try {
    // Get user info to check role
    const [userResult] = await pool.query(`SELECT * FROM users WHERE id = ?`, [userID]);
    const user = userResult[0];

    let query;
    let params;

    if (user.role === 8888) {
      // If role is customercare (8888), skip hospitalID filter
      query = queryGetFullPatientByIDWithoutHospital;
      params = [id];
    } else {
      query = queryGetFullPatientByID;
      params = [hospitalID, id];
    }

    const [results] = await pool.query(query, params);
    console.log("results",results)
    const foundPatient = user.role === 8888 ? results[0]: results[0];
    console.log("foundPatient",foundPatient)

    if (!foundPatient) return resourceNotFound(res, "patient not found");
    let imageURL;
    if (foundPatient.photo) {
      imageURL = await getSignedUrl(
        s3Client,
        new GetObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: foundPatient.photo,
        }),
        { expiresIn: 300 }
      );
    }
    foundPatient.imageURL = imageURL || null;
    foundPatient.doctorName =
      foundPatient.firstName + " " + foundPatient.lastName;
    let foundP;
    const arr =results;
    foundP = arr[arr.length - 1];
    res.status(200).send({
      message: "success",
      patient: foundP,
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

const getPatientByIDForCustomerCare = async (req, res) => {
  const id = req.params.id;
  const userID = req.userID;

  try {
    // Get user info to check role
    const [userResult] = await pool.query(`SELECT * FROM users WHERE id = ?`, [userID]);
    const user = userResult[0];

    // Restrict to customercare role (8888)
    if (user.role !== 8888) {
      return res.status(403).send({
        message: "error",
        error: "Access restricted to customer care role"
      });
    }

    // Query patient by ID without hospitalID filter
    const query = queryGetFullPatientByIDWithoutHospital;
    const [results] = await pool.query(query, [id]);
    console.log("results", results);

    // Check if patient exists
    if (!results || results.length === 0) {
      return resourceNotFound(res, "patient not found");
    }

    // Use the last result (consistent with original API)
    const foundPatient = results[results.length - 1];
    console.log("foundPatient", foundPatient);

    // Generate signed URL for photo if it exists
    let imageURL;
    if (foundPatient.photo) {
      imageURL = await getSignedUrl(
        s3Client,
        new GetObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: foundPatient.photo,
        }),
        { expiresIn: 300 }
      );
    }

    // Add imageURL and doctorName to patient
    foundPatient.imageURL = imageURL || null;
    foundPatient.doctorName = foundPatient.firstName + " " + foundPatient.lastName;

    res.status(200).send({
      message: "success",
      patient: foundPatient,
    });
  } catch (err) {
    console.error("Error in getPatientByIDForCustomerCare:", err.message);
    serverError(res, err.message);
  }
};

const getPatientByIDForTriage = async (req, res) => {
  // console.log("get patient by id")
  const hospitalID = req.params.hospitalID;
  const id = req.params.id;
  try {
    const results = await pool.query(queryGetFullPatientByIDForTriage, [
      hospitalID,
      id,
    ]);
    const foundPatient = results[0][0];
    if (!foundPatient) return resourceNotFound(res, "patient not found");
    let imageURL;
    if (foundPatient.photo) {
      imageURL = await getSignedUrl(
        s3Client,
        new GetObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: foundPatient.photo,
        }),
        { expiresIn: 300 }
      );
    }
    foundPatient.imageURL = imageURL || null;
    foundPatient.doctorName =
      foundPatient.firstName + " " + foundPatient.lastName;
    let foundP;
    const arr = results[0];
    foundP = arr[arr.length - 1];
    res.status(200).send({
      message: "success",
      patient: foundP,
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

/**
 *** METHOD : PATCH
 *** DESCRIPTION : get patient by id and update data
 ***
 */
const updatePatientByID = async (req, res) => {
  // console.log("get patient by id")
  const hospitalID = req.params.hospitalID;
  const id = req.params.id;
  let connection = null;
  // console.log("function called", hospitalID, id);
  // console.log("body data", req.body);
  try {
    const validateData = await updatePatientSchema.validateAsync(req.body);
    const [results] = await pool.query(queryGetPatientByID, [hospitalID, id]);
    // console.log(results);
    const foundPatient = results[0];
    // check if patient present
    if (!foundPatient) return resourceNotFound(res, "patient not found");
    // check if patient is not discharged
    if (foundPatient.ptype === patientUtils.patientStatus.discharged)
      return notAllowed(res, "cannot update discharged patient");

    const file = req.file;
    let photo = null;
    if (file) {
      if (file.mimetype !== "image/png" && file.mimetype !== "image/jpeg") {
        return notAllowed(res, "only images allowed");
      }
      photo = generateFileName();
      const uploadParams = {
        Bucket: AWS_BUCKET_NAME,
        Body: file.buffer,
        Key: photo,
        ContentType: file.mimetype,
      };
      await s3Client.send(new PutObjectCommand(uploadParams));
    }
    console.log("validated data", validateData);
    const updateData = {
      pUHID: validateData.pUHID || foundPatient.pUHID,
      category: validateData.category || foundPatient.category,
      dob: validateData.dob || foundPatient.dob,
      gender: validateData.gender || foundPatient.gender,
      age: validateData.age || foundPatient.age,
      weight: validateData.weight || foundPatient.weight,
      height: validateData.height || foundPatient.height,
      pName: validateData.pName || foundPatient.pName,
      phoneNumber: validateData.phoneNumber || foundPatient.phoneNumber,
      email: validateData.email || foundPatient.email,
      address: validateData.address || foundPatient.address,
      city: validateData.city || foundPatient.city,
      state: validateData.state || foundPatient.state,
      pinCode: validateData.pinCode || foundPatient.pinCode,
      referredBy: validateData.referredBy || foundPatient.referredBy,
      photo: photo || foundPatient.photo,
      insurance: validateData.insurance,
      insuranceNumber: validateData.insuranceNumber,
      insuranceCompany: validateData.insuranceCompany,
    };
    const { userID } = req.body;
    let foundTimeLine;
    if (userID) {
      await updateTimeLineSchema.validateAsync({ userID });
      foundTimeLine = await pool.query(queryGetLatestTimeLine, [id]);
      // console.log("timeline", foundTimeLine);
      if (!foundTimeLine)
        return resourceNotFound(res, "Failed to get patient timeline");
    }
    connection = await pool.getConnection();
    await connection.beginTransaction();
    // console.log("updated data", updateData);
    await connection.query(queryUpdatePatientByID, [
      updateData.pUHID,
      updateData.category,
      updateData.dob,
      updateData.gender,
      updateData.age,
      updateData.weight,
      updateData.height,
      updateData.pName,
      updateData.phoneNumber,
      updateData.email,
      updateData.address,
      updateData.city,
      updateData.state,
      updateData.pinCode,
      updateData.referredBy,
      updateData.insurance,
      updateData.insuranceNumber,
      updateData.insuranceCompany,
      updateData.photo,
      hospitalID,
      id,
    ]);
    // if (userID) {
    //   await connection.query(queryUpdatePatientTimeLineByID, [
    //     userID,
    //     foundTimeLine.id,
    //   ]);
    // }
    await connection.commit();

    let imageURL;
    if (updateData.photo) {
      imageURL = await getSignedUrl(
        s3Client,
        new GetObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: updateData.photo,
        }),
        { expiresIn: 300 }
      );
      updateData.imageURL = imageURL;
    }
    // if (userID) updateData.userID = userID || foundTimeLine.userID;
    res.status(200).send({
      message: "success",
      patient: updateData,
    });
  } catch (err) {
    serverError(res, err.message);
  }
};
const isViewedPatient = async (req, res) => {
  const hospitalID = req.params.hospitalID;
  const id = req.params.id;

  const queryUpdateIsViewed = `
    UPDATE patients
    SET isViewed = 1
    WHERE id = ? AND hospitalID = ?`;

  try {
    const [result] = await pool.query(queryUpdateIsViewed, [id, hospitalID]);

    if (result.affectedRows > 0) {
      res.status(200).json({
        message: "success",
        status: 0,
      });
    } else {
      res.status(404).json({
        message: "Patient not found or already viewed.",
        status: 1,
      });
    }
  } catch (err) {
    serverError(res, err.message);
  }
};

/**
 *** METHOD : GET
 *** DESCRIPTION : change patient status to discharged and end the latest timeline
 ***
 */
const dischargePatient = async (req, res) => {
  // console.log("discharge patient route")
  const hospitalID = req.params.hospitalID;
  const id = req.params.id;
  let connection = null;
  const dischargeData = {
    dischargeType: req.body.dischargeType,
    diet: req.body.diet,
    advice: req.body.advice,
    followUp: req.body.followUp,
    followUpDate: req.body.followUpDate,
    icd: req.body.icd,
    diagnosis: req.body.diagnosis,
    prescription: req.body.prescription,
  };
  // console.log(`discharge : ${JSON.stringify(dischargeData)}`);
  // const { dischargeType, diet, advice, followUp, followUpDate, icd } = req.body
  try {
    await dischargeSchema.validateAsync(dischargeData);
    const result = await pool.query(queryGetPatientForDischarge, [
      hospitalID,
      id,
    ]);
    const foundPatient = result[0][0];
    if (!foundPatient) return resourceNotFound(res, "No Patient present");
    if (foundPatient.ptype !== foundPatient.patientStartStatus)
      return serverError(
        res,
        `patient status and timeline status are different ${foundPatient.patientID}`
      );
    if (foundPatient.ptype === patientUtils.patientStatus.outpatient)
      return missingBody(res, "outpatients cannot be discharged");
    if (foundPatient.patientEndStatus === patientUtils.patientStatus.discharged)
      return missingBody(res, "patient already discharged");
    connection = await pool.getConnection();
    await connection.beginTransaction();
    await connection.query(queryIncreaseWardBed, [foundPatient.wardID]);
    if (dischargeData.followUpDate) {
      await connection.query(queryInsertFollowUp, [
        foundPatient.patientTimeLineID,
        dischargeData.followUpDate,
        patientUtils.followUpStatus.active,
      ]);
    }

    // console.log("decreased-------------------", decreaseWardBeds);
    // if (!decreaseWardBeds[0].changedRows) {
    //   return notAllowed(res, "Ward reached it's maximum occupancy");
    // }
    const removeRes = await removeAllDoctor(
      connection,
      foundPatient.patientTimeLineID,
      hospitalID
    );
    if (removeRes.status != 200) {
      return res.status(removeRes.status).send({
        message: removeRes.message,
      });
    }
    await connection.query(queryUpdatePatient, [
      patientUtils.patientStatus.discharged,
      foundPatient.patientID,
    ]);
    await connection.query(queryUpdatePatientTimeLine, [
      patientUtils.patientStatus.discharged,
      dischargeData.dischargeType,
      dischargeData.diet,
      dischargeData.advice,
      dischargeData.followUp,
      dischargeData.followUpDate,
      dischargeData.icd,
      dischargeData.prescription,
      dischargeData.diagnosis,
      foundPatient.patientTimeLineID,
    ]);
    


    await connection.commit();
    res.status(200).send({
      message: "success",
    });
  } catch (err) {
    if (connection) {
      connection.rollback();
    }
    serverError(res, err.message);
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

/**
 * ** METHOD : POST
 * ** DESCRIPTION : PUT PATIENT BACK IN INPATIENT
 */
const patientRevisit = async (req, res) => {
  const hospitalID = req.params.hospitalID;
  const id = req.params.id;
  const wardID = req.body.wardID;
  let connection = null;
  const ptype = req.body.ptype;
  if (!ptype) return missingBody(res, "patient type required");
  try {
    // console.log(`hospitalID :${hospitalID}`);
    // console.log(`patientID: ${id}`);
    const patientTimeLineData = {
      hospitalID,
      departmentID: req.body.departmentID,
      patientStartStatus: ptype,
      wardID,
    };
    await patientTimeLineSchema.validateAsync(patientTimeLineData);
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const queryCheckPatientTimeLineAcive = `SELECT * FROM patientTimeLine WHERE patientID = ? AND hospitalID = ? AND patientEndStatus IS NULL`;
    const [result] = await connection.query(queryCheckPatientTimeLineAcive, [
      id,
      hospitalID,
    ]);

    if (result.length) {
      return notAllowed(res, "Timeline already exist");
    }
    //here updating patientstable
    const update = await connection.query(queryUpdatePatientRevisit, [
      ptype,
      hospitalID,
      id,
    ]);
    const { changedRows } = update[0];
    if (!changedRows) throw new Error("failed to update patient");
    const [insertTimeline] = await connection.query(
      queryRevisitPatientTimeLine(ptype),
      [
        patientTimeLineData.hospitalID,
        id,
        patientTimeLineData.departmentID,
        patientTimeLineData.patientStartStatus,
        wardID,
      ]
    );
    const newTimelineID = insertTimeline.insertId;
    const result2 = await addDoctor(
      connection,
      newTimelineID,
      req.body.userID,
      "primary",
      hospitalID
    );
    if (result2.status != 201) {
      connection.rollback();
      return res.status(result2.status).json({
        message: result2.message,
      });
    }
    await connection.commit();

    res.status(200).send({
      message: "success",
    });
  } catch (err) {
    if (err.isJoi === true) {
      return missingBody(res, err.message);
    }
    if (connection) {
      connection.rollback();
    }
    serverError(res, err.message);
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

/**
 * ** METHOD : GET
 * ** DESCRIPTION : get patient count for each month for the current year
 */
const getYearCount2 = async (req, res) => {
  const hospitalID = req.params.hospitalID;
  const ptype = req.params.ptype;
  const selectedYear = req.params.selectedYear;
  const filterMonth = req.query.filterMonth; // Get the filterMonth from query parameters

  const today = new Date();
  const currentYear = selectedYear || today.getFullYear();
  const currentMonth = today.getMonth();
  const monthCounts = [];
  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    if (filterMonth) {
      // Handle specific month filtering
      const startDate = new Date(currentYear, filterMonth - 1, 1);
      const endDate = new Date(currentYear, filterMonth, 1);
      const result = await pool.query(queryGetCountBetweenDates, [
        hospitalID,
        startDate,
        endDate,
      ]);
      monthCounts.push({
        month: monthNames[filterMonth - 1],
        count: result[0][0].count,
      });
    } else {
      // Fetch all months' data for the year
      for (let i = 0; i < 12; i++) {
        const startDate = new Date(currentYear, i, 1);
        const endDate = new Date(currentYear, i + 1, 1);
        const result = await pool.query(queryGetCountBetweenDates, [
          hospitalID,
          startDate,
          endDate,
        ]);
        monthCounts.push({
          month: monthNames[i],
          count: result[0][0].count,
        });
      }
    }

    await connection.commit();
    res.status(200).send({
      message: "success",
      counts: monthCounts,
    });
  } catch (err) {
    if (connection) {
      connection.rollback();
    }
    serverError(res, err.message);
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

const getYearCount = async (req, res) => {
  const userID = req.userID;
  const hospitalID = req.params.hospitalID;
  const ptype = req.params.ptype || patientUtils.patientStatus.inpatient;
  const filter = req.query.filter || "month";
  const filterYear = req.query.filterYear || new Date().getFullYear(); // default to current year
  const filterMonth = req.query.filterMonth; // optional month parameter
  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    await pool.query(querySetFilterOption(filter));

    let result;

    if (filterMonth) {
      // If filterMonth is selected, fetch daily data for the selected month of the filterYear
      const queryPatientDailyCount = `
  SELECT 
    DAY(patientTimeLine.startTime) AS filter_value, 
    COUNT(DISTINCT patientTimeLine.id) AS count
  FROM patientTimeLine
  INNER JOIN patientDoctors 
    ON patientTimeLine.id = patientDoctors.patientTimeLineID
  WHERE 
    patientTimeLine.hospitalID = ? 
    AND patientDoctors.doctorID = ? -- Ensure the doctorID condition is included
    AND YEAR(patientTimeLine.startTime) = ? 
    AND MONTH(patientTimeLine.startTime) = ? 
    AND patientTimeLine.patientStartStatus = ${patientUtils.patientStatus.inpatient}
  GROUP BY filter_value;
`;

      result = await pool.query(
        queryPatientDailyCount,
        [hospitalID, userID, filterYear, filterMonth] // Ensure placeholders match the query order
      );
    } else {
      // If no month is selected, display monthly data for the entire year
      const queryPatientMonthlyCount = (filterYear) => `
        SELECT 
          MONTH(patientTimeLine.startTime) AS filter_value, 
          COUNT(DISTINCT patientTimeLine.id) AS count
        FROM patientTimeLine
       LEFT JOIN  patients ON patientTimeLine.patientID = patients.id
        INNER JOIN patientDoctors 
          ON patientTimeLine.id = patientDoctors.patientTimeLineID
        WHERE 
          patients.hospitalID = ? 
          AND patientDoctors.doctorID = ? 
          AND YEAR(patientTimeLine.startTime) = ? 
          AND patientTimeLine.patientStartStatus = ${patientUtils.patientStatus.inpatient}
        GROUP BY filter_value;
      `;

      result = await pool.query(
        queryPatientMonthlyCount(filterYear),
        [hospitalID, userID, filterYear] // Updated parameter list
      );
    }

    await connection.commit();

    res.status(200).send({
      message: "success",
      counts: result[0],
    });
  } catch (err) {
    if (connection) {
      connection.rollback();
    }
    serverError(res, err.message);
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

// getAllPatientCountByHospital

const getAllPatientCountByHospital = async (req, res) => {
  const hospitalID = req.params.hospitalID;
  const filter = req.query.filter || "month";
  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [result] = await pool.query(queryallPatientCountByHospital(filter), [
      hospitalID,
    ]);

    await connection.commit();

    res.status(200).send({
      message: "success",
      counts: result,
    });
  } catch (err) {
    if (connection) {
      connection.rollback();
    }
    serverError(res, err.message);
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

const getOtYearCount = async (req, res) => {
  const hospitalID = req.params.hospitalID;
  const ptype = req.params.ptype;
  const selectedYear = req.params.selectedYear;
  const patientType = req.params.patientType;

  const today = new Date();
  const currentYear = selectedYear || today.getFullYear();
  const currentMonth = today.getMonth();
  const monthCounts = [];
  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    for (let i = 0; i < 12; i++) {
      const startDate = new Date(currentYear, i, 1);
      const endDate = new Date(currentYear, i + 1, 1);
      const result = await pool.query(queryGetOTCountBetweenDates, [
        hospitalID,
        // ptype,
        startDate,
        endDate,
        patientType,
      ]);
      monthCounts.push({
        month: monthNames[i],
        count: result[0][0].patient_count,
      });
    }
    await connection.commit();
    res.status(200).send({
      message: "success",
      counts: monthCounts,
    });
  } catch (err) {
    if (connection) {
      connection.rollback();
    }
    serverError(res, err.message);
  } finally {
    if (connection) {
      connection.release();
    }
  }
};
const getPatientCountOnFilter = async (req, res) => {
  const userID = req.userID;
  const hospitalID = req.params.hospitalID;
  const ptype = req.params.ptype || patientUtils.patientStatus.outpatient;
  const zone = req.query.zone;
  const filter = req.query.filter || "month";
  const filterYear = req.query.filterYear || new Date().getFullYear(); // default to current year
  const filterMonth = req.query.filterMonth; // optional month parameter
  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    await pool.query(querySetFilterOption(filter));

    let result;

    if (ptype != patientUtils.patientStatus.emergency) {
      if (filterMonth) {
        // If filterMonth is selected, fetch daily data for the selected month of the filterYear
        const queryPatientDailyCount = `
        SELECT DAY(patientTimeLine.startTime) AS filter_value, COUNT(DISTINCT patientTimeLine.id) AS count
        FROM patientTimeLine
       
        INNER JOIN patientDoctors ON patientTimeLine.id = patientDoctors.patientTimeLineID
        WHERE patientTimeLine.hospitalID = ?
          AND patientDoctors.doctorID = ?
          AND YEAR(patientTimeLine.startTime) = ? 
          AND MONTH(patientTimeLine.startTime) = ?
          AND patientTimeLine.patientStartStatus = ${patientUtils.patientStatus.outpatient}
        GROUP BY filter_value;
      `;

        result = await pool.query(
          queryPatientDailyCount,
          [hospitalID, userID, filterYear, filterMonth] // Updated parameters to include doctorID
        );
      } else {
        // If no month is selected, display monthly data for the entire year
        const queryPatientMonthlyCount = `
        SELECT
          MONTH(patientTimeLine.startTime) AS filter_value,
          COUNT(DISTINCT patientTimeLine.id) AS count
        FROM patientTimeLine
        INNER JOIN patientDoctors 
          ON patientTimeLine.id = patientDoctors.patientTimeLineID
         
        WHERE
          patientDoctors.doctorID = ?
          AND patientDoctors.hospitalID = ? 
          AND patientTimeLine.patientStartStatus = ?
          AND YEAR(patientTimeLine.startTime) = ?
        GROUP BY filter_value;
      `;

        result = await pool.query(
          queryPatientMonthlyCount,
          [userID, hospitalID, ptype, filterYear] // Adjusted parameter order
        );
      }
    } else {
      if (!zone) return res.status(400).send({ message: "zone missing" });
      const queryPatientEmergencyCount = `
      SELECT
        ${filterMonth ? "DAY(startTime)" : "MONTH(startTime)"} AS filter_value,
        COUNT(DISTINCT patientID) AS count
      FROM patientTimeLine
      INNER JOIN patientDoctors ON patientTimeLine.id = patientDoctors.patientTimeLineID
      WHERE
        patientDoctors.hospitalID = ? 
        AND patientDoctors.doctorID = ? 
        AND patientTimeLine.patientStartStatus = ? 
        AND zone IN (${zone})
        AND YEAR(patientTimeLine.startTime) = ?
        ${filterMonth ? "AND MONTH(patientTimeLine.startTime) = ?" : ""}
      GROUP BY filter_value;
    `;

      const params = filterMonth
        ? [hospitalID, userID, ptype, filterYear, filterMonth]
        : [hospitalID, userID, ptype, filterYear];

      result = await pool.query(queryPatientEmergencyCount, params);
    }
    await connection.commit();

    res.status(200).send({
      message: "success",
      counts: result[0],
    });
  } catch (err) {
    if (connection) {
      connection.rollback();
    }
    serverError(res, err.message);
  } finally {
    if (connection) {
      connection.release();
    }
  }
};
/**
 * ** METHOD : GET
 * ** DESCRIPTION : get patient visit by department
 */
const getPatientVisitByDepartment = async (req, res) => {
  const hospitalID = req.params.hospitalID;
  try {
    const results = await pool.query(queryGetDepartmentsPercentage, [
      hospitalID,
    ]);
    // console.log(results[0]);
    const percentages = [];
    const uniqueArray = [...new Set(results[0].map((obj) => obj.name))];
    // console.log(uniqueArray)
    uniqueArray.map((item) => {
      const count = results[0].filter(
        (element) => element.name === item
      ).length;
      let percentage = ((count / results[0].length) * 100).toFixed(2);
      percentage = parseFloat(percentage);
      percentages.push({
        department: item,
        percentage: percentage,
      });
    });
    res.status(200).send({
      message: "success",
      percentages: percentages,
    });
  } catch (err) {
    serverError(res, err);
  }
};

const getPatientVisitByDepartmentWithFilter = async (req, res) => {
  const hospitalID = req.params.hospitalID;
  // const userID = req.query.userID;
  const ptype = req.query.ptype;
  const filter = req.query.filter || "month";
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    await connection.query(querySetFilterOption(filter));
    const results = await connection.query(queryDepartmentDistribution, [
      hospitalID,
      ptype,
    ]);
    await connection.commit();
    console.log("------get distribution-------", results[0]);
    const sum = results[0].reduce((acc, curr) => acc + curr.count, 0);
    const finalResult = results[0].map((curr) => ({
      name: curr.name,
      percentage: curr.count,
    }));
    res.status(200).send({
      message: "success",
      percentages: finalResult,
    });
  } catch (err) {
    serverError(res, err);
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

/**
 * ** METHOD : GET
 * ** DESCRIPTION : get imageURL from photo object
 */
const getPhotoImageURL = async (req, res) => {
  const photo = req.params.photo;
  if (!photo) missingBody(res, "missing photo object");
  try {
    const imageURL = await getSignedUrl(
      s3Client,
      new GetObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: photo,
      }),
      { expiresIn: 300 }
    );
    res.status(200).send({
      message: "success",
      imageURL: imageURL,
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

/**
 * ** METHOD : GET
 * ** DESCRIPTION : CHECK DEVICE PRESENT
 */
const checkDevicePresent = async (req, res) => {
  const hospitalID = req.params.hospitalID;
  const patientID = req.params.id;

  // console.log(`hospitalID : ${hospitalID}`);
  // console.log(`patientID : ${patientID}`);
  try {
    const result = await pool.query(queryGetPatientByID, [
      hospitalID,
      patientID,
    ]);
    const foundPatient = result[0][0];
    if (!foundPatient) return resourceNotFound(res, "no patient found");
    if (!foundPatient.deviceID) return resourceNotFound(res, "no device found");
    const device = await pool.query(queryGetDevice, [foundPatient.deviceID]);
    res.status(200).send({
      message: "success",
      device: device[0][0],
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

/**
 * ** METHOD : GET
 * ** DESCRIPTION : GET MONTHLY SUMMARY
 */
const getSummary = async (req, res) => {
  const duration = req.query.duration;
  const hospitalID = req.params.hospitalID;
  const month = req.query.filterValue || null;
  const year = req.query.filterValue || null;
  const filterType = req.query.duration || "month";
  const categoryFilter = Number(req.query.category) || 0;
  const getCurrentMonth = () => new Date().getMonth() + 1;
  const getCurrentYear = () => new Date().getFullYear();
  let connection;
  const getCurrentWeek = () => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(
      now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1)
    ); // Adjust to the start of the week (Sunday)

    const days = Math.floor((now - startOfWeek) / (24 * 60 * 60 * 1000));
    return Math.ceil((days + 1) / 7); // Adding 1 to start the count from 1
  };
  const filterValue = {
    month: month || getCurrentMonth(),
    year: year || getCurrentYear(),
    week: getCurrentWeek(),
  }[filterType];
  let filterCondition = "";
  if (filterValue !== undefined) {
    if (filterType === "month") {
      filterCondition = `AND MONTH(startTime) = ${filterValue} AND YEAR(startTime) = YEAR(NOW())`;
    } else if (filterType === "week") {
      filterCondition = `AND YEARWEEK(startTime, 1) = YEARWEEK(NOW(), 1)`;
    } else {
      filterCondition = `AND ${filterType}(startTime) = ${filterValue}`;
    }
  }
  const categoryFilterCondition = categoryFilter
    ? `AND p.category = ${categoryFilter}`
    : "";
  const patientsJoin = categoryFilterCondition
    ? "JOIN patients p ON pt.patientID = p.id"
    : "";
  const query = `
    SELECT
      pt.patientStartStatus,
      COUNT(*) AS patientCount
    FROM
      patientTimeLine pt
    ${patientsJoin}
    WHERE
      pt.hospitalID=?
      ${filterCondition}
      ${categoryFilterCondition}
    GROUP BY
      pt.patientStartStatus
  `;
  const queryForDischarge = `
  SELECT pt.patientEndStatus, COUNT(*) AS patientCount,dischargeType
  FROM patientTimeLine pt 
  ${patientsJoin} 
  WHERE pt.hospitalID=? AND pt.patientEndStatus=${patientUtils.patientStatus.discharged}
  ${filterCondition}
  ${categoryFilterCondition}
  GROUP BY dischargeType
  `;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    const result = await connection.query(query, [hospitalID]);
    const dischargeResult = await connection.query(queryForDischarge, [
      hospitalID,
    ]);
    const summary = {};
    result[0].forEach((el) => {
      summary[
        Object.keys(patientUtils.patientStatus)[
        Object.values(patientUtils.patientStatus).indexOf(
          el.patientStartStatus
        )
        ]
      ] = el.patientCount;
    });
    summary[dischargeResult[0].patientEndStatus] =
      dischargeResult[0].patientCount;
    dischargeResult[0].forEach((el) => {
      if (el.dischargeType == patientUtils.dischargeType.death)
        summary.death = el.patientCount;
      else summary.discharged = (summary.discharged || 0) + el.patientCount;
    });

    // console.log("arju",summary)
    res.status(200).send({
      message: "success",
      summary,
    });
  } catch (err) {
    serverError(res, err.message);
  } finally {
    if (connection) connection.release();
  }
};

/**
 * ** METHOD : GET
 * ** DESCRIPTION : GET PERCENTAGE USE OF DEVICES
 */
const getPercentageUseOfDevices = async (req, res) => {
  const hospitalID = req.params.hospitalID;
  try {
    const [result] = await pool.query(queryGetPercentageUseOfDevices, [
      hospitalID,
    ]);
    console.log("resopk", result);
    let inPatients = 0;
    let outPatients = 0;
    let emergency = 0;
    result.map((item) => {
      switch (item.patientStartStatus) {
        case 1:
          outPatients++;
          break;
        case 2:
          inPatients++;
          break;
        case 3:
          emergency++;
          break;
      }
    });
    const total = result.length;
    const outPatientPercent = ((outPatients / total) * 100).toFixed(2);
    const intPatientPercent = ((inPatients / total) * 100).toFixed(2);
    const emergencyPercent = ((emergency / total) * 100).toFixed(2);
    res.status(200).send({
      message: "success",
      percentages: {
        outPatient: outPatientPercent,
        inPatient: intPatientPercent,
        emergency: emergencyPercent,
      },
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

/**
 * ** METHOD : GET
 * ** DESCRIPTION : GET PERCENTAGE USE OF DEVICES
 */
const getPercentageUsageOfHubs = async (req, res) => {
  const hospitalID = req.params.hospitalID;
  try {
    const [result] = await pool.query(queryGetPercentageUseOfDevices, [
      hospitalID,
    ]);
    let inPatients = 0;
    let outPatients = 0;
    let emergency = 0;
    result.map((item) => {
      switch (item.patientStartStatus) {
        case 1:
          outPatients++;
          break;
        case 2:
          inPatients++;
          break;
        case 3:
          emergency++;
          break;
      }
    });
    const total = result.length;
    const outPatientPercent = ((outPatients / total) * 100).toFixed(2);
    const intPatientPercent = ((inPatients / total) * 100).toFixed(2);
    const emergencyPercent = ((emergency / total) * 100).toFixed(2);
    res.status(200).send({
      message: "success",
      percentages: {
        outPatient: outPatientPercent,
        inPatient: intPatientPercent,
        emergency: emergencyPercent,
      },
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

/**
 * ** METHOD : GET
 * ** DESCRIPTION : GET CALENDAR CARDS
 */
const getCalendarCard = async (req, res) => {
  console.log(`in calendar`);

  const hospitalId = req.params.hospitalID;
  const date = req.query.date;
  const userID = req.userID;
  console.log(`date: ${date}`);
  try {
    await dateValidation.validateAsync({ date });
    const [result] = await pool.query(queryGetCalendarCards, [
      hospitalId,
      userID,
    ]);
    let totalPatients = 0,
      inPatients = 0,
      discharged = 0;
    if (date) {
      for (let i = 0; i < result.length; i++) {
        totalPatients++;
        if (
          result[i].patientEndStatus === null ||
          result[i].patientEndStatus === 2
        ) {
          inPatients++;
        }
        // console.log(`startTime : ${result[i].startTime}`);
        // console.log(`endTime: ${result[i].endTime}`);
        else if (result[i].patientEndStatus === 21) {
          const gotDate = result[i].endTime.toISOString().split("T")[0];
          console.log(`endDate: ${gotDate} , date: ${date}`);
          // if (gotDate === date) {
          discharged++;
          // }
        }
      }
    } else {
      for (let i = 0; i < result.length; i++) {
        if (
          result[i].patientEndStatus === null ||
          result[i].patientEndStatus === 2
        ) {
          inPatients++;
          totalPatients++;
        } else if (result[i].patientEndStatus === 21) {
          discharged++;
          totalPatients++;
        }
      }
    }

    res.status(200).send({
      message: "success",
      result,
      Total_Patients: totalPatients,
      Total_InPatients: inPatients,
      Discharged_Patients: discharged,
    });
  } catch (err) {
    if (err.isJoi) return missingBody(res, `joi:${err.message}`);
    serverError(res, err.message);
  }
};

const addWardToPatient = async (req, res) => {
  const hospitalID = req.params.hospitalID;
  const id = req.params.id; //Patient ID
  const { wardID } = req.body;
  let connection;
  try {
    const [results] = await pool.query(queryGetPatientByID, [hospitalID, id]);
    const foundPatient = results[0];
    // check if patient present
    if (!foundPatient) return resourceNotFound(res, "patient not found");
    // check if patient is not discharged
    if (foundPatient.ptype === patientUtils.patientStatus.discharged)
      return notAllowed(res, "cannot update discharged patient");
    foundTimeLine = await pool.query(queryGetLatestTimeLine, [id]);
    if (!foundTimeLine)
      return resourceNotFound(res, "Failed to get patient timeline");
    if (!wardID) {
      return missingBody(res, "Ward ID missing");
    }
    await updateTimeLineSchema.validateAsync({ wardID });

    connection = await pool.getConnection();
    await connection.beginTransaction();
    await connection.query(queryUpdatePatientTimeLineByIDAddWard, [
      wardID,
      foundTimeLine.id,
    ]);
    await connection.commit();
    res.status(201).send({
      message: "success",
    });
  } catch (err) {
    serverError(res, err.message);
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

// {
//   "wardID": 155,
//   "transferType": "1",
//   "bp": "95/53",
//   "temp": "20",
//   "oxygen": "55",
//   "pulse": "30",
//   "hospitalName": null,
//   "reason": "checkups",
//   "relativeName": "samm",
//   "departmentID": 203,
//   "userID": 439
// }

const transferPatient = async (req, res) => {
  ////Body data: wardID, departmentID, transferType,userID,bp, temp, oxygen,pulse,reason,hospitalName
  //// Body data: relativeName
  const hospitalID = req.params.hospitalID;
  const id = req.params.id;
  const wardID = req.body.wardID;
  const transferType = req.body.transferType; //internal or external
  const transferStatus = req.body.status; ///inpatient, outpatient,operationTheatre or emergency
  let patientStatus;
  if (transferType == patientUtils.transferType.internal) {
    patientStatus = transferStatus || patientUtils.patientStatus.inpatient;
  } else {
    patientStatus = patientUtils.patientStatus.discharged;
  }

  /////Data to update the timeline
  const dischargeData = {
    dischargeType: patientUtils.dischargeType.transfer, //6
    patientStatus, //2
  };

  let connection;
  try {
    //this query checking that patient should be active.. not discharge
    const result = await pool.query(queryGetPatientForDischarge, [
      hospitalID,
      id,
    ]);
    const foundPatient = result[0][0];

    console.log("step:3=======");
    console.log("foundPatient", result[0]);
    if (!foundPatient) return resourceNotFound(res, "No Patient present");
    if (foundPatient.wardID == wardID) {
      return duplicateRecord(
        res,
        "Patient already present in the selected ward"
      );
    }
    if (foundPatient.ptype !== foundPatient.patientStartStatus)
      return serverError(
        res,
        `patient status and timeline status are different ${foundPatient.patientID}`
      );

    if (foundPatient.ptype === patientUtils.patientStatus.outpatient) {
      if (
        foundPatient.patientEndStatus === patientUtils.patientStatus.discharged
      ) {
        //   return missingBody(res, "outpatients cannot be discharged");
        return missingBody(res, "patient already discharged");
      }
    }

    ////Data to create a new timeline
    const patientTimelineData = {
      hospitalID,
      patientID: foundPatient.patientID,
      departmentID: req.body.departmentID,
      patientStartStatus: patientStatus,
      wardID,
    };

    connection = await pool.getConnection();
    await connection.beginTransaction();
    const queryCheckWardBedCount = "SELECT availableBeds FROM wards WHERE id=?";

    if (foundPatient.wardID && transferType != 2) {
      //before update beds need to check bed count
      const result = await connection.query(queryCheckWardBedCount, [
        foundPatient.wardID,
      ]);
      const isBedsAvailableData = result[0][0];

      if (isBedsAvailableData?.availableBeds <= 0) {
        return missingBody(res, "No Available Beds In this Ward");
      } else {
        await connection.query(queryIncreaseWardBed, [foundPatient.wardID]);
      }
    }

    ////Close the old timeline
    await connection.query(queryUpdatePatientTimeLineForTransfer, [
      dischargeData.patientStatus,
      dischargeData.dischargeType,
      foundPatient.patientTimeLineID,
    ]);
    let lastInsertedId;

    console.log("step:4=======", foundPatient.patientID);
    //////update patient isviewed status
    // if (transferType != patientUtils.transferType.internal) {
    // "UPDATE patients SET ptype=?,isViewed=0 WHERE id=?";
    await connection.query(queryUpdatePatientIsViewed, [
      patientStatus,
      foundPatient.patientID,
    ]);
    // }

    ////////////////Updating the ptype of outpatients //////////////////////////
    // if (
    //   transferType == patientUtils.transferType.internal &&
    //   (foundPatient.ptype == patientUtils.patientStatus.outpatient ||
    //     foundPatient.ptype == patientUtils.patientStatus.emergency)
    // ) {
    //   await connection.query(queryUpdatePatient, [
    //     patientStatus,
    //     foundPatient.patientID,
    //   ]);
    // }
    //////////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////////////

    if (patientStatus == patientUtils.patientStatus.inpatient) {
      if (!patientTimelineData.wardID) return notAllowed(res, "Ward missing");
      const decreaseWardBeds = await connection.query(queryDecreaseWardBed, [
        patientTimelineData.wardID,
      ]);
      if (!decreaseWardBeds[0].changedRows) {
        return notAllowed(res, "Ward reached it's maximum occupancy");
      }
    }
    if (transferType == patientUtils.transferType.internal) {
      //creating new patientTimeLine
      await connection.query(
        queryInsertPatientTimeLineForTransfer(patientStatus),
        Object.values(patientTimelineData)
      );
      const lastInsertedIdResult = await connection.query(
        "SELECT LAST_INSERT_ID() as id"
      );
      lastInsertedId = lastInsertedIdResult[0][0].id;
      // console.log("testing1....", hospitalID, foundPatient.patientTimeLineID);
      ////Remove previous doctors
      const removeDoctor = await doctorService.removeAllDoctor(
        connection,
        foundPatient.patientTimeLineID,
        hospitalID
      );
      if (removeDoctor.status != 200) {
        connection.rollback();
        return res.status(removeDoctor.status).send({
          message: removeDoctor.message,
        });
      }
      const insertDoctor = await addDoctor(
        connection,
        lastInsertedId,
        req.body.userID,
        "primary",
        hospitalID
      );
      if (insertDoctor?.status != 201) {
        connection.rollback();
        return res.status(insertDoctor.status).send({
          message: insertDoctor.message,
        });
      }
    }
    // console.log("testing3....");
    //////creating transfer data
    const transferData = {
      hospitalID,
      patientID: foundPatient.patientID,
      transferType,
      bp: req.body.bp || null,
      temp: req.body.temp || null,
      oxygen: req.body.oxygen || null,
      pulse: req.body.pulse || null,
      hospitalName: req.body.hospitalName || null,
      reason: req.body.reason || null,
      timelineID: foundPatient.patientTimeLineID,
      newTimelineID: lastInsertedId || null,
      relativeName: req.body.relativeName,
    };
    // console.log("transfer data-----1", transferData);
    await transferPatientSchema.validateAsync(transferData);
    await connection.query(queryInsertTransferPatient, [
      transferData.hospitalID,
      transferData.patientID,
      transferType,
      transferData.bp,
      transferData.temp,
      transferData.oxygen,
      transferData.pulse,
      transferData.reason,
      transferData.timelineID,
      transferData.newTimelineID,
      transferData.hospitalName,
      transferData.relativeName || null,
    ]);
    // console.log("transfer data-----2", transferData);

    await connection.commit();
    foundTimeLine = await pool.query(queryGetLatestTimeLine, [
      foundPatient.patientID,
    ]);
    res.status(200).send({
      message: "success",
      timeline: [0][0],
    });
  } catch (err) {
    if (err.isJoi) {
      return missingBody(res, err.message);
    }
    serverError(res, err.message);
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

const createFollowUp = async (req, res) => {
  const timelineID = req.params.timelineID;
  const date = req.body.date;
  try {
    await pool.query(queryInsertFollowUp, [timelineID, date]);
    res.status(200).send({
      message: "success",
      date,
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

const doctorSummary = async (req, res) => {
  try {
    const hospitalID = req.params.hospitalID;
    const doctorID = req.query.doctorID || 0;

    const year = req.query.year || new Date().getFullYear();
    const month = req.query.month || new Date().getMonth() + 1;

    if (!doctorID) return missingBody(res, "doctorID missing");

    const query = `
      SELECT 
        pt.patientStartStatus,
        pt.patientEndStatus,
        COUNT(DISTINCT p.id) AS patientCount
      FROM 
        patientDoctors pd
      JOIN 
        patientTimeLine pt ON pd.patientTimeLineID = pt.id 
      JOIN 
        patients p ON pt.patientID = p.id
      WHERE 
        pd.hospitalID = ?
        AND pd.doctorID = ?
        AND pt.hospitalID = ?
        AND YEAR(pt.startTime) = ?
        AND MONTH(pt.startTime) = ?
      GROUP BY 
        pt.patientStartStatus, pt.patientEndStatus;
    `;

    const params = [hospitalID, doctorID, hospitalID, year, month];
    console.log("Parameters:", params);

    const [results] = await pool.query(query, params);
    console.log("Query Results:", results);

    const summary = {
      outpatient: 0,
      emergency: 0,
      inpatient: 0,
      discharged: 0,
    };

    results.forEach((el) => {
      switch (el.patientStartStatus) {
        case patientUtils.patientStatus.outpatient:
          summary.outpatient += el.patientCount;
          break;
        case patientUtils.patientStatus.emergency:
          summary.emergency += el.patientCount;
          break;
        case patientUtils.patientStatus.inpatient:
          summary.inpatient += el.patientCount;
          break;
      }
      if (el.patientEndStatus === patientUtils.patientStatus.discharged) {
        summary.discharged += el.patientCount;
      }
    });

    console.log("Summary:", summary);

    res.status(200).send({
      message: "success",
      summary,
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

// =====================dont delete========================

// const doctorSummary = async (req, res) => {
//   // console.log("function called");
//   try {
//     const filterType = req.query.duration || "month";
//     const hospitalID = req.params.hospitalID;
//     const doctorID = req.query.doctorID || 0;
//     const year = req.query.year;

//     if (!doctorID) return missingBody(res, "doctorID missing");
//     console.log("doctorID",doctorID)

//     const categoryFilter = Number(req.query.category) || 0;
//     // console.log("filterrrr", filterType, categoryFilter);
//     const getCurrentMonth = () => new Date().getMonth() + 1;
//     const getCurrentYear = () => new Date().getFullYear();
//     const getCurrentWeek = () => {
//       const now = new Date();
//       const startOfWeek = new Date(now);
//       startOfWeek.setHours(0, 0, 0, 0);
//       startOfWeek.setDate(
//         now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1)
//       ); // Adjust to the start of the week (Sunday)

//       const days = Math.floor((now - startOfWeek) / (24 * 60 * 60 * 1000));
//       return Math.ceil((days + 1) / 7); // Adding 1 to start the count from 1
//     };
//     const filterValue = {
//       month: getCurrentMonth(),
//       year: getCurrentYear(),
//       week: getCurrentWeek(),
//     }[filterType];
//     console.log("filterValue",filterValue)
//     let filterCondition = "";
//     if (filterValue !== undefined) {
//       if (filterType === "month") {
//         filterCondition = `AND MONTH(startTime) = MONTH(NOW()) AND YEAR(startTime) = YEAR(NOW())`;
//       } else if (filterType === "week") {
//         filterCondition = `AND YEARWEEK(startTime, 1) = YEARWEEK(NOW(), 1)`;
//       } else {
//         filterCondition = `AND ${filterType}(startTime) = ${filterValue}`;
//       }
//     }
//     const categoryFilterCondition = categoryFilter
//       ? `AND p.category = ${categoryFilter}`
//       : "";
//     const patientsJoin = categoryFilterCondition
//       ? "JOIN patients p ON pt.patientID = p.id"
//       : "";
//     const query = `
//     SELECT
//       pt.patientID,
//       COUNT(*) AS patientCount,
//       MONTH(pt.startTime) AS month_year
//     FROM
//       patientTimeLine pt
//     WHERE
//       pt.hospitalID=?
//       AND pt.patientID=?
//       AND YEAR(pt.startTime) = ${year || "YEAR(CURRENT_DATE)"}
//     GROUP BY month_year
//     ORDER BY month_year
//   `;
//     const results = await pool.query(query, [hospitalID, doctorID]);
//     // console.log(results[0][0]);
//     const summary = [];
//     results[0].forEach((el) => {
//       summary.push({ filter_value: el.month_year, count: el.patientCount });
//       // summary[el.month_year] = el.patientCount;
//     });
//     res.status(200).send({
//       message: "success",
//       summary,
//     });
//   } catch (err) {
//     serverError(res, err.message);
//   }
// };

const checkIfpatientExists = async (req, res, next) => {
  const pID = req.params.pID;
  const hospitalID = req.params.hospitalID;
  try {
    const results = await pool.query(queryFindPatientByPID, [hospitalID, pID]);
    if (results[0].length !== 0) {
      res.status(200).json({
        message: "success",
        status: 0,
      });
    } else {
      res.status(200).json({
        message: "success",
        status: 1,
      });
    }
  } catch (err) {
    serverError(res, err.message);
  }
};

//get nurse added latest  patient list
const getNurseRecentPatients = async (req, res) => {
  const hospitalID = req.params.hospitalID;
  const ptype = req.params.ptype;
  const role = req.query.role || ROLES_LIST.nurse;
  const userID = req.query.userID;
  const category = req.query.category;
  try {
    const queryGetRecentPatientsAddedByNurse = `SELECT patients.id, patients.hospitalID, patients.deviceID, patients.pID, patients.pUHID, patients.ptype, patients.category, patients.pName, 
        patients.dob, patients.gender, patients.weight, patients.height, 
        patients.phoneNumber, patients.email, patients.address, patients.city, patients.state, patients.pinCode, patients.referredBy, 
        patients.photo, patientTimeLine.startTime, users.firstName,users.lastName, departments.name AS department
        FROM patients
        INNER JOIN patientTimeLine ON patients.id = patientTimeLine.patientID
        INNER JOIN patientDoctors ON patientDoctors.patientTimeLineID = patientTimeLine.id AND patientDoctors.active=true  
        INNER JOIN users ON users.id=patientDoctors.doctorID
        INNER JOIN departments ON departments.id=users.departmentID
        WHERE patients.hospitalID = ? 
          AND patients.ptype = ? 
          AND patients.isViewed = 0
          AND patientTimeLine.patientEndStatus IS NULL  
          AND patients.addedBy = ?
        ORDER BY patientTimeLine.startTime DESC 
        LIMIT 10`;

    const [results] = await pool.query(queryGetRecentPatientsAddedByNurse, [
      hospitalID,
      ptype,
      userID,
    ]);

    if (!results || results.length === 0) {
      return res.status(404).send({
        message: "No recent patients found",
        patients: [],
      });
    }

    const patientsWithPhotos = await Promise.all(
      results.map(async (patient) => {
        if (patient.photo) {
          const imageURL = await getSignedUrl(
            s3Client,
            new GetObjectCommand({
              Bucket: process.env.AWS_BUCKET_NAME,
              Key: patient.photo,
            }),
            { expiresIn: 300 }
          );
          patient.imageURL = imageURL;
        }
        patient.doctorName = patient.firstName + " " + patient.lastName;
        return patient;
      })
    );
    console.log("patientswithphotos===", patientsWithPhotos);
    res.status(200).send({
      message: "success",
      patients: patientsWithPhotos,
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

//get Nurse Opd Previous Patients List
//  AND patients.ptype IN (?, 21) -- Filter for dynamic ptype and ptype 21
const getNurseOpdPreviousPatientsList = async (req, res) => {
  const hospitalID = req.params.hospitalID;
  const ptype = req.params.ptype;
  const role = req.query.role || ROLES_LIST.nurse;
  const userID = req.query.userID;
  let results;

  try {
    const query = ` SELECT patients.id, patients.hospitalID, patients.deviceID, patients.pID, patients.pUHID, patients.ptype, patients.category, patients.pName, 
        patients.dob, patients.gender, patients.weight, patients.height, 
        patients.phoneNumber, patients.email, patients.address, patients.city, patients.state, patients.pinCode, patients.referredBy, 
        patients.photo, patientTimeLine.startTime, users.firstName,users.lastName, departments.name AS department
        FROM patients
        INNER JOIN patientTimeLine ON patients.id = patientTimeLine.patientID
        INNER JOIN patientDoctors ON patientDoctors.patientTimeLineID = patientTimeLine.id AND patientDoctors.active=true  
        INNER JOIN users ON users.id=patientDoctors.doctorID
        INNER JOIN departments ON departments.id=users.departmentID
        LEFT JOIN followUp ON followUp.timelineID = patientTimeLine.id
        WHERE patients.hospitalID = ? 
           AND patients.ptype IN (?, ?)
          AND patients.isViewed = 1
           AND (patientTimeLine.patientEndStatus IS NULL OR patientTimeLine.patientEndStatus = 21) 
           AND followUp.timelineID IS NULL
          AND patients.addedBy = ?
        ORDER BY patientTimeLine.startTime DESC 
        LIMIT 10`;
    results = await pool.query(query, [hospitalID, ptype, 21, userID]);

    const patients = results[0];
    const patientsWithPhotos = await Promise.all(
      patients.map(async (patient) => {
        if (patient.photo) {
          const imageURL = await getSignedUrl(
            s3Client,
            new GetObjectCommand({
              Bucket: process.env.AWS_BUCKET_NAME,
              Key: patient.photo,
            }),
            { expiresIn: 300 }
          );
          patient.imageURL = imageURL;
        }
        patient.doctorName = patient.firstName + " " + patient.lastName;
        return patient;
      })
    );
    res.status(200).send({
      message: "success",
      patients: patientsWithPhotos,
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

const getNurseIpdPatientsByType = async (req, res) => {
  const hospitalID = req.params.hospitalID;
  const ptype = req.params.ptype;
  const userID = req.query.userID;
  try {
    const query = `SELECT patients.id, patients.hospitalID, patients.deviceID, patients.pID, patients.pUHID, patients.ptype, 
    patients.category, patients.pName, users.firstName, users.lastName, departments.name as department, patients.dob, 
    patients.gender, patients.weight, patients.height, patients.phoneNumber, patients.email, patients.address, 
    patients.city, patients.state, patients.pinCode, patients.referredBy, patients.photo, patientTimeLine.startTime, 
    patientTimeLine.patientEndStatus, patientTimeLine.patientStartStatus, patientTimeLine.id AS patientTimeLineID, 
    patientTimeLine.wardID, wards.name AS wardName
    FROM patientDoctors 
    INNER JOIN patientTimeLine ON patientDoctors.patientTimeLineID = patientTimeLine.id 
    INNER JOIN patients ON patientTimeLine.patientID = patients.id 
    INNER JOIN users ON patientDoctors.doctorID = users.id 
    INNER JOIN departments ON users.departmentID = departments.id 
    LEFT JOIN wards ON patientTimeLine.wardID = wards.id 
    WHERE patientDoctors.hospitalID = ? AND patientDoctors.active = true 
    AND patientTimeLine.patientEndStatus IS NULL AND patients.ptype=? 
    AND  patients.addedBy = ? 
    AND patients.isViewed =1`;

    let testRes;
    if (ptype) {
      testRes = await pool.query(query, [hospitalID, ptype, userID]);
    }
    results = await Promise.all(
      testRes[0].map(async (patient) => {
        const date = new Date().toISOString().split("T")[0];
        const ret = await pool.query(queryGetNotificationCount, [
          patient.patientTimeLineID,
          date,
        ]);
        // console.log(`count : ${JSON.stringify(ret[0])}`);
        patient.notificationCount = ret[0][0].count;
        return patient;
      })
    );

    const patients = results;
    const patientsWithPhotos = await Promise.all(
      patients.map(async (patient) => {
        if (patient.photo) {
          const imageURL = await getSignedUrl(
            s3Client,
            new GetObjectCommand({
              Bucket: process.env.AWS_BUCKET_NAME,
              Key: patient.photo,
            }),
            { expiresIn: 300 }
          );
          patient.imageURL = imageURL;
        }
        patient.doctorName = patient.firstName + " " + patient.lastName;
        return patient;
      })
    );

    res.status(200).send({
      message: "success",
      // testRes:testRes[0],
      patients: patientsWithPhotos,
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

module.exports = {
  addPatient,
  getAllPatientsByTypeForReception,
  getAllPatientsByType,
  getpatientsForTriage,
  getRecentPatientsByType,
  getPatientCountByType,
  getTotalPatientCount,
  getPatientCountByMonthYear,
  isViewedPatient,
  dischargePatient,
  getPatientByID,
  getYearCount,
  getOtYearCount,
  getPatientVisitByDepartment,
  getPhotoImageURL,
  updatePatientByID,
  patientRevisit,
  checkDevicePresent,
  addPatientMobile,
  getSummary,
  getPercentageUseOfDevices,
  getPercentageUsageOfHubs,
  getCalendarCard,
  addWardToPatient,
  getAllPatientsByTypeWithFilter,
  transferPatient,
  doctorSummary,
  getPatientCountOnFilter,
  getPatientVisitCountByMonthYear,
  getPatientVisitByDepartmentWithFilter,
  createFollowUp,
  checkIfpatientExists,
  getPatientByIDForTriage,
  getCountOfPatientsByZone,
  getOpdPreviousPatientsList,
  getAllPatientCountByHospital,
  getNurseRecentPatients,
  getNurseOpdPreviousPatientsList,
  getNurseIpdPatientsByType,
  getPatientByIDForCustomerCare,
};
