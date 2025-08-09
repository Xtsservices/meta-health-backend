const { unauthorized } = require("../utils/errors");
const verifyRoles = (...alowedRoles) => {
  return (req, res, next) => {
    const rolesArray = [...alowedRoles];
    const role = req.group;
    const result = rolesArray.includes(role);
    if (!result) return unauthorized(res, "insufficient permissions");
    next();
  };
};

module.exports = verifyRoles;
