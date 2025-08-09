const {
  serverError,
  missingBody,
  resourceNotFound
} = require("../utils/errors");

const departmentServices = require("../services/departmentService");

/**
 * ** METHOD : POST
 * ** DESCRIPTION : Add Multiple departments
 */

const addDepartments = async (req, res) => {
  const hospitalID = req.params.hospitalID;
  const departments = req.body.departments;
  if (!hospitalID) return missingBody(res, "hospitalID missing");
  if (!departments || departments.length === 0)
    return missingBody(res, "no departments have been added");
  try {
    const result = await departmentServices.addDepartments(
      hospitalID,
      departments
    );
    res.status(201).send({
      message: "success",
      departments: result
    });
  } catch (err) {
    if (err.isJoi === true) {
      return missingBody(res, err.message);
    }
    serverError(res, err.message);
  }
};

const getDepartmentByID = async (req, res) => {
  const id = req.params.id;
  if (!id) return missingBody(res, "missing id");
  try {
    const results = await departmentServices.getDepartmentByID(id);
    if (results[0].length == 0)
      return resourceNotFound(res, "No Department Found");
    res.status(200).send({
      message: "success",
      department: results[0]
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

/**
 * ** METHOD : GET
 * ** GET DEPARTMENT BY ID
 */
const getDepartment = async (req, res) => {
  const hospitalID = req.params.hospitalID;
  const id = req.params.id;
  if (!hospitalID) return missingBody(res, "hospitalID missing");
  if (!id) return missingBody(res, "missing id");
  try {
    const results = await departmentServices.getDepartment(hospitalID, id);
    if (results[0].length == 0)
      return resourceNotFound(res, "No Department Found");
    res.status(200).send({
      message: "success",
      department: results[0][0]
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

/**
 * ** METHOD :  GET
 * ** DESCRIPTION : GET ALL DEPARTMENTS IN HOSPITAL
 */
const getAllDepartments = async (req, res) => {
  const hospitalID = req.params.hospitalID;
  if (!hospitalID) return missingBody(res, "hospitalID missing");
  try {
    const results = await departmentServices.getAllDepartments(hospitalID);
    res.status(200).send({
      message: "success",
      departments: results[0],
      hospitalID
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

/**
 * ** METHOD : PUT
 * ** DESCRIPTION : UPDATE DEPARTMENT
 */
const updateDepartment = async (req, res) => {
  const id = req.params.id;
  const hospitalID = req.params.hospitalID;
  if (!hospitalID) return missingBody(res, "hospitalID missing");
  if (!id) return missingBody(res, "missing id");
  const { name, description } = req.body;
  if (!name) return missingBody(res, "missing body");
  try {
    const results = await departmentServices.updateDepartment(
      id,
      hospitalID,
      name,
      description
    );
    res.status(200).send({
      message: "success",
      department: results
    });
  } catch (err) {
    if (err.isJoi === true) return missingBody(res, err.message);
    serverError(res, err.message);
  }
};

const deleteDepartment = async (req, res) => {
  const id = req.params.id;
  const hospitalID = req.params.hospitalID;
  try {
    const results = await departmentServices.deleteDepartment(id, hospitalID);
    const { affectedRows } = results[0];
    if (!affectedRows) return resourceNotFound(res, "failed to delete");
    res.status(200).send({
      message: "success"
    });
  } catch (err) {
    if (err.isJoi === true) return missingBody(res, err.message);
    serverError(res, err.message);
  }
};

module.exports = {
  addDepartments,
  getDepartment,
  getAllDepartments,
  updateDepartment,
  deleteDepartment,
  getDepartmentByID
};
