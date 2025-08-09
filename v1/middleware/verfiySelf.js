const { notAllowed } = require("../utils/errors");
const verifySelf = (req, res, next) => {
  const id = req.params.id;
  const { userID } = req;

  if (parseInt(userID) !== parseInt(id)) {
    return notAllowed(res, "Cannot access other user's data");
  }

  next();
};

module.exports = verifySelf;
