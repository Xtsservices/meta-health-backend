const create_database = `CREATE DATABASE yantramHospital`;
const pool = require("../");

const hospitals = `CREATE TABLE hospitals(
	id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    parent VARCHAR(100),
    website VARCHAR(100),
    phoneNo VARCHAR(20),
    email VARCHAR(100),
    address VARCHAR(200),
    city VARCHAR(50),
    state VARCHAR(50),
    district varchar(250),
    country VARCHAR(50),
    pinCode VARCHAR(15),
    addedOn TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
	lastModified TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    isDeleted TINYINT DEFAULT 0
    );`;

const departments = `CREATE TABLE departments (
	id INT AUTO_INCREMENT PRIMARY KEY,
    hospitalID INT,
    FOREIGN KEY (hospitalID) REFERENCES hospitals(id),
    name VARCHAR(50),
	description TEXT,
    addedOn TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    lastModified TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);`;
const wards = `CREATE TABLE wards (
	id INT AUTO_INCREMENT PRIMARY KEY,
    hospitalID INT,
    FOREIGN KEY (hospitalID) REFERENCES hospitals(id),
    name VARCHAR(50),
	description TEXT,
    addedOn TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    lastModified TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    totalBeds INT,
    availableBeds INT
);`;

const users = `CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    hospitalID INT,
    FOREIGN KEY (hospitalID) REFERENCES hospitals(id),
    departmentID INT,
    FOREIGN KEY (departmentID) REFERENCES departments(id),
    email VARCHAR(100),
    password VARCHAR(100),
    role INT,
    scope VARCHAR(255),
    countryCode VARCHAR(10),
    phoneNo VARCHAR(20),
    pin INT,
    forgotToken VARCHAR(255),
    refreshToken VARCHAR(255),
    firstName VARCHAR(50),
    lastName VARCHAR(50),
    photo VARCHAR(50),
    dob DATETIME,
    gender TINYINT,
    address VARCHAR(255),
    city VARCHAR(50),
    state VARCHAR(50),
    pinCode INT,
    addedOn TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    lastOnline TIMESTAMP,
    lastUpdated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    isDeleted TINYINT DEFAULT 0
    );`;

const hubs = `CREATE TABLE hubs(
	id INT AUTO_INCREMENT PRIMARY KEY,
	hospitalID INT,
    FOREIGN KEY (hospitalID) REFERENCES hospitals(id),
    hubName VARCHAR(50),
    hubCustomName VARCHAR(50),
    hubAddress VARCHAR(50),
    hubProtocolAddress VARCHAR(50),
    addedOn TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    lastModified TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);`;

const devices = `CREATE TABLE devices(
	id INT AUTO_INCREMENT PRIMARY KEY,
	hubID INT,
    FOREIGN KEY (hubID) REFERENCES hubs(id),
    deviceName VARCHAR(50),
    deviceCustomName VARCHAR(50),
    deviceAddress VARCHAR(50),
    addedOn TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    lastModified TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);`;

// TODO update the schema in the database
const patients = `CREATE TABLE patients(
	id INT AUTO_INCREMENT PRIMARY KEY,
	hospitalID INT,
    FOREIGN KEY (hospitalID) REFERENCES hospitals(id),
    deviceID INT,
    FOREIGN KEY (deviceID) REFERENCES devices(id),
    pID VARCHAR(50),
    pUHID BIGINT,
    category TINYINT,
    ptype TINYINT,
    zone TINYINT,
    dob DATE,
    gender TINYINT,
    weight FLOAT,
    height FLOAT,
    pName VARCHAR(50),
    photo VARCHAR(50),
    phoneNumber VARCHAR(20),
    email VARCHAR(50),
    address VARCHAR(100),
	city VARCHAR(50),
	state VARCHAR(50),
	pinCode VARCHAR(20),
    referredBy VARCHAR(50),
    insurance BOOLEAN DEFAULT 0 CHECK (insurance IN (0, 1)),
    insuranceNumber VARCHAR(50),
    insuranceCompany VARCHAR(100),
    addedOn TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    lastModified TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);`;

const patientTimeLine = `CREATE TABLE patientTimeLine(
	id INT AUTO_INCREMENT PRIMARY KEY,
    hospitalID INT,
    FOREIGN KEY (hospitalID) REFERENCES hospitals(id),
    patientID INT,
    FOREIGN KEY (patientID) REFERENCES patients(id),
    departmentID INT,
    FOREIGN KEY (departmentID) REFERENCES departments(id),
    wardID INT,
    FOREIGN KEY (wardID) REFERENCES wards(id),
    patientStartStatus TINYINT,
    patientEndStatus TINYINT,
    zone TINYINT,
    startTime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    endTime TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    dischargeType TINYINT,
    diet TEXT,
    advice TEXT,
    followUp TINYINT,   
    followUpDate DATE,
    icd TEXT,
    prescription,
    diagnosis
);`;

// TODO update the schema in the database
const transferPatient = `CREATE TABLE transferPatient(
    hospitalID INT,
    FOREIGN KEY (hospitalID) REFERENCES hospitals(id),
    id INT AUTO_INCREMENT PRIMARY KEY,
    transferType TINYINT,
    reason TEXT,
    bp VARCHAR(10),
    temp FLOAT,
    oxygen TINYINT,
    pulse TINYINT,
    patientTimeLineID INT,
    FOREIGN KEY(patientTimeLineID) REFERENCES patientTimeLine(id),
    patientNewTimeLineID INT,
    FOREIGN KEY(patientNewTimeLineID) REFERENCES patientTimeLine(id ),
    patientID INT,
    FOREIGN KEY (patientID) REFERENCES patients(id),
    transferDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    hopitalName TEXT
    relativeName TEXT
);`;

const patientDoctors = `CREATE TABLE patientDoctors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    hospitalID INT,
    FOREIGN KEY (hospitalID) REFERENCES hospitals(id),
    patientTimeLineID INT,
    FOREIGN KEY (patientTimeLineID) REFERENCES patientTimeLine(id),
    doctorID INT,
    FOREIGN KEY (doctorID) REFERENCES users(id),
    assignedDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    purpose VARCHAR(50),
    active BOOLEAN DEFAULT TRUE,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    category ENUM('primary', 'secondary'), 
    scope ENUM('doctor','surgon','anesthetic') DEFAULT doctor
);`;

const doctorHandover = `CREATE TABLE doctorHandover (
    id INT AUTO_INCREMENT PRIMARY KEY,
    hospitalID INT,
    FOREIGN KEY (hospitalID) REFERENCES hospitals(id),
    patientTimeLineID INT,
    FOREIGN KEY (patientTimeLineID) REFERENCES patientTimeLine(id),
    handshakingFrom INT,
	FOREIGN KEY (handshakingFrom) REFERENCES users(id),
    handshakingTo INT,
	FOREIGN KEY (handshakingTo) REFERENCES users(id),
    handshakingBy INT,
	FOREIGN KEY (handshakingBy) REFERENCES users(id),
    reason TEXT,
	addedOn TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`;

const followUp = `CREATE TABLE followUp(
    id INT AUTO_INCREMENT PRIMARY KEY,
    timelineID INT,
    FOREIGN KEY (timelineID) REFERENCES patientTimeLine(id),
    date DATE,  
    status TINYINT,
    addedOn TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    endTime TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    );`;

const shiftTime = `CREATE TABLE shift (
    hospitalID INT,
    FOREIGN KEY (hospitalID) REFERENCES hospitals(id),
    id INT AUTO_INCREMENT PRIMARY KEY,
    startTime TIME NOT NULL,
    endTime TIME NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE
);`;
const rooster = `CREATE TABLE rooster (
    hospitalID INT,
    FOREIGN KEY (hospitalID) REFERENCES hospitals(id),
    id INT AUTO_INCREMENT PRIMARY KEY,
    hospitalID INT,
    FOREIGN KEY (hospitalID) REFERENCES hospitals(id),
    date DATE,
    shiftID INT,
    FOREIGN KEY (shiftID) REFERENCES shiftTime(id),
    addedOn TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`;

const onleave = `CREATE TABLE onleave (
    hospitalID INT,
    FOREIGN KEY (hospitalID) REFERENCES hospitals(id),
    id SERIAL PRIMARY KEY,
    staffID INT,
    doctorName VARCHAR(255),
    departmentName VARCHAR(255),
    FOREIGN KEY (staffID) REFERENCES users(id),
    date DATE
);`;

const onduty = `CREATE TABLE onduty (
    hospitalID INT,
    FOREIGN KEY (hospitalID) REFERENCES hospitals(id),
    id SERIAL PRIMARY KEY,
    roosterID INT,
    staffID INT,
    doctorName VARCHAR(255),
    departmentName VARCHAR(255),
    FOREIGN KEY (roosterID) REFERENCES rooster(id),
    FOREIGN KEY (staffID) REFERENCES users(id)
);`;

const prescriptions = `
CREATE TABLE prescriptions(
    id INT AUTO_INCREMENT PRIMARY KEY,
    hospitalID INT,
    FOREIGN KEY (hospitalID) REFERENCES hospitals(id),
    timeLineID INT,
    FOREIGN KEY (timeLineID) REFERENCES patientTimeLine(id),
    userID INT,
	FOREIGN KEY (userID) REFERENCES users(id),
    diet TEXT,
    advice TEXT,
    followUp TINYINT,   
    followUpDate DATE,
    addedOn TIMESTAMP DEFAULT CURRENT_TIMESTAMP,    
    medicine TEXT,
    medicineType TEXT,
    medicineTime TEXT,
    medicineDuration TEXT,
    medicineFrequency TEXT, 
    medicineNotes TEXT, 
    test TEXT,
    notes TEXT,
    diagnosis TEXT  
);
`;

const symptoms = `CREATE TABLE symptoms(
	id INT AUTO_INCREMENT PRIMARY KEY,
    timeLineID INT,
    FOREIGN KEY (timeLineID) REFERENCES patientTimeLine(id),
    userID INT,
    FOREIGN KEY (userID) REFERENCES users(id),
    symptom VARCHAR(100),
    conceptID INT,
    duration TEXT,
    durationParameter TEXT,
    addedOn TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`;

const test = `CREATE TABLE tests(
	id INT AUTO_INCREMENT PRIMARY KEY,
    timeLineID INT,
    FOREIGN KEY (timeLineID) REFERENCES patientTimeLine(id),
    userID INT,
    FOREIGN KEY (userID) REFERENCES users(id),
    test VARCHAR(100),
    addedOn TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`;

const attachments = `CREATE TABLE attachments(
	id INT AUTO_INCREMENT PRIMARY KEY,
    timeLineID INT,
    FOREIGN KEY (timeLineID) REFERENCES patientTimeLine(id),
    userID INT,
    FOREIGN KEY (userID) REFERENCES users(id),
    fileName VARCHAR(100),
    givenName VARCHAR(100),
    mimeType VARCHAR(50),
    category VARCHAR(100),
    addedOn TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`;

const consentformAttachments = `CREATE TABLE consentformAttachments(
	id INT AUTO_INCREMENT PRIMARY KEY,
    timeLineID INT,
    FOREIGN KEY (timeLineID) REFERENCES patientTimeLine(id),
    userID INT,
    FOREIGN KEY (userID) REFERENCES users(id),
    fileName VARCHAR(100),
    givenName VARCHAR(100),
    mimeType VARCHAR(50),
    category VARCHAR(100),
    addedOn TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`;

const medicines = `CREATE TABLE medicines(
	id INT AUTO_INCREMENT PRIMARY KEY,
    timeLineID INT,
    FOREIGN KEY (timeLineID) REFERENCES patientTimeLine(id),
    userID INT,
    FOREIGN KEY (userID) REFERENCES users(id),
    medicineType TINYINT,
    medicineName VARCHAR(255),
    daysCount TINYINT,
    doseCount TINYINT,
	medicationTime VARCHAR(50),
    doseTimings TEXT,
    notes TEXT,
    addedOn TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    lastModified TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);`;

const medicineReminders = `CREATE TABLE medicineReminders(
	id INT AUTO_INCREMENT PRIMARY KEY,
    medicineID INT,
	FOREIGN KEY (medicineID) REFERENCES medicines(id),
	userID INT,
    FOREIGN KEY (userID) REFERENCES users(id),
    dosageTime TIMESTAMP,
    givenTime TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    doseStatus TINYINT DEFAULT 0,
    day VARCHAR(10),
    note TEXT
);`;

const medicalHistory = `CREATE TABLE medicalHistory(
	id INT AUTO_INCREMENT PRIMARY KEY,
    patientID INT,
    FOREIGN KEY (patientID) REFERENCES patients(id),
    userID INT,
    FOREIGN KEY (userID) REFERENCES users(id),
    givenName VARCHAR(50),
    givenPhone VARCHAR(20),
    givenRelation VARCHAR(50),
    bloodGroup VARCHAR(3),
    bloodPressure VARCHAR(10),
    disease TEXT,
    foodAllergy TEXT,
    medicineAllergy TEXT,
    anaesthesia TEXT,
    meds TEXT,
    selfMeds TEXT,
    chestCondition TEXT,
    neurologicalDisorder TEXT,
    heartProblems TEXT,
    infections TEXT,
    mentalHealth TEXT,
    drugs TEXT,
    pregnant TEXT,
    hereditaryDisease TEXT,
    lumps TEXT,
    cancer TEXT,
    addedOn TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    lastModified TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);`;

const vitals = `CREATE TABLE vitals(
	id INT AUTO_INCREMENT PRIMARY KEY,
    timeLineID INT,
    FOREIGN KEY (timeLineID) REFERENCES patientTimeLine(id),
	userID INT,
    FOREIGN KEY (userID) REFERENCES users(id),
    pulse INT,
    temperature FLOAT,
    oxygen TINYINT,
    bp VARCHAR(10),
    addedOn TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    pulseTime TIMESTAMP,
    oxygenTime TIMESTAMP,
    temperatureTime TIMESTAMP,
    bpTime TIMESTAMP,
    givenTime TIMESTAMP,
    device TINYINT DEFAULT 0,
	deviceTime BIGINT DEFAULT 0,
    battery TINYINT
);`;

const deviceTimeLines = `CREATE TABLE deviceTimeLines(
	id INT AUTO_INCREMENT PRIMARY KEY,
    patientID INT,
    FOREIGN KEY (patientID) REFERENCES patients(id),
    deviceID INT,
    FOREIGN KEY (deviceID) REFERENCES devices(id),
	addUserID INT,
    FOREIGN KEY (addUserID) REFERENCES users(id),
    removeUserID INT,
    FOREIGN KEY (removeUserID) REFERENCES users(id),
    startTime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    endTime TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
); `;

const readings = `CREATE TABLE readings(
	id INT AUTO_INCREMENT PRIMARY KEY,
    hubID INT,
    FOREIGN KEY (hubID) REFERENCES hubs(id),
	deviceID INT,
    FOREIGN KEY (deviceID) REFERENCES devices(id),
    temperature FLOAT,
    battery TINYINT,
    deviceTime BigInt,
    uploadTime BigInt,
    addedOn  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
); `;

const purchase = `CREATE TABLE purchase(
	id INT AUTO_INCREMENT PRIMARY KEY,
    hospitalID INT NOT NULL,
	FOREIGN KEY (hospitalID) REFERENCES hospitals(id),
    purchaseType ENUM("online","offline"),
    purchaseDate DATE,
    hubCount INT NOT NULL,
    deviceCount INT NOT NULL,
    totalCost DECIMAL(10, 2) NOT NULL,
    addedOn TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`;

const triageForm = `	CREATE TABLE triageForm (
	  id SERIAL PRIMARY KEY,
	  zone VARCHAR(255),
	  ward VARCHAR(255),
	  patientTimelineID INT,
	  FOREIGN KEY (patientTimeLineID) REFERENCES patientTimeLine(id),
	  hospitalID INT,
	  FOREIGN KEY (hospitalID) REFERENCES hospitals(id),
	  userID INT,
	  FOREIGN KEY (userID) REFERENCES users(id),
      time VARCHAR(50),
	  lastKnownSequence VARCHAR(255),
	  criticalCondition VARCHAR(255),
	  oxygen INT,
	  pulse INT,
	  temperature FLOAT,
	  bpH INT,
	  bpL INT,
	  respiratoryRate INT,
	  vitalsTime TIMESTAMP,
	  radialPulse BOOLEAN,
	  noisyBreathing BOOLEAN,
	  activeSeizures BOOLEAN,
	  cSpineInjury BOOLEAN,
	  angioedema VARCHAR(255),
	  stridor BOOLEAN,
	  activeBleeding BOOLEAN,
	  incompleteSentences BOOLEAN,
	  capillaryRefill BOOLEAN,
	  alteredSensorium BOOLEAN,
	  activeBleedingType VARCHAR(255),
	  eyeMovement VARCHAR(255),
	  verbalResponse VARCHAR(255),
	  motorResponse VARCHAR(255),
	  painScale VARCHAR(255),
	  traumaType VARCHAR(255),
	  fallHeight VARCHAR(255),
	  fracture BOOLEAN,
	  fractureRegion VARCHAR(255),
	  amputation BOOLEAN,
	  neckSwelling BOOLEAN,
	  minorHeadInjury BOOLEAN,
	  abrasion BOOLEAN,
	  suspectedAbuse BOOLEAN,
	  chestInjuryType VARCHAR(255),
	  stabInjurySeverity VARCHAR(255),
	  stabInjuryLocation VARCHAR(255),
	  stabHeadScalp BOOLEAN,
	  stabHeadFace BOOLEAN,
	  stabHeadNeck BOOLEAN,
	  stabChestHeart BOOLEAN,
	  stabChestLungs BOOLEAN,
	  stabChestMajorBloodVessels BOOLEAN,
	  stabAbdomenStomach BOOLEAN,
	  stabAbdomenLiver BOOLEAN,
	  stabAbdomenKidneys BOOLEAN,
	  stabAbdomenSpleen BOOLEAN,
	  stabAbdomenIntestines BOOLEAN,
	  stabExtremityArm BOOLEAN,
	  stabExtremityLeg BOOLEAN,
	  stabExtremityMuscles BOOLEAN,
	  stabExtremityTendons BOOLEAN,
	  stabExtremityNerves BOOLEAN,
	  stabExtremityBloodVessels BOOLEAN,
	  pregnancy BOOLEAN,
	  pregnancyIssue VARCHAR(255),
	  trimester VARCHAR(255),
	  breathlessness BOOLEAN,
	  edema BOOLEAN,
	  internalBleeding BOOLEAN,
	  internalBleedingCause VARCHAR(255),
	  poisoning BOOLEAN,
	  poisoningCause VARCHAR(255),
	  burn BOOLEAN,
	  burnPercentage VARCHAR(255),
	  hanging BOOLEAN,
	  drowning BOOLEAN,
	  electrocution BOOLEAN,
	  heatStroke BOOLEAN,
	  fever BOOLEAN,
	  feverSymptoms VARCHAR(255),
	  drugOverdose BOOLEAN,
	  stoolPass BOOLEAN,
	  urinePass BOOLEAN,
	  swellingWound BOOLEAN,
	  dizziness BOOLEAN,
	  headache BOOLEAN,
	  coughCold BOOLEAN,
	  skinRash BOOLEAN,
	  medicoLegalExamination BOOLEAN
	);`;

const schedule = `CREATE TABLE schedule(
	id INT AUTO_INCREMENT PRIMARY KEY,
    hospitalID INT,
    FOREIGN KEY (hospitalID) REFERENCES hospitals(id),
    userID INT,
    FOREIGN KEY (userID) REFERENCES users(id),
    patientTimeLineId INT,
    FOREIGN KEY (patientTimeLineId) REFERENCES patientTimeLine(id),
    active BOOLEAN DEFAULT TRUE,
    startTime TIMESTAMP,
    roomID TEXT,
    attendees TEXT,
    endTime TIMESTAMP,
    addedOn TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`;

module.exports = {
  hospitals,
  departments,
  users,
  hubs,
  devices,
  patients,
  patientTimeLine,
  symptoms,
  attachements,
  medicines,
  medicineReminders,
  medicalHistory,
  vitals,
  deviceTimeLines,
  readings,
  triageForm,
  patientDoctors,
  doctorHandover,
  followUp,
  shiftTime,
  purchase,
  transferPatient,
  schedule
};
