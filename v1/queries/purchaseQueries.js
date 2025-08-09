const queryInsertPurchase = `INSERT INTO purchase(hospitalID,purchaseDate,purchaseType,hubCount,deviceCount,totalCost) 
    VALUES (?,?,?,?,?,?)`;
const queryDeletePurchase = `DELETE FROM purchase WHERE id=?`;
const queryGetAllPurchases = `SELECT * FROM purchase WHERE hospitalID=?`;
const queryGetPurchaseByID = `SELECT * FROM purchase WHERE id=?`;

module.exports = {
  queryInsertPurchase,
  queryDeletePurchase,
  queryGetAllPurchases,
  queryGetPurchaseByID
};
