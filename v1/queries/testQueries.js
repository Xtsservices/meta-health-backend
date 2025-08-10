const queryExistingTests =
  "SELECT COUNT(*) as count FROM tests WHERE timeLineID=? AND test IN (?)";
const insertTests =
  "INSERT INTO tests(timeLineID,patientID,userID,hospitalID, test, addedOn,loinc_num_,status,alertStatus,category, testID) VALUES ?";
const queryGetAllTests = "SELECT * FROM tests WHERE patientID=?";
const queryGetTestByID = "SELECT * FROM tests WHERE timeLineID=? AND id=?";
const queryDeleteTestsByID = "DELETE FROM tests WHERE timeLineID=? AND id=?";
const queryGetTestsByIDs = "SELECT * FROM tests WHERE id IN (?)";
const queryGetAlertsDetails = `SELECT tests.*, patientTimeLine.patientID ,patients.pID, patients.pName, patientDoctors.doctorID , users.firstName as doctor_firstName, users.lastName as doctor_lastName, users.departmentID, wards.name as ward_name, patients.ptype FROM tests 
LEFT JOIN patientTimeLine on tests.timeLineID = patientTimeLine.id 
LEFT JOIN patients on  patientTimeLine.patientID = patients.id
LEFT JOIN patientDoctors on tests.timeLineID = patientDoctors.patientTimeLineID AND patientDoctors.active=true AND patientDoctors.category = "primary"
LEFT JOIN users on patientDoctors.doctorID=users.id 
LEFT JOIN wards on patientTimeLine.wardID=wards.id
WHERE tests.hospitalID = ? and tests.category = ? AND tests.alertStatus="pending" order by id desc`;
//TODO:for reference
// const queryGetPatientCountYearAndMonth = `SELECT COUNT(DISTINCT tests.timeLineID) AS patient_count_year,
// COUNT(DISTINCT CASE WHEN MONTH(approved_status) = MONTH(CURDATE()) THEN tests.timeLineID END) AS patient_count_month
// FROM tests
// WHERE YEAR(approved_status) = YEAR(CURDATE()) AND hospitalID=? AND category = ? AND alertStatus = ?`;

const queryGetPatientCountYearAndMonth = `
  SELECT 
    COUNT(DISTINCT CASE WHEN YEAR(addedOn) = YEAR(CURDATE()) THEN tests.timeLineID END) AS patient_count_year,
    COUNT(DISTINCT CASE 
      WHEN YEAR(addedOn) = YEAR(CURDATE()) 
      AND MONTH(addedOn) = MONTH(CURDATE()) 
      THEN tests.timeLineID 
    END) AS patient_count_month
  FROM tests
  WHERE hospitalID = ? 
    AND category = ? 
    AND userID = ?
    AND tests.alertStatus = "approved"
`;

const queryGetPatientCountBetweenDates = `SELECT COUNT(DISTINCT tests.timeLineID) AS count
FROM tests
WHERE hospitalID = ? AND category = ? AND approved_status BETWEEN ? AND ? `;

// const queryGetAllPatientList = `SELECT distinct tests.timeLineID, tests.userID, tests.status, patientTimeLine.patientID, patients.pID, patients.pName, wards.id, wards.name as ward_name, departments.id,  departments.name as department_name , patients.photo, patients.phoneNumber
// FROM tests
// LEFT JOIN patientTimeLine on tests.timeLineID = patientTimeLine.id
// LEFT JOIN departments on patientTimeLine.departmentID = departments.id
// LEFT JOIN patients on  patientTimeLine.patientID = patients.id
// LEFT JOIN wards on patientTimeLine.wardID=wards.id
// WHERE tests.hospitalID = ?  and tests.category = ? and tests.userID = ? AND tests.isViewed=1
// GROUP BY tests.timeLineID;`;

const queryGetAllPatientList = `SELECT
    tests.timeLineID,
    MAX(tests.userID) AS userID,
    MAX(tests.status) AS status,
    MAX(patientTimeLine.patientID) AS patientID,
    MAX(patients.pID) AS pID,
    MAX(patients.pName) AS pName,
    MAX(wards.id) AS ward_id,
    MAX(wards.name) AS ward_name,
    MAX(departments.id) AS department_id,
    MAX(departments.name) AS department_name,
    MAX(patients.photo) AS photo,
    MAX(patients.phoneNumber) AS phoneNumber,
    MAX(patients.ptype) AS ptype,
    MAX(patientTimeLine.patientStartStatus) AS patientStartStatus
FROM tests
LEFT JOIN patientTimeLine ON tests.timeLineID = patientTimeLine.id
LEFT JOIN departments ON patientTimeLine.departmentID = departments.id
LEFT JOIN patients ON patientTimeLine.patientID = patients.id
LEFT JOIN wards ON patientTimeLine.wardID = wards.id
WHERE tests.hospitalID = ?
  AND tests.category = ?
  AND tests.alertStatus = 'approved'
GROUP BY tests.timeLineID
HAVING SUM(
    CASE WHEN tests.status IN ('pending', 'processing') THEN 1 ELSE 0 END
) > 0
ORDER BY MAX(tests.id) DESC;
`;

const queryGetPatientDetails = `SELECT tests.*, patientTimeLine.patientID ,patients.pID, patients.pName,patients.city,patients.state, patientDoctors.doctorID , users.firstName as doctor_firstName, users.lastName as doctor_lastName, wards.name as ward_name FROM tests 
LEFT JOIN patientTimeLine on tests.timeLineID = patientTimeLine.id 
LEFT JOIN patients on  patientTimeLine.patientID = patients.id
LEFT JOIN patientDoctors on tests.timeLineID = patientDoctors.patientTimeLineID AND patientDoctors.category = "primary"
LEFT JOIN users on patientDoctors.doctorID=users.id 
LEFT JOIN wards on patientTimeLine.wardID=wards.id
WHERE tests.hospitalID = ?  and tests.category = ? and tests.timeLineID = ? and tests.alertStatus='approved' and tests.status IN ('pending', 'processing');`;

const queryGetWalkinPatientDetails = `SELECT walkinPatientsTests.*,  users.firstName as doctor_firstName, users.lastName as doctor_lastName FROM walkinPatientsTests 


LEFT JOIN users on walkinPatientsTests.userID=users.id 

WHERE walkinPatientsTests.hospitalID = ?  and walkinPatientsTests.id = ? ;`;

const queryUpdateStatus = `UPDATE tests SET status = ? WHERE id = ? `;
const getAllLabTestPridingByHospitalId = `
  SELECT 
    lp.id AS pricingID,
    lp.hospitalID,
    lp.labTestID,
    lt.LOINC_Name AS testName,
    lt.LOINC_Code As lonicCode,
    lt.Department,
    lp.testPrice,
    lp.gst,
    lp.hsn,
    lp.addedOn,
    lp.updatedOn
  FROM labTestPricing lp
  LEFT JOIN LabTests lt ON lp.labTestID = lt.id
  WHERE lp.hospitalID = ? AND lt.Department =? AND isActive=1
`;

const queryGetBillingDetails = `SELECT tests.*, patientTimeLine.patientID ,patients.pID, patients.pName, patientDoctors.doctorID , users.firstName as doctor_firstName, users.lastName as doctor_lastName, users.departmentID, wards.name as ward_name, patients.ptype,
 payment.totalAmount, 
        payment.paidAmount, 
        payment.dueAmount, 
        payment.discount, 
        payment.paymentDetails FROM tests 

LEFT JOIN patientTimeLine on tests.timeLineID = patientTimeLine.id 
LEFT JOIN patients on  patientTimeLine.patientID = patients.id
LEFT JOIN patientDoctors on tests.timeLineID = patientDoctors.patientTimeLineID AND patientDoctors.active=true AND patientDoctors.category = "primary"
LEFT JOIN users on patientDoctors.doctorID=users.id 
LEFT JOIN wards on patientTimeLine.wardID=wards.id
LEFT JOIN testPaymentDetails AS payment ON patientTimeLine.patientID = payment.patientID 
WHERE tests.hospitalID = ? and tests.category = ? AND tests.alertStatus=? order by tests.id desc`;

const queryGetAllReportsCompletedPatientList = `SELECT distinct tests.timeLineID, tests.userID, tests.status, patientTimeLine.patientID, patients.pID, patients.pName, wards.id, wards.name as ward_name, departments.id,  departments.name as department_name , patients.photo, patients.phoneNumber, patients.ptype, patientTimeLine.patientStartStatus
FROM tests 
LEFT JOIN patientTimeLine on tests.timeLineID = patientTimeLine.id 
LEFT JOIN departments on patientTimeLine.departmentID = departments.id 
LEFT JOIN patients on  patientTimeLine.patientID = patients.id
LEFT JOIN wards on patientTimeLine.wardID=wards.id
WHERE tests.hospitalID = ?  and tests.category = ? and tests.alertStatus = 'approved' and tests.status = 'completed'
GROUP BY tests.timeLineID;`;

const queryGetAllWalkinReportsCompletedPatientList = `
SELECT wpt.id, wpt.hospitalID, wpt.userID, wpt.pName, wpt.phoneNumber, wpt.city, 
       wpt.addedOn, wpt.pID, wpt.fileName, wpt.testsList, wpt.department
FROM walkinPatientsTests wpt
WHERE wpt.hospitalID = ? 
  AND wpt.department = ? 
  AND JSON_CONTAINS(wpt.testsList, '{"status": "completed"}');
`;

const queryGetReportsCompletedPatientDetails = `SELECT tests.*, patientTimeLine.patientID ,patients.pID, patients.pName, patients.gender, patients.addedOn as patient_admissionDate, patients.dob,patients.state, patients.city, patientDoctors.doctorID , users.firstName as doctor_firstName, users.lastName as doctor_lastName, wards.name as ward_name FROM tests 
LEFT JOIN patientTimeLine on tests.timeLineID = patientTimeLine.id 
LEFT JOIN patients on  patientTimeLine.patientID = patients.id
LEFT JOIN patientDoctors on tests.timeLineID = patientDoctors.patientTimeLineID AND patientDoctors.category = "primary"
LEFT JOIN users on patientDoctors.doctorID=users.id 
LEFT JOIN wards on patientTimeLine.wardID=wards.id
WHERE tests.hospitalID = ?  and tests.category = ?  and tests.timeLineID = ? and tests.alertStatus='approved' and tests.status = 'completed'`;

const queryGetWalkinReportsCompletedPatientDetails = `
SELECT *
FROM walkinPatientsTests 
WHERE hospitalID = ? 
  AND department = ? 
  AND id=?
  AND JSON_CONTAINS(testsList, '{"status": "completed"}');
`;

module.exports = {
  queryExistingTests,
  insertTests,
  queryGetAllTests,
  queryGetTestByID,
  queryDeleteTestsByID,
  queryGetTestsByIDs,
  queryGetAlertsDetails,
  queryGetPatientCountYearAndMonth,
  queryGetPatientCountBetweenDates,
  queryGetAllPatientList,
  queryGetPatientDetails,
  queryUpdateStatus,
  getAllLabTestPridingByHospitalId,
  queryGetBillingDetails,
  queryGetAllReportsCompletedPatientList,
  queryGetReportsCompletedPatientDetails,
  queryGetWalkinPatientDetails,
  queryGetAllWalkinReportsCompletedPatientList,
  queryGetWalkinReportsCompletedPatientDetails
};
