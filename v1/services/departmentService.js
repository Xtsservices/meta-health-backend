const { schema } = require("../helper/validators/departmentValidator");
const pool = require("../db/conn");

const {
  queryExistingDepartments,
  insertDepartments,
  getByID,
  getAll,
  getAllDepartmentsWithUserCount,
  updateDep,
  deleteDep,
  getdepartmentByID
} = require("../queries/departmentQueries");

const addDepartments = async (hospitalID, departments) => {
  const existingDepartments = await pool.query(queryExistingDepartments, [
    hospitalID,
    departments.map((department) => department.name)
  ]);
  console.log(`existing departments : ${existingDepartments[0][0].count}`);
  const existingCount = existingDepartments[0][0].count;
  if (existingCount > 0) return "one or more departments with same name exist";
  // Validate each department in the list
  const validatedDepartments = await Promise.all(
    departments.map(async (department) => {
      return await schema.validateAsync(department);
    })
  );

  const values = validatedDepartments.map((department) => {
    return [
      hospitalID,
      department.name.toLowerCase(),
      department.description || ""
    ];
  });
  // console.log(`values = ${values}`);

  // Insert all departments into the database
  const result = await pool.query(insertDepartments, [values], true);
  let count = result[0].insertId - 1;
  const response = validatedDepartments.map((department) => {
    count += 1;
    return {
      id: count,
      name: department.name,
      description: department.description
    };
  });
  console.log(result);
  return response;
};

const getDepartmentByID = async (id) => {
  const results = await pool.query(getdepartmentByID, [id]);
  return results;
};

/**
 * ** METHOD : GET
 * ** GET DEPARTMENT BY ID
 */
const getDepartment = async (hospitalID, id) => {
  const results = await pool.query(getByID, [hospitalID, id]);
  return results;
};

/**
 * ** METHOD :  GET
 * ** DESCRIPTION : GET ALL DEPARTMENTS IN HOSPITAL
 */
const getAllDepartments = async (hospitalID) => {
  const results = await pool.query(getAllDepartmentsWithUserCount, [
    hospitalID
  ]);
  return results;
};

/**
 * ** METHOD : PUT
 * ** DESCRIPTION : UPDATE DEPARTMENT
 */
const updateDepartment = async (id, hospitalID, name, description) => {
  const results = await pool.query(getByID, [hospitalID, id]);
  if (results[0].length == 0) return "No Department Found";
  const foundDep = results[0][0];
  foundDep.name = name || foundDep.name;
  foundDep.description = description || foundDep.description;
  await pool.query(updateDep, [
    foundDep.name,
    foundDep.description,
    hospitalID,
    id
  ]);
  return foundDep;
};

const deleteDepartment = async (id, hospitalID) => {
  const results = await pool.query(deleteDep, [hospitalID, id]);
  return results;
};

module.exports = {
  addDepartments,
  getDepartment,
  getAllDepartments,
  updateDepartment,
  deleteDepartment,
  getDepartmentByID
};
