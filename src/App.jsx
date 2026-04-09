import { useState, useEffect, useRef } from "react";

// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  eSMART Combined Report + AI Intervention Plan                          ║
// ║  Central Institute of Behavioural Sciences, Nagpur                      ║
// ║  Dr. Shailesh V. Pangaonkar — Director & Consultant Psychiatrist        ║
// ╚══════════════════════════════════════════════════════════════════════════╝

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxYw3DNfteGUApE97zpPScPgVCrHjNXTU-kuwabwQNviLmsaW4gSEd6hqY1FoTJsxu4HQ/exec";
const TOKEN = "CIBS2026";

// ── URL helpers ────────────────────────────────────────────────────────────
const getParam = k => { try { return new URLSearchParams(window.location.search).get(k)||""; } catch { return ""; } };

// ── Auto Child ID ──────────────────────────────────────────────────────────
function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) { h = Math.imul(31, h) + s.charCodeAt(i) | 0; }
  return Math.abs(h).toString(36).toUpperCase().slice(0, 4);
}
function generateChildID(mobile="", email="", cibsReg="", dob="", gender="") {
  const yr = String(new Date().getFullYear()).slice(-2);
  const m4 = mobile.replace(/\D/g,"").slice(-4);
  const eh = email ? hashStr(email.toLowerCase()) : "";
  const dh = dob   ? hashStr(dob.replace(/-/g,""))  : "";
  const gh = gender ? gender[0].toUpperCase() : "X";
  if (cibsReg) return `CIBS-C-${cibsReg}-${m4||eh||dh}-${gh}`;
  if (m4 && eh) return `CIBS-C-${yr}-${m4}-${eh}`;
  if (m4)       return `CIBS-C-MOB-${yr}-${m4}-${dh||"AUTO"}`;
  if (email)    return `CIBS-C-EMAIL-${yr}-${eh}-${dh||"AUTO"}`;
  return `CIBS-C-AUTO-${yr}-${hashStr(dob+gender+mobile)}`;
}

// ── Translations ───────────────────────────────────────────────────────────
const T = {
  en: {
    title:"eSMART Combined Assessment Report",
    org:"Central Institute of Behavioural Sciences, Nagpur",
    clinicalTab:"🏥 Clinical Report",
    familyTab:"👨‍👩‍👧 Family Report",
    printBtn:"🖨 Print / Save PDF",
    loading:"Fetching assessment data…",
    generating:"Generating AI intervention plan…",
    noData:"No assessment data found for this File No.",
    pendingC:"eSMART-C (Cognitive) — Not yet completed",
    pendingP:"eSMART-P (Parent Questionnaire) — Not yet completed",
    pendingV:"eSMART-V (Clinician Validation) — Not yet completed",
    addData:"Complete this module to strengthen the report",
    strengths:"Child's Strengths",
    challenges:"Areas Needing Support",
    thisWeek:"What to do this week",
    watchFor:"Signs to watch for",
    tellSchool:"What to tell the school",
    nextAppt:"Next Steps",
    confLabel:"CONFIDENTIAL — For clinical use only",
    famConfLabel:"For family and caregivers",
    sessionLabel:"Session",
    dateLabel:"Report Date",
    fileLabel:"File No.",
    childIDLabel:"Child ID",
    ageLabel:"Age",
    genderLabel:"Gender",
    schoolLabel:"School",
    tier1:"Tier 1 — Immediate (This Month)",
    tier2:"Tier 2 — Short-Term (3 Months)",
    tier3:"Tier 3 — Long-Term (6–12 Months)",
    schoolLetter:"School Accommodation Letter",
    medReview:"Medication Review Checklist",
    greeting:"Dear Parent / Caregiver,",
    familyIntro:"This report summarises your child's assessment at CIBS. It is written for you — in plain words, no medical jargon. Please read it with the clinician who assessed your child.",
    baselineNote:"This is a BASELINE ASSESSMENT REPORT. A 6-month follow-up impact report will be generated after weekly progress tracking.",
  },
  hi: {
    title:"eSMART संयुक्त मूल्यांकन रिपोर्ट",
    org:"केंद्रीय व्यावहारिक विज्ञान संस्थान, नागपुर",
    clinicalTab:"🏥 चिकित्सक रिपोर्ट",
    familyTab:"👨‍👩‍👧 परिवार रिपोर्ट",
    printBtn:"🖨 प्रिंट / PDF सहेजें",
    loading:"मूल्यांकन डेटा लोड हो रहा है…",
    generating:"AI हस्तक्षेप योजना तैयार की जा रही है…",
    noData:"इस FileNo के लिए कोई डेटा नहीं मिला।",
    pendingC:"eSMART-C (संज्ञानात्मक) — अभी पूरा नहीं हुआ",
    pendingP:"eSMART-P (अभिभावक प्रश्नावली) — अभी पूरा नहीं हुआ",
    pendingV:"eSMART-V (चिकित्सक सत्यापन) — अभी पूरा नहीं हुआ",
    addData:"रिपोर्ट को मजबूत बनाने के लिए यह मॉड्यूल पूरा करें",
    strengths:"बच्चे की खूबियाँ",
    challenges:"सहायता की जरूरत वाले क्षेत्र",
    thisWeek:"इस सप्ताह क्या करें",
    watchFor:"किन संकेतों पर ध्यान दें",
    tellSchool:"स्कूल को क्या बताएं",
    nextAppt:"अगले कदम",
    confLabel:"गोपनीय — केवल चिकित्सकीय उपयोग के लिए",
    famConfLabel:"परिवार और देखभालकर्ताओं के लिए",
    sessionLabel:"सत्र",
    dateLabel:"रिपोर्ट दिनांक",
    fileLabel:"फाइल नं.",
    childIDLabel:"बाल ID",
    ageLabel:"आयु",
    genderLabel:"लिंग",
    schoolLabel:"विद्यालय",
    tier1:"स्तर 1 — तत्काल (इस माह)",
    tier2:"स्तर 2 — अल्पकालिक (3 माह)",
    tier3:"स्तर 3 — दीर्घकालिक (6–12 माह)",
    schoolLetter:"विद्यालय के लिए पत्र",
    medReview:"दवाई समीक्षा जाँचसूची",
    greeting:"प्रिय माता-पिता / देखभालकर्ता,",
    familyIntro:"यह रिपोर्ट CIBS में आपके बच्चे के मूल्यांकन का सारांश है। यह आपके लिए लिखी गई है — सरल भाषा में, कोई चिकित्सकीय शब्दजाल नहीं।",
    baselineNote:"यह एक आधार रेखा मूल्यांकन रिपोर्ट है। साप्ताहिक ट्रैकिंग के बाद 6 माह की प्रभाव रिपोर्ट तैयार की जाएगी।",
  },
  mr: {
    title:"eSMART एकत्रित मूल्यांकन अहवाल",
    org:"केंद्रीय वर्तणूक विज्ञान संस्था, नागपूर",
    clinicalTab:"🏥 वैद्यकीय अहवाल",
    familyTab:"👨‍👩‍👧 कुटुंब अहवाल",
    printBtn:"🖨 प्रिंट / PDF जतन करा",
    loading:"मूल्यांकन डेटा लोड होत आहे…",
    generating:"AI हस्तक्षेप योजना तयार होत आहे…",
    noData:"या FileNo साठी कोणताही डेटा सापडला नाही।",
    pendingC:"eSMART-C (संज्ञानात्मक) — अद्याप पूर्ण नाही",
    pendingP:"eSMART-P (पालक प्रश्नावली) — अद्याप पूर्ण नाही",
    pendingV:"eSMART-V (वैद्यकीय प्रमाणीकरण) — अद्याप पूर्ण नाही",
    addData:"अहवाल मजबूत करण्यासाठी हे मॉड्यूल पूर्ण करा",
    strengths:"मुलाचे गुण",
    challenges:"मदतीची आवश्यकता असलेले क्षेत्र",
    thisWeek:"या आठवड्यात काय करावे",
    watchFor:"कोणत्या चिन्हांवर लक्ष ठेवावे",
    tellSchool:"शाळेला काय सांगावे",
    nextAppt:"पुढील पावले",
    confLabel:"गोपनीय — केवळ वैद्यकीय वापरासाठी",
    famConfLabel:"कुटुंब आणि काळजीवाहकांसाठी",
    sessionLabel:"सत्र",
    dateLabel:"अहवाल दिनांक",
    fileLabel:"फाइल क्र.",
    childIDLabel:"बाल ID",
    ageLabel:"वय",
    genderLabel:"लिंग",
    schoolLabel:"शाळा",
    tier1:"स्तर 1 — तात्काळ (या महिन्यात)",
    tier2:"स्तर 2 — अल्पकालीन (3 महिने)",
    tier3:"स्तर 3 — दीर्घकालीन (6–12 महिने)",
    schoolLetter:"शाळेसाठी पत्र",
    medReview:"औषध पुनरावलोकन तपासणी यादी",
    greeting:"प्रिय पालक / काळजीवाहक,",
    familyIntro:"हा अहवाल CIBS मध्ये तुमच्या मुलाच्या मूल्यांकनाचा सारांश आहे। हे तुमच्यासाठी लिहिले आहे — सोप्या शब्दांत।",
    baselineNote:"हा एक आधाररेषा मूल्यांकन अहवाल आहे. साप्ताहिक ट्रॅकिंगनंतर 6 महिन्यांचा प्रभाव अहवाल तयार केला जाईल.",
  },
};

// ── AI: Generate intervention plan ─────────────────────────────────────────
async function generatePlan(profile) {
  const { C, P, V, childInfo, available } = profile;

  const prompt = `You are a senior child psychologist at CIBS Nagpur. Generate a comprehensive, evidence-based intervention plan report for the following child assessment. Return ONLY valid JSON, no markdown, no explanation.

Child: ${childInfo.name||"Subject"}, Age: ${childInfo.age||"?"} years, Gender: ${childInfo.gender||"?"}
Available data: ${available.join(" + ")}

${C ? `COGNITIVE (CIBS-FIS + SCSS):
FIS IQ: ${C["FIS IQ Estimate"]||"?"}, Band: ${C["FIS IQ Band"]||"?"},
Mental Age: ${C["FIS Mental Age (yrs)"]||"?"} yrs, Percentile: ${C["FIS Percentile"]||"?"}
FIS Series: ${C["FIS Series Score"]||"?"}, Classification: ${C["FIS Classification Score"]||"?"},
Matrix: ${C["FIS Matrix Score"]||"?"}, Conditions: ${C["FIS Conditions Score"]||"?"}
SCSS Cognitive Quotient: ${C["SCSS Cognitive Quotient"]||"?"}
SCSS Cognitive Style: ${C["SCSS Cognitive Style"]||"?"}
SCSS Emotional Intelligence: ${C["SCSS Emotional Intelligence"]||"?"}
SCSS DSM Cluster: ${C["SCSS DSM-5 Cluster"]||"?"}
SCSS Risk CRI: ${C["SCSS Combined Risk Index"]||"?"}
SCSS Mental Health Index: ${C["SCSS Mental Health Index"]||"?"}` : ""}

${P ? `BEHAVIOURAL (Parent Report):
Age Band: ${P["Age Band"]||"?"}
Risk Level: ${P["Risk Level"]||"?"} — ${P["Risk Label"]||"?"}
IDD: ${P["IDD Score"]||"?"} (${P["IDD Severity"]||"?"})
ADHD: ${P["ADHD Score"]||"?"} (${P["ADHD Severity"]||"?"})
ASD: ${P["ASD Score"]||"?"} (${P["ASD Severity"]||"?"})
SLD: ${P["SLD Score"]||"?"} (${P["SLD Severity"]||"?"})
MDD: ${P["MDD Score"]||"?"} (${P["MDD Severity"]||"?"})
Anxiety: ${P["Anxiety Score"]||"?"} (${P["Anxiety Severity"]||"?"})
ODD: ${P["ODD Score"]||"?"} (${P["ODD Severity"]||"?"})
CD: ${P["Conduct Disorder Score"]||"?"} (${P["CD Severity"]||"?"})
Suicide Flag: ${P["Suicide Risk Flag"]||"None"}` : ""}

${V ? `CLINICIAN VALIDATION:
FSIQ Estimate: ${V["FSIQ Estimate"]||"?"}
Primary Diagnosis: ${V["Primary Diagnosis"]||"?"}
All Diagnoses: ${V["All Confirmed Diagnoses"]||"?"}
Clinical Impression: ${V["Clinical Impression"]||"?"}
Treatment Plan: ${V["Treatment Plan"]||"?"}` : ""}

Return this exact JSON structure:
{
  "clinical": {
    "formulation": "2-3 sentence integrated clinical formulation",
    "tier1": ["3-4 immediate intervention points with evidence citations"],
    "tier2": ["3-4 short-term goals for 3 months"],
    "tier3": ["3-4 long-term goals for 6-12 months"],
    "therapies": ["specific therapy modalities recommended with brief rationale"],
    "schoolAccommodations": ["5-6 specific school accommodations"],
    "medicationNote": "medication review note if relevant, else empty string",
    "riskNote": "risk management note if any flags, else empty string",
    "evidenceSummary": "2 sentences citing key evidence base"
  },
  "family": {
    "greeting": "warm personalised opening sentence using child name",
    "strengths": ["5 specific strengths based on assessment data"],
    "challenges": ["3 challenges explained in plain parent-friendly language"],
    "weeklyActivities": ["3 specific home activities for this week, age-appropriate"],
    "watchFor": ["3 specific warning signs to report to doctor"],
    "tellSchool": ["3 specific things to request from school"],
    "motivationalClose": "2 warm encouraging sentences for the parent",
    "nextSteps": "what to do next — book follow-up, start weekly tracker etc."
  }
}`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST", signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514", max_tokens: 2000,
        messages: [{ role: "user", content: prompt }]
      })
    });
    clearTimeout(timer);
    const data = await res.json();
    const txt = (data.content||[]).map(b=>b.text||"").join("");
    const clean = txt.replace(/```json|```/g,"").trim();
    return JSON.parse(clean.slice(clean.indexOf("{"), clean.lastIndexOf("}")+1));
  } catch(e) {
    return getFallbackPlan(profile);
  }
}

function getFallbackPlan({ C, P, V, childInfo, available }) {
  const iq = C?.["FIS IQ Estimate"] || "?";
  const band = C?.["FIS IQ Band"] || "Average";
  const risk = P?.["Risk Level"] || "NORMAL";
  const dx = V?.["Primary Diagnosis"] || "";
  return {
    clinical: {
      formulation: `${childInfo.name||"The child"} presents with a ${band} intellectual profile (FIS IQ ${iq}) with ${available.includes("P") ? "parent-reported behavioural concerns" : "cognitive screening completed"}. ${dx ? `Provisional diagnosis: ${dx}.` : "Clinician validation pending."} A multi-modal intervention approach is recommended.`,
      tier1: [
        `Cognitive support aligned with IQ band ${band} — structured learning activities`,
        "Parent psychoeducation session — understanding the assessment findings",
        available.includes("P") && risk !== "NORMAL" ? "Behavioural management plan — consult CIBS team" : "Monitor behaviour at home — begin weekly tracking",
        "School communication — share report with class teacher"
      ].filter(Boolean),
      tier2: [
        "Re-assess cognitive function in 3 months",
        "Initiate appropriate therapy (speech/OT/CBT) based on domain needs",
        "School accommodation implementation review",
        "Parent support group referral if needed"
      ],
      tier3: [
        "6-month impact assessment using eSMART longitudinal protocol",
        "Academic progress review with school",
        "Transition planning if applicable",
        "Maintenance therapy schedule"
      ],
      therapies: ["Individual therapy as indicated by diagnosis", "Family counselling", "School-based support"],
      schoolAccommodations: [
        "Additional time for examinations",
        "Preferential seating near teacher",
        "Simplified written instructions",
        "Regular check-ins from class teacher",
        "Buddy system for learning support"
      ],
      medicationNote: "",
      riskNote: P?.["Suicide Risk Flag"] === "FLAGGED" ? "⚠️ Suicide/self-harm risk flag present. Immediate clinical review required." : "",
      evidenceSummary: "Recommendations based on CIBS normative data and DSM-5/ICD-11 evidence-based guidelines for child mental health intervention."
    },
    family: {
      greeting: `Dear Parent of ${childInfo.name||"your child"},`,
      strengths: [
        `${childInfo.name||"Your child"} completed all assessment tasks with cooperation and effort`,
        "Ability to engage with visual reasoning tasks demonstrates learning potential",
        "Your child's unique cognitive style can be built upon with the right support",
        "The willingness to participate shows positive motivation",
        "With appropriate support, meaningful progress is very achievable"
      ],
      challenges: [
        band.toLowerCase().includes("below") || band.toLowerCase().includes("border") ?
          "Your child needs extra support with learning — this is very manageable with the right help" :
          "Some areas of learning may need more attention and patience",
        available.includes("P") && risk !== "NORMAL" ? "Some behaviours at home and school need structured support" : "Regular monitoring will help track progress",
        "Building confidence and self-esteem is an important part of the journey"
      ],
      weeklyActivities: [
        "Read together for 10 minutes every evening — let your child choose the book",
        "Play a simple sorting or pattern game — builds cognitive skills",
        "Praise one specific thing your child did well today — every single day"
      ],
      watchFor: [
        "Sudden changes in behaviour — more withdrawal or aggression than usual",
        "Refusing to go to school or excessive crying",
        "Changes in sleep or appetite lasting more than 3 days"
      ],
      tellSchool: [
        "My child has been assessed at CIBS — please ask for the accommodation letter",
        "My child may need instructions repeated or broken into smaller steps",
        "Please inform me of any changes in performance or behaviour"
      ],
      motivationalClose: `You are doing the best thing for ${childInfo.name||"your child"} by getting this assessment done. Every step you take is making a real difference.`,
      nextSteps: "Book your 1-month follow-up with Dr. Pangaonkar. Start the weekly tracker to monitor progress at home."
    }
  };
}

// ── Score bar component ─────────────────────────────────────────────────────
function ScoreBar({ label, value, max=100, color="#0d5c6e", small=false }) {
  const pct = Math.min(100, Math.round((Number(value)||0)/max*100));
  return (
    <div style={{marginBottom:small?4:8}}>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:small?10:12,marginBottom:3}}>
        <span style={{color:"#374151",fontWeight:500}}>{label}</span>
        <span style={{fontWeight:700,color,fontFamily:"monospace"}}>{value||"—"}</span>
      </div>
      <div style={{background:"#f3f4f6",borderRadius:3,height:small?4:6,overflow:"hidden"}}>
        <div style={{width:`${pct}%`,height:"100%",background:color,borderRadius:3,transition:"width 1s ease"}}/>
      </div>
    </div>
  );
}

// ── Severity badge ──────────────────────────────────────────────────────────
function SevBadge({ sev }) {
  const c = {Normal:"#16a34a",Mild:"#65a30d",Moderate:"#d97706",Severe:"#dc2626"}[sev] || "#94a3b8";
  const b = {Normal:"#f0fdf4",Mild:"#f7fee7",Moderate:"#fffbeb",Severe:"#fef2f2"}[sev] || "#f8fafc";
  return <span style={{background:b,color:c,border:`1px solid ${c}40`,borderRadius:99,padding:"2px 10px",fontSize:10,fontWeight:700}}>{sev||"—"}</span>;
}

// ── Pending section placeholder ─────────────────────────────────────────────
function PendingSection({ label, note }) {
  return (
    <div style={{background:"#f8fafc",border:"1.5px dashed #cbd5e1",borderRadius:10,padding:"14px 16px",marginBottom:12,opacity:0.7}}>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <span style={{fontSize:18}}>⏳</span>
        <div>
          <p style={{margin:0,fontSize:12,fontWeight:700,color:"#64748b"}}>{label}</p>
          <p style={{margin:0,fontSize:11,color:"#94a3b8"}}>{note}</p>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  CLINICAL REPORT — English only
// ══════════════════════════════════════════════════════════════════════════════
function ClinicalReport({ data, plan, childInfo, childID, today, available }) {
  const C = data.C, P = data.P, V = data.V;
  const cl = plan?.clinical;

  const SectionHeader = ({ title, color="#0d3b47" }) => (
    <div style={{background:color,color:"white",padding:"7px 16px",fontSize:11,fontWeight:700,
      letterSpacing:"0.1em",textTransform:"uppercase",margin:"0 -24px 14px",
      borderLeft:"4px solid rgba(255,255,255,0.3)"}}>
      {title}
    </div>
  );

  return (
    <div style={{fontFamily:"'Segoe UI',system-ui,sans-serif",fontSize:13,color:"#1f2937",lineHeight:1.7}}>
      <style>{`@media print{body{background:white!important}.no-print{display:none!important}}`}</style>

      {/* Header */}
      <div style={{background:"linear-gradient(135deg,#0d3b47,#0d5c6e,#0d9488)",padding:"24px",color:"white",margin:"-24px -24px 20px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12}}>
          <div>
            <div style={{fontSize:9,letterSpacing:"0.2em",textTransform:"uppercase",color:"#9FE1CB",marginBottom:4}}>
              eSMART Integrated Child Assessment Report — Baseline
            </div>
            <div style={{fontSize:20,fontWeight:800,marginBottom:2}}>Combined Clinical Report</div>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.7)"}}>
              CIBS-FIS + SCSS + Parent Questionnaire{V?" + Clinician Validation":""}
            </div>
            <div style={{marginTop:10,display:"flex",gap:6,flexWrap:"wrap"}}>
              {available.map(a => (
                <span key={a} style={{background:"rgba(255,255,255,0.15)",borderRadius:4,padding:"2px 8px",fontSize:10,fontWeight:700}}>{a} ✓</span>
              ))}
              {!available.includes("P") && <span style={{background:"rgba(255,165,0,0.3)",borderRadius:4,padding:"2px 8px",fontSize:10}}>P pending</span>}
              {!available.includes("V") && <span style={{background:"rgba(255,165,0,0.3)",borderRadius:4,padding:"2px 8px",fontSize:10}}>V pending</span>}
            </div>
          </div>
          <div style={{textAlign:"right",fontSize:11,color:"rgba(255,255,255,0.7)",lineHeight:2}}>
            <div style={{color:"white",fontWeight:700,fontSize:13}}>{today}</div>
            <div>Dr. Shailesh V. Pangaonkar</div>
            <div>Director & Consultant Psychiatrist</div>
            <div>MBBS, DPM, DNB, MSc, BA</div>
            <div>CIBS Nagpur · +91 712 254 8966</div>
          </div>
        </div>
        {/* Child info grid */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginTop:16}}>
          {[
            ["Name", childInfo.name||"—"],
            ["Age", `${childInfo.age||"?"}${childInfo.age?" yrs":""}`],
            ["File No.", childInfo.fileNo||"—"],
            ["Child ID", childID],
            ["Gender", childInfo.gender||"—"],
            ["School", childInfo.school||"—"],
            ["Assessor", childInfo.assessor||"—"],
            ["Session", `C:${data.sessions?.C||1} P:${data.sessions?.P||0} V:${data.sessions?.V||0}`],
          ].map(([l,v]) => (
            <div key={l} style={{background:"rgba(255,255,255,0.1)",borderRadius:6,padding:"6px 10px"}}>
              <div style={{fontSize:8,opacity:0.65,textTransform:"uppercase",letterSpacing:"0.1em"}}>{l}</div>
              <div style={{fontSize:11,fontWeight:700}}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Clinical formulation */}
      {cl?.formulation && (
        <div style={{background:"#f0fdf4",border:"1.5px solid #86efac",borderRadius:10,padding:"14px 16px",marginBottom:20}}>
          <p style={{margin:0,fontSize:12,fontWeight:700,color:"#15803d",marginBottom:6}}>Integrated Clinical Formulation</p>
          <p style={{margin:0,fontSize:13,color:"#166534",lineHeight:1.8,fontFamily:"Georgia,serif"}}>{cl.formulation}</p>
        </div>
      )}

      {/* ── D1 COGNITIVE ── */}
      <SectionHeader title="Part 1 — Cognitive Assessment (CIBS-FIS + SCSS)" color="#0d5c6e"/>
      {C ? (
        <>
          <div style={{display:"grid",gridTemplateColumns:"auto 1fr",gap:16,marginBottom:16,alignItems:"center"}}>
            <div style={{textAlign:"center",background:`${iqColor(C["FIS IQ Estimate"])}15`,
              border:`3px solid ${iqColor(C["FIS IQ Estimate"])}`,borderRadius:14,padding:"18px 22px",minWidth:120}}>
              <div style={{fontSize:10,fontWeight:700,color:iqColor(C["FIS IQ Estimate"]),marginBottom:2}}>CIBS-FIS IQ</div>
              <div style={{fontSize:48,fontWeight:900,color:iqColor(C["FIS IQ Estimate"]),lineHeight:1,fontFamily:"monospace"}}>
                {C["FIS IQ Estimate"]||"—"}
              </div>
              <div style={{fontSize:11,color:iqColor(C["FIS IQ Estimate"]),marginTop:2}}>{C["FIS IQ Band"]||"—"}</div>
              <div style={{fontSize:10,color:"#64748b",marginTop:2}}>
                MA {C["FIS Mental Age (yrs)"]||"?"} yrs · {C["FIS Percentile"]||"?"}th pct
              </div>
            </div>
            <div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:10}}>
                {[
                  ["Series (Patterns)", C["FIS Series Score"], 12],
                  ["Classification", C["FIS Classification Score"], 14],
                  ["Matrix (Grids)", C["FIS Matrix Score"], 12],
                  ["Conditions", C["FIS Conditions Score"], 8],
                ].map(([l,v,mx]) => (
                  <div key={l} style={{background:"#f8fafc",borderRadius:6,padding:"8px 10px",border:"1px solid #e2e8f0"}}>
                    <div style={{fontSize:10,color:"#64748b",marginBottom:2}}>{l}</div>
                    <div style={{fontSize:18,fontWeight:800,color:"#0d5c6e"}}>{v||"—"}<span style={{fontSize:11,color:"#94a3b8"}}>/{mx}</span></div>
                  </div>
                ))}
              </div>
              <div style={{background:"#eff6ff",borderRadius:8,padding:"10px 12px",border:"1px solid #bfdbfe"}}>
                <div style={{fontSize:10,fontWeight:700,color:"#1d4ed8",marginBottom:3}}>SCSS Cognitive Profile</div>
                <div style={{display:"flex",gap:12,flexWrap:"wrap",fontSize:12,color:"#1e3a5f"}}>
                  <span><strong>CQ:</strong> {C["SCSS Cognitive Quotient"]||"—"}</span>
                  <span><strong>Style:</strong> {C["SCSS Cognitive Style"]||"—"}</span>
                  <span><strong>EQ:</strong> {C["SCSS Emotional Intelligence"]||"—"} ({C["SCSS EQ Band"]||"—"})</span>
                  <span><strong>MHI:</strong> {C["SCSS Mental Health Index"]||"—"}</span>
                  <span><strong>CRI:</strong> {C["SCSS Combined Risk Index"]||"—"}</span>
                </div>
              </div>
            </div>
          </div>
          {C["SCSS DSM-5 Cluster"] && (
            <div style={{background:"#faf5ff",borderRadius:8,padding:"10px 12px",border:"1px solid #d8b4fe",marginBottom:10}}>
              <span style={{fontSize:11,fontWeight:700,color:"#6d28d9"}}>SCSS DSM-5 Alignment: </span>
              <span style={{fontSize:12,color:"#374151"}}>{C["SCSS DSM-5 Cluster"]} — {C["SCSS DSM-5 Features"]||""}</span>
            </div>
          )}
        </>
      ) : <PendingSection label="eSMART-C not yet completed" note="Complete the child cognitive assessment to populate this section"/>}

      {/* ── D2 BEHAVIOURAL ── */}
      <SectionHeader title="Part 2 — Behavioural Profile (Parent Report — eSMART-P)" color="#633806"/>
      {P ? (
        <>
          <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:14,flexWrap:"wrap"}}>
            <div style={{background:riskBg(P["Risk Level"]),border:`2px solid ${riskColor(P["Risk Level"])}`,
              borderRadius:10,padding:"10px 16px",textAlign:"center",minWidth:100}}>
              <div style={{fontSize:10,fontWeight:700,color:riskColor(P["Risk Level"])}}>Overall Risk</div>
              <div style={{fontSize:18,fontWeight:900,color:riskColor(P["Risk Level"])}}>{P["Risk Level"]||"—"}</div>
              <div style={{fontSize:10,color:riskColor(P["Risk Level"])}}>{P["Risk Label"]||""}</div>
            </div>
            <div style={{flex:1,display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
              {[["Age Band",P["Age Band"]||"—"],["Total Score",P["Total Score"]||"—"],
                ["Informant",P["Informant Name"]||"—"],["Relation",P["Informant Relation to Child"]||"—"]
              ].map(([l,v]) => (
                <div key={l} style={{background:"#fafafa",borderRadius:6,padding:"6px 10px",border:"1px solid #e2e8f0"}}>
                  <span style={{fontSize:10,color:"#94a3b8"}}>{l}: </span>
                  <span style={{fontSize:11,fontWeight:600,color:"#374151"}}>{v}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginBottom:12}}>
            {[
              ["IDD",P["IDD Score"],P["IDD Severity"],"Intellectual Disability"],
              ["ADHD",P["ADHD Score"],P["ADHD Severity"],"Attention-Deficit"],
              ["ASD",P["ASD Score"],P["ASD Severity"],"Autism Spectrum"],
              ["SLD",P["SLD Score"],P["SLD Severity"],"Learning Disorder"],
              ["MDD",P["MDD Score"],P["MDD Severity"],"Depression"],
              ["ANX",P["Anxiety Score"],P["Anxiety Severity"],"Anxiety"],
              ["ODD",P["ODD Score"],P["ODD Severity"],"Oppositional"],
              ["CD",P["Conduct Disorder Score"],P["CD Severity"],"Conduct"],
            ].map(([code,sc,sev,label]) => (
              <div key={code} style={{background:"#f8fafc",borderRadius:6,padding:"8px 10px",
                border:`1px solid ${sev==="Severe"?"#fca5a5":sev==="Moderate"?"#fcd34d":"#e2e8f0"}`}}>
                <div style={{fontSize:9,fontWeight:700,color:"#64748b",marginBottom:2}}>{code}</div>
                <div style={{fontSize:10,color:"#374151",marginBottom:4}}>{label}</div>
                <div style={{fontSize:16,fontWeight:800,color:sevColor(sev)}}>{sc||"0"}</div>
                <SevBadge sev={sev||"Normal"}/>
              </div>
            ))}
          </div>
          {P["Suicide Risk Flag"] === "FLAGGED" && (
            <div style={{background:"#fef2f2",border:"2px solid #ef4444",borderRadius:8,padding:"12px 14px",marginBottom:12}}>
              <p style={{margin:0,fontSize:12,fontWeight:800,color:"#dc2626"}}>
                ⚠️ SUICIDE / SELF-HARM RISK FLAG — IMMEDIATE CLINICAL REVIEW REQUIRED
              </p>
              <p style={{margin:"4px 0 0",fontSize:11,color:"#b91c1c"}}>
                Concurrent ADHD + MDD (≥4 items) + ODD/CD detected. Follow CIBS risk management protocol.
              </p>
            </div>
          )}
        </>
      ) : <PendingSection label="eSMART-P not yet completed" note="Complete the parent questionnaire to populate behavioural domain scores"/>}

      {/* ── D3 CLINICIAN VALIDATION ── */}
      <SectionHeader title="Part 3 — Clinician Validation (eSMART-V)" color="#3C3489"/>
      {V ? (
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
          {[
            ["FSIQ Estimate", V["FSIQ Estimate"]||"—"],
            ["Primary Diagnosis", V["Primary Diagnosis"]||"—"],
            ["All Diagnoses", V["All Confirmed Diagnoses"]||"—"],
            ["Instruments Used", V["Instruments Used"]||"—"],
            ["C-SSRS Level", V["C-SSRS Level"]||"—"],
            ["Assessment Date", V["Assessment Date"]||"—"],
          ].map(([l,v]) => (
            <div key={l} style={{background:"#f5f3ff",borderRadius:8,padding:"10px 12px",border:"1px solid #ddd6fe"}}>
              <div style={{fontSize:10,color:"#7c3aed",fontWeight:700,marginBottom:2}}>{l}</div>
              <div style={{fontSize:12,fontWeight:600,color:"#374151"}}>{v}</div>
            </div>
          ))}
          {V["Clinical Impression"] && (
            <div style={{gridColumn:"1/-1",background:"#faf5ff",borderRadius:8,padding:"12px",border:"1px solid #d8b4fe"}}>
              <div style={{fontSize:10,fontWeight:700,color:"#6d28d9",marginBottom:6}}>Clinical Impression</div>
              <div style={{fontSize:12,color:"#374151",lineHeight:1.8,fontFamily:"Georgia,serif"}}>{V["Clinical Impression"]}</div>
            </div>
          )}
        </div>
      ) : <PendingSection label="eSMART-V not yet completed" note="Clinician validation adds diagnosis confirmation, FSIQ from standardised tests, and therapy protocol"/>}

      {/* ── INTERVENTION PLAN ── */}
      {cl && (
        <>
          <SectionHeader title="Evidence-Based Intervention Plan" color="#1e3a5f"/>
          {[
            ["tier1", "⚡ Tier 1 — Immediate Interventions (This Month)", "#dc2626"],
            ["tier2", "📅 Tier 2 — Short-Term Goals (3 Months)", "#d97706"],
            ["tier3", "🎯 Tier 3 — Long-Term Plan (6–12 Months)", "#0d5c6e"],
          ].map(([key, label, color]) => cl[key]?.length > 0 && (
            <div key={key} style={{marginBottom:14}}>
              <p style={{fontWeight:700,color,fontSize:12,margin:"0 0 8px"}}>{label}</p>
              {(cl[key]||[]).map((pt,i) => (
                <div key={i} style={{display:"flex",gap:10,marginBottom:6,alignItems:"flex-start"}}>
                  <span style={{color,fontWeight:700,flexShrink:0,fontSize:11}}>{i+1}.</span>
                  <span style={{fontSize:12,color:"#374151",lineHeight:1.7}}>{pt}</span>
                </div>
              ))}
            </div>
          ))}

          {cl.therapies?.length > 0 && (
            <div style={{background:"#f0f9ff",borderRadius:8,padding:"12px 14px",border:"1px solid #bae6fd",marginBottom:12}}>
              <p style={{fontWeight:700,color:"#0369a1",fontSize:12,margin:"0 0 8px"}}>🔬 Recommended Therapy Modalities</p>
              {cl.therapies.map((t,i) => (
                <div key={i} style={{fontSize:12,color:"#374151",marginBottom:4,paddingLeft:10}}>• {t}</div>
              ))}
            </div>
          )}

          {cl.schoolAccommodations?.length > 0 && (
            <div style={{background:"#f0fdf4",borderRadius:8,padding:"12px 14px",border:"1px solid #86efac",marginBottom:12}}>
              <p style={{fontWeight:700,color:"#15803d",fontSize:12,margin:"0 0 8px"}}>🏫 School Accommodation Recommendations</p>
              {cl.schoolAccommodations.map((a,i) => (
                <div key={i} style={{fontSize:12,color:"#374151",marginBottom:4,paddingLeft:10}}>• {a}</div>
              ))}
            </div>
          )}

          {cl.riskNote && (
            <div style={{background:"#fef2f2",borderRadius:8,padding:"10px 14px",border:"1.5px solid #fca5a5",marginBottom:12}}>
              <p style={{margin:0,fontSize:12,fontWeight:700,color:"#dc2626"}}>{cl.riskNote}</p>
            </div>
          )}

          {cl.evidenceSummary && (
            <div style={{background:"#f8fafc",borderRadius:8,padding:"10px 14px",border:"1px solid #e2e8f0",marginBottom:12}}>
              <p style={{margin:0,fontSize:11,color:"#64748b",fontStyle:"italic"}}>{cl.evidenceSummary}</p>
            </div>
          )}
        </>
      )}

      {/* Signatures */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24,marginTop:20,
        borderTop:"1.5px solid #0d5c6e",paddingTop:16}}>
        {["Evaluating Clinician","Countersigning Clinician"].map(l => (
          <div key={l}>
            <div style={{fontSize:10,color:"#94a3b8",marginBottom:16}}>{l}</div>
            <div style={{borderBottom:"1px dotted #cbd5e1",marginBottom:6,height:32}}/>
            <div style={{fontSize:9,color:"#9ca3af"}}>Name, Designation, Date: _____________</div>
          </div>
        ))}
      </div>

      <div style={{marginTop:12,borderTop:"1px solid #e5e7eb",paddingTop:10,
        display:"flex",justifyContent:"space-between",fontSize:9,color:"#9ca3af"}}>
        <span>eSMART Combined Report · CIBS Nagpur · {today}</span>
        <span>CONFIDENTIAL — For clinical use only · File: {childInfo.fileNo||"—"} · Child ID: {childID}</span>
      </div>
    </div>
  );
}

// ── Colour helpers ─────────────────────────────────────────────────────────
function iqColor(iq) {
  const n = Number(iq);
  if (!n) return "#64748b";
  if (n>=120) return "#0F6E56"; if (n>=100) return "#0d5c6e";
  if (n>=80)  return "#d97706";  return "#dc2626";
}
function riskColor(lv) {
  const m={NORMAL:"#16a34a","LEVEL 1":"#65a30d","LEVEL 2":"#d97706","LEVEL 3":"#dc2626"};
  return m[lv]||"#64748b";
}
function riskBg(lv) {
  const m={NORMAL:"#f0fdf4","LEVEL 1":"#f7fee7","LEVEL 2":"#fffbeb","LEVEL 3":"#fef2f2"};
  return m[lv]||"#f8fafc";
}
function sevColor(sev) {
  return {Normal:"#16a34a",Mild:"#65a30d",Moderate:"#d97706",Severe:"#dc2626"}[sev]||"#64748b";
}

// ══════════════════════════════════════════════════════════════════════════════
//  FAMILY REPORT — EN / HI / MR
// ══════════════════════════════════════════════════════════════════════════════
function FamilyReport({ data, plan, childInfo, childID, today, lang, setLang }) {
  const t = T[lang] || T.en;
  const fam = plan?.family;
  const P = data.P;
  const risk = P?.["Risk Level"] || "NORMAL";

  const Section = ({ emoji, title, color, children }) => (
    <div style={{marginBottom:20}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
        <span style={{fontSize:22}}>{emoji}</span>
        <h3 style={{margin:0,fontSize:15,fontWeight:800,color}}>{title}</h3>
      </div>
      {children}
    </div>
  );

  return (
    <div style={{fontFamily:"'Segoe UI',system-ui,sans-serif",color:"#1f2937"}}>
      <style>{`@media print{body{background:white!important}.no-print{display:none!important}}`}</style>

      {/* Language toggle */}
      <div className="no-print" style={{display:"flex",gap:6,marginBottom:16,justifyContent:"center"}}>
        {[["en","English"],["hi","हिंदी"],["mr","मराठी"]].map(([code,label]) => (
          <button key={code} onClick={()=>setLang(code)}
            style={{padding:"6px 16px",borderRadius:99,border:"2px solid",fontSize:12,fontWeight:700,
              cursor:"pointer",transition:"all 0.2s",
              background:lang===code?"#0d5c6e":"white",
              color:lang===code?"white":"#0d5c6e",
              borderColor:"#0d5c6e"}}>
            {label}
          </button>
        ))}
      </div>

      {/* Header */}
      <div style={{background:"linear-gradient(135deg,#0d9488,#10b981)",padding:"24px",color:"white",
        margin:"-24px -24px 24px",borderRadius:"4px 4px 0 0"}}>
        <div style={{fontSize:9,letterSpacing:"0.18em",textTransform:"uppercase",color:"#d1fae5",marginBottom:4}}>
          {t.famConfLabel}
        </div>
        <div style={{fontSize:20,fontWeight:800,marginBottom:4}}>{t.title}</div>
        <div style={{fontSize:11,color:"rgba(255,255,255,0.8)"}}>
          {t.org} · Dr. Shailesh V. Pangaonkar
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginTop:16}}>
          {[[t.fileLabel,childInfo.fileNo||"—"],[t.childIDLabel,childID],[t.dateLabel,today]].map(([l,v]) => (
            <div key={l} style={{background:"rgba(255,255,255,0.15)",borderRadius:6,padding:"6px 10px"}}>
              <div style={{fontSize:9,opacity:0.7}}>{l}</div>
              <div style={{fontSize:11,fontWeight:700}}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Greeting */}
      <div style={{background:"#f0fdf4",borderRadius:12,padding:"16px",marginBottom:20,
        border:"1.5px solid #86efac"}}>
        <p style={{margin:0,fontSize:13,fontWeight:700,color:"#15803d",marginBottom:6}}>{fam?.greeting||t.greeting}</p>
        <p style={{margin:0,fontSize:13,color:"#166534",lineHeight:1.8}}>{t.familyIntro}</p>
      </div>

      {/* Baseline note */}
      <div style={{background:"#eff6ff",borderRadius:10,padding:"12px 14px",marginBottom:20,
        border:"1px solid #bfdbfe",display:"flex",gap:10,alignItems:"flex-start"}}>
        <span style={{fontSize:20,flexShrink:0}}>📋</span>
        <div>
          <p style={{margin:0,fontSize:12,fontWeight:700,color:"#1d4ed8",marginBottom:3}}>
            {lang==="hi"?"आधार रेखा रिपोर्ट":lang==="mr"?"आधाररेषा अहवाल":"Baseline Assessment Report"}
          </p>
          <p style={{margin:0,fontSize:12,color:"#374151"}}>{t.baselineNote}</p>
        </div>
      </div>

      {/* Strengths */}
      <Section emoji="🌟" title={t.strengths} color="#0d9488">
        <div style={{display:"grid",gridTemplateColumns:"1fr",gap:8}}>
          {(fam?.strengths||[]).map((s,i) => (
            <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start",
              background:"#f0fdf4",borderRadius:8,padding:"10px 12px",border:"1px solid #bbf7d0"}}>
              <span style={{fontSize:18,flexShrink:0}}>{"⭐🌟✨💫🎯"[i]||"✅"}</span>
              <p style={{margin:0,fontSize:13,color:"#166534",lineHeight:1.7}}>{s}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Challenges */}
      <Section emoji="💡" title={t.challenges} color="#d97706">
        <div style={{display:"grid",gridTemplateColumns:"1fr",gap:8}}>
          {(fam?.challenges||[]).map((c,i) => (
            <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start",
              background:"#fffbeb",borderRadius:8,padding:"10px 12px",border:"1px solid #fde68a"}}>
              <span style={{fontSize:18,flexShrink:0}}>{"🔸🔶🟡"[i]||"📌"}</span>
              <p style={{margin:0,fontSize:13,color:"#92400e",lineHeight:1.7}}>{c}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Weekly activities */}
      <Section emoji="🏠" title={t.thisWeek} color="#0d5c6e">
        <div style={{display:"grid",gridTemplateColumns:"1fr",gap:8}}>
          {(fam?.weeklyActivities||[]).map((a,i) => (
            <div key={i} style={{display:"flex",gap:12,alignItems:"flex-start",
              background:"#f0f9ff",borderRadius:8,padding:"12px 14px",border:"1px solid #bae6fd"}}>
              <div style={{width:28,height:28,borderRadius:"50%",background:"#0d5c6e",color:"white",
                display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,flexShrink:0}}>
                {i+1}
              </div>
              <p style={{margin:0,fontSize:13,color:"#1e3a5f",lineHeight:1.7}}>{a}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Watch for */}
      <Section emoji="👁️" title={t.watchFor} color="#dc2626">
        <div style={{display:"grid",gridTemplateColumns:"1fr",gap:6}}>
          {(fam?.watchFor||[]).map((w,i) => (
            <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start",
              background:"#fef2f2",borderRadius:8,padding:"10px 12px",border:"1px solid #fecaca"}}>
              <span style={{fontSize:16,flexShrink:0}}>⚠️</span>
              <p style={{margin:0,fontSize:13,color:"#991b1b",lineHeight:1.7}}>{w}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Tell school */}
      <Section emoji="🏫" title={t.tellSchool} color="#7c3aed">
        <div style={{display:"grid",gridTemplateColumns:"1fr",gap:6}}>
          {(fam?.tellSchool||[]).map((s,i) => (
            <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start",
              background:"#faf5ff",borderRadius:8,padding:"10px 12px",border:"1px solid #ddd6fe"}}>
              <span style={{fontSize:16,flexShrink:0}}>📝</span>
              <p style={{margin:0,fontSize:13,color:"#4c1d95",lineHeight:1.7}}>{s}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Next steps */}
      {fam?.nextSteps && (
        <div style={{background:"#1e3a5f",borderRadius:12,padding:"16px 20px",marginBottom:20,color:"white"}}>
          <p style={{margin:"0 0 6px",fontSize:12,fontWeight:700,color:"#9FE1CB"}}>
            {t.nextAppt}
          </p>
          <p style={{margin:0,fontSize:13,lineHeight:1.8}}>{fam.nextSteps}</p>
        </div>
      )}

      {/* Motivational close */}
      {fam?.motivationalClose && (
        <div style={{background:"linear-gradient(135deg,#f0fdf4,#dcfce7)",borderRadius:12,
          padding:"20px",border:"2px solid #86efac",marginBottom:16,textAlign:"center"}}>
          <span style={{fontSize:32}}>💚</span>
          <p style={{margin:"10px 0 0",fontSize:14,color:"#15803d",lineHeight:1.8,
            fontFamily:"Georgia,serif",fontStyle:"italic"}}>{fam.motivationalClose}</p>
        </div>
      )}

      {/* CIBS contact */}
      <div style={{background:"#f8fafc",borderRadius:10,padding:"14px 16px",border:"1px solid #e2e8f0",
        display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
        <div>
          <p style={{margin:0,fontSize:12,fontWeight:700,color:"#1e3a5f"}}>Central Institute of Behavioural Sciences (CIBS)</p>
          <p style={{margin:0,fontSize:11,color:"#64748b"}}>Dr. Shailesh V. Pangaonkar · MBBS DPM DNB MSc</p>
        </div>
        <div style={{textAlign:"right",fontSize:11,color:"#64748b"}}>
          <p style={{margin:0}}>📞 +91 712 254 8966</p>
          <p style={{margin:0}}>✉ pangaonkar@cibsindia.com</p>
        </div>
      </div>

      <div style={{marginTop:12,fontSize:10,color:"#94a3b8",textAlign:"center"}}>
        {t.famConfLabel} · CIBS Nagpur · {today} · File: {childInfo.fileNo||"—"}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  MAIN APP
// ══════════════════════════════════════════════════════════════════════════════
export default function App() {
  // Read mode and language from URL
  // mode=family  → opens family report directly (for parents)
  // mode=clinical → opens clinical report directly (for clinicians)
  // lang=hi or lang=mr → sets family report language automatically
  const urlMode = getParam("mode") || ""; // "family" | "clinical" | ""
  const urlLang = getParam("lang") || "en"; // "en" | "hi" | "mr"

  const [screen, setScreen]   = useState("entry");
  const [fileNo, setFileNo]   = useState(getParam("reg") || "");
  const [tab,    setTab]      = useState(urlMode==="family" ? "family" : "clinical");
  const [famLang,setFamLang]  = useState(["hi","mr"].includes(urlLang) ? urlLang : "en");
  const [data,   setData]     = useState(null);   // { C, P, V, sessions }
  const [plan,   setPlan]     = useState(null);   // AI plan
  const [childInfo, setChildInfo] = useState({});
  const [childID,   setChildID]   = useState("");
  const [available, setAvailable] = useState([]);
  const [error, setError] = useState("");
  const today = new Date().toLocaleDateString("en-IN",{year:"numeric",month:"long",day:"numeric"});

  // Auto-load if reg param present
  useEffect(() => {
    if (getParam("reg")) fetchData(getParam("reg"));
    // If mode=family with reg, skip entry screen entirely
    // If mode=clinical with reg, skip entry screen entirely
  }, []);

  const fetchData = async (fn) => {
    const fno = (fn||fileNo).trim();
    if (!fno) return;
    setScreen("loading");
    try {
      const url = `${APPS_SCRIPT_URL}?action=getRecord&reg=${encodeURIComponent(fno)}&token=${TOKEN}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.status !== "ok") throw new Error(json.msg || "Fetch failed");

      const d = json.data;
      setData(d);

      // Determine available components
      const avail = [];
      if (d.C) avail.push("C");
      if (d.P) avail.push("P");
      if (d.V) avail.push("V");
      setAvailable(avail);

      if (avail.length === 0) { setScreen("error"); setError("No assessment data found for this FileNo."); return; }

      // Extract child info from first available component
      const src = d.C || d.P || d.V;
      const ci = {
        name:     src["Child Name"]     || src["Respondent Name"] || "",
        age:      src["Child Age (yrs)"]|| src["Age (years)"]     || "",
        gender:   src["Child Gender"]   || src["Gender"]          || "",
        school:   src["School / Institution"]                     || "",
        fileNo:   fno,
        assessor: src["Assessor / Examiner"]                      || "",
        dob:      src["Child Date of Birth"]                      || "",
        mobile:   src["Mobile"]                                   || "",
        email:    src["Email"]                                     || "",
        cibsReg:  fno.includes("CIBS-") ? fno.split("-").slice(-1)[0] : "",
      };
      setChildInfo(ci);

      // Generate Child ID
      const cid = generateChildID(ci.mobile, ci.email, ci.cibsReg, ci.dob, ci.gender);
      setChildID(cid);

      // Generate AI plan
      setScreen("generating");
      const profile = { C: d.C, P: d.P, V: d.V, childInfo: ci, available: avail };
      const aiPlan = await generatePlan(profile);
      setPlan(aiPlan);
      setScreen("report");

    } catch(e) {
      setScreen("error");
      setError(e.message || "Could not load assessment data. Please check the File No. and try again.");
    }
  };

  // ── ENTRY SCREEN ────────────────────────────────────────────────────────
  if (screen === "entry") return (
    <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#0d3b47,#0d5c6e)",
      display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{background:"white",borderRadius:20,padding:36,maxWidth:460,width:"100%",
        boxShadow:"0 24px 64px rgba(0,0,0,0.3)"}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{width:72,height:72,borderRadius:18,background:"linear-gradient(135deg,#0d5c6e,#0d9488)",
            display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px"}}>
            <span style={{fontSize:36}}>📋</span>
          </div>
          <h1 style={{fontSize:20,fontWeight:800,color:"#0d3b47",margin:"0 0 4px"}}>
            eSMART Combined Report
          </h1>
          <p style={{fontSize:12,color:"#64748b",margin:0}}>
            Central Institute of Behavioural Sciences, Nagpur
          </p>
        </div>

        <div style={{marginBottom:20}}>
          <label style={{fontSize:12,fontWeight:700,color:"#374151",display:"block",marginBottom:6}}>
            Child's File No. (CIBS Registration)
          </label>
          <input value={fileNo} onChange={e=>setFileNo(e.target.value)}
            placeholder="e.g. CIBS-26-0042"
            onKeyDown={e=>e.key==="Enter"&&fetchData(fileNo)}
            style={{width:"100%",padding:"12px 16px",borderRadius:10,border:"1.5px solid #e2e8f0",
              fontSize:14,fontFamily:"monospace",color:"#0d3b47",outline:"none",
              boxSizing:"border-box"}}/>
          <p style={{fontSize:11,color:"#94a3b8",margin:"6px 0 0"}}>
            The report will include all available eSMART-C, P, and V data for this child.
          </p>
        </div>

        <button onClick={()=>fetchData(fileNo)} disabled={!fileNo.trim()}
          style={{width:"100%",padding:"14px",borderRadius:12,border:"none",
            background:fileNo.trim()?"linear-gradient(135deg,#0d5c6e,#0d9488)":"#e2e8f0",
            color:fileNo.trim()?"white":"#94a3b8",fontSize:14,fontWeight:700,cursor:fileNo.trim()?"pointer":"not-allowed"}}>
          Generate Combined Report →
        </button>

        <div style={{marginTop:16,padding:"12px 14px",background:"#f0fdf4",borderRadius:8,
          border:"1px solid #86efac"}}>
          <p style={{margin:0,fontSize:11,color:"#15803d",lineHeight:1.7}}>
            ✅ Works with C only · C+P · C+P+V<br/>
            ✅ Generates AI intervention plan<br/>
            ✅ Clinical report (EN) + Family report (EN/HI/MR)<br/>
            ✅ Downloadable PDF
          </p>
        </div>
      </div>
    </div>
  );

  // ── LOADING ─────────────────────────────────────────────────────────────
  if (screen === "loading" || screen === "generating") return (
    <div style={{minHeight:"100vh",background:"#f0f4f8",display:"flex",
      alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16,padding:24}}>
      <div style={{width:56,height:56,border:"4px solid #e2e8f0",borderTopColor:"#0d5c6e",
        borderRadius:"50%",animation:"spin 1s linear infinite"}}/>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      <p style={{fontSize:16,fontWeight:700,color:"#0d3b47",margin:0}}>
        {screen==="loading" ? T.en.loading : T.en.generating}
      </p>
      <p style={{fontSize:12,color:"#64748b",margin:0}}>
        {screen==="generating" ? "Claude AI is analysing the assessment profile…" : `Fetching data for ${fileNo}…`}
      </p>
    </div>
  );

  // ── ERROR ────────────────────────────────────────────────────────────────
  if (screen === "error") return (
    <div style={{minHeight:"100vh",background:"#f0f4f8",display:"flex",
      alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{background:"white",borderRadius:16,padding:32,maxWidth:420,textAlign:"center",
        boxShadow:"0 8px 32px rgba(0,0,0,0.1)"}}>
        <span style={{fontSize:48}}>⚠️</span>
        <h2 style={{color:"#dc2626",margin:"12px 0 8px"}}>Could not load report</h2>
        <p style={{color:"#64748b",fontSize:13}}>{error}</p>
        <button onClick={()=>setScreen("entry")}
          style={{marginTop:16,padding:"10px 24px",borderRadius:8,background:"#0d5c6e",
            color:"white",border:"none",fontSize:13,fontWeight:700,cursor:"pointer"}}>
          ← Try Again
        </button>
      </div>
    </div>
  );

  // ── REPORT ───────────────────────────────────────────────────────────────
  return (
    <div style={{background:"#e8ecf0",minHeight:"100vh",padding:"16px 8px 60px",
      fontFamily:"'Segoe UI',system-ui,sans-serif"}}>
      <style>{`@media print{.no-print{display:none!important}body{background:white!important}}`}</style>

      {/* Top bar */}
      <div className="no-print" style={{maxWidth:860,margin:"0 auto 14px"}}>
        {/* Tab selector — hidden when mode is locked via URL */}
        {!urlMode && (
        <div style={{display:"flex",gap:8,marginBottom:10,background:"white",
          padding:8,borderRadius:12,boxShadow:"0 2px 8px rgba(0,0,0,0.08)"}}>
          {[["clinical","🏥 Clinical Report (English)"],["family","👨‍👩‍👧 Family Report"]].map(([key,label]) => (
            <button key={key} onClick={()=>setTab(key)}
              style={{flex:1,padding:"10px",border:"none",borderRadius:8,fontSize:13,fontWeight:700,
                cursor:"pointer",transition:"all 0.2s",
                background:tab===key?(key==="clinical"?"#0d5c6e":"#0d9488"):"#f1f5f9",
                color:tab===key?"white":"#64748b"}}>
              {label}
            </button>
          ))}
        </div>
        )}

        {/* Language selector — shown prominently for family mode */}
        {(tab==="family" || urlMode==="family") && (
          <div style={{display:"flex",gap:6,marginBottom:10,justifyContent:"center"}}>
            {[["en","English"],["hi","हिंदी"],["mr","मराठी"]].map(([code,label]) => (
              <button key={code} onClick={()=>setFamLang(code)}
                style={{flex:1,padding:"10px",borderRadius:10,border:"2px solid",
                  fontSize:13,fontWeight:700,cursor:"pointer",transition:"all 0.2s",
                  background:famLang===code?"#0d9488":"white",
                  color:famLang===code?"white":"#0d9488",
                  borderColor:"#0d9488"}}>
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <button onClick={()=>window.print()}
            style={{flex:1,minWidth:140,padding:"10px",borderRadius:9,background:"#1e293b",
              color:"white",border:"none",fontSize:12,fontWeight:700,cursor:"pointer"}}>
            🖨 Print / Save PDF
          </button>
          {!urlMode && (
          <button onClick={()=>setScreen("entry")}
            style={{flex:1,minWidth:140,padding:"10px",borderRadius:9,background:"white",
              color:"#0d5c6e",border:"1.5px solid #0d5c6e",fontSize:12,fontWeight:600,cursor:"pointer"}}>
            ← New Report
          </button>
          )}
          {available.length < 3 && (
            <div style={{flex:2,padding:"10px 14px",borderRadius:9,background:"#fffbeb",
              border:"1px solid #fcd34d",fontSize:11,color:"#92400e"}}>
              ⚡ {["C","P","V"].filter(x=>!available.includes(x))
                .map(x=>({C:"eSMART-C",P:"eSMART-P",V:"eSMART-V"})[x]).join(" + ")} pending — report will strengthen when added
            </div>
          )}
        </div>
      </div>

      {/* Report content */}
      <div style={{maxWidth:860,margin:"0 auto",background:"white",
        boxShadow:"0 4px 40px rgba(0,0,0,0.12)",borderRadius:4,padding:24}}>
        {tab==="clinical"
          ? <ClinicalReport data={data} plan={plan} childInfo={childInfo}
              childID={childID} today={today} available={available}/>
          : <FamilyReport data={data} plan={plan} childInfo={childInfo}
              childID={childID} today={today} lang={famLang} setLang={setFamLang}/>
        }
      </div>
    </div>
  );
}
