const ROLES_LIST = require("../utils/roles");
const patientUtils = require("../utils/patientUtils");

const queryFindPatientByPID =
  "SELECT * FROM patients WHERE hospitalID=? AND pID=?";

const queryUpdatePatientByID = `UPDATE patients SET pUHID=?,category=?, 
    dob=?, gender=?, weight=?, height=?, pName=?, phoneNumber=?, email=?, address=?, city=?, state=?, pinCode=?, referredBy=?,insurance=?,insuranceNumber=?,insuranceCompany=?,photo=?
     WHERE hospitalID = ? AND id = ?`;
const queryUpdatePatientTimeLineByID = `UPDATE patientTimeLine SET userID=? WHERE id=?`;
const queryUpdatePatientTimeLineByIDAddWard = `UPDATE patientTimeLine SET wardID=? WHERE id=?`;
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
    return `INSERT INTO patientTimeLine (hospitalID,patientID, userID,departmentID,patientStartStatus) 
VALUES (?,?,?,?,?)`;
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

const queryGetPatientsForTriage =
  `SELECT patients.id,patients.hospitalID,patients.deviceID,patients.pID,patients.zone,patients.pUHID,patients.ptype,patients.category,patients.pName,patients.dob,patients.gender,patients.weight,patients.height,patients.phoneNumber,` +
  `patients.email,patients.address,patients.city,patients.state,patients.pinCode,patients.referredBy,patients.photo` +
  " " +
  `FROM patients WHERE patients.hospitalID=? AND patients.ptype=${patientUtils.patientStatus.emergency} AND patients.zone IS NULL`;

////To get all patient using ward and department filter

const queryGetPatientByTypeWithFilter = `SELECT patients.id,patients.hospitalID,patients.deviceID,patients.pID,
    patients.pUHID,patients.ptype,patients.category,patients.pName,users.firstName,users.lastName,departments.name as department,patients.dob,patients.gender,
    patients.weight,patients.height,patients.phoneNumber,patients.email,patients.address,
    patients.city,patients.state,patients.pinCode,patients.referredBy,patients.photo,patientTimeLine.startTime,
    patientTimeLine.id AS patientTimeLineID,wards.id AS wardID, wards.name AS wardName
    FROM patients
    INNER JOIN patientTimeLine on patients.id=patientTimeLine.patientID 
    INNER JOIN users on patientTimeLine.patientID=users.id 
    INNER JOIN departments on users.departmentID=departments.id
    INNER JOIN wards on patientTimeLine.wardID=wards.id
    WHERE patients.hospitalID=? AND patients.ptype=? AND patientTimeLine.startTime=patientTimeLine.endTime AND (departmentID = ? OR ? IS NULL)
    AND (wardID = ? OR ? IS NULL);`;

const queryGetPatientByTypeAndZoneWithFilter = `SELECT patients.id,patients.hospitalID,patients.deviceID,patients.pID,
    patients.pUHID,patients.ptype,patients.zone,patients.category,patients.pName,users.firstName,users.lastName,departments.name as department,patients.dob,patients.gender,
    patients.weight,patients.height,patients.phoneNumber,patients.email,patients.address,
    patients.city,patients.state,patients.pinCode,patients.referredBy,patients.photo,patientTimeLine.startTime,
    patientTimeLine.id AS patientTimeLineID,wards.id AS wardID, wards.name AS wardName
    FROM patients
    INNER JOIN patientTimeLine on patients.id=patientTimeLine.patientID 
    INNER JOIN users on patientTimeLine.patientID=users.id 
    INNER JOIN departments on users.departmentID=departments.id
    INNER JOIN wards on patientTimeLine.wardID=wards.id
    WHERE patients.hospitalID=? AND patients.ptype=? AND patientTimeLine.startTime=patientTimeLine.endTime AND patients.zone=?`;

// only for inpatients
const queryGetNotificationCount = `select count(*) as count from medicines
      LEFT JOIN medicineReminders ON
      medicines.id=medicineReminders.medicineID
      where medicines.timeLineID=? AND
      medicineReminders.dosageTime>?`;

// =========================================for getting patients======================

// only for inpatients
const queryGetDischargedPatients = (role) =>
  role == ROLES_LIST.doctor
    ? `SELECT DISTINCT patients.id, patients.hospitalID, patients.deviceID, patients.pID,
   patients.pUHID, patients.ptype, patients.category, patients.pName,
   patients.dob, patients.gender, patients.weight, patients.height,
   patients.phoneNumber, patients.email, patients.address, patients.city,
   patients.state, patients.pinCode, patients.referredBy, patients.photo,
   patientTimeLine.startTime, patientTimeLine.patientEndStatus,
   patientTimeLine.patientStartStatus, patientTimeLine.id AS patientTimeLineID,
   patientTimeLine.wardID
   FROM patientTimeLine
   JOIN patients ON patientTimeLine.patientID = patients.id AND patients.ptype = ?
   LEFT JOIN patientDoctors ON patientTimeLine.id = patientDoctors.patientTimeLineID
   WHERE patients.hospitalID = ? 
   AND patientDoctors.active = false
   AND patientTimeLine.patientEndStatus IS NOT NULL AND patientTimeLine.patientStartStatus=? 
   AND patientDoctors.doctorID = ? ORDER BY patientTimeLine.startTime DESC`
    : `
   SELECT DISTINCT patients.id, patients.hospitalID, patients.deviceID, patients.pID,
   patients.pUHID, patients.ptype, patients.category, patients.pName,
   patients.dob, patients.gender, patients.weight, patients.height,
   patients.phoneNumber, patients.email, patients.address, patients.city,
   patients.state, patients.pinCode, patients.referredBy, patients.photo,
   patientTimeLine.startTime, patientTimeLine.patientEndStatus,
   patientTimeLine.patientStartStatus, patientTimeLine.id AS patientTimeLineID,
   patientTimeLine.wardID
   FROM patientTimeLine
   JOIN patients ON patientTimeLine.patientID = patients.id AND patients.ptype = ?
   WHERE patients.hospitalID = ? 
   AND patientTimeLine.patientEndStatus IS NOT NULL AND patientTimeLine.patientStartStatus=? ORDER BY patientTimeLine.startTime DESC
`;

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
    WHERE patientDoctors.hospitalID = ? AND patientDoctors.active = true AND patientTimeLine.patientEndStatus IS NULL AND patients.ptype=? AND patientDoctors.doctorID = ?`
    : `SELECT patients.id, patients.hospitalID, patients.deviceID, patients.pID, patients.pUHID, patients.ptype, 
    patients.category, patients.pName, patients.dob, 
    patients.gender, patients.weight, patients.height, patients.phoneNumber, patients.email, patients.address, 
    patients.city, patients.state, patients.pinCode, patients.referredBy, patients.photo, patientTimeLine.startTime, 
    patientTimeLine.patientEndStatus, patientTimeLine.patientStartStatus, patientTimeLine.id AS patientTimeLineID, 
    patientTimeLine.wardID, wards.name AS wardName
    FROM patients
    INNER JOIN patientTimeLine ON patients.id = patientTimeLine.patientID 
    LEFT JOIN wards ON patientTimeLine.wardID = wards.id 
    WHERE patients.hospitalID = ? AND patientTimeLine.patientEndStatus IS NULL AND patients.ptype=?`;

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

const queryGetPatientsByTypeAndZone = (
  role
) => `SELECT patients.id,patients.hospitalID,patients.deviceID,patients.pID,patients.zone,
                patients.pUHID,patients.ptype,patients.category,patients.pName,patients.dob,patients.gender,
                patients.weight,patients.height,patients.phoneNumber,patients.email,patients.address,
                patients.city,patients.state,patients.pinCode,patients.referredBy,patients.photo,patientTimeLine.startTime,patientTimeLine.patientEndStatus,patientTimeLine.patientStartStatus,
                patientTimeLine.id AS patientTimeLineID,patientTimeLine.wardID,wards.name AS wardName
                FROM patients
                INNER JOIN patientTimeLine on patients.id=patientTimeLine.patientID 
                LEFT JOIN wards on patientTimeLine.wardID=wards.id
                WHERE patients.hospitalID=? AND patients.ptype=? AND patientTimeLine.startTime=patientTimeLine.endTime AND patients.zone=?`;

// ===================for getting dashboard latest patients======
const queryGetRecentPatientsByType = (role, zone = 0, userID = 0) => {
  let query =
    ROLES_LIST.doctor == role && !zone
      ? `
        SELECT patients.id, patients.hospitalID, patients.deviceID, patients.pID, patients.pUHID, patients.ptype, patients.category, patients.pName, 
        patients.dob, patients.gender, patients.weight, patients.height, 
        patients.phoneNumber, patients.email, patients.address, patients.city, patients.state, patients.pinCode, patients.referredBy, 
        patients.photo, patientTimeLine.startTime 
        FROM patients
        INNER JOIN patientTimeLine ON patients.id = patientTimeLine.patientID
        INNER JOIN patientDoctors ON patientDoctors.patientTimeLineID = patientTimeLine.id AND patientDoctors.active=true  
        WHERE patients.hospitalID = ? 
          AND patients.ptype = ? 
          AND patientTimeLine.patientEndStatus IS NULL  
          AND patientDoctors.doctorID=${userID}
          ${zone ? `AND patientTimeLine.zone = ${zone}` : ""}
        ORDER BY patientTimeLine.startTime DESC 
        LIMIT 10
      `
      : `SELECT patients.id, patients.hospitalID, patients.deviceID, patients.pID, patients.pUHID, patients.ptype, patients.category, patients.pName, 
      patients.dob, patients.gender, patients.weight, patients.height, 
      patients.phoneNumber, patients.email, patients.address, patients.city, patients.state, patients.pinCode, patients.referredBy, 
      patients.photo, patientTimeLine.startTime 
      FROM patients
      INNER JOIN patientTimeLine ON patients.id = patientTimeLine.patientID
      WHERE patients.hospitalID = ? 
        AND patients.ptype = ? 
        AND patientTimeLine.patientEndStatus IS NULL  
        ${zone ? `AND patientTimeLine.zone = ${zone}` : ""}
      ORDER BY patientTimeLine.startTime DESC 
      LIMIT 10`;

  return query;
};

////Get all discharge patients with ward and department filter
const queryGetDischargedPatientsWithFilter = `SELECT patients.id,patients.hospitalID,patients.deviceID,patients.pID,
    patients.pUHID,patients.ptype,patients.category,patients.pName,users.firstName,users.lastName,departments.name as department,patients.dob,patients.gender,
    patients.weight,patients.height,patients.phoneNumber,patients.email,patients.address,
    patients.city,patients.state,patients.pinCode,patients.referredBy,patients.photo,patientTimeLine.startTime,patientTimeLine.endTime,
    patientTimeLine.id AS patientTimeLineID,patientTimeLine.dischargeType,patientTimeLine.diet,
    patientTimeLine.advice,patientTimeLine.followUp,patientTimeLine.followUpDate,patientTimeLine.icd
    FROM patients
    INNER JOIN patientTimeLine on patients.id=patientTimeLine.patientID 
    INNER JOIN users on patientTimeLine.patientID=users.id 
    INNER JOIN departments on users.departmentID=departments.id 
    INNER JOIN wards on patientTimeLine.wardID=wards.id
    WHERE patients.hospitalID=? AND patients.ptype=? AND (departmentID = ? OR ? IS NULL)
    AND (wardID = ? OR ? IS NULL) ORDER BY patientTimeLine.startTime DESC LIMIT 1`;

const queryCountPatientsByType =
  "SELECT COUNT(*) FROM patients WHERE hospitalID=? AND ptype=?";
const queryCountAllPatients =
  "SELECT COUNT(*) FROM patients WHERE hospitalID=?";

const queryPatientVisitByDate =
  "SELECT COUNT(*) FROM patients WHERE hospitalID=? AND addedOn>=? AND addedOn<?";

const queryCountPatientVisitMonthAndYear = `SELECT
COUNT(DISTINCT patientID) AS patient_count_year,
COUNT(DISTINCT CASE WHEN MONTH(startTime) = MONTH(CURDATE()) THEN patientID END) AS patient_count_month
FROM patientTimeLine
WHERE YEAR(startTime) = YEAR(CURDATE()) AND hospitalID=? AND patientStartStatus=?`;

const queryCountPatientVisitMonthAndYearForEmergency = `SELECT
COUNT(DISTINCT patientID) AS patient_count_year,
COUNT(DISTINCT CASE WHEN MONTH(startTime) = MONTH(CURDATE()) THEN patientID END) AS patient_count_month
FROM patientTimeLine
WHERE YEAR(startTime) = YEAR(CURDATE()) AND hospitalID=? AND patientStartStatus=? AND zone=?`;

const queryGetLatestTimeLine =
  "SELECT * FROM patientTimeLine WHERE patientID=? ORDER BY startTime DESC LIMIT 1";
// const queryGetCountBetweenDates = "SELECT COUNT(*) AS count FROM patients WHERE hospitalID=? AND ptype=? AND addedOn BETWEEN ? AND ?";
const queryGetCountBetweenDates =
  "SELECT COUNT(*) AS count FROM patients WHERE hospitalID=? AND addedOn BETWEEN ? AND ?";
const queryUpdatePatient = "UPDATE patients SET ptype=? WHERE id=?";
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
const queryGetPatientForDischarge = `SELECT patients.id AS patientID,patients.ptype,patientTimeLine.id AS patientTimeLineID,
    patientTimeLine.patientStartStatus,patientTimeLine.patientEndStatus,patientTimeLine.wardID AS wardID
    FROM patients 
    LEFT JOIN patientTimeLine
    ON patients.id=patientTimeLine.patientID
    WHERE patients.hospitalID=? AND patientID=? AND patientTimeLine.startTime=patientTimeLine.endTime`;

const queryUpdatePatientRevisit = `UPDATE patients 
    SET ptype=? 
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
    departments.name AS department
    FROM patients
    INNER JOIN patientTimeLine ON patients.id = patientTimeLine.patientID 
    INNER JOIN departments ON patientTimeLine.departmentID = departments.id 
    LEFT JOIN followUp ON followUp.timelineID = patientTimeLine.id
    WHERE patients.hospitalID = ? AND patients.id = ? AND patientTimeLine.startTime = patientTimeLine.endTime 
    ORDER BY followUpAddedOn DESC LIMIT 1`;

const queryGetFullPatientByIDForTriage = `SELECT patients.id,patients.hospitalID,patients.deviceID,patients.pID,
    patients.pUHID,patients.ptype,patients.category,patients.pName,patients.dob,patients.gender,patients.zone,
    patients.weight,patients.height,patients.phoneNumber,patients.email,patients.address,patients.insurance,patients.insuranceNumber,
    patients.insuranceCompany,patients.city,patients.state,patients.pinCode,patients.referredBy,patients.photo
    FROM patients
    WHERE patients.hospitalID=? AND patients.id=?`;

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

const queryGetCalendarCards = `
  SELECT patients.id,patientTimeLine.patientEndStatus,patientTimeLine.startTime,patientTimeLine.endTime 
  FROM patients
  LEFT JOIN patientTimeLine ON patientTimeLine.patientID=patients.id
  WHERE patientTimeLine.startTime = (select MAX(startTime) FROM patientTimeLine WHERE patientID=patients.id)
  AND patients.hospitalID=?`;

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
END AS filter_value, COUNT(DISTINCT patientID) AS count
FROM patientTimeLine
WHERE
hospitalID=? AND patientStartStatus=? AND zone=${zone} AND
CASE
  WHEN @filterOption = 'year' THEN YEAR(startTime) = ${year}
  WHEN @filterOption = 'month' THEN YEAR(startTime) = YEAR(CURDATE()) AND MONTH(startTime) = ${month}
  WHEN @filterOption = 'week' THEN YEAR(startTime) = YEAR(CURDATE()) AND WEEK(startTime) = WEEK(CURDATE()) AND MONTH(startTime) = MONTH(CURDATE())
  ELSE FALSE
END
GROUP BY filter_value;`;
};

const queryDepartmentDistribution = `SELECT
COUNT(*) AS count, departments.name
FROM patientTimeLine pt INNER JOIN departments ON pt.departmentID=departments.id
WHERE
pt.hospitalID=? AND pt.patientStartStatus=? AND 
CASE
  WHEN @filterOption = 'year' THEN YEAR(pt.startTime) = YEAR(CURDATE())
  WHEN @filterOption = 'month' THEN YEAR(pt.startTime) = YEAR(CURDATE()) AND MONTH(pt.startTime) = MONTH(CURDATE())
  WHEN @filterOption = 'week' THEN YEAR(pt.startTime) = YEAR(CURDATE()) AND WEEK(pt.startTime) = WEEK(CURDATE()) AND MONTH(pt.startTime) = MONTH(CURDATE())
  ELSE FALSE
END
GROUP BY pt.departmentID`;

const queryDecreaseWardBed = `UPDATE wards
SET availableBeds = GREATEST(availableBeds - 1, 0)
WHERE id = ?`;

const queryIncreaseWardBed = `UPDATE wards
SET availableBeds = GREATEST(availableBeds + 1, totalBeds)
WHERE id = ?`;

const queryInsertFollowUp = `INSERT INTO followUp (timelineID,date) VALUES (?,?) `;

const queryPatientCountForZone = `SELECT patientTimeLine.zone, COUNT(*) as patient_count
 FROM patientTimeLine
 WHERE patientTimeLine.patientStartStatus = ${patientUtils.patientStatus.emergency} AND hospitalID=? AND patientTimeLine.startTime = patientTimeLine.endTime AND patientTimeLine.zone IS NOT NULL
 GROUP BY patientTimeLine.zone`;

// const queryDoctorData =
//   `SELECT count(*), pt.userID, users.firstName, users.lastName FROM patientTimeLine pt INNER JOIN users ON pt.userID=users.id` +
//   `WHERE hospitalID=? ${filtere}`;

const {
  queryCheckPatientTimeLinePresent
} = require("../queries/patientTimeLine");
module.exports = {
  queryFindPatientByPID,
  queryUpdatePatientByID,
  queryUpdatePatientTimeLineByID,
  queryUpdatePatientTimeLineByIDAddWard,
  queryInsertPatient,
  querySetID,
  queryInsertPatientTimeLine,
  queryInsertPatientTimeLineForTransfer,
  queryInsertTransferPatient,
  queryRevisitPatientTimeLine,
  queryGetPatientsByType,
  queryGetPatientsByTypeAndZone,
  queryGetPatientsForTriage,
  queryGetPatientByTypeWithFilter,
  queryGetPatientByTypeAndZoneWithFilter,
  queryGetNotificationCount,
  queryGetDischargedPatients,
  queryGetDischargedAndOutpatients,
  queryGetDischargedPatientsWithFilter,
  queryGetRecentPatientsByType,
  queryCountPatientsByType,
  queryCountAllPatients,
  queryPatientVisitByDate,
  queryCountPatientVisitMonthAndYear,
  queryCountPatientVisitMonthAndYearForEmergency,
  queryGetLatestTimeLine,
  queryGetCountBetweenDates,
  queryUpdatePatient,
  queryUpdatePatientTimeLine,
  queryUpdatePatientTimeLineForTransfer,
  queryGetPatientByID,
  queryGetDepartmentsPercentage,
  queryGetPatientForDischarge,
  queryUpdatePatientRevisit,
  queryCheckDevicePresent,
  queryGetDevice,
  queryGetFullPatientByID,
  queryGetFullPatientByIDForTriage,
  queryGetSummary,
  queryGetPercentageUseOfDevices,
  queryGetCalendarCards,
  querySetFilterOption,
  queryPatientCountWithFilter,
  queryPatientCountWithFilterForEmergency,
  queryDepartmentDistribution,
  queryDecreaseWardBed,
  queryIncreaseWardBed,
  queryInsertFollowUp,
  queryPatientCountForZone,
  queryCheckPatientTimeLinePresent
};
