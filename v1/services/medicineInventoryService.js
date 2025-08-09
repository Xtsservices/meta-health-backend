const pool = require("../db/conn");
const { serverError } = require("../utils/errors");

const {
  queryGetMedicineInventory,
  queryInsertMedicineInventory,
  querySearchMedicineExist,
  querychangeIsActiveStatusMedicineInventory
} = require("../queries/medicineInventoryQueries");

const changeIsActiveStatus = async (rowID) => {
  try {
    const [response] = await pool.query(
      querychangeIsActiveStatusMedicineInventory,
      [rowID]
    );
    return {
      status: 200,
      medicines: response
    };
  } catch (error) {
    serverError(error);
  }
};

const getMedicineInventory = async (hospitalID) => {
  try {
    const [response] = await pool.query(queryGetMedicineInventory, [
      hospitalID
    ]);
    console.log("respons====",response)
    if (response.length > 0) {
      return {
        status: 200,
        medicines: response
      };
    } else {
      return {
        status: 204
      };
    }
  } catch (error) {
    serverError(error);
  }
};

const postMedicineInventory = async (hospitalID, newStock) => {
  try {
    let [response] = await pool.query(querySearchMedicineExist, [
      newStock.name,
      hospitalID
    ]);

    if (response.length > 0) {
      return {
        status: 400
      };
    }

    [response] = await pool.query(queryInsertMedicineInventory, [
      hospitalID,
      newStock.name,
      newStock.category,
      newStock.hsn,
      newStock.quantity,
      newStock.costPrice,
      newStock.sellingPrice,
      newStock.manufacturer,
      newStock.location,
      newStock.expiryDate
    ]);

    if (response.affectedRows == 1) {
      return {
        status: 201
      };
    } else {
      return {
        status: 400
      };
    }
  } catch (error) {
    serverError(error);
  }
};

const postMedicineInventoryQuantityUpdate = async (hospitalID, newStock) => {
  try {
    let [response] = await pool.query(querySearchMedicineExist, [
      newStock.name,
      hospitalID
    ]);

    if (response.length > 0) {
      return {
        status: 400
      };
    }

    [response] = await pool.query(queryInsertMedicineInventory, [
      hospitalID,
      newStock.name,
      newStock.category,
      newStock.hsn,
      newStock.quantity,
      newStock.costPrice,
      newStock.sellingPrice,
      newStock.manufacturer,
      newStock.location,
      newStock.expiryDate
    ]);

    if (response.affectedRows == 1) {
      return {
        status: 201
      };
    } else {
      return {
        status: 400
      };
    }
  } catch (error) {
    serverError(error);
  }
};

module.exports = {
  changeIsActiveStatus,
  getMedicineInventory,
  postMedicineInventory,
  postMedicineInventoryQuantityUpdate
};
