const { mobileVersion, apiVersion } = require("../utils/versions");

const getVersion = async (req, res) => {
  res.status(200).send({
    message: "success",
    version: mobileVersion.version
  });
};

const getApiVersion = async (req, res) => {
  res.status(200).send({
    message: "success",
    version: apiVersion.version
  });
};

module.exports = {
  getVersion,
  getApiVersion
};
