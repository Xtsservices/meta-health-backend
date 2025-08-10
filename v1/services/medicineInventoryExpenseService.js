const pool = require("../db/conn");

const {
  querySearchMedicineExist,
  queryInsertMedicineInventory,
  queryUpdateQuantity
} = require("../queries/medicineInventoryQueries");

const {
  queryGetManufacturePresent,
  queryInsertManufactureData,
  queryGetAgencyAndManufacturePresent
} = require("../queries/medicineInventoryManufactureQueries");

const {
  queryInsertExpenseData,
  queryGetInventoryExpense
} = require("../queries/medicineInventoryExpenseQueries");

const AddInventoryExpense = async (hospitalID, medicineList) => {
  try {
    console.log("am in===")
    const groupedData = medicineList.reduce((acc, item) => {
      if (!acc[item.agencyName]) acc[item.agencyName] = [];
      acc[item.agencyName].push(item);
      return acc;
    }, {});

    const agencyWiseData = Object.entries(groupedData).map(
      ([agencyName, items]) => ({ agencyName, items })
    );
console.log("agencywise==",agencyWiseData)
    for (const { agencyName, items } of agencyWiseData) {
      const manufactureData = items[0];

      let [response] = await pool.query(queryGetAgencyAndManufacturePresent, [
        hospitalID,
        agencyName,
        manufactureData.manufacturer
      ]);
console.log("res===", response)
      let insertID;
      if (response.length === 0) {
        const [insertResponse] = await pool.query(queryInsertManufactureData, [
          hospitalID,
          agencyName,
          manufactureData.contactNo,
          manufactureData.email,
          manufactureData.agentCode,
          manufactureData.manufacturer
        ]);
        console.log("insertResponse===",insertResponse)
        if (insertResponse.affectedRows <= 0)
          return { status: 500, message: "Unable to insert manufacture data" };
        insertID = insertResponse.insertId;
      } else {
        insertID = response[0].id;
      }

      const [expenseResponse] = await pool.query(queryInsertExpenseData, [
        hospitalID,
        JSON.stringify(items),
        insertID
      ]);
      console.log("expenseResponse==",expenseResponse)
      if (expenseResponse.affectedRows <= 0)
        return { status: 500, message: "Unable to insert expense data" };
    }

    return {
      status: 200,
      message: "All data inserted and emails sent successfully"
    };
  } catch (error) {
    return { status: 500, message: error.message };
  }
};

const ReorderOrReplaceMedicine = async (
  hospitalID,
  medicineList,
  manufactureData
) => {
  try {
    let finalResponse;
    for (let i = 0; i < medicineList.length; i++) {
      let newStock = medicineList[i];
      let medName = newStock.name;

      // Check if manufacturer is already present
      let [existingManufacture] = await pool.query(queryGetManufacturePresent, [
        hospitalID,
        newStock.agencyName
      ]);

      let insertID;

      if (existingManufacture.length === 0) {
        // Insert new manufacturer data
        const [insertResponse] = await pool.query(queryInsertManufactureData, [
          hospitalID,
          newStock.agencyName,
          newStock.contactNo || null,
          newStock.email || null,
          newStock.agentCode || null,
          newStock.manufacturer || null
        ]);

        if (insertResponse.affectedRows <= 0) {
          return {
            status: 500,
            message: "Unable to insert manufacturer data"
          };
        }
        insertID = insertResponse.insertId;
      } else {
        insertID = existingManufacture[0].id;
      }

      // isReordered status change to 1
      const queryUpdateisReordered =
        "UPDATE medicineInventory SET isReordered=1 WHERE name=?";
      await pool.query(queryUpdateisReordered, [medName]);

      // Insert expense data
      const [expenseResponse] = await pool.query(queryInsertExpenseData, [
        hospitalID,
        JSON.stringify([newStock]),
        insertID
      ]);

      finalResponse = expenseResponse; // Store last response
    }

    if (finalResponse && finalResponse.affectedRows > 0) {
      return { status: 200, data: finalResponse };
    }
  } catch (error) {
    return { status: 500, message: error.message };
  }
};

const getInventoryExpenseData = async (hospitalID) => {
  try {
    let [response] = await pool.query(queryGetInventoryExpense, [hospitalID]);

    if (response.length == 0) {
      return { status: 200, data: [] };
    }

    if (response.length > 0) {
      return { status: 200, data: response };
    }
  } catch (error) {
    return { status: 500, message: error.message };
  }
};

module.exports = {
  AddInventoryExpense,
  getInventoryExpenseData,
  ReorderOrReplaceMedicine
};
