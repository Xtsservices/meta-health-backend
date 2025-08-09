const {
  serverError,
  missingBody,
  resourceNotFound,
  duplicateRecord,
  notAllowed
} = require("../utils/errors");
const pool = require("../db/conn");

// Queries
const getAlltasksById =
  "SELECT * FROM adminTasks WHERE userID=? order by id desc";
const addTaskQuery =
  "INSERT INTO adminTasks (userID, task, status,colour) VALUES (?, ?, ?, ?)";
const updateTaskQuery =
  "UPDATE adminTasks SET task = ?, status = ?, colour = ?, updateon = CURRENT_TIMESTAMP WHERE id = ?";
const deleteTaskQuery = "DELETE FROM adminTasks WHERE id = ?";

/**
 * ** METHOD : POST
 * ** DESCRIPTION : add new tasks
 */
const addnewAdmintask = async (req, res) => {
  const { userID, task, status, colour } = req.body;

  if (!userID || !task) {
    return missingBody(res);
  }

  try {
    const [result] = await pool.query(addTaskQuery, [
      userID,
      task,
      status || "pending",
      colour || "#E1C6F4"
    ]);
    res.status(201).send({
      message: "success",
      id: result.insertId
    });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return duplicateRecord(res);
    }
    serverError(res, err.message);
  }
};

/**
 * ** METHOD : GET
 * ** DESCRIPTION : GET ALL tasks
 */
const getadminalltasks = async (req, res) => {
  const userID = req.userID;

  try {
    const [results] = await pool.query(getAlltasksById, [userID]);

    res.status(200).send({
      message: "success",
      alerts: results
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

/**
 * ** METHOD : POST
 * ** DESCRIPTION : edit tasks
 */
const editAdmintask = async (req, res) => {
  const id = req.params.taskId; // Assume id is passed as a URL parameter
  const { task, status, colour } = req.body;

  if (!task && !status) {
    return missingBody(res);
  }

  try {
    const [result] = await pool.query(updateTaskQuery, [
      task,
      status,
      colour,
      id
    ]);

    if (result.affectedRows === 0) {
      return resourceNotFound(res, `Admin task with id ${id} not found`);
    }

    res.send({
      message: "success"
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

/**
 * ** METHOD : POST
 * ** DESCRIPTION : delete tasks
 */
const deleteAdmintask = async (req, res) => {
  const id = req.params.taskId; // Assume id is passed as a URL parameter

  try {
    const [result] = await pool.query(deleteTaskQuery, [id]);

    if (result.affectedRows === 0) {
      return resourceNotFound(res, `Admin task with id ${id} not found`);
    }

    res.send({
      message: "success"
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

module.exports = {
  addnewAdmintask,
  getadminalltasks,
  editAdmintask,
  deleteAdmintask
};
