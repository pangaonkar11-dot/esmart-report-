// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║  CIBS MASTER DATA PIPELINE v4                                                ║
// ║  Central Institute of Behavioural Sciences, Nagpur                           ║
// ║  Dr. Shailesh V. Pangaonkar — Director & Consultant Psychiatrist             ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

const SHEET_ID_ADULT  = "1_X0cMuieQVaMH9umypcMkZjjrYAh84KqS0wJ4ZkGv34";
const SHEET_ID_ESMART = "1CxwCAQjErrDXEpxFkKXQX1WlOrpcPat9bQ-5FbpXo2A";

function getSheetId(tool) {
  return (tool==="eSMART-C"||tool==="eSMART-P"||tool==="eSMART-V")
    ? SHEET_ID_ESMART : SHEET_ID_ADULT;
}

// ── UNIVERSAL COLUMNS — Human readable labels ─────────────────────────────────
const UNIVERSAL_COLS = [
  "File No.",
  "Anonymous UID",
  "Timestamp",
  "Tool",
  "Mode",
  "Session No.",
  "Respondent Name",
  "Date of Birth",
  "Age (years)",
  "Gender",
  "Mobile",
  "Email",
  "Education",
  "Occupation",
  "Referral Source",
  "Assessor / Examiner",
  "Clinical Notes",
];

// Internal keys matching UNIVERSAL_COLS positions
const UNIVERSAL_KEYS = [
  "fileno","uid","timestamp","tool","mode","session_no",
  "name","dob","age","gender","mobile","email",
  "education","occupation","referral_source","assessor","clinical_notes",
];

// ── TOOL-SPECIFIC COLUMNS — Human readable ────────────────────────────────────
const TOOL_COLS = {

  "CIBS-VALID": {
    labels: [
      // D1 Cognition
      "Cognitive IQ Estimate","Cognitive Mental Age (yrs)","Cognitive Classification",
      "Cognitive Percentile","Cognitive Items Correct",
      // D2 Personality
      "BFI Openness (T)","BFI Conscientiousness (T)","BFI Extraversion (T)",
      "BFI Agreeableness (T)","BFI Neuroticism (T)",
      // D3 Health
      "Duke General Health","Duke Physical","Duke Mental",
      "Duke Social","Duke Depression Index","Duke Anxiety Index","Duke Self-Esteem",
      // D4 Risk
      "C-SSRS Level","C-SSRS Label",
      "AUDIT-C Score","AUDIT-C Classification",
      "SDQ Total",
    ],
    keys: [
      "cq_iq","cq_ma","cq_label","cq_percentile","cq_correct",
      "bfi_o","bfi_c","bfi_e","bfi_a","bfi_n",
      "duke_general","duke_phys","duke_mental","duke_social",
      "duke_depression","duke_anxiety","duke_selfesteem",
      "cssrs_level","cssrs_label",
      "auditc_score","auditc_label",
      "sdq_total",
    ],
  },

  "CIBS-VISTA": {
    labels: [
      // D1 Cognitive
      "VISTA Cognitive Quotient","VISTA Percentile","VISTA Band","VISTA Classification",
      "VISTA Cognitive Style",
      // D2 Personality
      "BFI Openness (T)","BFI Conscientiousness (T)","BFI Extraversion (T)",
      "BFI Agreeableness (T)","BFI Neuroticism (T)",
      "DSM-5 Cluster","DSM-5 Features",
      // D3 Emotional
      "Emotional Intelligence Score","EQ Band",
      // D4 Health
      "Mental Health Index (MHI)","Anxiety Index","Depression Index",
      "Physical Health Score","Social Functioning Index",
      // D5 Risk
      "SI Risk Level","SI Raw Score",
      "Substance Use Risk","SU Raw Score",
      "Conduct Risk Level","Conduct Raw Score",
      "Combined Risk Index (CRI)",
      // SCSS Codes
      "SCSS Shape Sequence","SCSS Colour Sequence",
      "SCSS Shade Sequence","SCSS Smiley Sequence",
    ],
    keys: [
      "vista_cq","vista_percentile","vista_band","vista_label","vista_cogstyle",
      "bfi_o","bfi_c","bfi_e","bfi_a","bfi_n",
      "dsm_cluster","dsm_features",
      "eq_score","eq_band",
      "mhi","anxiety_index","depression_index","phys_health","social_function",
      "sir_level","sir_raw","sur_level","sur_raw","cdr_level","cdr_raw","cri",
      "scss_shapecode","scss_colorcode","scss_shadecode","scss_smileycode",
    ],
  },

  "eSMART-C": {
    labels: [
      // Child demographics
      "Child Name","Child Date of Birth","Child Age (yrs)","Child Gender",
      "School / Institution","Class / Grade","Chief Complaint",
      // FIS
      "FIS IQ Estimate","FIS Mental Age (yrs)","FIS IQ Band","FIS Percentile",
      "FIS Total Correct","FIS Series Score","FIS Classification Score",
      "FIS Matrix Score","FIS Conditions Score",
      // SCSS
      "SCSS Cognitive Quotient","SCSS Cognitive Style",
      "SCSS Emotional Intelligence","SCSS EQ Band",
      "SCSS Mental Health Index","SCSS Combined Risk Index",
      "SCSS DSM-5 Cluster","SCSS DSM-5 Features",
      "SCSS Shape Sequence","SCSS Colour Sequence",
      "SCSS Shade Sequence","SCSS Smiley Sequence",
      "SCSS Validity",
    ],
    keys: [
      "child_name","child_dob","child_age","child_gender",
      "school","grade","chief_complaint",
      "fis_iq","fis_ma","fis_band","fis_percentile",
      "fis_correct","fis_series","fis_classif","fis_matrix","fis_cond",
      "scss_cq","scss_cogstyle","scss_eq","scss_eq_band",
      "scss_mhi","scss_risk_cri",
      "scss_dsm_cluster","scss_dsm_features",
      "scss_shapecode","scss_colorcode","scss_shadecode","scss_smileycode",
      "scss_validity",
    ],
  },

  "eSMART-P": {
    labels: [
      // Child demographics
      "Child Name","Child Date of Birth","Child Age (yrs)","Child Gender",
      "School / Institution","Class / Grade",
      // Informant
      "Informant Name","Informant Relation to Child","Informant Occupation",
      // Age band & overall risk
      "Age Band","Total Score","Percentile","Risk Level","Risk Label","Suicide Risk Flag",
      // Domain scores
      "IDD Score","IDD Severity",
      "ADHD Score","ADHD Severity",
      "ASD Score","ASD Severity",
      "SLD Score","SLD Severity",
      "MDD Score","MDD Severity",
      "Anxiety Score","Anxiety Severity",
      "ODD Score","ODD Severity",
      "Conduct Disorder Score","CD Severity",
    ],
    keys: [
      "child_name","child_dob","child_age","child_gender",
      "school","grade",
      "informant_name","informant_relation","informant_occupation",
      "ageband","total_score","percentile","risk_level","risk_label","suicide_flag",
      "idd_score","idd_sev",
      "adhd_score","adhd_sev",
      "asd_score","asd_sev",
      "sld_score","sld_sev",
      "mdd_score","mdd_sev",
      "anx_score","anx_sev",
      "odd_score","odd_sev",
      "cd_score","cd_sev",
    ],
  },

  "eSMART-V": {
    labels: [
      // Child demographics
      "Child Name","Child Date of Birth","Child Age (yrs)","Child Gender",
      "School / Institution","Class / Grade",
      // Clinician
      "Clinician Name","Assessment Date","Setting","Purpose / Referral",
      "Instruments Used",
      // IQ
      "FSIQ Estimate","IQ Source",
      "MISIC FSIQ","MISIC VCI","MISIC PRI","MISIC WMI","MISIC PSI",
      "WISC FSIQ","SB5 FSIQ","Ravens Total",
      // Adaptive & behaviour
      "VABS Adaptive Composite","SNAP Total","SNAP Inattention","SNAP Hyperactivity",
      // Diagnosis
      "Primary Diagnosis","Secondary Diagnosis","All Confirmed Diagnoses",
      "Cognitive Severity","Emotional Severity","Behavioural Severity",
      // Risk
      "C-SSRS Level","Risk Summary",
      // Clinical formulation
      "Clinical Impression","Strengths","Treatment Plan",
      "Referrals","Follow-Up Date","Prognosis",
      "Validation Status",
    ],
    keys: [
      "child_name","child_dob","child_age","child_gender",
      "school","grade",
      "clinician_name","assessment_date","setting","purpose",
      "instruments_used",
      "fsiq_estimate","iq_source",
      "misic_fsiq","misic_vci","misic_pri","misic_wmi","misic_psi",
      "wisc_fsiq","sb5_fsiq","ravens_total",
      "vabs_abc","snap_total","snap_inattention","snap_hyperactivity",
      "dx_primary","dx_secondary","dx_confirmed_all",
      "severity_cognitive","severity_emotional","severity_behavioural",
      "cssrs_level","risk_summary",
      "clinical_impression","strengths","treatment_plan",
      "referrals","follow_up_date","prognosis",
      "validation_status",
    ],
  },
};

// ── MASTER COLUMNS ─────────────────────────────────────────────────────────────
const MASTER_COLS_ADULT = [
  "File No.","Subject Name","Age","Gender","Last Updated",
  "VALID Session","VALID Date","VALID IQ Estimate","VALID IQ Classification",
  "VALID BFI-N","VALID Duke General","VALID C-SSRS Level","VALID AUDIT-C",
  "VISTA Session","VISTA Date","VISTA Cognitive Quotient","VISTA Band",
  "VISTA DSM-5 Cluster","VISTA CRI","VISTA EQ Score",
];

const MASTER_COLS_ESMART = [
  "File No.","Child Name","Child Age","Child Gender","Last Updated",
  "eSMART-C Session","eSMART-C Date","FIS IQ","FIS Band","SCSS EQ","SCSS Risk CRI",
  "eSMART-P Session","eSMART-P Date","Age Band","P Risk Level",
  "IDD Severity","ADHD Severity","ASD Severity","MDD Severity","Suicide Flag",
  "eSMART-V Session","eSMART-V Date","FSIQ Estimate","Primary Diagnosis",
  "All Diagnoses","Treatment Plan","Follow-Up Date",
];

function getMasterCols(tool) {
  return (tool==="eSMART-C"||tool==="eSMART-P"||tool==="eSMART-V")
    ? MASTER_COLS_ESMART : MASTER_COLS_ADULT;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN ENTRY POINT
// ═══════════════════════════════════════════════════════════════════════════════
function doPost(e) {
  try {
    const data   = JSON.parse(e.postData.contents);
    const tool   = data.tool || "UNKNOWN";
    const fileNo = (data.fileNo || "").trim();
    if (!fileNo) return jsonResponse({ status:"error", msg:"FileNo missing" });

    // Route weekly tracker separately
    if (tool === "WEEKLY") {
      const ss = SpreadsheetApp.openById(SHEET_ID_ESMART);
      insertWeekly(data, ss);
      // Also upsert MASTER with latest P-style data
      return jsonResponse({ status:"ok", fileNo, tool:"WEEKLY" });
    }

    const ss = SpreadsheetApp.openById(getSheetId(tool));

    const tabName   = toolTabName(tool);
    let   toolSheet = ss.getSheetByName(tabName);
    if (!toolSheet) { toolSheet = ss.insertSheet(tabName); setupTab(toolSheet, tool); }

    const sessionNo = getSessionNumber(toolSheet, fileNo);
    const row = buildRow(data, tool, sessionNo);
    toolSheet.appendRow(row);
    colorLastRow(toolSheet, tool);

    upsertMaster(ss, data, sessionNo, tool);

    return jsonResponse({ status:"ok", fileNo, tool, session:sessionNo });

  } catch (err) {
    return jsonResponse({ status:"error", msg:err.toString() });
  }
}

function doGet(e) {
  const p      = e.parameter || {};
  const action = p.action || "ping";
  const token  = p.token  || "";

  // Security token
  if (action !== "ping" && token !== "CIBS2026") {
    return jsonResponse({ status:"error", msg:"Unauthorised" });
  }

  // ── GET RECORD: fetch all C, P, V rows for a FileNo ──────────────────────
  if (action === "getRecord") {
    const fileNo = (p.reg || "").trim();
    if (!fileNo) return jsonResponse({ status:"error", msg:"FileNo missing" });

    const ss = SpreadsheetApp.openById(SHEET_ID_ESMART);
    const result = { fileNo, C:null, P:null, V:null, sessions:{C:0,P:0,V:0} };

    ["eSMART-C","eSMART-P","eSMART-V"].forEach(tool => {
      const tabName = toolTabName(tool);
      const sheet   = ss.getSheetByName(tabName);
      if (!sheet) return;

      const data    = sheet.getDataRange().getValues();
      if (data.length < 2) return;
      const headers = data[0];

      // Find ALL rows for this FileNo — take the latest session
      const rows = [];
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]).trim() === fileNo) rows.push(data[i]);
      }
      if (rows.length === 0) return;

      // Build object from latest row
      const latest = rows[rows.length - 1];
      const obj    = {};
      headers.forEach((h, idx) => { obj[h] = latest[idx]; });

      const key = tool.replace("eSMART-","");
      result[key]              = obj;
      result.sessions[key]     = rows.length;
    });

    return jsonResponse({ status:"ok", data:result });
  }

  // ── GET WEEKLY: fetch all weekly rows for a FileNo ────────────────────────
  if (action === "getWeekly") {
    const fileNo = (p.reg || "").trim();
    if (!fileNo) return jsonResponse({ status:"error", msg:"FileNo missing" });

    const ss    = SpreadsheetApp.openById(SHEET_ID_ESMART);
    const sheet = ss.getSheetByName("WEEKLY");
    if (!sheet) return jsonResponse({ status:"ok", data:{ fileNo, weeks:[] }});

    const data    = sheet.getDataRange().getValues();
    const headers = data[0];
    const weeks   = [];

    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim() === fileNo) {
        const obj = {};
        headers.forEach((h, idx) => { obj[h] = data[i][idx]; });
        weeks.push(obj);
      }
    }
    return jsonResponse({ status:"ok", data:{ fileNo, weeks }});
  }

  // ── PING ──────────────────────────────────────────────────────────────────
  return jsonResponse({ status:"alive", service:"CIBS Pipeline v4",
    endpoints:["getRecord","getWeekly"] });
}

// ── WEEKLY INSERT — handles POST from esmart-weekly ────────────────────────
function insertWeekly(data, ss) {
  const tabName = "WEEKLY";
  let sheet = ss.getSheetByName(tabName);
  if (!sheet) {
    sheet = ss.insertSheet(tabName);
    const hdrs = [
      "File No.","Child ID","Week No.","Timestamp","Language",
      "Behaviour Score","School Attendance","Attention Score",
      "Sleep Score","Appetite","Social Score","Aggression Score",
      "Problem vs Last Week","Intervention Category","Intervention Activity",
      "Intervention Helped","Parent Stress Score","Clinician Flag",
      "Flag Note","AI Feedback Given"
    ];
    sheet.appendRow(hdrs);
    sheet.getRange(1,1,1,hdrs.length)
      .setFontWeight("bold").setBackground("#1e293b").setFontColor("#fff");
    sheet.setFrozenRows(1);
  }
  const row = [
    data.fileNo||"", data.childId||"", data.weekNo||"",
    data.timestamp||new Date().toISOString(), data.lang||"en",
    data.behaviour||"", data.school||"", data.attention||"",
    data.sleep||"", data.appetite||"", data.social||"",
    data.aggression||"", data.problemVsLast||"",
    data.interventionCategory||"", data.interventionActivity||"",
    data.interventionHelped||"", data.parentStress||"",
    data.clinicianFlag||"", data.flagNote||"",
    data.aiFeedbackGiven||"yes"
  ];
  sheet.appendRow(row);
  colorLastRow(sheet, "eSMART-C");
}

// ═══════════════════════════════════════════════════════════════════════════════
// RUN THIS MANUALLY ONCE to pre-create all tabs with correct headers
// Select "setupAllSheets" in the function dropdown and click Run
// ═══════════════════════════════════════════════════════════════════════════════
function setupAllSheets() {
  // Adult sheet — VALID + VISTA
  const adultSS = SpreadsheetApp.openById(SHEET_ID_ADULT);
  ["CIBS-VALID","CIBS-VISTA"].forEach(tool => {
    const name = toolTabName(tool);
    let sh = adultSS.getSheetByName(name);
    if (!sh) sh = adultSS.insertSheet(name);
    applyHeaders(sh, tool);
  });
  setupMaster(adultSS, MASTER_COLS_ADULT);

  // eSMART sheet — C + P + V
  const smartSS = SpreadsheetApp.openById(SHEET_ID_ESMART);
  ["eSMART-C","eSMART-P","eSMART-V"].forEach(tool => {
    const name = toolTabName(tool);
    let sh = smartSS.getSheetByName(name);
    if (!sh) sh = smartSS.insertSheet(name);
    applyHeaders(sh, tool);
  });
  setupMaster(smartSS, MASTER_COLS_ESMART);

  return "All tabs created and headers applied.";
}

function applyHeaders(sheet, tool) {
  const cfg  = TOOL_COLS[tool];
  const cols = [...UNIVERSAL_COLS, ...cfg.labels];
  // Clear row 1 and rewrite
  sheet.getRange(1, 1, 1, Math.max(cols.length, sheet.getLastColumn())).clearContent();
  sheet.getRange(1, 1, 1, cols.length).setValues([cols]);
  sheet.getRange(1, 1, 1, cols.length)
    .setFontWeight("bold")
    .setBackground(toolColor(tool))
    .setFontColor("#FFFFFF")
    .setWrap(true);
  sheet.setFrozenRows(1);
  sheet.setColumnWidth(1, 140);
  sheet.setRowHeight(1, 50);
}

function setupMaster(ss, masterCols) {
  let master = ss.getSheetByName("MASTER");
  if (!master) master = ss.insertSheet("MASTER");
  master.getRange(1, 1, 1, Math.max(masterCols.length, master.getLastColumn())).clearContent();
  master.getRange(1, 1, 1, masterCols.length).setValues([masterCols]);
  master.getRange(1, 1, 1, masterCols.length)
    .setFontWeight("bold").setBackground("#1e293b").setFontColor("#FFFFFF").setWrap(true);
  master.setFrozenRows(1);
  master.setColumnWidth(1, 140);
}

// ─────────────────────────────────────────────────────────────────────────────
function toolTabName(tool) {
  const map = {"CIBS-VALID":"VALID","CIBS-VISTA":"VISTA","eSMART-C":"eSMART-C","eSMART-P":"eSMART-P","eSMART-V":"eSMART-V"};
  return map[tool] || tool;
}

function getSessionNumber(sheet, fileNo) {
  const data = sheet.getDataRange().getValues();
  let count = 0;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === fileNo) count++;
  }
  return count + 1;
}

function setupTab(sheet, tool) {
  applyHeaders(sheet, tool);
}

function toolColor(tool) {
  const colors = {"CIBS-VALID":"#1D6A4D","CIBS-VISTA":"#3C3489","eSMART-C":"#0C447C","eSMART-P":"#633806","eSMART-V":"#712B13"};
  return colors[tool] || "#374151";
}

function colorLastRow(sheet, tool) {
  const last = sheet.getLastRow(); if (last < 2) return;
  const cols = sheet.getLastColumn();
  const alt  = {"CIBS-VALID":"#E1F5EE","CIBS-VISTA":"#EEEDFE","eSMART-C":"#E6F1FB","eSMART-P":"#FAEEDA","eSMART-V":"#FAECE7"};
  sheet.getRange(last, 1, 1, cols).setBackground(alt[tool] || "#F8FAFC");
}

// ─────────────────────────────────────────────────────────────────────────────
function buildRow(data, tool, sessionNo) {
  const cfg  = TOOL_COLS[tool];
  const allKeys = [...UNIVERSAL_KEYS, ...cfg.keys];

  // Flat map of every possible field
  const d = data;
  const map = {
    // Universal
    "fileno":            d.fileNo||"",
    "uid":               d.uid||"",
    "timestamp":         d.timestamp||new Date().toISOString(),
    "tool":              d.tool||"",
    "mode":              d.mode||"",
    "session_no":        sessionNo,
    "name":              d.name||"Anonymous",
    "dob":               d.dob||"",
    "age":               d.age||"",
    "gender":            d.gender||"",
    "mobile":            d.mobile||"",
    "email":             d.email||"",
    "education":         d.education||"",
    "occupation":        d.occupation||"",
    "referral_source":   d.referral||"",
    "assessor":          d.assessor||"",
    "clinical_notes":    d.notes||"",
    // VALID
    "cq_iq":d.cq_iq||"","cq_ma":d.cq_ma||"","cq_label":d.cq_label||"",
    "cq_percentile":d.cq_percentile||"","cq_correct":d.cq_correct||"",
    "bfi_o":d.bfi_O||d.bfi_o||"","bfi_c":d.bfi_C||d.bfi_c||"",
    "bfi_e":d.bfi_E||d.bfi_e||"","bfi_a":d.bfi_A||d.bfi_a||"",
    "bfi_n":d.bfi_N||d.bfi_n||"",
    "duke_general":d.duke_general||"","duke_phys":d.duke_phys||"",
    "duke_mental":d.duke_mental||"","duke_social":d.duke_social||"",
    "duke_depression":d.duke_depression||"","duke_anxiety":d.duke_anxiety||"",
    "duke_selfesteem":d.duke_selfEsteem||d.duke_selfesteem||"",
    "cssrs_level":d.cssrs_level||"","cssrs_label":d.cssrs_label||"",
    "auditc_score":d.auditc_score||"","auditc_label":d.auditc_label||"",
    "sdq_total":d.sdq_total||"",
    // VISTA
    "vista_cq":d.vista_cq||d.vista_total||"",
    "vista_percentile":d.vista_percentile||"",
    "vista_band":d.vista_band||"","vista_label":d.vista_label||"",
    "vista_cogstyle":d.vista_cogStyle||"",
    "dsm_cluster":d.vista_dsmCluster||"","dsm_features":d.vista_dsmFeatures||"",
    "eq_score":d.vista_eq||"","eq_band":d.vista_eqBand||"",
    "mhi":d.vista_mhi||"","anxiety_index":d.vista_anxIdx||"",
    "depression_index":d.vista_depIdx||"","phys_health":d.vista_physNorm||"",
    "social_function":d.vista_sfi||"",
    "sir_level":d.vista_sir_level||"","sir_raw":d.vista_sir_raw||"",
    "sur_level":d.vista_sur_level||"","sur_raw":d.vista_sur_raw||"",
    "cdr_level":d.vista_cdr_level||"","cdr_raw":d.vista_cdr_raw||"",
    "cri":d.vista_cri||"",
    "scss_shapecode":d.vista_shapeCode||d.scss_shapeCode||"",
    "scss_colorcode":d.vista_colorCode||d.scss_colorCode||"",
    "scss_shadecode":d.vista_shadeCode||d.scss_shadeCode||"",
    "scss_smileycode":d.vista_smileyCode||d.scss_smileyCode||"",
    // eSMART-C
    "child_name":d.child_name||"","child_dob":d.child_dob||"",
    "child_age":d.child_age||"","child_gender":d.child_gender||"",
    "school":d.school||"","grade":d.grade||"","chief_complaint":d.chief_complaint||"",
    "fis_iq":d.fis_iq||"","fis_ma":d.fis_ma||"","fis_band":d.fis_band||"",
    "fis_percentile":d.fis_percentile||"","fis_correct":d.fis_correct||"",
    "fis_series":d.fis_series||"","fis_classif":d.fis_classif||"",
    "fis_matrix":d.fis_matrix||"","fis_cond":d.fis_cond||"",
    "scss_cq":d.scss_cq||d.scss_total||"","scss_cogstyle":d.scss_cogStyle||"",
    "scss_eq":d.scss_eq||"","scss_eq_band":d.scss_eqBand||"",
    "scss_mhi":d.scss_mhi||"","scss_risk_cri":d.scss_cri||"",
    "scss_dsm_cluster":d.scss_dsmCluster||"","scss_dsm_features":d.scss_dsmFeatures||"",
    "scss_validity":d.scss_validity||"",
    // eSMART-P
    "informant_name":d.parent_name||d.informant_name||"",
    "informant_relation":d.relationship_to_child||d.relationship||"",
    "informant_occupation":d.informant_occupation||"",
    "ageband":d.age_band||"","total_score":d.total_score||"",
    "percentile":d.percentile||"","risk_level":d.risk_level||"",
    "risk_label":d.risk_label||"","suicide_flag":d.suicide_flag||"",
    "idd_score":d.idd_score||"","idd_sev":d.idd_sev||"",
    "adhd_score":d.adhd_score||"","adhd_sev":d.adhd_sev||"",
    "asd_score":d.asd_score||"","asd_sev":d.asd_sev||"",
    "sld_score":d.sld_score||"","sld_sev":d.sld_sev||"",
    "mdd_score":d.mdd_score||"","mdd_sev":d.mdd_sev||"",
    "anx_score":d.anx_score||"","anx_sev":d.anx_sev||"",
    "odd_score":d.odd_score||"","odd_sev":d.odd_sev||"",
    "cd_score":d.cd_score||"","cd_sev":d.cd_sev||"",
    // eSMART-V
    "clinician_name":d.clinician_name||"","assessment_date":d.assessment_date||"",
    "setting":d.setting||"","purpose":d.purpose||d.referral||"",
    "instruments_used":d.instruments_used||"",
    "fsiq_estimate":d.clinical_iq_estimate||"","iq_source":d.iq_source||"",
    "misic_fsiq":d.misic_fsiq||"","misic_vci":d.misic_vci||"",
    "misic_pri":d.misic_pri||"","misic_wmi":d.misic_wmi||"","misic_psi":d.misic_psi||"",
    "wisc_fsiq":d.wisc_fsiq||"","sb5_fsiq":d.sb5_fsiq||"","ravens_total":d.ravens_total||"",
    "vabs_abc":d.vabs_abc||d.vsms_total||"",
    "snap_total":d.snap_total||d.conners_total||"",
    "snap_inattention":d.snap_inattention||d.conners_inattention||"",
    "snap_hyperactivity":d.snap_hyperactivity||d.conners_hyperactivity||"",
    "dx_primary":d.dx_primary||"","dx_secondary":d.dx_secondary||"",
    "dx_confirmed_all":d.diagnosis_provisional||"",
    "severity_cognitive":d.severity_cognitive||"",
    "severity_emotional":d.severity_emotional||"",
    "severity_behavioural":d.severity_behavioural||"",
    "risk_summary":d.risk_summary||"",
    "clinical_impression":d.clinical_impression||"",
    "strengths":d.strengths||"","treatment_plan":d.recommendation||d.treatment_plan||"",
    "referrals":d.referrals||"","follow_up_date":d.follow_up_date||"",
    "prognosis":d.prognosis||"","validation_status":d.validation_status||"",
  };

  return allKeys.map(k => map[k] !== undefined ? map[k] : "");
}

// ─────────────────────────────────────────────────────────────────────────────
function upsertMaster(ss, data, sessionNo, tool) {
  const masterCols = getMasterCols(tool);
  let master = ss.getSheetByName("MASTER");
  if (!master) {
    master = ss.insertSheet("MASTER");
    setupMaster(ss, masterCols);
  }

  const fileNo  = (data.fileNo || "").trim();
  const now     = new Date().toISOString().split("T")[0];
  const allData = master.getDataRange().getValues();

  let existingRow = -1;
  for (let i = 1; i < allData.length; i++) {
    if (String(allData[i][0]).trim() === fileNo) { existingRow = i + 1; break; }
  }

  if (existingRow === -1) {
    const newRow = new Array(masterCols.length).fill("");
    newRow[0] = fileNo;
    newRow[1] = data.child_name || data.name || "Anonymous";
    newRow[2] = data.child_age  || data.age  || "";
    newRow[3] = data.child_gender || data.gender || "";
    newRow[4] = now;
    master.appendRow(newRow);
    existingRow = master.getLastRow();
  }

  const row = master.getRange(existingRow, 1, 1, masterCols.length).getValues()[0];
  const ci  = (name) => masterCols.indexOf(name);

  row[1] = data.child_name || data.name || row[1];
  row[2] = data.child_age  || data.age  || row[2];
  row[3] = data.child_gender || data.gender || row[3];
  row[4] = now;

  const d = data;
  if (tool === "CIBS-VALID") {
    row[ci("VALID Session")]        = sessionNo;
    row[ci("VALID Date")]           = now;
    row[ci("VALID IQ Estimate")]    = d.cq_iq||"";
    row[ci("VALID IQ Classification")] = d.cq_label||"";
    row[ci("VALID BFI-N")]          = d.bfi_N||d.bfi_n||"";
    row[ci("VALID Duke General")]   = d.duke_general||"";
    row[ci("VALID C-SSRS Level")]   = d.cssrs_level||"";
    row[ci("VALID AUDIT-C")]        = d.auditc_label||"";
  } else if (tool === "CIBS-VISTA") {
    row[ci("VISTA Session")]        = sessionNo;
    row[ci("VISTA Date")]           = now;
    row[ci("VISTA Cognitive Quotient")] = d.vista_cq||"";
    row[ci("VISTA Band")]           = d.vista_band||"";
    row[ci("VISTA DSM-5 Cluster")]  = d.vista_dsmCluster||"";
    row[ci("VISTA CRI")]            = d.vista_cri||"";
    row[ci("VISTA EQ Score")]       = d.vista_eq||"";
  } else if (tool === "eSMART-C") {
    row[ci("eSMART-C Session")]     = sessionNo;
    row[ci("eSMART-C Date")]        = now;
    row[ci("FIS IQ")]               = d.fis_iq||"";
    row[ci("FIS Band")]             = d.fis_band||"";
    row[ci("SCSS EQ")]              = d.scss_eq||"";
    row[ci("SCSS Risk CRI")]        = d.scss_cri||"";
  } else if (tool === "eSMART-P") {
    row[ci("eSMART-P Session")]     = sessionNo;
    row[ci("eSMART-P Date")]        = now;
    row[ci("Age Band")]             = d.age_band||"";
    row[ci("P Risk Level")]         = d.risk_level||"";
    row[ci("IDD Severity")]         = d.idd_sev||"";
    row[ci("ADHD Severity")]        = d.adhd_sev||"";
    row[ci("ASD Severity")]         = d.asd_sev||"";
    row[ci("MDD Severity")]         = d.mdd_sev||"";
    row[ci("Suicide Flag")]         = d.suicide_flag||"";
  } else if (tool === "eSMART-V") {
    row[ci("eSMART-V Session")]     = sessionNo;
    row[ci("eSMART-V Date")]        = now;
    row[ci("FSIQ Estimate")]        = d.clinical_iq_estimate||"";
    row[ci("Primary Diagnosis")]    = d.dx_primary||"";
    row[ci("All Diagnoses")]        = d.diagnosis_provisional||"";
    row[ci("Treatment Plan")]       = d.recommendation||d.treatment_plan||"";
    row[ci("Follow-Up Date")]       = d.follow_up_date||"";
  }

  master.getRange(existingRow, 1, 1, masterCols.length).setValues([row]);
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
