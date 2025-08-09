const ROLES_LIST = require("../utils/roles");

// Check for existing wards based on exact combination of name, floor, and room
const queryExistingWards = `
  SELECT name, floor, room 
  FROM wards 
  WHERE hospitalID = ? 
    AND (name, floor, room) IN (?)
`;

const insertWards = `INSERT INTO wards(hospitalID,name,description,totalBeds,availableBeds,Attendees,floor,price,room,amenities,location) VALUES ?`;
const getByID = "SELECT * FROM wards WHERE hospitalID=? AND id=?";
const getAll = "SELECT * FROM wards WHERE hospitalID=? INNER JOIN ";
// const getAllWardsWithUserCount = `SELECT wards.id,wards.hospitalID,wards.name,wards.description,
//   wards.addedOn,wards.lastModified,count(users.id) as count
//   FROM wards
//   LEFT JOIN users ON wards.id=users.wardID
//   WHERE wards.hospitalID=?
//   GROUP BY wards.id`;

// const getAllWardsWithUserCount = `SELECT wards.id,wards.hospitalID,wards.name,wards.description,wards.addedOn,wards.lastModified,wards.totalBeds,wards.availableBeds
//   FROM wards
//   WHERE wards.hospitalID=?
//   GROUP BY wards.id ORDER BY addedOn DESC`;

//////added by pavan all data from wards
const getAllWardsWithUserCount = `SELECT *
  FROM wards 
  WHERE wards.hospitalID=?
  GROUP BY wards.id ORDER BY addedOn DESC`;

const updateWard =
  "UPDATE wards SET name=?,description=?,totalBeds=?,availableBeds=? WHERE hospitalID=? AND id=?";
const deleteWard = "DELETE FROM wards WHERE hospitalID=? AND id=?";
const queryPatientDistribution =
  `SELECT COUNT(*) AS patientCount, wards.name FROM patientTimeLine INNER JOIN wards ON patientTimeLine.wardID=wards.id ` +
  `WHERE patientTimeLine.startTime=patientTimeLine.endTime AND patientTimeLine.hospitalID=? AND patientTimeLine.wardID IS NOT NULL GROUP BY patientTimeLine.wardID`;

// const queryPatientDistributionForStaff = (role) =>
//   `SELECT COUNT(*) AS patientCount, wards.name FROM patientTimeLine INNER JOIN wards ON patientTimeLine.wardID=wards.id ` +
//   `WHERE patientTimeLine.startTime=patientTimeLine.endTime AND patientTimeLine.hospitalID=? AND patientTimeLine.wardID IS NOT NULL GROUP BY patientTimeLine.wardID`;

const queryPatientDistributionForStaff = (role, selectedWardDataFilter) => {
  let dateCondition = "";

  // Determine the date condition based on the selectedWardDataFilter
  switch (selectedWardDataFilter) {
    case "Day":
      dateCondition = `AND DATE(patientTimeLine.startTime) = CURRENT_DATE()`;
      break;
    case "Week":
      dateCondition = `AND WEEK(patientTimeLine.startTime) = WEEK(CURRENT_DATE()) 
                       AND YEAR(patientTimeLine.startTime) = YEAR(CURRENT_DATE())`;
      break;
    case "Month":
      dateCondition = `AND MONTH(patientTimeLine.startTime) = MONTH(CURRENT_DATE()) 
                       AND YEAR(patientTimeLine.startTime) = YEAR(CURRENT_DATE())`;
      break;

    default:
      // No additional date condition for default behavior
      dateCondition = "";
  }

  return `SELECT COUNT(*) AS patientCount, wards.name 
          FROM patientTimeLine 
          INNER JOIN wards ON patientTimeLine.wardID = wards.id 
          WHERE patientTimeLine.startTime <= patientTimeLine.endTime 
            AND patientTimeLine.hospitalID = ? 
            AND patientTimeLine.wardID IS NOT NULL 
            ${dateCondition} 
          GROUP BY patientTimeLine.wardID`;
};

module.exports = {
  queryExistingWards,
  insertWards,
  getByID,
  getAll,
  getAllWardsWithUserCount,
  updateWard,
  deleteWard,
  queryPatientDistribution,
  queryPatientDistributionForStaff
};
