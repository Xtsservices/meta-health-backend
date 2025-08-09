const createcheckLeaveQuery = `SELECT doctorName FROM onleave WHERE date = ? AND hospitalID=?`;

const createcheckRoosterQuery = `
    SELECT id FROM rooster WHERE date = ? AND shiftID = ? AND hospitalID= ?
  `;
const createRoosterQuery = `
  INSERT INTO rooster (date, shiftID,hospitalID)
  VALUES (?, ?,?)
`;

// Insert staff members into onduty table for the created rooster
const createinsertOndutyQuery = `
        INSERT INTO onduty (roosterID, staffID, doctorName, departmentName,hospitalID)
        VALUES (?, ?, ?, ?,?)
      `;
const createfetchRoosterQuery = `
      SELECT * FROM rooster WHERE id = ?
    `;
const checkShiftQuery = `SELECT id FROM shift WHERE id = ?`;

// ==================update queries==================
// Check if the rooster entry exists
const updatecheckRoosterQuery = `
SELECT id FROM rooster WHERE id = ? AND hospitalID = ?
`;
// Check if any staff members are on leave for the specified date
const updatecheckLeaveQuery = `SELECT doctorName FROM onleave WHERE date = ? AND hospitalID = ?`;

// Update the rooster entry
const updateRoosterQuery = `
  UPDATE rooster 
  SET date = ?, shiftID = ? 
  WHERE id = ? AND hospitalID = ?
`;
// Update staff members in onduty table for the updated rooster
const deleteOndutyQuery = `
 DELETE FROM onduty 
 WHERE roosterID = ? AND hospitalID = ?
`;

const insertOndutyQuery = `
INSERT INTO onduty (roosterID, staffID, doctorName, departmentName, hospitalID)
VALUES (?, ?, ?, ?, ?)
`;

const fetchRoosterQuery = `
SELECT * FROM rooster WHERE id = ?
`;

// ========create =================
// Insert the new shift into the database
const createShiftquery = `
 INSERT INTO shift (startTime, endTime, active, hospitalID)
 VALUES (?, ?, ?, ?);
`;
const createShiftgetShiftQuery = `SELECT * FROM shift WHERE id=?`;

// ======create leasve entires===========
// Insert leave entries into the onleave table
const insertLeaveQuery = `
  INSERT INTO onleave (staffID, doctorName, departmentName, date, hositalID)
  VALUES (?, ?, ?, ?,?)
`;

// Delete the leave entry for the provided staffID and date
const deleteLeaveQuery = `
  DELETE FROM onleave
  WHERE staffID = ? AND date = ? AND hospitalID = ?
`;

// Get count of staff on duty for the current date
const getStaffStatusonDutyQuery = `
SELECT COUNT(*) AS count FROM onduty WHERE hospitalID = ? AND date = ?
`;

const getRoosterListByMonthAndYearQuery = `
      SELECT rooster.id,rooster.date, rooster.shiftID, onduty.staffID, onduty.doctorName, onduty.departmentName,shift.startTime, shift.endTime
      FROM rooster
      LEFT JOIN onduty ON rooster.id = onduty.roosterID
      LEFT JOIN shift ON rooster.shiftID = shift.id
      WHERE YEAR(rooster.date) = ? 
        AND MONTH(rooster.date) = ? 
        AND rooster.hospitalID = ? 
        AND shift.active = true;
      `;
// Fetch all shifts from the database
const getAllShiftsquery = `
SELECT * FROM shift WHERE hospitalID=? AND active=?;
`;

// Update the shift to make it inactive
const deactivateShiftquery = `
 UPDATE shift SET active =? WHERE id = ? AND hospitalID=?
`;

module.exports = {
  checkShiftQuery,
  createcheckLeaveQuery,
  createcheckRoosterQuery,
  createRoosterQuery,
  createinsertOndutyQuery,
  createfetchRoosterQuery,
  updatecheckRoosterQuery,
  updatecheckLeaveQuery,
  updateRoosterQuery,
  deleteOndutyQuery,
  insertOndutyQuery,
  fetchRoosterQuery,
  createShiftquery,
  createShiftgetShiftQuery,
  insertLeaveQuery,
  deleteLeaveQuery,
  getStaffStatusonDutyQuery,
  getRoosterListByMonthAndYearQuery,
  getAllShiftsquery,
  deactivateShiftquery
};
