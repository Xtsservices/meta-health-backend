const express = require("express");
const router = express.Router();
const {
  addNewReading,
  addHubLog,
  pingRequest
} = require("../controllers/reading");

router.route("/:timeLineID/:hubID/:deviceID").post(pingRequest);

router.route("/logs/:hubAddress/:log").post(addHubLog);

router
  .route("/:deviceTime/:timeLineID/:hubID/:deviceID/:temp/:battery/:uploadTime")
  .post(addNewReading);

module.exports = router;
