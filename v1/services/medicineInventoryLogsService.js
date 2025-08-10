const pool = require("../db/conn");

const {
  querySearchMedicineExist,
  queryInsertMedicineInventory,
  queryUpdateQuantity
} = require("../queries/medicineInventoryQueries");

const {
  queryGetManufacturePresent
} = require("../queries/medicineInventoryManufactureQueries");

const {
  queryInsertInventoryLogsData,
  queryGetInventoryLogs
} = require("../queries/medicineInventoryLogsQueries");
const {
  queryInsertExpenseData
} = require("../queries/medicineInventoryExpenseQueries");

const editMedicineInventoryData = async (hospitalID, medicineList, rowId) => {
  try {
    const {
      category,
      quantity,
      gst,
      sellingPrice,
      costPrice,
      hsn,
      lowStockValue
    } = medicineList;

    const updatedOn = new Date();

    const query = `
      UPDATE medicineInventory
      SET category = ?, quantity = ?, gst = ?, sellingPrice = ?,
          costPrice = ?, hsn = ?, lowStockValue = ?, updatedOn = ?
      WHERE id = ? AND hospitalID = ?
    `;

    const values = [
      category,
      quantity,
      gst,
      sellingPrice,
      costPrice,
      hsn,
      lowStockValue,
      updatedOn,
      rowId,
      hospitalID
    ];

    const [response] = await pool.query(query, values);

    if (response.affectedRows > 0) {
      return {
        status: 200,
        message: "Medicine inventory updated successfully"
      };
    } else {
      return {
        status: 404,
        message: "Medicine inventory not found or no changes made"
      };
    }
  } catch (error) {
    return { status: 500, message: error.message };
  }
};

const addInventoryLogs = async (hospitalID, medicineList, user) => {
  try {
    let response;
    const userID = user.id;
    const groupedData = medicineList.reduce((acc, item) => {
      if (!acc[item.agencyName]) {
        acc[item.agencyName] = [];
      }
      acc[item.agencyName].push(item);
      return acc;
    }, {});

    // Convert to an array format
    const agencyWiseData = Object.entries(groupedData).map(
      ([agencyName, items]) => ({
        agencyName,
        items
      })
    );
    // =========================================================================
    for (const agencyData of agencyWiseData) {
      const { agencyName, items } = agencyData;

      // Check if the manufacturer data already exists
      [response] = await pool.query(queryGetManufacturePresent, [
        hospitalID,
        agencyName
      ]);
      console.log("response", response);
      //if there is no agancy foud throw error
      if (response?.length === 0) {
        throw new Error("Agancy Name Not Found");
      }

      for (let i = 0; i < items.length; i++) {
        let newStock = items[i];

        const formattedExpiryDate = new Date(newStock.expiryDate)
          .toISOString()
          .slice(0, 19)
          .replace("T", " ");
        console.log("activehk", newStock);
        const [medicineInsertResponse] = await pool.query(
          queryInsertMedicineInventory,
          [
            hospitalID,
            userID,
            newStock.name,
            newStock.category,
            newStock.hsn,
            newStock.quantity,
            newStock.costPrice,
            newStock.sellingPrice,
            newStock.agencyID,
            formattedExpiryDate,
            newStock.lowStockValue,
            newStock.gst,
            newStock.quantity
          ]
        );
      }
    }
console.log("response233====",response)
    return { status: 200, data: response };
  } catch (error) {
    return { status: 500, message: error.message };
  }
};

const getInventoryLogs = async (hospitalID) => {
  try {
    let [response] = await pool.query(queryGetInventoryLogs, [hospitalID]);
    if (response.length === 0) {
      return { status: 200, data: [] };
    }

    // Using reduce to group by addedOn and agencyID
    const groupedData = response.reduce((acc, item) => {
      const groupKey = `${item.addedOn}_${item.agencyID}`; // Unique key for grouping

      if (!acc[groupKey]) {
        acc[groupKey] = {
          hospitalID: item.hospitalID,
          agencyID: item.agencyID,
          firstName: item.firstName || null,
          lastName: item.lastName || null,
          agencyName: item.agencyName || null,
          contactNo: item.contactNo || null,
          agentCode: item.agentCode || null,
          manufacturer: item.manufacturer || null,
          addedOn: item.addedOn,
          lowStockValue: item.lowStockValue,
          expiryDate: item.expiryDate,
          medicinesList: [] // Initialize array for medicines
        };
      }

      // Push medicine details to the corresponding group
      acc[groupKey].medicinesList.push({
        id: item.id,
        name: item.name,
        category: item.category,
        hsn: item.hsn,
        quantity: item.quantity,
        costPrice: item.costPrice,
        sellingPrice: item.sellingPrice,
        gst: parseFloat(item.gst)
      });

      return acc;
    }, {});

    return { status: 200, data: Object.values(groupedData) };
  } catch (error) {
    return { status: 500, message: error.message };
  }
};

module.exports = {
  editMedicineInventoryData,
  addInventoryLogs,
  getInventoryLogs
};
