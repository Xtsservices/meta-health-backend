const { schema } = require("../helper/validators/wardValidator");
const {
  serverError,
  missingBody,
  resourceNotFound
} = require("../utils/errors");
// const { ROLES_LIST } = require("../utils/roles");
const pool = require("../db/conn");
const ROLES_LIST = require("../utils/roles");

const wardServices = require("../services/wardService");

/**
 * ** METHOD : POST
 * ** DESCRIPTION : Add Multiple departments
 */

const addWards = async (req, res) => {
  const hospitalID = req.params.hospitalID;
  try {
    // request is given as list of departments in the "departments" field
    const wards = req.body;
    //   console.log(`deparments : ${JSON.stringify(wards)}`)
    if (!wards || wards.length === 0) {
      return missingBody(res, "no wards have been added");
    }

    const results = await wardServices.addWards(hospitalID, wards);
    console.log("result=================", results);

    if (results?.error) {
      return missingBody(res, results.error);
    }

    res.status(201).send({
      message: "success",
      wards: results
    });
  } catch (err) {
    if (err.isJoi === true) {
      return missingBody(res, err.message);
    }
    serverError(res, err.message);
  }
};

/**
 * ** METHOD : GET
 * ** GET DEPARTMENT BY ID
 */
const getWard = async (req, res) => {
  const hospitalID = req.params.hospitalID;
  const id = req.params.id;

  try {
    if (!id) return missingBody(res, "missing id");

    const results = await wardServices.getWard(hospitalID, id);

    if (results[0].length == 0) return resourceNotFound(res, "No Ward Found");

    res.status(200).send({
      message: "success",
      ward: results[0][0]
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

/**
 * ** METHOD :  GET
 * ** DESCRIPTION : GET ALL DEPARTMENTS IN HOSPITAL
 */

const getAllWards = async (req, res) => {
  const hospitalID = req.params.hospitalID;
  try {
    const results = await wardServices.getAllWards(hospitalID);
    res.status(200).send({
      message: "success",
      wards: results[0]
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

/**
 * ** METHOD : PUT
 * ** DESCRIPTION : UPDATE DEPARTMENT
 */
const updateSingleWard = async (req, res) => {
  const id = req.params.id;
  const hospitalID = req.params.hospitalID;
  const reqBodyData = req.body;

  console.log("reqBodyData", reqBodyData);

  try {
    const foundDep = await wardServices.updateSingleWardService(
      hospitalID,
      id,
      reqBodyData
    );

    res.status(200).send({
      message: "success",
      ward: foundDep
    });
  } catch (err) {
    if (err.isJoi === true) return missingBody(res, err.message);
    serverError(res, err.message);
  }
};

const deleteSingleWard = async (req, res) => {
  const id = req.params.id;
  const hospitalID = req.params.hospitalID;
  try {
    const results = await wardServices.deleteSingleWard(hospitalID, id);
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

const getPatientCountForAllWards = async (req, res) => {
  // console.log("function called");
  try {
    const filterType = req.query.duration || "month";
    const hospitalID = req.params.hospitalID;
    const categoryFilter = Number(req.query.category) || 0;
    const month = req.query.filterValue || null;
    const year = req.query.filterValue || null;

    const summary = await wardServices.getPatientCountForAllWards(
      filterType,
      hospitalID,
      categoryFilter,
      month,
      year
    );

    return res.status(200).send({
      message: "success",
      summary
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

const patientDistribution = async (req, res) => {
  const hospitalID = req.params.hospitalID;
  try {
    const summary = await wardServices.patientDistribution(hospitalID);

    res.status(200).send({
      message: "success",
      summary
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

const patientDistributionForStaffDashboard = async (req, res) => {
  const hospitalID = req.params.hospitalID;
  const selectedWardDataFilter = req.params.selectedWardDataFilter;
  const role = req.query.role || ROLES_LIST.nurse;
  const userID = req.query.userID;
  try {
    const summary = await wardServices.patientDistributionForStaffDashboard(
      hospitalID,
      role,
      userID,
      selectedWardDataFilter
    );
    res.status(200).send({
      message: "success",
      summary
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

module.exports = {
  addWards,
  getWard,
  getAllWards,
  updateSingleWard,
  deleteSingleWard,
  getPatientCountForAllWards,
  patientDistribution,
  patientDistributionForStaffDashboard
};
