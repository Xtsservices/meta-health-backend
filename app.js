const express = require("express");
const dotenv = require("dotenv");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const { WebSocketServer } = require("ws");

// ROUTES part
const USER_ROUTE = require("./v1/routes/user");
const HOSPITAL_ROUTE = require("./v1/routes/hospital");
const DEPARTMENT_ROUTE = require("./v1/routes/department");
const WARD_ROUTE = require("./v1/routes/ward");
const HUB_ROUTE = require("./v1/routes/hub");
const DEVICE_ROUTE = require("./v1/routes/device");
const PATIENT_ROUTE = require("./v1/routes/patient");
const PATIENT_TIMELINE_ROUTE = require("./v1/routes/patTimeLine");
const SYMPTOMS_ROUTE = require("./v1/routes/symptoms");
const TESTS_ROUTE = require("./v1/routes/tests");
const ATTACHMENT_ROUTE = require("./v1/routes/attachment");
const MEDICINE_ROUTE = require("./v1/routes/medicine");
const MEDICINE_REMINDER_ROUTE = require("./v1/routes/medReminder");
const PATIENT_HISTORY_ROUTE = require("./v1/routes/medicalHistory");
const DATA_ROUTE = require("./v1/routes/data");
const VITAL_ROUTE = require("./v1/routes/vitals");
const POCUS_ROUTE = require("./v1/routes/pocus");

const READING_ROUTE = require("./v1/routes/reading");
const DEVICE_TIMELINE_ROUTE = require("./v1/routes/deviceTimeLine");
const ALERTS_ROUTE = require("./v1/routes/alerts");
const HEALTH_ROUTE = require("./v1/routes/health");
const PURCHASE_ROUTE = require("./v1/routes/purchase");
const TICKET_ROUTE = require("./v1/routes/ticket");
const VERSION_ROUTE = require("./v1/routes/version");
const PRESCRIPTION_ROUTE = require("./v1/routes/prescription");
const FOLLOWUP_ROUTE = require("./v1/routes/followUp");
const ROOSTER_ROUTE = require("./v1/routes/rooster");
const TRIAGE_ROUTE = require("./v1/routes/triage");
const DOCTOR_ROUTE = require("./v1/routes/doctor");
const WEB_SOCKET_ROUTE = require("./v1/routes/webSocketRoute");
const OPERATION_THEATRE_ROUTE = require("./v1/routes/operationTheatre");
const SCHEDULE_ROUTE = require("./v1/routes/schedule");
const MEDICINE_INVENTORY_ROUTE = require("./v1/routes/medicineInventory");
const MEDICINE_INVENTORY_PATIENTS_ORDER_ROUTE = require("./v1/routes/medicineInventoryPatientsOrder");
const MEDICINE_INVENTORY_MANUFACTURE_ROUTE = require("./v1/routes/medicineInventoryManufacture");
const MEDICINE_INVENTORY_EXPENSE_ROUTE = require("./v1/routes/medicineInventoryExpense");
const MEDICINE_INVENTORY_LOGS_ROUTE = require("./v1/routes/medicineInventoryLogs");
const MEDICINE_INVENTORY_PATIENTS_ROUTE = require("./v1/routes/medicineInventoryPatients");
const TEMPLATE_ROUTE = require("./v1/routes/template");
const ADMINTASKS_ROUTE = require("./v1/routes/adminTasks");
const NURSE_ROUTE = require("./v1/routes/nurse");

const port = process.env.PORT || 3002;
// PATHS
const API_PATH = "/api/v1";
const HOSPITAL_PATH = API_PATH + "/hospital";
const USER_PATH = API_PATH + "/user";
const DEPARTMENT_PATH = API_PATH + "/department";
const WARD_PATH = API_PATH + "/ward";
const HUB_PATH = API_PATH + "/hub";
const DEVICE_PATH = API_PATH + "/device";
const PATIENT_PATH = API_PATH + "/patient";
const PATIENT_TIMELINE_PATH = API_PATH + "/patientTimeLine";
const SYMPTOMS_PATH = API_PATH + "/symptom";
const TESTS_PATH = API_PATH + "/test";
const ATTACHMENT_PATH = API_PATH + "/attachment";
const MEDICINE_PATH = API_PATH + "/medicine";
const MEDICINE_REMINDER_PATH = API_PATH + "/medicineReminder";
const PATIENT_HISTORY_PATH = API_PATH + "/history";
const DATA_PATH = API_PATH + "/data";
const VITALS_PATH = API_PATH + "/vitals";
const POCUS_PATH = API_PATH + "/pocus";
const READING_PATH = API_PATH + "/reading";
const DEVICE_TIMELINE_PATH = API_PATH + "/deviceTimeLine";
const ALERTS_PATH = API_PATH + "/alerts";
const HEALTH_PATH = API_PATH + "/health";
const PURCHASE_PATH = API_PATH + "/purchase";
const TICKERT_PATH = API_PATH + "/ticket";
const VERSION_PATH = API_PATH + "/version";
const PRESCRIPTION_PATH = API_PATH + "/prescription";
const FOLLOWUP_PATH = API_PATH + "/followup";
const ROOSTER_PATH = API_PATH + "/rooster";
const TRIAGE_PATH = API_PATH + "/triage";
const DOCTOR_PATH = API_PATH + "/doctor";
const OPERATION_THEATRE_PATH = API_PATH + "/ot";
const SCHEDULE_PATH = API_PATH + "/schedule";
const MEDICINE_INVENTORY_PATH = API_PATH + "/pharmacy";
const MEDICINE_INVENTORY_PATIENTS_ORDER_PATH =
  API_PATH + "/medicineInventoryPatientsOrder";
const MEDICINE_INVENTORY_MANUFACTURE_PATH =
  API_PATH + "/medicineInventoryManufacture";
const MEDICINE_INVENTORY_EXPENSE_PATH = API_PATH + "/medicineInventoryExpense";
const MEDICINE_INVENTORY_LOGS_PATH = API_PATH + "/medicineInventoryLogs";
const MEDICINE_INVENTORY_PATIENTS_PATH =
  API_PATH + "/medicineInventoryPatients";
const TEMPLATE_PATH = API_PATH + "/template";

const ADMINTASK_PATH = API_PATH + "/admintasks";
const NURSE_PATH = API_PATH + "/nurse";
const LOCAL_ORIGIN = "http://127.0.0.1:5173";
// const CLOUD_ORIGIN = 'http://hospitaldashboard.s3-website.ap-south-1.amazonaws.com'
const CLOUD_ORIGIN = "https://yantrammedtech.com";
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// app.use(helmet())
// app.use(helmet.crossOriginResourcePolicy({ policy: 'cross-origin' }))
app.use(morgan("dev"));
// app.use(cors({
//     origin: CLOUD_ORIGIN, // use your domain name (or localhost)
//     methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'],
//     allowedHeaders: ['Content-Type', 'Origin', 'X-Requested-With', 'Accept', 'x-client-key', 'x-client-token', 'x-client-secret', 'Authorization'],
//     credentials: true
// }))

app.use(cors());
app.use(ADMINTASK_PATH, ADMINTASKS_ROUTE);
app.use(NURSE_PATH, NURSE_ROUTE);
app.use(HEALTH_PATH, HEALTH_ROUTE);
app.use(HOSPITAL_PATH, HOSPITAL_ROUTE);
app.use(USER_PATH, USER_ROUTE);
app.use(DEPARTMENT_PATH, DEPARTMENT_ROUTE);
app.use(WARD_PATH, WARD_ROUTE);
app.use(HUB_PATH, HUB_ROUTE);
app.use(DEVICE_PATH, DEVICE_ROUTE);
app.use(PATIENT_PATH, PATIENT_ROUTE);
app.use(PATIENT_TIMELINE_PATH, PATIENT_TIMELINE_ROUTE);
app.use(SYMPTOMS_PATH, SYMPTOMS_ROUTE);
app.use(TESTS_PATH, TESTS_ROUTE);
app.use(ATTACHMENT_PATH, ATTACHMENT_ROUTE);
app.use(MEDICINE_PATH, MEDICINE_ROUTE);
app.use(MEDICINE_REMINDER_PATH, MEDICINE_REMINDER_ROUTE);
app.use(PATIENT_HISTORY_PATH, PATIENT_HISTORY_ROUTE);
app.use(DATA_PATH, DATA_ROUTE);
app.use(VITALS_PATH, VITAL_ROUTE);
app.use(POCUS_PATH, POCUS_ROUTE);
app.use(READING_PATH, READING_ROUTE);
app.use(DEVICE_TIMELINE_PATH, DEVICE_TIMELINE_ROUTE);
app.use(ALERTS_PATH, ALERTS_ROUTE);
app.use(PURCHASE_PATH, PURCHASE_ROUTE);
app.use(TICKERT_PATH, TICKET_ROUTE);
app.use(VERSION_PATH, VERSION_ROUTE);
app.use(PRESCRIPTION_PATH, PRESCRIPTION_ROUTE);
app.use(FOLLOWUP_PATH, FOLLOWUP_ROUTE);
app.use(FOLLOWUP_PATH, FOLLOWUP_ROUTE);
app.use(ROOSTER_PATH, ROOSTER_ROUTE);
app.use(TRIAGE_PATH, TRIAGE_ROUTE);
app.use(DOCTOR_PATH, DOCTOR_ROUTE);
app.use(OPERATION_THEATRE_PATH, OPERATION_THEATRE_ROUTE);
app.use(SCHEDULE_PATH, SCHEDULE_ROUTE);
app.use(MEDICINE_INVENTORY_PATH, MEDICINE_INVENTORY_ROUTE);
app.use(
  MEDICINE_INVENTORY_PATIENTS_ORDER_PATH,
  MEDICINE_INVENTORY_PATIENTS_ORDER_ROUTE
);
app.use(
  MEDICINE_INVENTORY_MANUFACTURE_PATH,
  MEDICINE_INVENTORY_MANUFACTURE_ROUTE
);
app.use(MEDICINE_INVENTORY_LOGS_PATH, MEDICINE_INVENTORY_LOGS_ROUTE);
app.use(MEDICINE_INVENTORY_EXPENSE_PATH, MEDICINE_INVENTORY_EXPENSE_ROUTE);
app.use(MEDICINE_INVENTORY_PATIENTS_PATH, MEDICINE_INVENTORY_PATIENTS_ROUTE);
app.use(TEMPLATE_PATH, TEMPLATE_ROUTE);
app.use("*", (req, res) => {
  res.status(404).send("404 Page not found");
});

const server = app.listen(port, () => {
  console.log(`server started on port : ${port}`);
});

WEB_SOCKET_ROUTE(server);
console.log("....web sockets runnin again....");
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  // Perform any necessary cleanup
  process.exit(1); // Exit the process with failure
});

// git push https://github.com/ArunDesignocare/hospitalServer.git master
