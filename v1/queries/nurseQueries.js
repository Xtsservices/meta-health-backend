const getAllHeadNurseFromHospitalQuery = `
SELECT 
d.name as departmentName,
CONCAT(u.firstName, ' ', u.lastName) AS name,
u.id as userId,
u.departmentID,
u.scope,
u.hospitalID
from 
users as u
LEFT JOIN departments AS d ON u.departmentID = d.id
where role = 2002 AND u.hospitalID=?;
`;
const getHeadNurseAllNurseFromHospitalQuery = `WITH RECURSIVE RecursiveUserHierarchy AS (
    -- Start with the main user (e.g., id = 547)
    SELECT 
        u.id AS userId,
        CONCAT(u.firstName, ' ', u.lastName) AS name,
        u.role,
        u.reportTo
    FROM users AS u
    WHERE u.id = ?

    UNION ALL

    -- Get users who report to the above user(s)
    SELECT 
        u2.id AS userId,
        CONCAT(u2.firstName, ' ', u2.lastName) AS name,
        u2.role,
        u2.reportTo
    FROM users AS u2
    INNER JOIN RecursiveUserHierarchy r ON u2.reportTo = r.userId
)

SELECT 
    r.userId AS id,
    r.name,
    r.role
FROM RecursiveUserHierarchy r;
`;

const getuserScopesDepartment =
    "SELECT scope ,departmentID from users where id=?";

let getnursedashboardcountsquery = `
SELECT 
    COUNT(DISTINCT CASE WHEN p.ptype != 21 AND pt.patientStartStatus IN (?) THEN pt.patientID END) AS activePatients,
    COUNT(DISTINCT CASE WHEN p.ptype = 21 AND pt.patientStartStatus IN (?) THEN pt.patientID END) AS dischargedPatients,
    COUNT(DISTINCT CASE WHEN pt.followUp = 1 AND pt.patientStartStatus IN (?) THEN pt.patientID END) AS followUpPatients
FROM 
    patients AS p
LEFT JOIN 
    patientTimeLine AS pt 
    ON p.id = pt.patientID
WHERE 
    p.hospitalID = ?
    AND pt.departmentID = ?
`;


let getnursedashbaordMedicinesCount = `
select count(*) as medicineAlerts 
from medicines
LEFT JOIN medicineReminders ON medicines.id=medicineReminders.medicineID
LEFt JOIN patientTimeLine As pt ON medicines.timeLineID = pt.id
where
medicineReminders.dosageTime > ?
AND pt.hospitalID = ?
AND pt.departmentID = ?
AND pt.patientStartStatus IN (?)
AND pt.patientEndStatus IS NULL
`;
const addstaffLeavesquery = `
INSERT INTO staffLeaves(hospitalID,approvedBy,userID,fromDate,toDate,leaveType) VALUES(?,?,?,?,?,?);
`;
const getstaffleavesQuery = `
SELECT 
staffLeaves.* ,
CONCAT(u.firstName, ' ', u.lastName) AS name
from 
staffLeaves
LEFT JOIN users AS u ON staffLeaves.userID = u.id
where
staffLeaves.approvedBy = ?
AND staffLeaves.hospitalID = ?
`;

const deletestaffleaveQuery = `DELETE FROM staffLeaves WHERE id = ? AND hospitalID = ?`
const deletestaffhiftSchedulQuery = `DELETE FROM staffSchedules WHERE id = ?  AND hospitalID = ?`

const getAttendanceLogsquery = `
SELECT 
    COUNT(DISTINCT CASE 
        WHEN CURDATE() BETWEEN fromDate AND toDate THEN sl.userID 
        END) AS leaveLogs,
    COUNT(DISTINCT u.id) - 
    COUNT(DISTINCT CASE 
        WHEN CURDATE() BETWEEN fromDate AND toDate THEN sl.userID 
        END) AS presentLogs
FROM 
    users u
LEFT JOIN 
    staffLeaves sl ON u.id = sl.userID 
WHERE 
	u.hospitalID = ?
    AND u.reportTo = ?
    
  `;

const getheadnursepatientsquery = `

SELECT 
    p.id, p.hospitalID, p.deviceID, p.pID, p.pUHID, p.ptype, 
    p.category, p.pName, 
    CONCAT(u.firstName, ' ', u.lastName) AS doctorName, 
    dept_timeline.name AS department, 
    p.dob, p.gender, p.weight, p.height, p.phoneNumber, p.email, 
    p.address, p.city, p.state, p.pinCode, p.referredBy, p.photo, 
    pt.startTime, pt.patientEndStatus, pt.patientStartStatus, 
    pt.id AS patientTimeLineID, pt.wardID, w.name AS wardName, pt.followUp,pt.followUpDate,pt.zone
FROM 
    patients p
INNER JOIN (
    SELECT patientID, id, startTime, patientEndStatus, patientStartStatus, wardID, departmentID,followUp,followUpDate,zone
    FROM patientTimeLine
    WHERE departmentID = ?
    AND patientStartStatus IN (?)
    AND id = (
        SELECT id 
        FROM patientTimeLine pt2 
        WHERE pt2.patientID = patientTimeLine.patientID 
        AND pt2.departmentID = ?
        AND pt2.patientStartStatus IN (?)
        ORDER BY pt2.startTime DESC 
        LIMIT 1
    )
) pt ON p.id = pt.patientID
INNER JOIN 
    departments AS dept_timeline ON pt.departmentID = dept_timeline.id
INNER JOIN (
    SELECT patientTimeLineID, doctorID, hospitalID
    FROM patientDoctors
    WHERE active = true
    AND id = (
        SELECT id 
        FROM patientDoctors pd2 
        WHERE pd2.patientTimeLineID = patientDoctors.patientTimeLineID 
        AND pd2.active = true
        ORDER BY pd2.assignedDate DESC  -- Latest doctor by assignedDate
        LIMIT 1
    )
) pd ON pd.patientTimeLineID = pt.id AND pd.hospitalID = p.hospitalID
INNER JOIN 
    users u ON pd.doctorID = u.id 
LEFT JOIN 
    wards w ON pt.wardID = w.id 
WHERE
    p.hospitalID = ?
`;

const getnursepatientsquery = "";

const medicationAlertsQuery = `

SELECT 
    p.id AS patientId, 
    p.pName, 
    w.name AS ward, 
    d.name AS department, 
    m.medicationTime, 
    pt.id AS timeLine,
   GROUP_CONCAT(DISTINCT DATE_FORMAT(mr.dosageTime, '%Y-%m-%d %h:%i %p') ORDER BY mr.dosageTime SEPARATOR ', ') AS dosageTimes
FROM medicines AS m
LEFT JOIN medicineReminders AS mr ON m.id = mr.medicineID
LEFT JOIN patientTimeLine AS pt ON m.timeLineID = pt.id
LEFT JOIN patients AS p ON pt.patientID = p.id
LEFT JOIN wards AS w ON pt.wardID = w.id
LEFT JOIN departments AS d ON pt.departmentID = d.id
WHERE 
    DATE(mr.dosageTime) = CURDATE()  
    AND pt.hospitalID = ?
    AND pt.departmentID = ?
    AND pt.patientStartStatus IN (?)
    AND pt.patientEndStatus IS NULL
    AND pt.id = (
        SELECT MAX(id) 
        FROM patientTimeLine 
        WHERE patientID = pt.patientID
    )
GROUP BY p.id, p.pName, w.name, d.name, m.medicationTime;

`;

const addshiftschedulequery = `INSERT INTO staffSchedules (
    hospitalID, 
    userID, 
    departmentID, 
    wardID, 
    fromDate, 
    toDate, 
    shiftTimings, 
    scope,
    addedBy
) VALUES (?, ?, ?, ?, ?, ?, ?, ?,?
);`;

const getshiftscheduleQuery = `

SELECT 
ss.*, 
CONCAT(u.firstName, ' ', u.lastName) AS name ,
d.name AS departmenName,
w.name AS wardName
from staffSchedules AS ss
 INNER JOIN users AS u ON ss.userID = u.id 
 INNER JOIN departments AS d ON ss.departmentID = d.id
 INNER JOIN wards AS w ON ss.wardID = w.id
 where 
 ss.addedBy = ? 
 AND ss.hospitalID = ?;
`

const getmyshiftscheduleQuery = `
SELECT 
    ss.id,
    ss.userID,
    ss.hospitalID,
    ss.fromDate,
    ss.toDate,
    ss.shiftTimings,
    ss.scope,
    ss.addedOn,
    ss.updatedOn,
    w.name AS wardName,
    d.name AS departmentName,
    sl.fromDate AS leaveFrom,
    sl.toDate AS leaveTo,
    sl.leaveType
FROM staffSchedules AS ss
LEFT JOIN wards AS w ON ss.wardID = w.id
LEFT JOIN departments AS d ON ss.departmentID = d.id
LEFT JOIN staffLeaves AS sl ON ss.userID = sl.userID 
    AND ss.hospitalID = sl.hospitalID
    AND sl.fromDate >= NOW()
WHERE ss.hospitalId = ? 
    AND ss.userID = ? 
ORDER BY ss.id DESC


`;

const getstaffleavesCountQuery = `
SELECT 
    COALESCE(MAX(totalLeaves), 21) AS totalLeaves,
    COALESCE(SUM(CASE 
        WHEN approvedBy IS NOT NULL 
        AND YEAR(fromDate) = ? 
        THEN DATEDIFF(toDate, fromDate) + 1 
        ELSE 0 
    END), 0) AS approvedLeaves,
    COALESCE(MAX(totalLeaves), 21) - COALESCE(SUM(CASE 
        WHEN approvedBy IS NOT NULL 
        AND YEAR(fromDate) = ? 
        THEN DATEDIFF(toDate, fromDate) + 1 
        ELSE 0 
    END), 0) AS pendingLeaves
FROM staffLeaves 
WHERE hospitalID = ? 
AND userID = ? 
AND YEAR(fromDate) = ?
`
module.exports = {
    getAllHeadNurseFromHospitalQuery,
    getnursedashboardcountsquery,
    getuserScopesDepartment,
    getnursedashbaordMedicinesCount,
    addstaffLeavesquery,
    getAttendanceLogsquery,
    getheadnursepatientsquery,
    getnursepatientsquery,
    medicationAlertsQuery,
    getHeadNurseAllNurseFromHospitalQuery,
    addshiftschedulequery,
    getmyshiftscheduleQuery,
    getstaffleavesQuery,
    getshiftscheduleQuery,
    deletestaffleaveQuery,
    deletestaffhiftSchedulQuery,
    getstaffleavesCountQuery
};
