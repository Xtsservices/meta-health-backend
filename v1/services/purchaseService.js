const {
  serverError,
  missingBody,
  resourceNotFound,
  duplicateRecord
} = require("../utils/errors");
const pool = require("../db/conn");
const {
  purchaseSchema,
  udpatePurchaseSchema
} = require("../helper/validators/purchaseValidator");

const {
  queryInsertPurchase,
  queryDeletePurchase,
  queryGetAllPurchases,
  queryGetPurchaseByID
} = require("../queries/purchaseQueries");
/*
 * ** METHOD : POST
 * ** DESCRIPTION : ADD NEW PURCHASE ORDER OF DEVICES FOR HOSPITAL
 */
const addPurchase = async (req, res) => {
  const data = {
    hospitalID: req.params.hospitalID,
    purchaseDate: req.body.purchaseDate,
    purchaseType: req.body.purchaseType,
    hubCount: req.body.hubCount,
    deviceCount: req.body.deviceCount,
    totalCost: req.body.totalCost
  };
  try {
    await purchaseSchema.validateAsync(data);
    const [result] = await pool.query(queryInsertPurchase, [
      data.hospitalID,
      data.purchaseDate,
      data.purchaseType,
      data.hubCount,
      data.deviceCount,
      data.totalCost
    ]);
    if (!result.insertId) return serverError(res, "Failed to add purchase");
    const [purchase] = await pool.query(queryGetPurchaseByID, [
      result.insertId
    ]);
    res.status(201).send({
      message: "success",
      purchase: purchase[0]
    });
  } catch (err) {
    if (err.joi) return missingBody(res, `joi :${err.message}`);
    serverError(res, err.message);
  }
};

/**
 * ** METHOD : PATCH
 * ** DESCRIPTION : UPDATE PURCHASE ORDER
 */
async function updatePurchase(id, data) {
  try {
    await udpatePurchaseSchema.validateAsync(data);
    const dataArray = [];
    const conditions = [];
    for (const key in data) {
      if (data[key] !== null && data[key] !== undefined) {
        conditions.push(`${key}=?`);
        dataArray.push(data[key]);
      }
    }
    if (!conditions.length) throw new Error("no items to update");

    let query = "UPDATE purchase SET ";
    query = query + conditions.join(",") + " WHERE id=?";
    dataArray.push(id);

    const [result] = await pool.query(query, dataArray);

    if (!result.changedRows) throw new Error("Failed to update");

    const [purchase] = await pool.query(queryGetPurchaseByID, [id]);

    return purchase[0];
  } catch (err) {
    if (err.joi) throw new Error(`joi :${err.message}`);
    throw new Error(err.message);
  }
}

/**
 * ** METHOD : DELETE
 * ** DESCRIPITON : DELETE PURCHASE ORDER BY ID
 */
async function deletePurchase(id) {
  try {
    const [result] = await pool.query(queryDeletePurchase, [id]);

    if (!result.affectedRows) throw new Error(res, "Failed to delete");

    return "success";
  } catch (err) {
    throw new Error(err.message);
  }
}

/**
 * ** METHOD : GET
 * ** DESCRIPITON : LIST ALL PURCHASES OF HOSPITAL
 */
const getAllPurchases = async (req, res) => {
  const hospitalID = req.params.hospitalID;
  try {
    const [results] = await pool.query(queryGetAllPurchases, [hospitalID]);
    res.status(200).send({
      message: "success",
      purchases: results
    });
  } catch (err) {
    throw new Error(err.message);
  }
};

// //
// * ** METHOD : GET
// * ** DESCRIPITON : GET SINGLE PURCHASE ID BY ID
// */

async function getPurchaseByID(id) {
  try {
    const [result] = await pool.query(queryGetPurchaseByID, [id]);

    return result[0];
  } catch (err) {
    throw new Error(err.message);
  }
}

module.exports = {
  addPurchase,
  updatePurchase,
  deletePurchase,
  getAllPurchases,
  getPurchaseByID
};
