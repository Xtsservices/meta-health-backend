const queryInsertPocus = `
    INSERT INTO pocus (
        abdomen, abg, cxr, ecg, heart, ivc, leftPleuralEffusion, leftPneumothorax,
        rightPleuralEffusion, rightPneumothorax, patientTimeLineId, userID
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

const queryGetPocus = `SELECT * FROM pocus WHERE patientTimeLineId=?`;

module.exports = {
  queryInsertPocus,
  queryGetPocus
};
