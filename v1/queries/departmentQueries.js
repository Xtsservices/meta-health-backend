const queryExistingDepartments =
  "SELECT COUNT(*) as count FROM departments WHERE hospitalID=? AND name IN (?)";
const insertDepartments = `INSERT INTO departments(hospitalID,name,description) VALUES ?`;
const getByID = "SELECT * FROM departments WHERE hospitalID=? AND id=?";
const getdepartmentByID = "SELECT * FROM departments WHERE id=?";
const getAll = "SELECT * FROM departments WHERE hospitalID=? INNER JOIN ";
const getAllDepartmentsWithUserCount = `SELECT departments.id,departments.hospitalID,departments.name,departments.description,
  departments.addedOn,departments.lastModified,count(users.id) as count
  FROM departments 
  LEFT JOIN users ON departments.id=users.departmentID
  WHERE departments.hospitalID=?
  GROUP BY departments.id order BY departments.addedOn DESC`;
const updateDep =
  "UPDATE departments SET name=?,description=? WHERE hospitalID=? AND id=?";
const deleteDep = "DELETE FROM departments WHERE hospitalID=? AND id=?";

module.exports = {
  queryExistingDepartments,
  insertDepartments,
  getByID,
  getAll,
  getAllDepartmentsWithUserCount,
  updateDep,
  deleteDep,
  getdepartmentByID
};
