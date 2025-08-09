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

const purchaseService = require("../services/purchaseService");

const queryInsertPurchase = `INSERT INTO purchase(hospitalID,purchaseDate,purchaseType,hubCount,deviceCount,totalCost) 
    VALUES (?,?,?,?,?,?)`;
const queryDeletePurchase = `DELETE FROM purchase WHERE id=?`;
const queryGetAllPurchases = `SELECT * FROM purchase WHERE hospitalID=?`;
const queryGetPurchaseByID = `SELECT * FROM purchase WHERE id=?`;

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
const updatePurchase = async (req, res) => {
  const id = req.params.id;
  const data = {
    purchaseDate: req.body.purchaseDate,
    purchaseType: req.body.purchaseType,
    hubCount: req.body.hubCount,
    deviceCount: req.body.deviceCount,
    totalCost: req.body.totalCost
  };
  try {
    const purchase = await purchaseService.updatePurchase(id, data);

    res.status(201).send({
      message: "success",
      purchase: purchase
    });
  } catch (err) {
    if (err.joi) return missingBody(res, `joi :${err.message}`);
    serverError(res, err.message);
  }
};

/**
 * ** METHOD : DELETE
 * ** DESCRIPITON : DELETE PURCHASE ORDER BY ID
 */
const deletePurchase = async (req, res) => {
  const id = req.params.id;
  try {
    await purchaseService.deletePurchase(id);

    res.status(200).send({
      message: "success"
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

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
    serverError(res, err.message);
  }
};

// //
// * ** METHOD : GET
// * ** DESCRIPITON : GET SINGLE PURCHASE ID BY ID
// */

const getPurchaseByID = async (req, res) => {
  const id = req.params.id;

  try {
    const result = await purchaseService.getPurchaseByID(id);

    res.status(200).send({
      message: "success",
      purchase: result
    });
  } catch (err) {
    serverError(res, err.message);
  }
};

module.exports = {
  addPurchase,
  updatePurchase,
  deletePurchase,
  getAllPurchases,
  getPurchaseByID
};
