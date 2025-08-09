const jwt = require("jsonwebtoken");
const { unauthorized } = require("../utils/errors");

const verifyJWT = (req, res, next) => {
  const token = req.headers.Authorization || req.headers.authorization;
  if (!token) return unauthorized(res, "missing authorization");
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) return unauthorized(res, err.message);
    console.log("decoded.info.hID", decoded.info.hID);
    req.userID = decoded.info.id;
    req.group = decoded.info.group;
    req.hospitalID = decoded.info.hID;
    next();
  });
};

module.exports = verifyJWT;
