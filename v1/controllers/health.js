const {
  serverError,
  missingBody,
  resourceNotFound,
  duplicateRecord,
  notAllowed
} = require("../utils/errors");

const healthCheck = async (req, res) => {
  res.status(200).send({
    message: "success"
  });
};
module.exports = { healthCheck };
