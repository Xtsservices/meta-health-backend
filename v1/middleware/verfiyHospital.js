const { forbidden } = require("../utils/errors");
const roles = require("../utils/roles");
const verifyHospital = (req, res, next) => {
  if (req.group === roles.sAdmin || req.group === roles.customerCare) {
    console.log("its sAdmin or customerCare, allow");
    return next();
  }
  const hospitalID = parseInt(req.params.hospitalID);

  const tokenHospitalId = parseInt(req.hospitalID);
console.log("hospitalID",hospitalID)
console.log("tokenHospitalId",tokenHospitalId)
  if (hospitalID != tokenHospitalId)
    return forbidden(res, "hospital not matching");
  next();
};

module.exports = verifyHospital;
