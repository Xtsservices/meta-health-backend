const create_database = `CREATE DATABASE yantramHospital`;
const pool = require("../");

const hospitals = `CREATE TABLE hospitals (
    id int NOT NULL AUTO_INCREMENT,
    name varchar(100) NOT NULL,
    parent varchar(100) DEFAULT NULL,
    website varchar(100) DEFAULT NULL,
    phoneNo varchar(20) DEFAULT NULL,
    email varchar(100) DEFAULT NULL,
    address varchar(255) DEFAULT NULL,
    city varchar(50) DEFAULT NULL,
    state varchar(50) DEFAULT NULL,
    country varchar(50) DEFAULT NULL,
    pinCode varchar(15) DEFAULT NULL,
    addedOn timestamp NULL DEFAULT CURRENT_TIMESTAMP,
    lastModified timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    isDeleted tinyint DEFAULT '0',
    PRIMARY KEY (id)
  );`;

const wards = `CREATE TABLE wards (
    id int NOT NULL AUTO_INCREMENT,
    hospitalID int DEFAULT NULL,
    name varchar(50) DEFAULT NULL,
    description text,
    addedOn timestamp NULL DEFAULT CURRENT_TIMESTAMP,
    lastModified timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    totalBeds int DEFAULT NULL,
    availableBeds int DEFAULT NULL,
    room VARCHAR(500) DEFAULT NULL,
    floor VARCHAR(500) DEFAULT NULL,
    location TEXT DEFAULT NULL,
    price DECIMAL(10, 2) DEFAULT NULL,  -- Decimal for price with two decimal places
    Attendees VARCHAR(500) DEFAULT NULL,
    amenities JSON DEFAULT NULL,
    PRIMARY KEY (id),
    KEY hospitalID (hospitalID),
    CONSTRAINT wards_ibfk_1 FOREIGN KEY (hospitalID) REFERENCES hospitals (id)
  );`;

const departments = `CREATE TABLE departments (
    id int NOT NULL AUTO_INCREMENT,
    hospitalID int DEFAULT NULL,
    name varchar(50) DEFAULT NULL,
    description text,
    addedOn timestamp NULL DEFAULT CURRENT_TIMESTAMP,
    lastModified timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY hospitalID (hospitalID),
    CONSTRAINT departments_ibfk_1 FOREIGN KEY (hospitalID) REFERENCES hospitals (id)
  );`;

const hubs = `CREATE TABLE hubs (
    id int NOT NULL AUTO_INCREMENT,
    hospitalID int DEFAULT NULL,
    hubName varchar(50) DEFAULT NULL,
    hubCustomName varchar(50) DEFAULT NULL,
    hubAddress varchar(50) DEFAULT NULL,
    hubProtocolAddress varchar(50) DEFAULT NULL,
    addedOn timestamp NULL DEFAULT CURRENT_TIMESTAMP,
    lastModified timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY hospitalID (hospitalID),
    CONSTRAINT hubs_ibfk_1 FOREIGN KEY (hospitalID) REFERENCES hospitals (id)
  );`;

const devices = `CREATE TABLE devices (
    id int NOT NULL AUTO_INCREMENT,
    hubID int DEFAULT NULL,
    deviceName varchar(50) DEFAULT NULL,
    deviceCustomName varchar(50) DEFAULT NULL,
    deviceAddress varchar(50) DEFAULT NULL,
    addedOn timestamp NULL DEFAULT CURRENT_TIMESTAMP,
    lastModified timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY hubID (hubID),
    CONSTRAINT devices_ibfk_1 FOREIGN KEY (hubID) REFERENCES hubs (id)
  );`;

const patients = `CREATE TABLE patients (
    id int NOT NULL AUTO_INCREMENT,
    hospitalID int DEFAULT NULL,
    deviceID int DEFAULT NULL,
    pID varchar(50) DEFAULT NULL,
    pUHID bigint DEFAULT NULL,
    category tinyint DEFAULT NULL,
    ptype tinyint DEFAULT NULL,
    dob date DEFAULT NULL,
    gender tinyint DEFAULT NULL,
    weight float DEFAULT NULL,
    height float DEFAULT NULL,
    pName varchar(50) DEFAULT NULL,
    photo varchar(50) DEFAULT NULL,
    phoneNumber varchar(20) DEFAULT NULL,
    email varchar(50) DEFAULT NULL,
    address varchar(100) DEFAULT NULL,
    city varchar(50) DEFAULT NULL,
    state varchar(50) DEFAULT NULL,
    pinCode varchar(20) DEFAULT NULL,
    referredBy varchar(50) DEFAULT NULL,
    addedOn timestamp NULL DEFAULT CURRENT_TIMESTAMP,
    lastModified timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    insurance tinyint(1) DEFAULT '0',
    insuranceNumber varchar(50) DEFAULT NULL,
    insuranceCompany varchar(100) DEFAULT NULL,
    zone tinyint DEFAULT NULL,
    isViewed tinyint(1) DEFAULT '0',
    PRIMARY KEY (id),
    KEY hospitalID (hospitalID),
    KEY deviceID (deviceID),
    CONSTRAINT patients_ibfk_1 FOREIGN KEY (hospitalID) REFERENCES hospitals (id),
    CONSTRAINT patients_ibfk_2 FOREIGN KEY (deviceID) REFERENCES devices (id),
    CONSTRAINT patients_chk_1 CHECK ((insurance in (0,1)))
  );`;

const patientTimeLine = `CREATE TABLE patientTimeLine (
    id int NOT NULL AUTO_INCREMENT,
    hospitalID int DEFAULT NULL,
    patientID int DEFAULT NULL,
    patientStartStatus tinyint DEFAULT NULL,
    patientEndStatus tinyint DEFAULT NULL,
    startTime timestamp NULL DEFAULT CURRENT_TIMESTAMP,
    endTime timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    dischargeType tinyint DEFAULT NULL,
    diet text,
    advice text,
    followUp tinyint DEFAULT NULL,
    followUpDate date DEFAULT NULL,
    icd text,
    departmentID int DEFAULT NULL,
    wardID int DEFAULT NULL,
    prescription text,
    diagnosis text,
    patientSubStatus tinyint DEFAULT NULL,
    zone tinyint DEFAULT NULL,
    PRIMARY KEY (id),
    KEY hospitalID (hospitalID),
    KEY patientID (patientID),
    KEY departmentID (departmentID),
    KEY wardID (wardID),
    CONSTRAINT patientTimeLine_ibfk_1 FOREIGN KEY (hospitalID) REFERENCES hospitals (id),
    CONSTRAINT patientTimeLine_ibfk_2 FOREIGN KEY (patientID) REFERENCES patients (id),
    CONSTRAINT patientTimeLine_ibfk_4 FOREIGN KEY (departmentID) REFERENCES departments (id),
    CONSTRAINT patientTimeLine_ibfk_5 FOREIGN KEY (wardID) REFERENCES wards (id)
  );`;

const auth_group = `CREATE TABLE auth_group (
    id int NOT NULL AUTO_INCREMENT,
    name varchar(150) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY name (name)
  );`;

const auth_user = `CREATE TABLE auth_user (
    id int NOT NULL AUTO_INCREMENT,
    password varchar(128) NOT NULL,
    last_login datetime(6) DEFAULT NULL,
    is_superuser tinyint(1) NOT NULL,
    username varchar(150) NOT NULL,
    first_name varchar(150) NOT NULL,
    last_name varchar(150) NOT NULL,
    email varchar(254) NOT NULL,
    is_staff tinyint(1) NOT NULL,
    is_active tinyint(1) NOT NULL,
    date_joined datetime(6) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY username (username)
  );`;

const users = `CREATE TABLE users (
    id int NOT NULL AUTO_INCREMENT,
    hospitalID int DEFAULT NULL,
    departmentID int DEFAULT NULL,
    email varchar(100) DEFAULT NULL,
    password varchar(100) DEFAULT NULL,
    role int DEFAULT NULL,
    countryCode varchar(10) DEFAULT NULL,
    phoneNo varchar(20) DEFAULT NULL,
    pin int DEFAULT NULL,
    forgotToken varchar(255) DEFAULT NULL,
    refreshToken varchar(255) DEFAULT NULL,
    firstName varchar(50) DEFAULT NULL,
    lastName varchar(50) DEFAULT NULL,
    photo varchar(50) DEFAULT NULL,
    dob datetime DEFAULT NULL,
    gender tinyint DEFAULT NULL,
    address varchar(255) DEFAULT NULL,
    city varchar(50) DEFAULT NULL,
    state varchar(50) DEFAULT NULL,
    pinCode int DEFAULT NULL,
    addedOn timestamp NULL DEFAULT CURRENT_TIMESTAMP,
    lastOnline timestamp NULL DEFAULT NULL,
    lastUpdated timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    isDeleted tinyint DEFAULT '0',
    scope varchar(255) DEFAULT NULL,
    zone tinyint DEFAULT NULL,
    PRIMARY KEY (id),
    KEY hospitalID (hospitalID),
    KEY departmentID (departmentID),
    CONSTRAINT users_ibfk_1 FOREIGN KEY (hospitalID) REFERENCES hospitals (id),
    CONSTRAINT users_ibfk_2 FOREIGN KEY (departmentID) REFERENCES departments (id)
  );`;

  const administrativeRegions = `CREATE TABLE administrativeRegions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    stateCode INT,
    state VARCHAR(100),
    districtCode INT,
    district VARCHAR(100),
    cityCode INT,
    city VARCHAR(100)
);`

const vitals = `CREATE TABLE vitals (
    id int NOT NULL AUTO_INCREMENT,
    timeLineID int DEFAULT NULL,
    patientID INT ,
    userID int DEFAULT NULL,
    pulse tinyint DEFAULT NULL,
    hrv float DEFAULT NULL,
    hrvTime timestamp NULL DEFAULT NULL,
    temperature float DEFAULT NULL,
    oxygen tinyint DEFAULT NULL,
    bp varchar(10) DEFAULT NULL,
    addedOn timestamp NULL DEFAULT CURRENT_TIMESTAMP,
    pulseTime timestamp NULL DEFAULT NULL,
    oxygenTime timestamp NULL DEFAULT NULL,
    temperatureTime timestamp NULL DEFAULT NULL,
    bpTime timestamp NULL DEFAULT NULL,
    givenTime timestamp NULL DEFAULT NULL,
    device tinyint DEFAULT '0',
    deviceTime bigint DEFAULT '0',
    battery tinyint DEFAULT NULL,
    respiratoryRate int DEFAULT NULL,
    respiratoryRateTime timestamp NULL DEFAULT NULL,
    PRIMARY KEY (id),
    KEY timeLineID (timeLineID),
    KEY userID (userID),
    CONSTRAINT vitals_ibfk_1 FOREIGN KEY (timeLineID) REFERENCES patientTimeLine (id),
    CONSTRAINT vitals_ibfk_2 FOREIGN KEY (userID) REFERENCES users (id)
  );`;

const vitalAlerts = `CREATE TABLE vitalAlerts (
    id int NOT NULL AUTO_INCREMENT,
    timeLineID int DEFAULT NULL,
    vitalID int DEFAULT NULL,
    seen tinyint DEFAULT '0',
    alertType tinyint DEFAULT NULL,
    alertMessage varchar(300) DEFAULT NULL,
    alertValue varchar(300) DEFAULT NULL,
    addedOn timestamp NULL DEFAULT CURRENT_TIMESTAMP,
    ward varchar(500) DEFAULT NULL,
    priority varchar(355) DEFAULT NULL,
    datetime varchar(555) DEFAULT NULL,
    PRIMARY KEY (id),
    KEY timeLineID (timeLineID),
    KEY vitalID (vitalID),
    CONSTRAINT vitalAlerts_ibfk_1 FOREIGN KEY (timeLineID) REFERENCES patientTimeLine (id),
    CONSTRAINT vitalAlerts_ibfk_2 FOREIGN KEY (vitalID) REFERENCES vitals (id)
  );`;

const schedule = `CREATE TABLE schedule (
    id int NOT NULL AUTO_INCREMENT,
    hospitalID int DEFAULT NULL,
    userID int DEFAULT NULL,
    patientTimeLineId int DEFAULT NULL,
    active tinyint(1) DEFAULT '1',
    startTime timestamp NULL DEFAULT NULL,
    roomID text,
    attendees text,
    endTime timestamp NULL DEFAULT NULL,
    addedOn timestamp NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY hospitalID (hospitalID),
    KEY userID (userID),
    KEY patientTimeLineId (patientTimeLineId),
    CONSTRAINT schedule_ibfk_1 FOREIGN KEY (hospitalID) REFERENCES hospitals (id),
    CONSTRAINT schedule_ibfk_2 FOREIGN KEY (userID) REFERENCES users (id),
    CONSTRAINT schedule_ibfk_3 FOREIGN KEY (patientTimeLineId) REFERENCES patientTimeLine (id)
  );`;

const shift = `CREATE TABLE shift (
    id int NOT NULL AUTO_INCREMENT,
    startTime time NOT NULL,
    endTime time NOT NULL,
    active tinyint(1) NOT NULL DEFAULT '1',
    hospitalID int DEFAULT NULL,
    PRIMARY KEY (id),
    KEY hospitalID (hospitalID),
    CONSTRAINT shift_ibfk_1 FOREIGN KEY (hospitalID) REFERENCES hospitals (id)
  );`;

const rooster = `CREATE TABLE rooster (
    date date DEFAULT NULL,
    addedOn timestamp NULL DEFAULT CURRENT_TIMESTAMP,
    id int NOT NULL AUTO_INCREMENT,
    shiftID int DEFAULT NULL,
    hospitalID int DEFAULT NULL,
    PRIMARY KEY (id),
    KEY fk_shiftID (shiftID),
    KEY hospitalID (hospitalID),
    CONSTRAINT fk_shiftID FOREIGN KEY (shiftID) REFERENCES shift (id),
    CONSTRAINT rooster_ibfk_1 FOREIGN KEY (hospitalID) REFERENCES hospitals (id)
  );`;

const transferPatient = `CREATE TABLE transferPatient (
    hospitalID int DEFAULT NULL,
    id int NOT NULL AUTO_INCREMENT,
    transferType tinyint DEFAULT NULL,
    reason text,
    bp varchar(10) DEFAULT NULL,
    temp float DEFAULT NULL,
    oxygen tinyint DEFAULT NULL,
    pulse tinyint DEFAULT NULL,
    patientTimeLineID int DEFAULT NULL,
    patientNewTimeLineID int DEFAULT NULL,
    patientID int DEFAULT NULL,
    transferDate timestamp NULL DEFAULT CURRENT_TIMESTAMP,
    hospitalName text,
    relativeName text,
    PRIMARY KEY (id),
    KEY hospitalID (hospitalID),
    KEY patientTimeLineID (patientTimeLineID),
    KEY patientNewTimeLineID (patientNewTimeLineID),
    KEY patientID (patientID),
    CONSTRAINT transferPatient_ibfk_1 FOREIGN KEY (hospitalID) REFERENCES hospitals (id),
    CONSTRAINT transferPatient_ibfk_2 FOREIGN KEY (patientTimeLineID) REFERENCES patientTimeLine (id),
    CONSTRAINT transferPatient_ibfk_3 FOREIGN KEY (patientNewTimeLineID) REFERENCES patientTimeLine (id),
    CONSTRAINT transferPatient_ibfk_4 FOREIGN KEY (patientID) REFERENCES patients (id)
  );`;

const tests = `CREATE TABLE tests (
    id int NOT NULL AUTO_INCREMENT,
    timeLineID int DEFAULT NULL,
    userID int DEFAULT NULL,
    hospitalID int DEFAULT NULL,
    patientID INT DEFAULT NULL,
    test varchar(100) DEFAULT NULL,
    addedOn timestamp NULL DEFAULT CURRENT_TIMESTAMP,
    loinc_num_ varchar(20) DEFAULT NULL,
    status enum("pending","processing","completed"),
    alertStatus enum ("pending","approved","rejected"),
    category enum("pathology","radiology"),
    isViewed boolean,
    approved_status timestamp,
    completed_status timestamp,
    rejectedReason VARCHAR(255) NULL,
    PRIMARY KEY (id),
    KEY timeLineID (timeLineID),
    KEY userID (userID),
    KEY hospitalID(hospitalID),
    CONSTRAINT tests_ibfk_1 FOREIGN KEY (timeLineID) REFERENCES patientTimeLine (id),
    CONSTRAINT tests_ibfk_2 FOREIGN KEY (userID) REFERENCES users (id),
    CONSTRAINT tests_ibfk_3 FOREIGN KEY (hospitalID) REFERENCES hospitals (id),
    CONSTRAINT tests_ibfk_4 FOREIGN KEY (patientID) REFERENCES patients (id)
);`;

const tickets = `CREATE TABLE tickets (
    id int NOT NULL AUTO_INCREMENT,
    hospitalID int DEFAULT NULL,
    userID int DEFAULT NULL,
    priority tinyint DEFAULT '0',
    status tinyint DEFAULT '0',
    type varchar(100) DEFAULT NULL,
    assignedID int DEFAULT NULL,
    subject text,
    addedOn timestamp NULL DEFAULT CURRENT_TIMESTAMP,
    dueDate date DEFAULT NULL,
    closeStatus tinyint DEFAULT NULL,
    ticketFor tinyint DEFAULT NULL,
    createdBy int DEFAULT NULL,
    reason text,
    module varchar(255) DEFAULT NULL,
    PRIMARY KEY (id),
    KEY hospitalID (hospitalID),
    KEY userID (userID),
    KEY assignedID (assignedID),
    KEY createdBy (createdBy),
    CONSTRAINT tickets_ibfk_1 FOREIGN KEY (hospitalID) REFERENCES hospitals (id),
    CONSTRAINT tickets_ibfk_2 FOREIGN KEY (userID) REFERENCES users (id),
    CONSTRAINT tickets_ibfk_3 FOREIGN KEY (assignedID) REFERENCES users (id),
    CONSTRAINT tickets_ibfk_4 FOREIGN KEY (createdBy) REFERENCES users (id)
  );`;

const triageForm = `CREATE TABLE triageForm (
    id bigint unsigned NOT NULL AUTO_INCREMENT,
    zone varchar(255) DEFAULT NULL,
    ward varchar(255) DEFAULT NULL,
    patientTimelineID int DEFAULT NULL,
    hospitalID int DEFAULT NULL,
    userID int DEFAULT NULL,
    lastKnownSequence varchar(255) DEFAULT NULL,
    criticalCondition varchar(255) DEFAULT NULL,
    oxygen int DEFAULT NULL,
    pulse int DEFAULT NULL,
    temperature float DEFAULT NULL,
    bpH int DEFAULT NULL,
    bpL int DEFAULT NULL,
    respiratoryRate int DEFAULT NULL,
    vitalsTime timestamp NULL DEFAULT NULL,
    radialPulse tinyint(1) DEFAULT NULL,
    noisyBreathing tinyint(1) DEFAULT NULL,
    activeSeizures varchar(255) DEFAULT NULL,
    cSpineInjury tinyint(1) DEFAULT NULL,
    angioedema varchar(255) DEFAULT NULL,
    stridor tinyint(1) DEFAULT NULL,
    activeBleeding tinyint(1) DEFAULT NULL,
    incompleteSentences tinyint(1) DEFAULT NULL,
    capillaryRefill varchar(255) DEFAULT NULL,
    alteredSensorium tinyint(1) DEFAULT NULL,
    activeBleedingType varchar(255) DEFAULT NULL,
    eyeMovement varchar(255) DEFAULT NULL,
    verbalResponse varchar(255) DEFAULT NULL,
    motorResponse varchar(255) DEFAULT NULL,
    painScale varchar(255) DEFAULT NULL,
    traumaType varchar(255) DEFAULT NULL,
    fallHeight varchar(255) DEFAULT NULL,
    fracture tinyint(1) DEFAULT NULL,
    fractureRegion varchar(255) DEFAULT NULL,
    amputation tinyint(1) DEFAULT NULL,
    neckSwelling tinyint(1) DEFAULT NULL,
    minorHeadInjury tinyint(1) DEFAULT NULL,
    abrasion tinyint(1) DEFAULT NULL,
    suspectedAbuse tinyint(1) DEFAULT NULL,
    chestInjuryType varchar(255) DEFAULT NULL,
    stabInjurySeverity varchar(255) DEFAULT NULL,
    stabInjuryLocation varchar(255) DEFAULT NULL,
    stabHeadScalp tinyint(1) DEFAULT NULL,
    stabHeadFace tinyint(1) DEFAULT NULL,
    stabHeadNeck tinyint(1) DEFAULT NULL,
    stabChestHeart tinyint(1) DEFAULT NULL,
    stabChestLungs tinyint(1) DEFAULT NULL,
    stabChestMajorBloodVessels tinyint(1) DEFAULT NULL,
    stabAbdomenStomach tinyint(1) DEFAULT NULL,
    stabAbdomenLiver tinyint(1) DEFAULT NULL,
    stabAbdomenKidneys tinyint(1) DEFAULT NULL,
    stabAbdomenSpleen tinyint(1) DEFAULT NULL,
    stabAbdomenIntestines tinyint(1) DEFAULT NULL,
    stabExtremityArm tinyint(1) DEFAULT NULL,
    stabExtremityLeg tinyint(1) DEFAULT NULL,
    stabExtremityMuscles tinyint(1) DEFAULT NULL,
    stabExtremityTendons tinyint(1) DEFAULT NULL,
    stabExtremityNerves tinyint(1) DEFAULT NULL,
    stabExtremityBloodVessels tinyint(1) DEFAULT NULL,
    pregnancy tinyint(1) DEFAULT NULL,
    pregnancyIssue varchar(255) DEFAULT NULL,
    trimester varchar(255) DEFAULT NULL,
    breathlessness tinyint(1) DEFAULT NULL,
    edema tinyint(1) DEFAULT NULL,
    internalBleeding tinyint(1) DEFAULT NULL,
    internalBleedingCause varchar(255) DEFAULT NULL,
    poisoning tinyint(1) DEFAULT NULL,
    poisoningCause varchar(255) DEFAULT NULL,
    burn tinyint(1) DEFAULT NULL,
    burnPercentage varchar(255) DEFAULT NULL,
    hanging tinyint(1) DEFAULT NULL,
    drowning tinyint(1) DEFAULT NULL,
    electrocution tinyint(1) DEFAULT NULL,
    heatStroke tinyint(1) DEFAULT NULL,
    fever tinyint(1) DEFAULT NULL,
    feverSymptoms varchar(255) DEFAULT NULL,
    drugOverdose tinyint(1) DEFAULT NULL,
    stoolPass tinyint(1) DEFAULT NULL,
    urinePass tinyint(1) DEFAULT NULL,
    swellingWound tinyint(1) DEFAULT NULL,
    dizziness tinyint(1) DEFAULT NULL,
    headache tinyint(1) DEFAULT NULL,
    coughCold tinyint(1) DEFAULT NULL,
    skinRash tinyint(1) DEFAULT NULL,
    medicoLegalExamination tinyint(1) DEFAULT NULL,
    TIME varchar(50) DEFAULT NULL,
    timelineID int DEFAULT NULL,
    addedOn timestamp NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY id (id),
    KEY patientTimelineID (patientTimelineID),
    KEY hospitalID (hospitalID),
    KEY userID (userID),
    KEY timelineID (timelineID),
    CONSTRAINT triageForm_ibfk_1 FOREIGN KEY (patientTimelineID) REFERENCES patientTimeLine (id),
    CONSTRAINT triageForm_ibfk_2 FOREIGN KEY (hospitalID) REFERENCES hospitals (id),
    CONSTRAINT triageForm_ibfk_3 FOREIGN KEY (userID) REFERENCES users (id),
    CONSTRAINT triageForm_ibfk_4 FOREIGN KEY (timelineID) REFERENCES patientTimeLine (id)
  );`;

const ticketComment = `CREATE TABLE ticketComment (
    id int NOT NULL AUTO_INCREMENT,
    ticketID int DEFAULT NULL,
    userID int DEFAULT NULL,
    comment text,
    addedOn timestamp NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY ticketID (ticketID),
    KEY userID (userID),
    CONSTRAINT ticketComment_ibfk_1 FOREIGN KEY (ticketID) REFERENCES tickets (id),
    CONSTRAINT ticketComment_ibfk_2 FOREIGN KEY (userID) REFERENCES users (id)
  );`;

const ticketAttachments = `CREATE TABLE ticketAttachments (
    id int NOT NULL AUTO_INCREMENT,
    ticketID int DEFAULT NULL,
    fileName varchar(100) DEFAULT NULL,
    givenName varchar(100) DEFAULT NULL,
    mimeType varchar(50) DEFAULT NULL,
    addedOn timestamp NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY ticketID (ticketID),
    CONSTRAINT ticketAttachments_ibfk_1 FOREIGN KEY (ticketID) REFERENCES tickets (id)
  );`;
const testList = `CREATE TABLE testList (
    Test_Name text,
    Detailed_Test_Names text
  );`;

const TestList = `CREATE TABLE TestList (
    name text
  );`;

const symptoms = `CREATE TABLE symptoms (
    id int NOT NULL AUTO_INCREMENT,
    timeLineID int DEFAULT NULL,
    userID int DEFAULT NULL,
    patientID INT,
    symptom varchar(100) DEFAULT NULL,
    conceptID int DEFAULT NULL,
    duration text,
    durationParameter text,
    addedOn timestamp NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY timeLineID (timeLineID),
    KEY userID (userID),
    CONSTRAINT symptoms_ibfk_1 FOREIGN KEY (timeLineID) REFERENCES patientTimeLine (id),
    CONSTRAINT symptoms_ibfk_2 FOREIGN KEY (userID) REFERENCES users (id)
  );`;

const searchsymptoms_term_all = `CREATE TABLE searchsymptoms_term_all (
    id varchar(20) NOT NULL,
    concept_id varchar(20) DEFAULT NULL,
    type_id varchar(20) DEFAULT NULL,
    term varchar(255) DEFAULT NULL,
    PRIMARY KEY (id)
  );`;

const readings = `CREATE TABLE readings (
    id int NOT NULL AUTO_INCREMENT,
    hubID int DEFAULT NULL,
    deviceID int DEFAULT NULL,
    temperature float DEFAULT NULL,
    battery tinyint DEFAULT NULL,
    deviceTime bigint DEFAULT NULL,
    uploadTime bigint DEFAULT NULL,
    addedOn timestamp NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY hubID (hubID),
    KEY deviceID (deviceID),
    CONSTRAINT readings_ibfk_1 FOREIGN KEY (hubID) REFERENCES hubs (id),
    CONSTRAINT readings_ibfk_2 FOREIGN KEY (deviceID) REFERENCES devices (id)
  );`;

const purchase = `CREATE TABLE purchase (
    id int NOT NULL AUTO_INCREMENT,
    hospitalID int NOT NULL,
    purchaseType enum('online','offline') DEFAULT NULL,
    purchaseDate date DEFAULT NULL,
    hubCount int NOT NULL,
    deviceCount int NOT NULL,
    totalCost decimal(10,2) NOT NULL,
    addedOn timestamp NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY hospitalID (hospitalID),
    CONSTRAINT purchase_ibfk_1 FOREIGN KEY (hospitalID) REFERENCES hospitals (id)
  );`;

const prescriptions = `CREATE TABLE prescriptions (
    id int NOT NULL AUTO_INCREMENT,
    hospitalID int DEFAULT NULL,
    timeLineID int DEFAULT NULL,
    userID int DEFAULT NULL,
    patientID INT ,
    diet text,
    advice text,
    followUp tinyint DEFAULT NULL,
    followUpDate date DEFAULT NULL,
    addedOn timestamp NULL DEFAULT CURRENT_TIMESTAMP,
    medicine text,
    medicineType text,
    medicineTime text,
    medicineDuration text,
    medicineFrequency text,
    medicineNotes text,
    test text,
    notes text,
    diagnosis text,
    meddosage int DEFAULT NULL,
    medicineStartDate date DEFAULT NULL,
    status tinyint DEFAULT 1,
    dosageUnit VARCHAR(255),
    PRIMARY KEY (id),
    KEY hospitalID (hospitalID),
    KEY timeLineID (timeLineID),
    KEY userID (userID),
    CONSTRAINT prescriptions_ibfk_1 FOREIGN KEY (hospitalID) REFERENCES hospitals (id),
    CONSTRAINT prescriptions_ibfk_2 FOREIGN KEY (timeLineID) REFERENCES patientTimeLine (id),
    CONSTRAINT prescriptions_ibfk_3 FOREIGN KEY (userID) REFERENCES users (id)
  );`;

const PreAnaestheticForm = `CREATE TABLE PreAnaestheticForm (
    id int NOT NULL AUTO_INCREMENT,
    timeLineID int DEFAULT NULL,
    name varchar(255) DEFAULT NULL,
    age varchar(255) DEFAULT NULL,
    sex varchar(255) DEFAULT NULL,
    weight varchar(255) DEFAULT NULL,
    height varchar(255) DEFAULT NULL,
    OT varchar(255) DEFAULT NULL,
    unit varchar(255) DEFAULT NULL,
    date varchar(255) DEFAULT NULL,
    diagnosis varchar(255) DEFAULT NULL,
    surgery varchar(255) DEFAULT NULL,
    ipNo varchar(255) DEFAULT NULL,
    diabetesMellitus tinyint(1) DEFAULT NULL,
    tb tinyint(1) DEFAULT NULL,
    palpitation tinyint(1) DEFAULT NULL,
    drugSensitivity tinyint(1) DEFAULT NULL,
    syncopalAttack tinyint(1) DEFAULT NULL,
    cav tinyint(1) DEFAULT NULL,
    jaundice tinyint(1) DEFAULT NULL,
    smokingAlcoholDrugAbuse tinyint(1) DEFAULT NULL,
    backache tinyint(1) DEFAULT NULL,
    bleedingTendency tinyint(1) DEFAULT NULL,
    allergy varchar(255) DEFAULT NULL,
    lastMeal varchar(255) DEFAULT NULL,
    convulsions tinyint(1) DEFAULT NULL,
    asthma tinyint(1) DEFAULT NULL,
    breathlessness tinyint(1) DEFAULT NULL,
    anaestheticExposure tinyint(1) DEFAULT NULL,
    hypertension tinyint(1) DEFAULT NULL,
    ischemicHeartDiseases tinyint(1) DEFAULT NULL,
    hospitalisation tinyint(1) DEFAULT NULL,
    anyOther varchar(255) DEFAULT NULL,
    presentMedication varchar(255) DEFAULT NULL,
    coughSputum varchar(255) DEFAULT NULL,
    built varchar(255) DEFAULT NULL,
    hydration tinyint(1) DEFAULT NULL,
    paltor tinyint(1) DEFAULT NULL,
    cyanosis tinyint(1) DEFAULT NULL,
    np tinyint(1) DEFAULT NULL,
    clubbing tinyint(1) DEFAULT NULL,
    pedalEdema tinyint(1) DEFAULT NULL,
    ascitis tinyint(1) DEFAULT NULL,
    nose tinyint(1) DEFAULT NULL,
    tmMovement tinyint(1) DEFAULT NULL,
    shortNeck tinyint(1) DEFAULT NULL,
    goitre tinyint(1) DEFAULT NULL,
    murmurs tinyint(1) DEFAULT NULL,
    cardiacEnlargements tinyint(1) DEFAULT NULL,
    liverSpleen tinyint(1) DEFAULT NULL,
    oralCavity varchar(255) DEFAULT NULL,
    mouthOpening varchar(255) DEFAULT NULL,
    teeth varchar(255) DEFAULT NULL,
    trachea varchar(255) DEFAULT NULL,
    cervicalSpineMovement varchar(255) DEFAULT NULL,
    mallampatiGrade varchar(255) DEFAULT NULL,
    spine varchar(255) DEFAULT NULL,
    lungs varchar(255) DEFAULT NULL,
    bp varchar(255) DEFAULT NULL,
    pulseRate varchar(255) DEFAULT NULL,
    rytm varchar(255) DEFAULT NULL,
    rr varchar(255) DEFAULT NULL,
    temperature varchar(255) DEFAULT NULL,
    heartSounds varchar(255) DEFAULT NULL,
    hb varchar(255) DEFAULT NULL,
    hiv tinyint(1) DEFAULT NULL,
    bt varchar(255) DEFAULT NULL,
    ct varchar(255) DEFAULT NULL,
    prothrombinTime varchar(255) DEFAULT NULL,
    urineAlbuminSugar varchar(255) DEFAULT NULL,
    bloodSugar varchar(255) DEFAULT NULL,
    bloodGroup varchar(255) DEFAULT NULL,
    serumCreatinine varchar(255) DEFAULT NULL,
    serumElectrolytes varchar(255) DEFAULT NULL,
    lft varchar(255) DEFAULT NULL,
    chestXRay varchar(255) DEFAULT NULL,
    ecg varchar(255) DEFAULT NULL,
    echo varchar(255) DEFAULT NULL,
    other varchar(255) DEFAULT NULL,
    opinion varchar(255) DEFAULT NULL,
    asaGrade varchar(255) DEFAULT NULL,
    instructions varchar(255) DEFAULT NULL,
    PRIMARY KEY (id),
    KEY timeLineID (timeLineID),
    CONSTRAINT PreAnaestheticForm_ibfk_1 FOREIGN KEY (timeLineID) REFERENCES patientTimeLine (id)
  );`;

const PincodeDistrict = `CREATE TABLE PincodeDistrict (
    id int NOT NULL AUTO_INCREMENT,
    pincode varchar(10) NOT NULL,
    district varchar(255) NOT NULL,
    PRIMARY KEY (id)
  );`;

const physicalExamination = `CREATE TABLE physicalExamination (
    id int NOT NULL AUTO_INCREMENT,
    hospitalID int DEFAULT NULL,
    physicalExaminationData json DEFAULT NULL,
    addedOn timestamp NULL DEFAULT CURRENT_TIMESTAMP,
    patientTimeLineID int DEFAULT NULL,
    PRIMARY KEY (id),
    KEY hospitalID (hospitalID),
    KEY fk_patientTimeLineID (patientTimeLineID),
    CONSTRAINT fk_patientTimeLineID FOREIGN KEY (patientTimeLineID) REFERENCES patientTimeLine (id),
    CONSTRAINT physicalExamination_ibfk_1 FOREIGN KEY (hospitalID) REFERENCES hospitals (id)
  );`;

const patientDoctors = `CREATE TABLE patientDoctors (
    id int NOT NULL AUTO_INCREMENT,
    hospitalID int DEFAULT NULL,
    patientTimeLineID int DEFAULT NULL,
    doctorID int DEFAULT NULL,
    assignedDate timestamp NULL DEFAULT CURRENT_TIMESTAMP,
    purpose varchar(50) DEFAULT NULL,
    active tinyint(1) DEFAULT '1',
    last_updated timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    category enum('primary','secondary') DEFAULT NULL,
    scope enum('doctor','surgon','anesthetic') DEFAULT 'doctor',
    PRIMARY KEY (id),
    KEY hospitalID (hospitalID),
    KEY patientTimeLineID (patientTimeLineID),
    KEY doctorID (doctorID),
    CONSTRAINT patientDoctors_ibfk_1 FOREIGN KEY (hospitalID) REFERENCES hospitals (id),
    CONSTRAINT patientDoctors_ibfk_2 FOREIGN KEY (patientTimeLineID) REFERENCES patientTimeLine (id),
    CONSTRAINT patientDoctors_ibfk_3 FOREIGN KEY (doctorID) REFERENCES users (id)
  );`;

const operationTheatre = `CREATE TABLE operationTheatre (
    id int NOT NULL AUTO_INCREMENT,
    patientTimeLineID int DEFAULT NULL,
    physicalExamination json DEFAULT NULL,
    preopRecord json DEFAULT NULL,
    consentForm text,
    anesthesiaRecord json DEFAULT NULL,
    hospitalID int DEFAULT NULL,
    postopRecord json DEFAULT NULL,
    status enum('pending','approved','rejected','scheduled','completed') DEFAULT 'pending',
    addedOn timestamp NULL DEFAULT CURRENT_TIMESTAMP,
    approvedTime timestamp NULL DEFAULT NULL,
    rejectedTime timestamp NULL DEFAULT NULL,
    scheduleTime timestamp NULL DEFAULT NULL,
    completedTime timestamp NULL DEFAULT NULL,
    patientType enum('elective','emergency') DEFAULT NULL,
    surgeryType text,
    rejectReason varchar(255) DEFAULT NULL,
    PRIMARY KEY (id),
    KEY patientTimeLineID (patientTimeLineID),
    KEY hospitalID (hospitalID),
    CONSTRAINT operationTheatre_ibfk_1 FOREIGN KEY (patientTimeLineID) REFERENCES patientTimeLine (id),
    CONSTRAINT operationTheatre_ibfk_2 FOREIGN KEY (hospitalID) REFERENCES hospitals (id)
  );`;
const onleave = `CREATE TABLE onleave (
    id bigint unsigned NOT NULL AUTO_INCREMENT,
    staffID int DEFAULT NULL,
    doctorName varchar(255) DEFAULT NULL,
    departmentName varchar(255) DEFAULT NULL,
    date date DEFAULT NULL,
    hospitalID int DEFAULT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY id (id),
    KEY staffID (staffID),
    KEY hospitalID (hospitalID),
    CONSTRAINT onleave_ibfk_2 FOREIGN KEY (staffID) REFERENCES users (id),
    CONSTRAINT onleave_ibfk_3 FOREIGN KEY (hospitalID) REFERENCES hospitals (id)
  );`;

const onduty = `CREATE TABLE onduty (
    id bigint unsigned NOT NULL AUTO_INCREMENT,
    roosterID int DEFAULT NULL,
    staffID int DEFAULT NULL,
    doctorName varchar(255) DEFAULT NULL,
    departmentName varchar(255) DEFAULT NULL,
    hospitalID int DEFAULT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY id (id),
    KEY roosterID (roosterID),
    KEY staffID (staffID),
    KEY hospitalID (hospitalID),
    CONSTRAINT onduty_ibfk_1 FOREIGN KEY (roosterID) REFERENCES rooster (id),
    CONSTRAINT onduty_ibfk_2 FOREIGN KEY (staffID) REFERENCES users (id),
    CONSTRAINT onduty_ibfk_3 FOREIGN KEY (hospitalID) REFERENCES hospitals (id)
  );`;

const medicines = `CREATE TABLE medicines (
    id int NOT NULL AUTO_INCREMENT,
    timeLineID int DEFAULT NULL,
    userID int DEFAULT NULL,
    medicineType tinyint DEFAULT NULL,
    medicineName varchar(255) DEFAULT NULL,
    daysCount tinyint DEFAULT NULL,
    doseCount int DEFAULT NULL,
    medicationTime varchar(500) DEFAULT NULL,
    doseTimings text,
    notes text,
    addedOn timestamp NULL DEFAULT CURRENT_TIMESTAMP,
    lastModified timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY timeLineID (timeLineID),
    KEY userID (userID),
    CONSTRAINT medicines_ibfk_1 FOREIGN KEY (timeLineID) REFERENCES patientTimeLine (id),
    CONSTRAINT medicines_ibfk_2 FOREIGN KEY (userID) REFERENCES users (id)
  );`;

const medicineReminders = `CREATE TABLE medicineReminders (
    id int NOT NULL AUTO_INCREMENT,
    medicineID int DEFAULT NULL,
    userID int DEFAULT NULL,
    dosageTime timestamp NULL DEFAULT NULL,
    givenTime timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    doseStatus tinyint DEFAULT '0',
    day varchar(10) DEFAULT NULL,
    note text,
    PRIMARY KEY (id),
    KEY medicineID (medicineID),
    KEY userID (userID),
    CONSTRAINT medicineReminders_ibfk_1 FOREIGN KEY (medicineID) REFERENCES medicines (id),
    CONSTRAINT medicineReminders_ibfk_2 FOREIGN KEY (userID) REFERENCES users (id)
  );`;
const medicineList = `CREATE TABLE medicineList (
    Medicine_Name text,
    Content_Name text
  );`;

const medicalHistory = `CREATE TABLE medicalHistory (
    id int NOT NULL AUTO_INCREMENT,
    patientID int DEFAULT NULL,
    userID int DEFAULT NULL,
    givenName varchar(50) DEFAULT NULL,
    givenPhone varchar(20) DEFAULT NULL,
    givenRelation varchar(50) DEFAULT NULL,
    bloodGroup varchar(3) DEFAULT NULL,
    bloodPressure varchar(10) DEFAULT NULL,
    disease text,
    foodAllergy text,
    medicineAllergy text,
    anaesthesia text,
    meds text,
    selfMeds text,
    chestCondition text,
    neurologicalDisorder text,
    heartProblems text,
    infections text,
    mentalHealth text,
    drugs text,
    pregnant text,
    hereditaryDisease text,
    lumps text,
    cancer text,
    addedOn timestamp NULL DEFAULT CURRENT_TIMESTAMP,
    lastModified timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    familyDisease varchar(255) DEFAULT NULL,
    PRIMARY KEY (id),
    KEY patientID (patientID),
    KEY userID (userID),
    CONSTRAINT medicalHistory_ibfk_1 FOREIGN KEY (patientID) REFERENCES patients (id),
    CONSTRAINT medicalHistory_ibfk_2 FOREIGN KEY (userID) REFERENCES users (id)
  );`;

const loinc_terms = `CREATE TABLE loinc_terms (
    id int NOT NULL AUTO_INCREMENT,
    status_ varchar(50) DEFAULT NULL,
    loinc_num_ varchar(20) DEFAULT NULL,
    long_common_name_ varchar(255) DEFAULT NULL,
    component_ varchar(255) DEFAULT NULL,
    property_ varchar(255) DEFAULT NULL,
    time_aspct_ varchar(50) DEFAULT NULL,
    system_ varchar(255) DEFAULT NULL,
    scale_typ_ varchar(50) DEFAULT NULL,
    method_typ_ varchar(255) DEFAULT NULL,
    classtype_ int DEFAULT NULL,
    example_ucum_units_ varchar(50) DEFAULT NULL,
    PRIMARY KEY (id)
  );`;

const json_staging = `CREATE TABLE json_staging (
    id int NOT NULL AUTO_INCREMENT,
    json_data json DEFAULT NULL,
    PRIMARY KEY (id)
  );`;

const followUp = `CREATE TABLE followUp (
    id int NOT NULL AUTO_INCREMENT,
    timelineID int DEFAULT NULL,
    date date DEFAULT NULL,
    status tinyint DEFAULT NULL,
    addedOn timestamp NULL DEFAULT CURRENT_TIMESTAMP,
    endTime timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY timelineID (timelineID),
    CONSTRAINT followUp_ibfk_1 FOREIGN KEY (timelineID) REFERENCES patientTimeLine (id)
  );`;

const doctorHandover = `CREATE TABLE doctorHandover (
    id int NOT NULL AUTO_INCREMENT,
    hospitalID int DEFAULT NULL,
    patientTimeLineID int DEFAULT NULL,
    handshakingFrom int DEFAULT NULL,
    handshakingTo int DEFAULT NULL,
    handshakingBy int DEFAULT NULL,
    reason text,
    addedOn timestamp NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY hospitalID (hospitalID),
    KEY patientTimeLineID (patientTimeLineID),
    KEY handshakingFrom (handshakingFrom),
    KEY handshakingTo (handshakingTo),
    KEY handshakingBy (handshakingBy),
    CONSTRAINT doctorHandover_ibfk_1 FOREIGN KEY (hospitalID) REFERENCES hospitals (id),
    CONSTRAINT doctorHandover_ibfk_2 FOREIGN KEY (patientTimeLineID) REFERENCES patientTimeLine (id),
    CONSTRAINT doctorHandover_ibfk_3 FOREIGN KEY (handshakingFrom) REFERENCES users (id),
    CONSTRAINT doctorHandover_ibfk_4 FOREIGN KEY (handshakingTo) REFERENCES users (id),
    CONSTRAINT doctorHandover_ibfk_5 FOREIGN KEY (handshakingBy) REFERENCES users (id)
  );`;

const django_migrations = `CREATE TABLE django_migrations (
    id bigint NOT NULL AUTO_INCREMENT,
    app varchar(255) NOT NULL,
    name varchar(255) NOT NULL,
    applied datetime(6) NOT NULL,
    PRIMARY KEY (id)
  );`;

const django_content_type = `CREATE TABLE django_content_type (
    id int NOT NULL AUTO_INCREMENT,
    app_label varchar(100) NOT NULL,
    model varchar(100) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY django_content_type_app_label_model_76bd3d3b_uniq (app_label,model)
  );`;

const django_admin_log = `CREATE TABLE django_admin_log (
    id int NOT NULL AUTO_INCREMENT,
    action_time datetime(6) NOT NULL,
    object_id longtext,
    object_repr varchar(200) NOT NULL,
    action_flag smallint unsigned NOT NULL,
    change_message longtext NOT NULL,
    content_type_id int DEFAULT NULL,
    user_id int NOT NULL,
    PRIMARY KEY (id),
    KEY django_admin_log_content_type_id_c4bce8eb_fk_django_co (content_type_id),
    KEY django_admin_log_user_id_c564eba6_fk_auth_user_id (user_id),
    CONSTRAINT django_admin_log_content_type_id_c4bce8eb_fk_django_co FOREIGN KEY (content_type_id) REFERENCES django_content_type (id),
    CONSTRAINT django_admin_log_user_id_c564eba6_fk_auth_user_id FOREIGN KEY (user_id) REFERENCES auth_user (id),
    CONSTRAINT django_admin_log_chk_1 CHECK ((action_flag >= 0))
  );`;

const deviceTimeLines = `CREATE TABLE deviceTimeLines (
    id int NOT NULL AUTO_INCREMENT,
    patientID int DEFAULT NULL,
    deviceID int DEFAULT NULL,
    addUserID int DEFAULT NULL,
    removeUserID int DEFAULT NULL,
    startTime timestamp NULL DEFAULT CURRENT_TIMESTAMP,
    endTime timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY patientID (patientID),
    KEY deviceID (deviceID),
    KEY addUserID (addUserID),
    KEY removeUserID (removeUserID),
    CONSTRAINT deviceTimeLines_ibfk_1 FOREIGN KEY (patientID) REFERENCES patients (id),
    CONSTRAINT deviceTimeLines_ibfk_2 FOREIGN KEY (deviceID) REFERENCES devices (id),
    CONSTRAINT deviceTimeLines_ibfk_3 FOREIGN KEY (addUserID) REFERENCES users (id),
    CONSTRAINT deviceTimeLines_ibfk_4 FOREIGN KEY (removeUserID) REFERENCES users (id)
  );`;

const auth_permission = `CREATE TABLE auth_permission (
    id int NOT NULL AUTO_INCREMENT,
    name varchar(255) NOT NULL,
    content_type_id int NOT NULL,
    codename varchar(100) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY auth_permission_content_type_id_codename_01ab375a_uniq (content_type_id,codename),
    CONSTRAINT auth_permission_content_type_id_2f476e4b_fk_django_co FOREIGN KEY (content_type_id) REFERENCES django_content_type (id)
  );`;

const attachments = `CREATE TABLE attachments (
    id int NOT NULL AUTO_INCREMENT,
    timeLineID int DEFAULT NULL,
    patientID INT,
    userID int DEFAULT NULL,
    fileName varchar(100) DEFAULT NULL,
    givenName varchar(100) DEFAULT NULL,
    mimeType varchar(50) DEFAULT NULL,
    addedOn timestamp NULL DEFAULT CURRENT_TIMESTAMP,
    category varchar(100) DEFAULT NULL,
    testID INT,
    PRIMARY KEY (id),
    KEY timeLineID (timeLineID),
    KEY userID (userID),
    CONSTRAINT attachments_ibfk_1 FOREIGN KEY (timeLineID) REFERENCES patientTimeLine (id),
    CONSTRAINT attachments_ibfk_2 FOREIGN KEY (userID) REFERENCES users (id)
  );`;

const pocus = `CREATE TABLE pocus (
    id INT AUTO_INCREMENT PRIMARY KEY,
    abdomen VARCHAR(255),
    abg VARCHAR(255),
    cxr VARCHAR(255),
    ecg VARCHAR(255),
    heart VARCHAR(255),
    ivc VARCHAR(255),
    leftPleuralEffusion VARCHAR(255),
    leftPneumothorax VARCHAR(255),
    rightPleuralEffusion VARCHAR(255),
    rightPneumothorax VARCHAR(255),
    patientTimeLineId INT,
    userID INT,
    FOREIGN KEY (patientTimeLineId) REFERENCES patientTimeLine(id),
    FOREIGN KEY (userID) REFERENCES users(id)
);
`;

const medicineStockHistory = `CREATE TABLE medicineStockHistory (
  id INT AUTO_INCREMENT PRIMARY KEY,
  medicineInventoryID INT NOT NULL,
   hospitalID INT NOT NULL,
  soldQty INT DEFAULT 0,
  inStock INT DEFAULT 0,
  expireDate TIMESTAMP NULL,
  soldDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  foreign key (medicineInventoryID) references medicineInventory(id),
  foreign key (hospitalID) references hospitals(id)
)`;

const medicineInventory = ` CREATE TABLE medicineInventory (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hospitalID int,
  foreign key (hospitalID) references hospitals(id),
  name text not null,
  category text not null,
  hsn text not null,
  quantity int not null,
  costPrice int, 
  sellingPrice int,
  email VARCHAR(255),
  lowStockValue INT DEFAULT 10,
  location text,
  used int default 0,
  gst DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  addedStock INT DEFAULT 0,
  expiryDate timestamp not null,
  addedOn  timestamp default CURRENT_TIMESTAMP,
  updatedOn TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  isActive TINYINT(1) NOT NULL DEFAULT 1,
  agencyID INT,
  addedBy INT,
  isReordered TINYINT(1) DEFAULT 0;
   foreign key (agencyID)references medicineInventoryManufacture(id),
   foreign key (addedBy)references users(id),
 )`;

const medicineInventoryPatientsOrder = `CREATE TABLE medicineInventoryPatientsOrder (
 id INT AUTO_INCREMENT PRIMARY KEY,
 hospitalID int,
 patientID INT,
 foreign key (hospitalID) references hospitals(id),
 patientTimeLineID int,
 foreign key (patientTimeLineID) references patientTimeLine(id),
 location int,
 departmemtType int,
 doctorID int,
 foreign key (doctorID)references users(id),
 medicinesList JSON,
 status enum("rejected","pending","completed"), 
 paymentDetails JSON,
 discount JSON,
 notes text,
 pIdNew int,
 addedOn  timestamp default CURRENT_TIMESTAMP,
 updatedOn TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)`;

const medicineInventoryManufacture = ` CREATE TABLE medicineInventoryManufacture(
  id INT AUTO_INCREMENT PRIMARY KEY,
  hospitalID INT,
  FOREIGN KEY (hospitalID) REFERENCES hospitals(id),
  agencyName text,
  contactNo varchar(20),
  location text,
  email VARCHAR(255),
  agentCode INT,
  manufacturer text,
  addedOn timestamp default CURRENT_TIMESTAMP
 )`;

const medicineInventoryExpense = `CREATE TABLE medicineInventoryExpense(
  id INT AUTO_INCREMENT PRIMARY KEY,
  hospitalID INT,
  FOREIGN KEY (hospitalID) REFERENCES hospitals(id),
  manufactureID INT,
  FOREIGN KEY (manufactureID) REFERENCES medicineInventoryManufacture(id),
  orderDate timestamp, 
  dueDate timestamp,
  medicinesList JSON,
  paymentDetails JSON,
  status enum("pending","approved","rejected"),
  addedOn timestamp default CURRENT_TIMESTAMP
 )`;

const medicineInventoryLogs = ` CREATE TABLE medicineInventoryLogs(
  id INT AUTO_INCREMENT PRIMARY KEY,
  hospitalID INT,
  FOREIGN KEY (hospitalID) REFERENCES hospitals(id),
  manufactureID INT,
  FOREIGN KEY (manufactureID) REFERENCES medicineInventoryManufacture(id),
  medicinesList JSON,
  addedOn timestamp default CURRENT_TIMESTAMP
  gst INT,
  userID INT,
 )`;

const medicineInventoryPatients = `CREATE TABLE medicineInventoryPatients(
  id INT AUTO_INCREMENT PRIMARY KEY,
  hospitalID INT,
  FOREIGN KEY (hospitalID) REFERENCES hospitals(id),
  pID INT,
  pName varchar(50),
  phoneNumber varchar(20),
  city varchar(50),
  medicinesList JSON,
  paymentDetails JSON,
  medGivenBy INT NOT NULL,
  addedOn timestamp default CURRENT_TIMESTAMP
)`;

const adminTasks = `CREATE TABLE adminTasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userID INT NOT NULL,
  task TEXT NOT NULL, -- Allows up to 16,777,215 characters
  status VARCHAR(50) DEFAULT 'pending', -- Modify the default status as per your requirement
  colour VARCHAR(20),
  addedon TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updateon TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userID) REFERENCES users(id)
);`;

const DoctorAppointmentScheduleTable = `CREATE TABLE DoctorAppointmentSchedule  (
  id INT AUTO_INCREMENT PRIMARY KEY,
  doctorID INT,
  hospitalID INT,
  slotTimings JSON,
  dayToggles JSON,
  addedOn TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedOn TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  addedBy INT,
  FOREIGN KEY (doctorID) REFERENCES users(id),
  FOREIGN KEY (hospitalID) REFERENCES hospitals(id)
);`;

const physicalexaminationimage = `
CREATE TABLE physicalexaminationimage (
    id INT AUTO_INCREMENT PRIMARY KEY,
    hospitalid INT NOT NULL,
    image varchar(500) NOT NULL,
    userid INT NOT NULL,
    patientid INT NOT NULL,
    patientTimeLineID INT NOT NULL,
    addedon DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);`;

const walkinTestAttachments = `CREATE TABLE walkinTestAttachments (
  id INT NOT NULL AUTO_INCREMENT,
  walkinId INT,
  userID INT DEFAULT NULL,
  fileName VARCHAR(100) DEFAULT NULL,
  givenName VARCHAR(100) DEFAULT NULL,
  mimeType VARCHAR(50) DEFAULT NULL,
  addedOn TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updatedOn TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  category VARCHAR(100) DEFAULT NULL,
  loincCode VARCHAR(100)
  PRIMARY KEY (id),
  KEY userID (userID),
  KEY walkinId (walkinId),
  FOREIGN KEY (walkinId) REFERENCES walkinPatientsTests (id),
  FOREIGN KEY (userID) REFERENCES users (id)
);`;

const walkinPatientsTests = `CREATE TABLE walkinPatientsTests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hospitalID INT,
  userID INT,
  pName VARCHAR(50),
  phoneNumber VARCHAR(20),
  city VARCHAR(50),
  addedOn TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedOn TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  pID TEXT,
  fileName TEXT,
  testsList JSON,
  discount JSON,
  paymentDetails JSON,
  department ENUM('Radiology', 'Pathology'),
  FOREIGN KEY (hospitalID) REFERENCES hospitals(id),
  FOREIGN KEY (userID) REFERENCES users(id) 
);`;

const templates = `CREATE TABLE IF NOT EXISTS templates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  templateName VARCHAR(255) NOT NULL,
  templateType VARCHAR(255) NOT NULL,
  fileURL TEXT NOT NULL,
  hospitalID INT NOT NULL,
  userID INT NOT NULL,
  fileName VARCHAR(255) NOT NULL;
  category VARCHAR(255);
  uploadedDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (hospitalID) REFERENCES hospitals(id) ON DELETE CASCADE,
  FOREIGN KEY (userID) REFERENCES users(id) ON DELETE CASCADE
);`;

const labTestPricing = `CREATE TABLE labTestPricing (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hospitalID INT NOT NULL,
  labTestID INT NOT NULL, 
  testPrice INT NOT NULL,
  gst INT NOT NULL,
  hsn VARCHAR(50) NOT NULL,
  addedOn TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedOn TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  isActive TINYINT(1) NOT NULL DEFAULT 1,
  deletedOn TIMESTAMP NULL,
  FOREIGN KEY (hospitalID) REFERENCES hospitals(id),
  FOREIGN KEY (labTestID) REFERENCES LabTests(id)
)`;

const testPaymentDetails = `CREATE TABLE testPaymentDetails (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hospitalID INT NOT NULL,
  patientID INT NOT NULL,
  timelineID INT NOT NULL,
  userID INT NOT NULL,
  paymentDetails JSON ,
  discount JSON,
  testCategory VARCHAR(255), 
  totalAmount DECIMAL(10,2) NOT NULL,
  paidAmount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  dueAmount DECIMAL(10,2) GENERATED ALWAYS AS (totalAmount - paidAmount) STORED,
  addedOn TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  lastUpdatedOn TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_user FOREIGN KEY (userID) REFERENCES users(id),
  CONSTRAINT fk_hospital FOREIGN KEY (hospitalID) REFERENCES hospitals(id) ON DELETE CASCADE,
  CONSTRAINT fk_patient FOREIGN KEY (patientID) REFERENCES patients(id) ON DELETE CASCADE,
  CONSTRAINT fk_timeline FOREIGN KEY (timelineID) REFERENCES patientTimeLine(id) ON DELETE CASCADE
);
`;

const staffLeaves=`CREATE TABLE staffLeaves (
    id INT AUTO_INCREMENT PRIMARY KEY,
    hospitalID INT,
    userID INT,
    fromDate DATE,
    toDate DATE,
    leaveType VARCHAR(500),
    addedOn TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedOn TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (hospitalID) REFERENCES hospitals(id),
    FOREIGN KEY (userID) REFERENCES users(id)
);`

const staffSchedules = `CREATE TABLE staffSchedules (
    id INT PRIMARY KEY AUTO_INCREMENT,
    hospitalID INT,
    userID INT,
    departmentID INT,
    wardID INT,
    fromDate DATE,
    toDate DATE,
    shiftTimings VARCHAR(100),
    scope TINYINT,
    addedOn TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedOn TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    addedBy INT,
    FOREIGN KEY (hospitalID) REFERENCES hospitals(id),
    FOREIGN KEY (userID) REFERENCES users(id),
    FOREIGN KEY (departmentID) REFERENCES departments(id),
    FOREIGN KEY (wardID) REFERENCES wards(id),
    FOREIGN KEY (addedBy) REFERENCES users(id),
);`

module.exports = {
  attachments,
  administrativeRegions,
  auth_permission,
  deviceTimeLines,
  django_admin_log,
  django_content_type,
  django_migrations,
  doctorHandover,
  followUp,
  json_staging,
  loinc_terms,
  medicalHistory,
  medicineList,
  medicineReminders,
  medicines,
  onduty,
  onleave,
  operationTheatre,
  patientDoctors,
  physicalExamination,
  PincodeDistrict,
  PreAnaestheticForm,
  prescriptions,
  purchase,
  readings,
  searchsymptoms_term_all,
  symptoms,
  TestList,
  testList,
  ticketAttachments,
  ticketComment,
  triageForm,
  tickets,
  tests,
  transferPatient,
  rooster,
  shift,
  schedule,
  vitalAlerts,
  vitals,
  users,
  auth_user,
  hospitals,
  wards,
  departments,
  hubs,
  devices,
  patients,
  patientTimeLine,
  auth_group,
  pocus,
  medicineInventory,
  medicineInventoryPatientsOrder,
  medicineInventoryManufacture,
  medicineInventoryExpense,
  medicineInventoryLogs,
  medicineInventoryPatients,
  adminTasks,
  DoctorAppointmentScheduleTable,
  physicalexaminationimage,
  walkinPatientsTests,
  medicineStockHistory,
  templates,
  labTestPricing,
  testPaymentDetails,
  walkinTestAttachments,
  staffLeaves,
  staffSchedules
};
