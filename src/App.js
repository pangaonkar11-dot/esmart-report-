import { useState, useRef, useCallback, useEffect } from "react";

// ╔══════════════════════════════════════════════════════════════════════════╗
// ║   CIBS-VALID  —  Standalone Validation Assessment Battery  v 1.0        ║
// ║   Central Institute of Behavioural Sciences, Nagpur                      ║
// ║   Domains: Cognition · Personality · Health · Depression · Risk          ║
// ╚══════════════════════════════════════════════════════════════════════════╝

// ── GOOGLE SHEETS DATA PIPELINE ──────────────────────────────────────────────
// Paste your deployed Apps Script Web App URL below after Step 4 of setup guide
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxYw3DNfteGUApE97zpPScPgVCrHjNXTU-kuwabwQNviLmsaW4gSEd6hqY1FoTJsxu4HQ/exec";

// ─────────────── INSTRUMENT DATA ───────────────────────────────────────────

// ── SVG Shape Primitives for Raven's Visual Matrices ──────────────────────────
const RvCircle = ({cx,cy,r=20,fill="none",stroke="#374151",sw=2.5}) =>
  <circle cx={cx} cy={cy} r={r} fill={fill} stroke={stroke} strokeWidth={sw}/>;
const RvRect = ({cx,cy,s=38,fill="none",stroke="#374151",sw=2.5}) =>
  <rect x={cx-s/2} y={cy-s/2} width={s} height={s} fill={fill} stroke={stroke} strokeWidth={sw}/>;
const RvTri = ({cx,cy,s=22,fill="none",stroke="#374151",sw=2.5}) =>
  <polygon points={`${cx},${cy-s} ${cx-s*0.87},${cy+s*0.5} ${cx+s*0.87},${cy+s*0.5}`}
    fill={fill} stroke={stroke} strokeWidth={sw}/>;
const RvDiam = ({cx,cy,s=21,fill="none",stroke="#374151",sw=2.5}) =>
  <polygon points={`${cx},${cy-s} ${cx+s},${cy} ${cx},${cy+s} ${cx-s},${cy}`}
    fill={fill} stroke={stroke} strokeWidth={sw}/>;
const RvDot = ({cx,cy,r=7,fill="#374151"}) => <circle cx={cx} cy={cy} r={r} fill={fill}/>;
const RvArrow = ({cx,cy,dir="right",size=16,color="#374151"}) => {
  const s=size, h=s*0.45;
  const pts = {
    right:`${cx-s},${cy-h} ${cx+s*0.3},${cy-h} ${cx+s*0.3},${cy-s} ${cx+s},${cy} ${cx+s*0.3},${cy+s} ${cx+s*0.3},${cy+h} ${cx-s},${cy+h}`,
    down: `${cx-h},${cy-s} ${cx+h},${cy-s} ${cx+h},${cy+s*0.3} ${cx+s},${cy+s*0.3} ${cx},${cy+s} ${cx-s},${cy+s*0.3} ${cx-h},${cy+s*0.3}`,
    left: `${cx+s},${cy-h} ${cx-s*0.3},${cy-h} ${cx-s*0.3},${cy-s} ${cx-s},${cy} ${cx-s*0.3},${cy+s} ${cx-s*0.3},${cy+h} ${cx+s},${cy+h}`,
    up:   `${cx-h},${cy+s} ${cx+h},${cy+s} ${cx+h},${cy-s*0.3} ${cx+s},${cy-s*0.3} ${cx},${cy-s} ${cx-s},${cy-s*0.3} ${cx-h},${cy-s*0.3}`,
  }[dir];
  return <polygon points={pts} fill={color}/>;
};
const RvQMark = ({cx,cy,fsz=26}) =>
  <text x={cx} y={cy+9} textAnchor="middle" fontSize={fsz} fontWeight="900" fill="#94A3B8">?</text>;
const RvGrid = ({rows,cols,cs=70}) => <>
  {Array.from({length:cols+1},(_,i)=><line key={`v${i}`} x1={i*cs} y1={0} x2={i*cs} y2={rows*cs} stroke="#CBD5E1" strokeWidth={1.5}/>)}
  {Array.from({length:rows+1},(_,i)=><line key={`h${i}`} x1={0} y1={i*cs} x2={cols*cs} y2={i*cs} stroke="#CBD5E1" strokeWidth={1.5}/>)}
</>;
// Regular n-sided polygon (vertex at top)
const RvPoly = ({cx,cy,r=20,n,fill="none",stroke="#374151",sw=2.5}) => {
  const pts = Array.from({length:n},(_,i)=>{
    const a = -Math.PI/2 + (2*Math.PI*i)/n;
    return `${(cx+r*Math.cos(a)).toFixed(1)},${(cy+r*Math.sin(a)).toFixed(1)}`;
  }).join(' ');
  return <polygon points={pts} fill={fill} stroke={stroke} strokeWidth={sw}/>;
};
// Dots arranged in a compact grid
const RvDots = ({cx,cy,n,r=5}) => {
  const layouts = {
    1:[[0,0]],
    2:[[-8,0],[8,0]],
    3:[[-9,5],[0,-8],[9,5]],
    4:[[-8,-8],[8,-8],[-8,8],[8,8]],
    5:[[0,-10],[10,-3],[6,9],[-6,9],[-10,-3]],
    6:[[-10,-7],[0,-7],[10,-7],[-10,7],[0,7],[10,7]],
    7:[[-10,-9],[0,-9],[10,-9],[-10,0],[10,0],[-5,9],[5,9]],
    8:[[-12,-7],[-4,-7],[4,-7],[12,-7],[-12,7],[-4,7],[4,7],[12,7]],
    9:[[-11,-11],[0,-11],[11,-11],[-11,0],[0,0],[11,0],[-11,11],[0,11],[11,11]],
    12:[[-13,-10],[-4,-10],[4,-10],[13,-10],[-13,-2],[-4,-2],[4,-2],[13,-2],[-13,7],[-4,7],[4,7],[13,7]],
  };
  return <>{(layouts[n]||[]).map(([dx,dy],i)=><circle key={i} cx={cx+dx} cy={cy+dy} r={r} fill="#374151"/>)}</>;
};

// ── CAT Item Pools organised by IQ Band ───────────────────────────────────────
// Band 1 (IQ 70–85)   — 6 items — advance rule: 4/6 correct — Mental Age ~7–9
// Band 2 (IQ 85–100)  — 6 items — advance rule: 4/6 correct — Mental Age ~9–12
// Band 3 (IQ 100–115) — 6 items — advance rule: 4/6 correct — Mental Age ~12–15
// Band 4 (IQ 115–130) — 4 items — terminal band            — Mental Age 15+
const RAVENS_CAT = {
  1: [
    // B1-Q1: Shape cycle ○□△ repeating across each row — 3×3 matrix
    { id:1, title:"Shape Pattern", instruction:"Which shape belongs in the empty box?", ans:0,
      renderStimulus:()=>(
        <svg viewBox="0 0 210 210" width={210} height={210} style={{display:'block',margin:'0 auto'}}>
          <RvGrid rows={3} cols={3}/>
          {[[0,0,'c'],[0,1,'s'],[0,2,'t'],[1,0,'c'],[1,1,'s'],[1,2,'t'],[2,0,'c'],[2,1,'s']].map(([r,c,tp],i)=>{
            const x=c*70+35,y=r*70+35;
            return tp==='c'?<RvCircle key={i} cx={x} cy={y}/>:tp==='s'?<RvRect key={i} cx={x} cy={y}/>:<RvTri key={i} cx={x} cy={y}/>;
          })}
          <RvQMark cx={175} cy={175}/>
        </svg>),
      options:[
        {label:"Triangle", render:(sz=56)=><svg width={sz} height={sz} viewBox="0 0 56 56"><RvTri cx={28} cy={28} s={19}/></svg>},
        {label:"Circle",   render:(sz=56)=><svg width={sz} height={sz} viewBox="0 0 56 56"><RvCircle cx={28} cy={28} r={19}/></svg>},
        {label:"Square",   render:(sz=56)=><svg width={sz} height={sz} viewBox="0 0 56 56"><RvRect cx={28} cy={28} s={36}/></svg>},
        {label:"Diamond",  render:(sz=56)=><svg width={sz} height={sz} viewBox="0 0 56 56"><RvDiam cx={28} cy={28} s={19}/></svg>},
      ]},

    // B1-Q2: Size series — circles shrinking left to right in 1×4
    { id:2, title:"Size Series", instruction:"Which circle comes next in the sequence?", ans:0,
      renderStimulus:()=>(
        <svg viewBox="0 0 280 70" width={280} height={70} style={{display:'block',margin:'0 auto'}}>
          <RvGrid rows={1} cols={4} cs={70}/>
          <RvCircle cx={35} cy={35} r={26}/><RvCircle cx={105} cy={35} r={19}/>
          <RvCircle cx={175} cy={35} r={12}/><RvQMark cx={245} cy={35}/>
        </svg>),
      options:[
        {label:"Tiny",   render:(sz=56)=><svg width={sz} height={sz} viewBox="0 0 56 56"><RvCircle cx={28} cy={28} r={6}/></svg>},
        {label:"Large",  render:(sz=56)=><svg width={sz} height={sz} viewBox="0 0 56 56"><RvCircle cx={28} cy={28} r={24}/></svg>},
        {label:"Medium", render:(sz=56)=><svg width={sz} height={sz} viewBox="0 0 56 56"><RvCircle cx={28} cy={28} r={17}/></svg>},
        {label:"Small",  render:(sz=56)=><svg width={sz} height={sz} viewBox="0 0 56 56"><RvCircle cx={28} cy={28} r={11}/></svg>},
      ]},

    // B1-Q3: Fill alternation — filled ● empty ○ filled ● ? = empty ○
    { id:3, title:"Fill Pattern", instruction:"Which circle comes next in the sequence?", ans:0,
      renderStimulus:()=>(
        <svg viewBox="0 0 280 70" width={280} height={70} style={{display:'block',margin:'0 auto'}}>
          <RvGrid rows={1} cols={4} cs={70}/>
          <circle cx={35}  cy={35} r={22} fill="#374151"/>
          <RvCircle cx={105} cy={35} r={22}/>
          <circle cx={175} cy={35} r={22} fill="#374151"/>
          <RvQMark cx={245} cy={35}/>
        </svg>),
      options:[
        {label:"Empty ○",  render:(sz=56)=><svg width={sz} height={sz} viewBox="0 0 56 56"><RvCircle cx={28} cy={28} r={22}/></svg>},
        {label:"Filled ●", render:(sz=56)=><svg width={sz} height={sz} viewBox="0 0 56 56"><circle cx={28} cy={28} r={22} fill="#374151"/></svg>},
        {label:"Square",   render:(sz=56)=><svg width={sz} height={sz} viewBox="0 0 56 56"><RvRect cx={28} cy={28} s={36}/></svg>},
        {label:"Triangle", render:(sz=56)=><svg width={sz} height={sz} viewBox="0 0 56 56"><RvTri cx={28} cy={28} s={20}/></svg>},
      ]},

    // B1-Q4: Dot count series 1→2→3→? = 4 dots
    { id:4, title:"Dot Count", instruction:"How many dots come next?", ans:1,
      renderStimulus:()=>(
        <svg viewBox="0 0 280 70" width={280} height={70} style={{display:'block',margin:'0 auto'}}>
          <RvGrid rows={1} cols={4} cs={70}/>
          <circle cx={35} cy={35} r={7} fill="#374151"/>
          <RvDots cx={105} cy={35} n={2} r={7}/>
          <RvDots cx={175} cy={35} n={3} r={7}/>
          <RvQMark cx={245} cy={35}/>
        </svg>),
      options:[
        {label:"2 dots", render:(sz=56)=><svg width={sz} height={sz} viewBox="0 0 56 56"><RvDots cx={28} cy={28} n={2} r={7}/></svg>},
        {label:"4 dots", render:(sz=56)=><svg width={sz} height={sz} viewBox="0 0 56 56"><RvDots cx={28} cy={28} n={4} r={8}/></svg>},
        {label:"6 dots", render:(sz=56)=><svg width={sz} height={sz} viewBox="0 0 56 56"><RvDots cx={28} cy={28} n={6} r={8}/></svg>},
        {label:"5 dots", render:(sz=56)=><svg width={sz} height={sz} viewBox="0 0 56 56"><RvDots cx={28} cy={28} n={5} r={8}/></svg>},
      ]},

    // B1-Q5: Arrow direction cycle → ↓ ← ? = ↑
    { id:5, title:"Arrow Direction", instruction:"Which arrow direction comes next?", ans:2,
      renderStimulus:()=>(
        <svg viewBox="0 0 280 70" width={280} height={70} style={{display:'block',margin:'0 auto'}}>
          <RvGrid rows={1} cols={4} cs={70}/>
          <RvArrow cx={35}  cy={35} dir="right" size={16}/>
          <RvArrow cx={105} cy={35} dir="down"  size={16}/>
          <RvArrow cx={175} cy={35} dir="left"  size={16}/>
          <RvQMark cx={245} cy={35}/>
        </svg>),
      options:[
        {label:"Right →", render:(sz=56)=><svg width={sz} height={sz} viewBox="0 0 56 56"><RvArrow cx={28} cy={28} dir="right" size={16}/></svg>},
        {label:"Down ↓",  render:(sz=56)=><svg width={sz} height={sz} viewBox="0 0 56 56"><RvArrow cx={28} cy={28} dir="down"  size={16}/></svg>},
        {label:"Up ↑",    render:(sz=56)=><svg width={sz} height={sz} viewBox="0 0 56 56"><RvArrow cx={28} cy={28} dir="up"    size={16}/></svg>},
        {label:"Left ←",  render:(sz=56)=><svg width={sz} height={sz} viewBox="0 0 56 56"><RvArrow cx={28} cy={28} dir="left"  size={16}/></svg>},
      ]},

    // B1-Q6: Same shape repeats across each row — 3×3 (△row, ○row, □row) — missing: □
    { id:6, title:"Row Rule", instruction:"Which shape completes the bottom row?", ans:2,
      renderStimulus:()=>(
        <svg viewBox="0 0 210 210" width={210} height={210} style={{display:'block',margin:'0 auto'}}>
          <RvGrid rows={3} cols={3}/>
          <RvTri cx={35} cy={35} s={20}/><RvTri cx={105} cy={35} s={20}/><RvTri cx={175} cy={35} s={20}/>
          <RvCircle cx={35} cy={105} r={20}/><RvCircle cx={105} cy={105} r={20}/><RvCircle cx={175} cy={105} r={20}/>
          <RvRect cx={35} cy={175} s={38}/><RvRect cx={105} cy={175} s={38}/>
          <RvQMark cx={175} cy={175}/>
        </svg>),
      options:[
        {label:"Triangle", render:(sz=56)=><svg width={sz} height={sz} viewBox="0 0 56 56"><RvTri cx={28} cy={28} s={20}/></svg>},
        {label:"Circle",   render:(sz=56)=><svg width={sz} height={sz} viewBox="0 0 56 56"><RvCircle cx={28} cy={28} r={20}/></svg>},
        {label:"Square",   render:(sz=56)=><svg width={sz} height={sz} viewBox="0 0 56 56"><RvRect cx={28} cy={28} s={38}/></svg>},
        {label:"Diamond",  render:(sz=56)=><svg width={sz} height={sz} viewBox="0 0 56 56"><RvDiam cx={28} cy={28} s={20}/></svg>},
      ]},
  ],

  2: [
    // B2-Q1: Dot doubling 1→2→4→? = 8
    { id:7, title:"Dot Count", instruction:"How many dots fill the next box?", ans:0,
      renderStimulus:()=>(
        <svg viewBox="0 0 280 70" width={280} height={70} style={{display:'block',margin:'0 auto'}}>
          <RvGrid rows={1} cols={4} cs={70}/>
          <RvDot cx={35} cy={35}/>
          <RvDot cx={91} cy={22}/><RvDot cx={119} cy={48}/>
          <RvDot cx={155} cy={22}/><RvDot cx={175} cy={22}/><RvDot cx={155} cy={48}/><RvDot cx={175} cy={48}/>
          <RvQMark cx={245} cy={35}/>
        </svg>),
      options:[
        {label:"8 dots", render:(sz=56)=><svg width={sz} height={sz} viewBox="0 0 56 56"><RvDots cx={28} cy={28} n={8} r={4.5}/></svg>},
        {label:"3 dots", render:(sz=56)=><svg width={sz} height={sz} viewBox="0 0 56 56"><RvDots cx={28} cy={28} n={3} r={5}/></svg>},
        {label:"5 dots", render:(sz=56)=><svg width={sz} height={sz} viewBox="0 0 56 56"><RvDots cx={28} cy={28} n={5} r={5}/></svg>},
        {label:"6 dots", render:(sz=56)=><svg width={sz} height={sz} viewBox="0 0 56 56"><RvDots cx={28} cy={28} n={6} r={4.5}/></svg>},
      ]},

    // B2-Q2: Arrow rotation 90° clockwise: → ↓ ← ? = ↑
    { id:8, title:"Arrow Direction", instruction:"Which arrow direction comes next?", ans:0,
      renderStimulus:()=>(
        <svg viewBox="0 0 280 70" width={280} height={70} style={{display:'block',margin:'0 auto'}}>
          <RvGrid rows={1} cols={4} cs={70}/>
          <RvArrow cx={35} cy={35} dir="right" size={15}/>
          <RvArrow cx={105} cy={35} dir="down"  size={15}/>
          <RvArrow cx={175} cy={35} dir="left"  size={15}/>
          <RvQMark cx={245} cy={35}/>
        </svg>),
      options:[
        {label:"Up",    render:(sz=56)=><svg width={sz} height={sz} viewBox="0 0 56 56"><RvArrow cx={28} cy={28} dir="up"    size={14}/></svg>},
        {label:"Right", render:(sz=56)=><svg width={sz} height={sz} viewBox="0 0 56 56"><RvArrow cx={28} cy={28} dir="right" size={14}/></svg>},
        {label:"Down",  render:(sz=56)=><svg width={sz} height={sz} viewBox="0 0 56 56"><RvArrow cx={28} cy={28} dir="down"  size={14}/></svg>},
        {label:"Left",  render:(sz=56)=><svg width={sz} height={sz} viewBox="0 0 56 56"><RvArrow cx={28} cy={28} dir="left"  size={14}/></svg>},
      ]},

    // B2-Q3: Checkerboard alternating fill — bottom-right cell missing
    { id:9, title:"Grid Pattern", instruction:"Which tile completes the checkerboard?", ans:0,
      renderStimulus:()=>(
        <svg viewBox="0 0 210 210" width={210} height={210} style={{display:'block',margin:'0 auto'}}>
          <RvGrid rows={3} cols={3}/>
          {[[0,0],[0,1],[0,2],[1,0],[1,1],[1,2],[2,0],[2,1]].map(([r,c])=>(
            (r+c)%2===0
              ?<rect key={`${r}${c}`} x={c*70+8} y={r*70+8} width={54} height={54} fill="#374151" rx={5}/>
              :<rect key={`${r}${c}`} x={c*70+8} y={r*70+8} width={54} height={54} fill="none" stroke="#CBD5E1" strokeWidth={2} rx={5}/>
          ))}
          <RvQMark cx={175} cy={175}/>
        </svg>),
      options:[
        {label:"Filled",   render:(sz=56)=><svg width={sz} height={sz} viewBox="0 0 56 56"><rect x={6} y={6} width={44} height={44} fill="#374151" rx={5}/></svg>},
        {label:"Empty",    render:(sz=56)=><svg width={sz} height={sz} viewBox="0 0 56 56"><rect x={6} y={6} width={44} height={44} fill="none" stroke="#CBD5E1" strokeWidth={2.5} rx={5}/></svg>},
        {label:"Triangle", render:(sz=56)=><svg width={sz} height={sz} viewBox="0 0 56 56"><RvTri cx={28} cy={28} s={19} fill="#374151" stroke="none" sw={0}/></svg>},
        {label:"Circle",   render:(sz=56)=><svg width={sz} height={sz} viewBox="0 0 56 56"><circle cx={28} cy={28} r={22} fill="#374151"/></svg>},
      ]},

    // B2-Q4: Count increases per column (1→2→3 shapes per col), shape changes per row
    { id:10, title:"Count Pattern", instruction:"How many squares complete the bottom row?", ans:0,
      renderStimulus:()=>(
        <svg viewBox="0 0 210 210" width={210} height={210} style={{display:'block',margin:'0 auto'}}>
          <RvGrid rows={3} cols={3}/>
          <RvTri cx={35} cy={35} s={17} fill="#374151" stroke="none" sw={0}/>
          <RvTri cx={93} cy={35} s={14} fill="#374151" stroke="none" sw={0}/><RvTri cx={117} cy={35} s={14} fill="#374151" stroke="none" sw={0}/>
          <RvTri cx={150} cy={35} s={12} fill="#374151" stroke="none" sw={0}/><RvTri cx={170} cy={35} s={12} fill="#374151" stroke="none" sw={0}/><RvTri cx={190} cy={35} s={12} fill="#374151" stroke="none" sw={0}/>
          <RvDot cx={35} cy={105} r={15}/>
          <RvDot cx={93} cy={105} r={11}/><RvDot cx={117} cy={105} r={11}/>
          <RvDot cx={150} cy={105} r={10}/><RvDot cx={170} cy={105} r={10}/><RvDot cx={190} cy={105} r={10}/>
          <rect x={13} y={153} width={44} height={44} fill="none" stroke="#374151" strokeWidth={2.5}/>
          <rect x={79} y={158} width={32} height={32} fill="none" stroke="#374151" strokeWidth={2.5}/>
          <rect x={113} y={158} width={32} height={32} fill="none" stroke="#374151" strokeWidth={2.5}/>
          <RvQMark cx={175} cy={175}/>
        </svg>),
      options:[
        {label:"Three □", render:(sz=56)=><svg width={sz} height={sz} viewBox="0 0 56 56">
            <rect x={3}  y={18} width={15} height={15} fill="none" stroke="#374151" strokeWidth={2}/>
            <rect x={21} y={18} width={15} height={15} fill="none" stroke="#374151" strokeWidth={2}/>
            <rect x={39} y={18} width={15} height={15} fill="none" stroke="#374151" strokeWidth={2}/>
          </svg>},
        {label:"One □",   render:(sz=56)=><svg width={sz} height={sz} viewBox="0 0 56 56"><rect x={14} y={14} width={28} height={28} fill="none" stroke="#374151" strokeWidth={2.5}/></svg>},
        {label:"Four □",  render:(sz=56)=><svg width={sz} height={sz} viewBox="0 0 56 56">
            {[3,17,31,45].map(x=><rect key={x} x={x} y={20} width={11} height={11} fill="none" stroke="#374151" strokeWidth={2}/>)}
          </svg>},
        {label:"Two □",   render:(sz=56)=><svg width={sz} height={sz} viewBox="0 0 56 56">
            <rect x={9}  y={18} width={16} height={16} fill="none" stroke="#374151" strokeWidth={2}/>
            <rect x={32} y={18} width={16} height={16} fill="none" stroke="#374151" strokeWidth={2}/>
          </svg>},
      ]},

    // B2-Q5: Two attributes — large/small × filled/empty in 1×4
    // large-filled, small-filled, large-empty, ? = small-empty
    { id:11, title:"Size & Fill", instruction:"Which tile fits the pattern?", ans:0,
      renderStimulus:()=>(
        <svg viewBox="0 0 280 70" width={280} height={70} style={{display:'block',margin:'0 auto'}}>
          <RvGrid rows={1} cols={4} cs={70}/>
          <rect x={11} y={11} width={48} height={48} fill="#374151" rx={5}/>
          <rect x={90} y={26} width={30} height={30} fill="#374151" rx={4}/>
          <rect x={151} y={11} width={48} height={48} fill="none" stroke="#374151" strokeWidth={2.5} rx={5}/>
          <RvQMark cx={245} cy={35}/>
        </svg>),
      options:[
        {label:"Small □", render:(sz=56)=><svg width={sz} height={sz} viewBox="0 0 56 56"><rect x={13} y={13} width={30} height={30} fill="none" stroke="#374151" strokeWidth={2.5} rx={4}/></svg>},
        {label:"Large □", render:(sz=56)=><svg width={sz} height={sz} viewBox="0 0 56 56"><rect x={3} y={3} width={50} height={50} fill="none" stroke="#374151" strokeWidth={2.5} rx={5}/></svg>},
        {label:"Small ■", render:(sz=56)=><svg width={sz} height={sz} viewBox="0 0 56 56"><rect x={13} y={13} width={30} height={30} fill="#374151" rx={4}/></svg>},
        {label:"Large ■", render:(sz=56)=><svg width={sz} height={sz} viewBox="0 0 56 56"><rect x={3} y={3} width={50} height={50} fill="#374151" rx={5}/></svg>},
      ]},

    // B2-Q6: Shape per column (○□△) × shade per row (dark→grey→outline) — 3×3
    // Missing: (row2, col2) = outline triangle
    { id:12, title:"Shape & Shade", instruction:"Which shape belongs in the empty box?", ans:0,
      renderStimulus:()=>{
        const fills=["#374151","#94A3B8",null];
        return (
          <svg viewBox="0 0 210 210" width={210} height={210} style={{display:'block',margin:'0 auto'}}>
            <RvGrid rows={3} cols={3}/>
            {[0,1,2].flatMap(r=>[0,1,2].map(c=>{
              if(r===2&&c===2) return <RvQMark key="q" cx={175} cy={175}/>;
              const cx=35+c*70, cy=35+r*70;
              const fill=fills[r];
              if(c===0) return <circle key={`${r}${c}`} cx={cx} cy={cy} r={22} fill={fill||"none"} stroke={fill?null:"#374151"} strokeWidth={fill?0:2.5}/>;
              if(c===1) return <rect key={`${r}${c}`} x={cx-20} y={cy-20} width={40} height={40} fill={fill||"none"} stroke={fill?null:"#374151"} strokeWidth={fill?0:2.5} rx={3}/>;
              return <RvTri key={`${r}${c}`} cx={cx} cy={cy} s={22} fill={fill||"none"} stroke={fill?null:"#374151"} sw={fill?0:2.5}/>;
            }))}
          </svg>
        );
      },
      options:[
        {label:"Empty △",  render:(sz=56)=><svg width={sz} height={sz} viewBox="0 0 56 56"><RvTri cx={28} cy={28} s={22}/></svg>},
        {label:"Filled △", render:(sz=56)=><svg width={sz} height={sz} viewBox="0 0 56 56"><RvTri cx={28} cy={28} s={22} fill="#374151" stroke="none" sw={0}/></svg>},
        {label:"Grey △",   render:(sz=56)=><svg width={sz} height={sz} viewBox="0 0 56 56"><RvTri cx={28} cy={28} s={22} fill="#94A3B8" stroke="none" sw={0}/></svg>},
        {label:"Empty ○",  render:(sz=56)=><svg width={sz} height={sz} viewBox="0 0 56 56"><RvCircle cx={28} cy={28} r={22}/></svg>},
      ]},
  ],

  3: [
    // B3-Q1: Two rules — shape changes per row AND size shrinks per column
    { id:13, title:"Size & Shape", instruction:"Which shape belongs in the empty box?", ans:0,
      renderStimulus:()=>(
        <svg viewBox="0 0 210 210" width={210} height={210} style={{display:'block',margin:'0 auto'}}>
          <RvGrid rows={3} cols={3}/>
          <RvCircle cx={35} cy={35} r={27}/><RvCircle cx={105} cy={35} r={20}/><RvCircle cx={175} cy={35} r={12}/>
          <RvRect cx={35} cy={105} s={50}/><RvRect cx={105} cy={105} s={38}/><RvRect cx={175} cy={105} s={23}/>
          <RvTri cx={35} cy={175} s={27}/><RvTri cx={105} cy={175} s={20}/>
          <RvQMark cx={175} cy={175}/>
        </svg>),
      options:[
        {label:"Small △", render:(sz=56)=><svg width={sz} height={sz} viewBox="0 0 56 56"><RvTri cx={28} cy={28} s={12}/></svg>},
        {label:"Large △", render:(sz=56)=><svg width={sz} height={sz} viewBox="0 0 56 56"><RvTri cx={28} cy={28} s={24}/></svg>},
        {label:"Small ○", render:(sz=56)=><svg width={sz} height={sz} viewBox="0 0 56 56"><RvCircle cx={28} cy={28} r={12}/></svg>},
        {label:"Large ○", render:(sz=56)=><svg width={sz} height={sz} viewBox="0 0 56 56"><RvCircle cx={28} cy={28} r={24}/></svg>},
      ]},

    // B3-Q2: Shade gradient dark→grey→light repeats in every row — 3×3
    { id:14, title:"Shade Pattern", instruction:"Which shade belongs in the empty box?", ans:0,
      renderStimulus:()=>{
        const shades=["#1F2937","#94A3B8","#F1F5F9"];
        return(
          <svg viewBox="0 0 210 210" width={210} height={210} style={{display:'block',margin:'0 auto'}}>
            <RvGrid rows={3} cols={3}/>
            {[0,1,2].flatMap(r=>shades.map((fill,c)=>{
              if(r===2&&c===2) return null;
              return <rect key={`${r}${c}`} x={c*70+8} y={r*70+8} width={54} height={54} fill={fill} rx={6}/>;
            }))}
            <RvQMark cx={175} cy={175}/>
          </svg>);
      },
      options:[
        {label:"Light",  render:(sz=56)=><svg width={sz} height={sz} viewBox="0 0 56 56"><rect x={5} y={5} width={46} height={46} fill="#F1F5F9" stroke="#CBD5E1" strokeWidth={1.5} rx={6}/></svg>},
        {label:"Dark",   render:(sz=56)=><svg width={sz} height={sz} viewBox="0 0 56 56"><rect x={5} y={5} width={46} height={46} fill="#1F2937" rx={6}/></svg>},
        {label:"Medium", render:(sz=56)=><svg width={sz} height={sz} viewBox="0 0 56 56"><rect x={5} y={5} width={46} height={46} fill="#94A3B8" rx={6}/></svg>},
        {label:"Black",  render:(sz=56)=><svg width={sz} height={sz} viewBox="0 0 56 56"><rect x={5} y={5} width={46} height={46} fill="#000" rx={6}/></svg>},
      ]},

    // B3-Q3: Two rules — arrow direction changes per row AND size decreases per column
    { id:15, title:"Direction & Size", instruction:"Which arrow completes the pattern?", ans:0,
      renderStimulus:()=>(
        <svg viewBox="0 0 210 210" width={210} height={210} style={{display:'block',margin:'0 auto'}}>
          <RvGrid rows={3} cols={3}/>
          <RvArrow cx={35}  cy={35}  dir="right" size={20}/>
          <RvArrow cx={105} cy={35}  dir="right" size={14}/>
          <RvArrow cx={175} cy={35}  dir="right" size={8}/>
          <RvArrow cx={35}  cy={105} dir="down" size={20}/>
          <RvArrow cx={105} cy={105} dir="down" size={14}/>
          <RvArrow cx={175} cy={105} dir="down" size={8}/>
          <RvArrow cx={35}  cy={175} dir="left" size={20}/>
          <RvArrow cx={105} cy={175} dir="left" size={14}/>
          <RvQMark cx={175} cy={175}/>
        </svg>),
      options:[
        {label:"Small ←",  render:(sz=56)=><svg width={sz} height={sz} viewBox="0 0 56 56"><RvArrow cx={28} cy={28} dir="left"  size={8}/></svg>},
        {label:"Large ←",  render:(sz=56)=><svg width={sz} height={sz} viewBox="0 0 56 56"><RvArrow cx={28} cy={28} dir="left"  size={20}/></svg>},
        {label:"Small →",  render:(sz=56)=><svg width={sz} height={sz} viewBox="0 0 56 56"><RvArrow cx={28} cy={28} dir="right" size={8}/></svg>},
        {label:"Med ↓",    render:(sz=56)=><svg width={sz} height={sz} viewBox="0 0 56 56"><RvArrow cx={28} cy={28} dir="down"  size={14}/></svg>},
      ]},

    // B3-Q4: Two rules — shape type per row (○□△) × count per column (1,2,3) — 3×3
    // Missing: (row2,col2) = 3 triangles
    { id:16, title:"Shape & Count", instruction:"What fills the missing cell?", ans:0,
      renderStimulus:()=>{
        const S=['c','s','t'];
        const draw=(sh,cx,cy,sz,key)=>{
          if(sh==='c') return <circle key={key} cx={cx} cy={cy} r={sz} fill="#374151"/>;
          if(sh==='s') return <rect key={key} x={cx-sz} y={cy-sz} width={sz*2} height={sz*2} fill="#374151" rx={2}/>;
          return <RvTri key={key} cx={cx} cy={cy} s={sz+3} fill="#374151" stroke="none" sw={0}/>;
        };
        return (
          <svg viewBox="0 0 210 210" width={210} height={210} style={{display:'block',margin:'0 auto'}}>
            <RvGrid rows={3} cols={3}/>
            {[0,1,2].flatMap(r=>[0,1,2].flatMap(c=>{
              if(r===2&&c===2) return [<RvQMark key="q" cx={175} cy={175}/>];
              const cx=35+c*70, cy=35+r*70, cnt=c+1;
              const sz=cnt===1?17:cnt===2?13:10;
              if(cnt===1) return [draw(S[r],cx,cy,sz,`${r}${c}0`)];
              if(cnt===2) return [draw(S[r],cx-13,cy,sz,`${r}${c}0`),draw(S[r],cx+13,cy,sz,`${r}${c}1`)];
              return [draw(S[r],cx-19,cy,sz,`${r}${c}0`),draw(S[r],cx,cy,sz,`${r}${c}1`),draw(S[r],cx+19,cy,sz,`${r}${c}2`)];
            }))}
          </svg>
        );
      },
      options:[
        {label:"3 △", render:(sz=56)=><svg width={sz} height={sz} viewBox="0 0 56 56">
          {[-18,0,18].map(dx=><RvTri key={dx} cx={28+dx} cy={28} s={13} fill="#374151" stroke="none" sw={0}/>)}
        </svg>},
        {label:"2 △", render:(sz=56)=><svg width={sz} height={sz} viewBox="0 0 56 56">
          {[-13,13].map(dx=><RvTri key={dx} cx={28+dx} cy={28} s={15} fill="#374151" stroke="none" sw={0}/>)}
        </svg>},
        {label:"3 ○", render:(sz=56)=><svg width={sz} height={sz} viewBox="0 0 56 56">
          {[-18,0,18].map(dx=><circle key={dx} cx={28+dx} cy={28} r={10} fill="#374151"/>)}
        </svg>},
        {label:"3 □", render:(sz=56)=><svg width={sz} height={sz} viewBox="0 0 56 56">
          {[-18,0,18].map(dx=><rect key={dx} x={18+dx} y={18} width={20} height={20} fill="#374151" rx={2}/>)}
        </svg>},
      ]},

    // B3-Q5: Two rules — outer shape per column (○□△) × inner dot count per row (0,1,2) — 3×3
    // Missing: (row2, col2) = triangle with 2 inner dots
    { id:17, title:"Inner Dots", instruction:"What belongs in the missing cell?", ans:0,
      renderStimulus:()=>(
        <svg viewBox="0 0 210 210" width={210} height={210} style={{display:'block',margin:'0 auto'}}>
          <RvGrid rows={3} cols={3}/>
          {[0,1,2].flatMap(r=>[0,1,2].flatMap(c=>{
            if(r===2&&c===2) return [<RvQMark key="q" cx={175} cy={175}/>];
            const cx=35+c*70, cy=35+r*70;
            const outer = c===0
              ? <circle key={`o${r}${c}`} cx={cx} cy={cy} r={26} fill="none" stroke="#374151" strokeWidth={2.5}/>
              : c===1
              ? <rect key={`o${r}${c}`} x={cx-24} y={cy-24} width={48} height={48} fill="none" stroke="#374151" strokeWidth={2.5} rx={3}/>
              : <RvTri key={`o${r}${c}`} cx={cx} cy={cy} s={27} fill="none" stroke="#374151" sw={2.5}/>;
            const dots = r===0 ? [] : r===1
              ? [<circle key={`d${r}${c}0`} cx={cx} cy={cy} r={6} fill="#374151"/>]
              : [<circle key={`d${r}${c}0`} cx={cx-9} cy={cy} r={5} fill="#374151"/>,
                 <circle key={`d${r}${c}1`} cx={cx+9} cy={cy} r={5} fill="#374151"/>];
            return [outer,...dots];
          }))}
        </svg>),
      options:[
        {label:"△ 2 dots", render:(sz=56)=><svg width={sz} height={sz} viewBox="0 0 56 56">
          <RvTri cx={28} cy={28} s={25} fill="none" stroke="#374151" sw={2.5}/>
          <circle cx={20} cy={30} r={5} fill="#374151"/><circle cx={36} cy={30} r={5} fill="#374151"/>
        </svg>},
        {label:"△ 1 dot", render:(sz=56)=><svg width={sz} height={sz} viewBox="0 0 56 56">
          <RvTri cx={28} cy={28} s={25} fill="none" stroke="#374151" sw={2.5}/>
          <circle cx={28} cy={30} r={6} fill="#374151"/>
        </svg>},
        {label:"○ 2 dots", render:(sz=56)=><svg width={sz} height={sz} viewBox="0 0 56 56">
          <circle cx={28} cy={28} r={25} fill="none" stroke="#374151" strokeWidth={2.5}/>
          <circle cx={20} cy={28} r={5} fill="#374151"/><circle cx={36} cy={28} r={5} fill="#374151"/>
        </svg>},
        {label:"□ 2 dots", render:(sz=56)=><svg width={sz} height={sz} viewBox="0 0 56 56">
          <rect x={2} y={2} width={52} height={52} fill="none" stroke="#374151" strokeWidth={2.5} rx={3}/>
          <circle cx={20} cy={28} r={5} fill="#374151"/><circle cx={36} cy={28} r={5} fill="#374151"/>
        </svg>},
      ]},

    // B3-Q6: Additive rule — cell (r,c) contains (r+c+1) dots — 3×3
    // (0,0)=1, (0,1)=2, (0,2)=3 / (1,0)=2, (1,1)=3, (1,2)=4 / (2,0)=3, (2,1)=4, (2,2)=? = 5
    { id:18, title:"Dot Rule", instruction:"How many dots belong in the empty cell?", ans:1,
      renderStimulus:()=>(
        <svg viewBox="0 0 210 210" width={210} height={210} style={{display:'block',margin:'0 auto'}}>
          <RvGrid rows={3} cols={3}/>
          {[0,1,2].flatMap(r=>[0,1,2].map(c=>{
            const n=r+c+1;
            const cx=35+c*70, cy=35+r*70;
            if(r===2&&c===2) return <RvQMark key="q" cx={175} cy={175}/>;
            return <RvDots key={`${r}${c}`} cx={cx} cy={cy} n={n} r={n<=3?7:6}/>;
          }))}
        </svg>),
      options:[
        {label:"4 dots", render:(sz=56)=><svg width={sz} height={sz} viewBox="0 0 56 56"><RvDots cx={28} cy={28} n={4} r={8}/></svg>},
        {label:"5 dots", render:(sz=56)=><svg width={sz} height={sz} viewBox="0 0 56 56"><RvDots cx={28} cy={28} n={5} r={8}/></svg>},
        {label:"6 dots", render:(sz=56)=><svg width={sz} height={sz} viewBox="0 0 56 56"><RvDots cx={28} cy={28} n={6} r={8}/></svg>},
        {label:"3 dots", render:(sz=56)=><svg width={sz} height={sz} viewBox="0 0 56 56"><RvDots cx={28} cy={28} n={3} r={8}/></svg>},
      ]},
  ],

  4: [
    // B4-Q1: Multiplication rule — cell(r,c) = (r+1)×(c+1) dots
    { id:19, title:"Dot Matrix", instruction:"How many dots belong in the missing cell?", ans:0,
      renderStimulus:()=>(
        <svg viewBox="0 0 210 210" width={210} height={210} style={{display:'block',margin:'0 auto'}}>
          <RvGrid rows={3} cols={3}/>
          {[[1,2,3],[2,4,6],[3,6,null]].flatMap((row,r)=>row.map((n,c)=>{
            const cx=35+c*70, cy=35+r*70;
            if(n===null) return <RvQMark key="q" cx={175} cy={175}/>;
            return <RvDots key={`${r}${c}`} cx={cx} cy={cy} n={n} r={5}/>;
          }))}
        </svg>),
      options:[
        {label:"9 dots",  render:(sz=56)=><svg width={sz} height={sz} viewBox="0 0 56 56"><RvDots cx={28} cy={28} n={9}  r={4}/></svg>},
        {label:"7 dots",  render:(sz=56)=><svg width={sz} height={sz} viewBox="0 0 56 56"><RvDots cx={28} cy={28} n={7}  r={4}/></svg>},
        {label:"8 dots",  render:(sz=56)=><svg width={sz} height={sz} viewBox="0 0 56 56"><RvDots cx={28} cy={28} n={8}  r={4}/></svg>},
        {label:"12 dots", render:(sz=56)=><svg width={sz} height={sz} viewBox="0 0 56 56"><RvDots cx={28} cy={28} n={12} r={3.5}/></svg>},
      ]},

    // B4-Q2: Polygon sides matrix — n sides = r+c+3; final cell (2,2)=7 sides
    { id:20, title:"Shape Sides", instruction:"Which shape has the correct number of sides?", ans:0,
      renderStimulus:()=>(
        <svg viewBox="0 0 210 210" width={210} height={210} style={{display:'block',margin:'0 auto'}}>
          <RvGrid rows={3} cols={3}/>
          {[[3,4,5],[4,5,6],[5,6,null]].flatMap((row,r)=>row.map((n,c)=>{
            const cx=35+c*70, cy=35+r*70;
            if(n===null) return <RvQMark key="q" cx={175} cy={175}/>;
            return <RvPoly key={`${r}${c}`} cx={cx} cy={cy} n={n} r={24}/>;
          }))}
        </svg>),
      options:[
        {label:"7 sides", render:(sz=56)=><svg width={sz} height={sz} viewBox="0 0 56 56"><RvPoly cx={28} cy={28} n={7} r={22}/></svg>},
        {label:"5 sides", render:(sz=56)=><svg width={sz} height={sz} viewBox="0 0 56 56"><RvPoly cx={28} cy={28} n={5} r={22}/></svg>},
        {label:"6 sides", render:(sz=56)=><svg width={sz} height={sz} viewBox="0 0 56 56"><RvPoly cx={28} cy={28} n={6} r={22}/></svg>},
        {label:"8 sides", render:(sz=56)=><svg width={sz} height={sz} viewBox="0 0 56 56"><RvPoly cx={28} cy={28} n={8} r={22}/></svg>},
      ]},

    // B4-Q3: Two rules — sides = r+c+3 AND fill alternates by (r+c) parity
    // Even parity = filled, odd parity = empty
    // (2,2): sides=7, parity=4(even) → filled 7-gon
    { id:21, title:"Sides & Fill", instruction:"Which shape belongs in the empty cell?", ans:0,
      renderStimulus:()=>(
        <svg viewBox="0 0 210 210" width={210} height={210} style={{display:'block',margin:'0 auto'}}>
          <RvGrid rows={3} cols={3}/>
          {[0,1,2].flatMap(r=>[0,1,2].map(c=>{
            if(r===2&&c===2) return <RvQMark key="q" cx={175} cy={175}/>;
            const cx=35+c*70, cy=35+r*70, n=r+c+3, filled=(r+c)%2===0;
            return <RvPoly key={`${r}${c}`} cx={cx} cy={cy} n={n} r={24}
              fill={filled?"#374151":"none"} stroke={filled?"none":"#374151"} sw={filled?0:2.5}/>;
          }))}
        </svg>),
      options:[
        {label:"Filled 7-gon", render:(sz=56)=><svg width={sz} height={sz} viewBox="0 0 56 56"><RvPoly cx={28} cy={28} n={7} r={23} fill="#374151" stroke="none" sw={0}/></svg>},
        {label:"Empty 7-gon",  render:(sz=56)=><svg width={sz} height={sz} viewBox="0 0 56 56"><RvPoly cx={28} cy={28} n={7} r={23} fill="none" stroke="#374151" sw={2.5}/></svg>},
        {label:"Filled 8-gon", render:(sz=56)=><svg width={sz} height={sz} viewBox="0 0 56 56"><RvPoly cx={28} cy={28} n={8} r={23} fill="#374151" stroke="none" sw={0}/></svg>},
        {label:"Empty 6-gon",  render:(sz=56)=><svg width={sz} height={sz} viewBox="0 0 56 56"><RvPoly cx={28} cy={28} n={6} r={23} fill="none" stroke="#374151" sw={2.5}/></svg>},
      ]},

    // B4-Q4: Three rules — direction = dirs[(r+c)%4], size per column, placed in 3×3
    // dirs: 0=right,1=down,2=left,3=up. sizes col0=large,col1=med,col2=small
    // (2,2): (r+c)%4 = 4%4 = 0 = right, size = small → small right arrow
    { id:22, title:"Direction & Size Matrix", instruction:"Which arrow completes the pattern?", ans:0,
      renderStimulus:()=>{
        const dirs=["right","down","left","up"], sizes=[20,14,8];
        return (
          <svg viewBox="0 0 210 210" width={210} height={210} style={{display:'block',margin:'0 auto'}}>
            <RvGrid rows={3} cols={3}/>
            {[0,1,2].flatMap(r=>[0,1,2].map(c=>{
              if(r===2&&c===2) return <RvQMark key="q" cx={175} cy={175}/>;
              return <RvArrow key={`${r}${c}`} cx={35+c*70} cy={35+r*70} dir={dirs[(r+c)%4]} size={sizes[c]}/>;
            }))}
          </svg>
        );
      },
      options:[
        {label:"Small →", render:(sz=56)=><svg width={sz} height={sz} viewBox="0 0 56 56"><RvArrow cx={28} cy={28} dir="right" size={8}/></svg>},
        {label:"Small ↓", render:(sz=56)=><svg width={sz} height={sz} viewBox="0 0 56 56"><RvArrow cx={28} cy={28} dir="down"  size={8}/></svg>},
        {label:"Med →",   render:(sz=56)=><svg width={sz} height={sz} viewBox="0 0 56 56"><RvArrow cx={28} cy={28} dir="right" size={14}/></svg>},
        {label:"Small ←", render:(sz=56)=><svg width={sz} height={sz} viewBox="0 0 56 56"><RvArrow cx={28} cy={28} dir="left"  size={8}/></svg>},
      ]},
  ],
};


// ── CAT Advancement Rules ─────────────────────────────────────────────────────
// Each band: 6 items (4 for band 4). passThreshold = 4 correct to advance.
const CAT_RULES = {
  1: { passThreshold:4, label:"Foundation",  iqBase:70,  range:15, maLo:7,  maHi:9  },
  2: { passThreshold:4, label:"Standard",    iqBase:85,  range:15, maLo:9,  maHi:12 },
  3: { passThreshold:4, label:"Advanced",    iqBase:100, range:15, maLo:12, maHi:15 },
  4: { passThreshold:3, label:"Exceptional", iqBase:115, range:15, maLo:15, maHi:18 },
};

// IQ + Mental Age lookup based on highest band reached and within-band performance
const scoreCAT = (d1) => {
  const band = d1._band || 1;
  const b = { 1:d1._b1||0, 2:d1._b2||0, 3:d1._b3||0, 4:d1._b4||0 };
  const totalCorrect = b[1]+b[2]+b[3]+b[4];
  const totalQ = Object.keys(d1).filter(k=>!k.startsWith('_')).length;
  const rule = CAT_RULES[band];
  const bc   = b[band];
  const bandTotal = RAVENS_CAT[band].length;

  // IQ estimate: band base + proportional within-band score
  const iq = Math.round(rule.iqBase + (bc / bandTotal) * rule.range);

  // Mental Age: interpolated within band's MA range
  const ma = parseFloat((rule.maLo + (bc / bandTotal) * (rule.maHi - rule.maLo)).toFixed(1));

  // Descriptive label
  const label =
    iq < 80  ? "Below Average"  :
    iq < 90  ? "Low Average"    :
    iq < 110 ? "Average"        :
    iq < 120 ? "High Average"   :
    iq < 130 ? "Superior"       : "Exceptional";

  // Approximate percentile (normal distribution table)
  const pctRank =
    iq >= 130 ? 98 : iq >= 125 ? 95 : iq >= 120 ? 91 : iq >= 115 ? 84 :
    iq >= 110 ? 75 : iq >= 105 ? 63 : iq >= 100 ? 50 : iq >= 95  ? 37 :
    iq >= 90  ? 25 : iq >= 85  ? 16 : iq >= 80  ? 9  : 5;

  return { iq, ma, label, pctRank, band, bandScores:b, totalCorrect, totalQ };
};

const BFI10 = [
  { id:1,  text:"I am outgoing and sociable",                     dom:"E", rev:false },
  { id:2,  text:"I am sometimes rude or critical to others",      dom:"A", rev:true  },
  { id:3,  text:"I am reliable and can always be counted on",     dom:"C", rev:false },
  { id:4,  text:"I worry a lot",                                  dom:"N", rev:false },
  { id:5,  text:"I enjoy creative work and new ideas",            dom:"O", rev:false },
  { id:6,  text:"I am quiet and reserved",                        dom:"E", rev:true  },
  { id:7,  text:"I am generally trusting and cooperative",        dom:"A", rev:false },
  { id:8,  text:"I can be somewhat lazy or disorganised",         dom:"C", rev:true  },
  { id:9,  text:"I stay calm and emotionally stable",             dom:"N", rev:true  },
  { id:10, text:"I have few artistic or creative interests",      dom:"O", rev:true  },
];

const DUKE17 = [
  // Functional (Duke: 0=limited lot, 1=limited little, 2=not limited)
  { id:1,  q:"Do strenuous activities (fast walking, cycling, sports)", type:"func" },
  { id:2,  q:"Do moderate activities (sweeping, light housework)",      type:"func" },
  { id:3,  q:"Climb one flight of stairs",                              type:"func" },
  { id:4,  q:"Bend, lift, or stoop",                                    type:"func" },
  // Frequency past week (0=none, 1=little, 2=some, 3=most, 4=all)
  { id:5,  q:"Visit with friends or relatives",                         type:"freq", neg:false },
  { id:6,  q:"Done work, housework, or schoolwork",                     type:"freq", neg:false },
  { id:7,  q:"Been happy",                                              type:"freq", neg:false },
  { id:8,  q:"Had a lot of energy",                                     type:"freq", neg:false },
  { id:9,  q:"Been depressed or sad",                                   type:"freq", neg:true  },
  { id:10, q:"Been nervous or worried",                                 type:"freq", neg:true  },
  { id:11, q:"Felt worthwhile as a person",                             type:"freq", neg:false },
  { id:14, q:"Had trouble sleeping",                                    type:"freq", neg:true  },
  { id:15, q:"Had physical pain limiting activities",                   type:"freq", neg:true  },
  { id:16, q:"Got along well with other people",                        type:"freq", neg:false },
  // Health ratings (0=poor, 4=excellent)
  { id:12, q:"Overall physical health in the past week",                type:"health" },
  { id:13, q:"Mental or emotional health in the past week",             type:"health" },
  { id:17, q:"Compared to others your age, your health is…",           type:"compare" },
];

const PHQ9 = [
  "Little interest or pleasure in doing things",
  "Feeling down, depressed, or hopeless",
  "Trouble falling or staying asleep, or sleeping too much",
  "Feeling tired or having little energy",
  "Poor appetite or overeating",
  "Feeling bad about yourself — or that you are a failure or let yourself down",
  "Trouble concentrating on things such as reading or watching TV",
  "Moving or speaking so slowly others could notice — or the opposite, being fidgety",
  "Thoughts that you would be better off dead, or of hurting yourself in some way",
];

const AUDITC = [
  { q:"How often do you have a drink containing alcohol?",
    opts:["Never","Monthly or less","2–4 times a month","2–3 times a week","4+ times a week"], sc:[0,1,2,3,4] },
  { q:"How many drinks on a typical drinking day?",
    opts:["1–2","3–4","5–6","7–9","10 or more"], sc:[0,1,2,3,4] },
  { q:"How often do you have 6+ drinks on one occasion?",
    opts:["Never","Less than monthly","Monthly","Weekly","Daily/almost daily"], sc:[0,1,2,3,4] },
];

const CSSRS = [
  "Have you wished you were dead or hoped you could go to sleep and not wake up?",
  "Have you had any actual thoughts of killing yourself?",
  "Have you been thinking about how you might do this?",
  "Have you had these thoughts and had some intention of acting on them?",
  "Have you started to work out or act on the details of how to kill yourself?",
];

const SDQCP = [
  { q:"I often have temper tantrums or hot tempers",      rev:false },
  { q:"I usually do as I am told",                        rev:true  },
  { q:"I fight a lot or bully others to get what I want", rev:false },
  { q:"I am often accused of lying or cheating",          rev:false },
  { q:"I take things that do not belong to me",           rev:false },
];

// ── OPTION SHUFFLE ────────────────────────────────────────────────────────────
// Deterministic per question ID — same question always shuffles same way,
// but correct answer lands in a different position for each question.
// Uses the question id as a seed so it is stable across renders.
const shuffleOptions = (options, correctIdx, questionId) => {
  // Simple seeded Fisher-Yates using question id
  const seed = questionId * 2654435761;
  const rng  = (n) => {
    const x = Math.sin(seed + n) * 10000;
    return x - Math.floor(x);
  };
  const arr  = options.map((opt, i) => ({ opt, origIdx: i }));
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng(i) * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  const newCorrectIdx = arr.findIndex(a => a.origIdx === correctIdx);
  return { shuffled: arr.map(a => a.opt), newCorrectIdx };
};

const scoreBFI = (resp) => {
  // BFI-10 standard scoring (Rammstedt & John, 2007)
  // Each domain: (forward_item + (6 - reverse_item)) / 2  → range 1–5
  // Forward items: E=1, A=7, C=3, N=4, O=5
  // Reverse items: E=6, A=2, C=8, N=9, O=10
  const doms = { O:[5,10], C:[3,8], E:[1,6], A:[7,2], N:[4,9] };
  const result = {};
  Object.entries(doms).forEach(([d,[f,r]]) => {
    const fv = resp[f] !== undefined ? resp[f] : 3;
    const rv = resp[r] !== undefined ? resp[r] : 3;
    result[d] = ((fv + (6 - rv)) / 2).toFixed(1);
  });
  return result;
};

const scoreDuke = (resp) => {
  const get = (id) => resp[id] !== undefined ? resp[id] : 2;
  // Physical: items 1,2,3,4 (func 0-2 each, max 8)
  const phys    = Math.round((get(1)+get(2)+get(3)+get(4)) / 8 * 100);
  // Mental: items 7,8,11(pos) + 9,10(neg reversed) (freq 0-4 each, max 20)
  const mental  = Math.round((get(7)+get(8)+(4-get(9))+(4-get(10))+get(11)) / 20 * 100);
  // Social: items 5,6,16 (freq 0-4 each, max 12)
  const social  = Math.round((get(5)+get(6)+get(16)) / 12 * 100);
  // General: mean of three functional scales
  const general = Math.round((phys+mental+social) / 3);
  // Self-Esteem: items 7+11 (happy+worthwhile, both 0-4, max 8) — Parkerson 1990
  const selfEsteem = Math.round((get(7)+get(11)) / 8 * 100);
  // Anxiety: items 10+14 (nervous+sleepless, both 0-4, max 8) — higher=worse
  const anxiety    = Math.round((get(10)+get(14)) / 8 * 100);
  // Depression: item9 + (4-item11) (sad + not-worthwhile, max 8) — higher=worse
  const depression = Math.round((get(9)+(4-get(11))) / 8 * 100);
  // Perceived health: items 12,13 (health 0-4 each, max 8)
  const perceived  = Math.round((get(12)+get(13)) / 8 * 100);
  // Pain: item 15 (neg freq, higher=more pain)
  const pain       = Math.round(get(15) / 4 * 100);
  // Disability: item 1 reversed (0=a lot limited → disability=100)
  const disability = Math.round((2-get(1)) / 2 * 100);
  return { phys, mental, social, general, selfEsteem, anxiety, depression, perceived, pain, disability };
};

const scorePHQ = (resp) => Object.values(resp).reduce((a,b)=>a+b,0);

const classPHQ = (score) => {
  if (score<=4)  return { label:"Minimal / None", color:"#10B981", risk:"low" };
  if (score<=9)  return { label:"Mild",           color:"#84CC16", risk:"low" };
  if (score<=14) return { label:"Moderate",       color:"#F59E0B", risk:"moderate" };
  if (score<=19) return { label:"Moderately Severe", color:"#F97316", risk:"high" };
  return              { label:"Severe",           color:"#EF4444", risk:"high" };
};

const scoreCSS = (resp) => {
  const pos = Object.values(resp).filter(Boolean).length;
  if (pos===0) return { level:0, label:"No ideation", color:"#10B981" };
  if (pos<=1)  return { level:1, label:"Passive ideation", color:"#84CC16" };
  if (pos<=2)  return { level:2, label:"Active ideation (no plan)", color:"#F59E0B" };
  if (pos<=3)  return { level:3, label:"Ideation with plan", color:"#F97316" };
  return              { level:4, label:"Intent with rehearsal", color:"#EF4444" };
};

const scoreAUDIT = (resp) => {
  const s = Object.entries(resp).reduce((a,[k,v]) => a + AUDITC[parseInt(k)].sc[v], 0);
  if (s<=3)  return { score:s, label:"Low risk", color:"#10B981" };
  if (s<=7)  return { score:s, label:"Hazardous use", color:"#F59E0B" };
  return          { score:s, label:"Harmful / Dependent", color:"#EF4444" };
};

// ── Age-adjusted normative ranges ────────────────────────────────────────────
// Source: Parkerson 1990 (Duke), Rammstedt & John 2007 (BFI-10),
//         NIMHANS/ICMR reference data for Indian adult population.
const getAgeNorms = (age) => {
  const a = parseInt(age) || 30;
  const g = a < 36 ? "young" : a < 56 ? "mid" : "older";
  return {
    // Duke functional scales (higher=better, 0-100)
    phys:       { young:[75,100], mid:[65,100], older:[50,100] }[g],
    mental:     { young:[65,100], mid:[60,100], older:[55,100] }[g],
    social:     { young:[60,100], mid:[55,100], older:[50,100] }[g],
    general:    { young:[67,100], mid:[60,100], older:[52,100] }[g],
    selfEsteem: { young:[70,100], mid:[65,100], older:[60,100] }[g],
    perceived:  { young:[60,100], mid:[55,100], older:[50,100] }[g],
    // Duke dysfunction scales (lower=better, 0-100)
    anxiety:    { young:[0,25],   mid:[0,30],   older:[0,38]   }[g],
    depression: { young:[0,20],   mid:[0,25],   older:[0,32]   }[g],
    pain:       { young:[0,20],   mid:[0,30],   older:[0,40]   }[g],
    disability: { young:[0,15],   mid:[0,25],   older:[0,40]   }[g],
    // BFI-10 T-score normal ranges (M=50, SD=10)
    bfi: {
      O: { young:[38,65], mid:[36,63], older:[34,62] }[g],
      C: { young:[38,65], mid:[42,68], older:[45,70] }[g],
      E: { young:[38,65], mid:[36,63], older:[34,62] }[g],
      A: { young:[38,63], mid:[42,66], older:[45,68] }[g],
      N: { young:[36,64], mid:[33,62], older:[30,58] }[g],
    },
    // Ravens IQ age-adjustment (Average band centre)
    iqAvgLo: { young:90, mid:88, older:82 }[g],
    iqAvgHi: { young:110, mid:108, older:100 }[g],
    group: g,
    label: { young:"Young Adult (18–35)", mid:"Middle Adult (36–55)", older:"Older Adult (56+)" }[g],
  };
};

// ── FileNo / Registration helpers ────────────────────────────────────────────
// Reads ?reg= from the URL so CIBS can pre-fill via a sent link
const getURLParam = (key) => {
  try { return new URLSearchParams(window.location.search).get(key) || ""; }
  catch { return ""; }
};

// Auto-generate a FileNo when none is provided (walk-in / self-referred)
const autoFileNo = () => {
  const yy = String(new Date().getFullYear()).slice(-2);
  const rand = String(Math.floor(Math.random()*9000)+1000);
  return `CIBS-${yy}-${rand}`;
};

// Calculate age from DOB string (YYYY-MM-DD)
const calcAge = (dob) => {
  if (!dob) return "";
  const d = new Date(dob), now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  if (now < new Date(now.getFullYear(), d.getMonth(), d.getDate())) age--;
  return age > 0 ? String(age) : "";
};

const generateUID = (mobile, dob, gender) => {
  const last6 = (mobile||"").replace(/\D/g,"").slice(-6).padStart(6,"0");
  const now = new Date();
  const dd = String(now.getDate()).padStart(2,"0");
  const mm = String(now.getMonth()+1).padStart(2,"0");
  const yy = String(now.getFullYear()).slice(-2);
  const g = (gender||"X")[0].toUpperCase();
  return `SC-${last6}-${dd}${mm}${yy}-${g}`;
};

// ─────────────── TINY UI ATOMS ─────────────────────────────────────────────

const cx = (...args) => args.filter(Boolean).join(" ");

const Pill = ({ children, color="#3B82F6" }) => (
  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
    style={{ background: color + "18", color, border: `1px solid ${color}33` }}>
    {children}
  </span>
);

const ScoreBar = ({ value, max=100, color="#3B82F6", label, sub }) => {
  const pct = Math.min(100, Math.round((value/max)*100));
  return (
    <div className="mb-3">
      <div className="flex justify-between items-baseline mb-1">
        <span className="text-xs font-semibold text-gray-700">{label}</span>
        <span className="text-sm font-black" style={{ color }}>{pct}</span>
      </div>
      <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}99, ${color})` }}/>
      </div>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
};

const SectionHead = ({ icon, title, color="#1A2E4A", badge }) => (
  <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
    <span className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0"
      style={{ background: color + "18" }}>{icon}</span>
    <div className="flex-1">
      <p className="font-black text-sm text-gray-800">{title}</p>
    </div>
    {badge && <Pill color={badge.color}>{badge.text}</Pill>}
  </div>
);

// ─────────────── SCREENS ───────────────────────────────────────────────────

// ════ WELCOME ════════════════════════════════════════════════════════════════
// ════ TRANSLATIONS (EN / HI / MR) ════════════════════════════════════════════
const VT = {
  en: {
    langTitle:"Choose Language", langSub:"Select the language you are most comfortable with",
    langEn:"English", langHi:"हिंदी", langMr:"मराठी",
    regTitle:"Patient Registration", regSub:"CIBS-VALID · Fill your details before starting",
    fileNoLabel:"Registration Number (FileNo) ★",
    fileNoPrefilled:"Pre-filled by CIBS — links your records across all tests",
    fileNoHint:"Leave blank — a unique number will be generated automatically",
    nameLabel:"Full Name (optional — leave blank to stay anonymous)",
    dobLabel:"Date of Birth ★", ageStr:"Age", yearsStr:"years",
    genderLabel:"Gender ★",
    genders:["Male","Female","Other","NSD"],
    mobileLabel:"Mobile Number (10 digits)",
    emailLabel:"Email (optional)",
    eduLabel:"Highest Education",
    edu:["No formal education","Primary (Std 1–5)","Secondary (Std 6–10)","Higher Secondary (Std 11–12)","Graduate","Post-Graduate","Doctorate","Other"],
    occLabel:"Occupation (optional)",
    refLabel:"How did you come here?",
    ref:["OPD / Walk-in","Referred by physician","Referred by school","Self-referred","Research study","Community screening","Other"],
    assessorLabel:"Assessor / Clinician Name",
    notesLabel:"Chief Complaint / Notes (optional)",
    uidLabel:"Anonymous UID", fileNoDisplay:"FileNo",
    privacyNote:"Your name and contact are used only to generate your UID. Only the anonymous UID is stored in research records.",
    proceedBtn:"Proceed to Assessment →",
    selfBtn:"Self-Assessment", selfSub:"For literate, tech-savvy individuals",
    clinBtn:"Clinician-Assisted Mode", clinSub:"Examiner reads aloud · Any literacy level",
  },
  hi: {
    langTitle:"भाषा चुनें", langSub:"वह भाषा चुनें जिसमें आप सबसे सहज हों",
    langEn:"English", langHi:"हिंदी", langMr:"मराठी",
    regTitle:"रोगी पंजीकरण", regSub:"CIBS-VALID · शुरू करने से पहले अपना विवरण भरें",
    fileNoLabel:"पंजीकरण संख्या (FileNo) ★",
    fileNoPrefilled:"CIBS द्वारा पूर्व-भरा गया — सभी परीक्षणों में आपके रिकॉर्ड जोड़ता है",
    fileNoHint:"खाली छोड़ें — एक अद्वितीय संख्या स्वतः बनाई जाएगी",
    nameLabel:"पूरा नाम (वैकल्पिक — गुमनाम रहने के लिए खाली छोड़ें)",
    dobLabel:"जन्म तिथि ★", ageStr:"आयु", yearsStr:"वर्ष",
    genderLabel:"लिंग ★",
    genders:["पुरुष","महिला","अन्य","बताना नहीं"],
    mobileLabel:"मोबाइल नंबर (10 अंक)",
    emailLabel:"ईमेल (वैकल्पिक)",
    eduLabel:"उच्चतम शिक्षा",
    edu:["कोई औपचारिक शिक्षा नहीं","प्राथमिक (कक्षा 1–5)","माध्यमिक (कक्षा 6–10)","उच्च माध्यमिक (कक्षा 11–12)","स्नातक","स्नातकोत्तर","डॉक्टरेट","अन्य"],
    occLabel:"व्यवसाय (वैकल्पिक)",
    refLabel:"आप यहाँ कैसे आए?",
    ref:["OPD / Walk-in","चिकित्सक द्वारा रेफर","विद्यालय द्वारा रेफर","स्वयं रेफर","शोध अध्ययन","सामुदायिक जांच","अन्य"],
    assessorLabel:"परीक्षक / चिकित्सक का नाम",
    notesLabel:"मुख्य शिकायत / नोट्स (वैकल्पिक)",
    uidLabel:"अनाम UID", fileNoDisplay:"FileNo",
    privacyNote:"आपका नाम और संपर्क केवल UID बनाने के लिए उपयोग किए जाते हैं। शोध रिकॉर्ड में केवल अनाम UID संग्रहीत है।",
    proceedBtn:"मूल्यांकन शुरू करें →",
    selfBtn:"स्व-मूल्यांकन", selfSub:"साक्षर, तकनीक-जानकार व्यक्तियों के लिए",
    clinBtn:"चिकित्सक-सहायता मोड", clinSub:"परीक्षक जोर से पढ़ता है · कोई भी साक्षरता स्तर",
  },
  mr: {
    langTitle:"भाषा निवडा", langSub:"तुम्हाला सर्वात सोयीस्कर असलेली भाषा निवडा",
    langEn:"English", langHi:"हिंदी", langMr:"मराठी",
    regTitle:"रुग्ण नोंदणी", regSub:"CIBS-VALID · सुरू करण्यापूर्वी आपला तपशील भरा",
    fileNoLabel:"नोंदणी क्रमांक (FileNo) ★",
    fileNoPrefilled:"CIBS द्वारे पूर्व-भरलेले — सर्व चाचण्यांमध्ये तुमचे रेकॉर्ड जोडते",
    fileNoHint:"रिकामे सोडा — एक अद्वितीय क्रमांक आपोआप तयार होईल",
    nameLabel:"पूर्ण नाव (पर्यायी — अज्ञात राहण्यासाठी रिकामे सोडा)",
    dobLabel:"जन्मतारीख ★", ageStr:"वय", yearsStr:"वर्षे",
    genderLabel:"लिंग ★",
    genders:["पुरुष","स्त्री","इतर","सांगायचे नाही"],
    mobileLabel:"मोबाइल नंबर (10 अंक)",
    emailLabel:"ईमेल (पर्यायी)",
    eduLabel:"सर्वोच्च शिक्षण",
    edu:["कोणतेही औपचारिक शिक्षण नाही","प्राथमिक (इयत्ता 1–5)","माध्यमिक (इयत्ता 6–10)","उच्च माध्यमिक (इयत्ता 11–12)","पदवी","पदव्युत्तर","डॉक्टरेट","इतर"],
    occLabel:"व्यवसाय (पर्यायी)",
    refLabel:"तुम्ही येथे कसे आलात?",
    ref:["OPD / Walk-in","वैद्यांनी संदर्भित","शाळेने संदर्भित","स्वतः संदर्भित","संशोधन अभ्यास","सामुदायिक तपासणी","इतर"],
    assessorLabel:"परीक्षक / वैद्यांचे नाव",
    notesLabel:"मुख्य तक्रार / नोट्स (पर्यायी)",
    uidLabel:"अनामिक UID", fileNoDisplay:"FileNo",
    privacyNote:"तुमचे नाव आणि संपर्क फक्त UID तयार करण्यासाठी वापरले जातात. संशोधन नोंदींमध्ये फक्त अनामिक UID साठवला जातो.",
    proceedBtn:"मूल्यांकन सुरू करा →",
    selfBtn:"स्व-मूल्यांकन", selfSub:"साक्षर, तंत्रज्ञान-जाणकार व्यक्तींसाठी",
    clinBtn:"वैद्य-सहाय्यित मोड", clinSub:"परीक्षक मोठ्याने वाचतो · कोणतीही साक्षरता पातळी",
  },
};

// ════ LANGUAGE SCREEN ════════════════════════════════════════════════════════
const LanguageScreen = ({ onSelect }) => (
  <div className="min-h-screen flex flex-col items-center justify-center p-6"
    style={{background:"linear-gradient(160deg,#0F1E30,#1A2E4A)"}}>
    <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-6"
      style={{background:"rgba(139,92,246,0.2)",border:"1px solid rgba(139,92,246,0.4)"}}>📋</div>
    <h1 className="text-2xl font-black text-white mb-1">CIBS-VALID</h1>
    <p className="text-purple-400 text-xs mb-8 text-center">Central Institute of Behavioural Sciences · Nagpur</p>
    <div className="w-full max-w-xs space-y-3">
      {[["en","English","Continue in English"],["hi","हिंदी","हिंदी में जारी रखें"],["mr","मराठी","मराठीत सुरू ठेवा"]].map(([code,label,sub])=>(
        <button key={code} onClick={()=>onSelect(code)}
          className="w-full py-4 rounded-2xl font-black text-white text-base transition-all active:scale-97"
          style={{background:"rgba(139,92,246,0.25)",border:"1.5px solid rgba(139,92,246,0.5)"}}>
          {label}
          <span className="block text-purple-300 text-xs font-normal mt-0.5">{sub}</span>
        </button>
      ))}
    </div>
  </div>
);

// ════ WELCOME SCREEN ════════════════════════════════════════════════════════
const Welcome = ({ onSelf, onClinician })=> (
  <div className="min-h-screen flex flex-col" style={{
    background: "linear-gradient(160deg, #0F1E30 0%, #1A2E4A 50%, #0F1E30 100%)"
  }}>
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
      {/* Branding */}
      <div className="relative mb-8">
        <div className="w-20 h-20 rounded-3xl mx-auto flex items-center justify-center mb-4 shadow-2xl"
          style={{ background: "rgba(139,92,246,0.25)", border: "1px solid rgba(139,92,246,0.5)" }}>
          <span className="text-4xl">📋</span>
        </div>
        <div className="absolute -top-1 -right-8 w-6 h-6 rounded-full bg-green-400 animate-pulse opacity-75"/>
      </div>

      <h1 className="text-4xl font-black text-white mb-1 tracking-tight">CIBS-VALID</h1>
      <p className="text-purple-300 font-semibold mb-1 text-sm">
        Validation & Assessment of Longitudinal Instrument Diagnostics
      </p>
      <p className="text-purple-500 text-xs mb-8">
        Central Institute of Behavioural Sciences · Nagpur · v 1.0
      </p>

      {/* Domain chips */}
      <div className="flex flex-wrap gap-2 justify-center mb-8 max-w-xs">
        {[
          { d:"D1", label:"Cognition",   color:"#3B82F6" },
          { d:"D2", label:"Personality", color:"#8B5CF6" },
          { d:"D3", label:"Health",      color:"#10B981" },
          { d:"D4", label:"Depression",  color:"#F59E0B" },
          { d:"D5", label:"Risk",        color:"#EF4444" },
        ].map(x => (
          <span key={x.d} className="px-3 py-1 rounded-full text-xs font-bold"
            style={{ background: x.color + "25", color: x.color, border: `1px solid ${x.color}44` }}>
            {x.d} · {x.label}
          </span>
        ))}
      </div>

      <p className="text-purple-400 text-xs mb-8">
        5 domains · ~58 items · 20–25 minutes
      </p>

      {/* Mode selection */}
      <div className="w-full max-w-sm space-y-3">
        <button onClick={onSelf}
          className="w-full py-4 rounded-2xl font-black text-white text-base shadow-lg transition-all active:scale-98"
          style={{ background: "linear-gradient(135deg, #8B5CF6, #6D28D9)" }}>
          Self-Assessment
          <span className="block text-purple-200 text-xs font-normal mt-0.5">For literate, tech-savvy individuals</span>
        </button>
        <button onClick={onClinician}
          className="w-full py-4 rounded-2xl font-black text-white text-base shadow-lg"
          style={{ background: "linear-gradient(135deg, #1D4ED8, #1A2E4A)" }}>
          Clinician-Assisted Mode
          <span className="block text-blue-200 text-xs font-normal mt-0.5">Examiner reads aloud · Any literacy level</span>
        </button>
      </div>
    </div>
    <p className="text-center text-purple-600 text-xs pb-4 px-4">
      PI: Dr Shailesh V. Pangaonkar · CIBS Nagpur · +91 9423105228
    </p>
  </div>
);

// ════ ELIGIBILITY (3-step) ════════════════════════════════════════════════
const Eligibility = ({ onResult }) => {
  const [step, setStep] = useState(0);
  const [results, setResults] = useState([]);

  const pass = (ok) => {
    const nr = [...results, ok];
    setResults(nr);
    if (step < 2) setTimeout(() => setStep(s => s + 1), 350);
    else {
      const allPass = nr.every(Boolean);
      setTimeout(() => onResult(allPass ? "self" : "assisted"), 500);
    }
  };

  const steps = [
    {
      inst: "Tap the CIRCLE",
      items: [
        { id:"circle",   label:"Circle",   render: <svg width={56} height={56} viewBox="0 0 56 56"><circle cx={28} cy={28} r={22} fill="#6B7280"/></svg> },
        { id:"triangle", label:"Triangle", render: <svg width={56} height={56} viewBox="0 0 56 56"><polygon points="28,6 50,50 6,50" fill="#6B7280"/></svg> },
        { id:"square",   label:"Square",   render: <svg width={56} height={56} viewBox="0 0 56 56"><rect x={6} y={6} width={44} height={44} fill="#6B7280"/></svg> },
      ],
      ans: "circle",
    },
    {
      inst: "Tap the HAPPY face",
      items: [
        { id:"happy",   label:"Happy",   render: <HappyFace/> },
        { id:"neutral", label:"Neutral", render: <NeutralFace/> },
        { id:"sad",     label:"Sad",     render: <SadFace/> },
      ],
      ans: "happy",
    },
    {
      inst: "Tap RED first, then the SQUARE",
      twoStep: true,
    },
  ];

  if (step < 2) {
    const s = steps[step];
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="bg-white border-b px-4 py-3">
          <p className="text-xs text-center text-gray-400 mb-2">Orientation Check — Step {step+1} of 3</p>
          <div className="flex gap-1.5">
            {[0,1,2].map(i => (
              <div key={i} className="flex-1 h-2 rounded-full"
                style={{ background: i < step ? "#10B981" : i === step ? "#8B5CF6" : "#E5E7EB" }}/>
            ))}
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="w-full max-w-sm">
            <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 text-center mb-8">
              <p className="text-xl font-black text-purple-800">{s.inst}</p>
            </div>
            <div className="flex justify-around">
              {s.items.map(item => (
                <button key={item.id} onClick={() => pass(item.id === s.ans)}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-gray-200 bg-white active:scale-95 transition-all">
                  {item.render}
                  <span className="text-xs text-gray-500">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 3: Two-step task
  return <TwoStepTask onDone={(ok) => pass(ok)} stepIndex={step} totalSteps={3}/>;
};

// Inline face SVGs
const HappyFace = () => (
  <svg width={56} height={56} viewBox="0 0 56 56">
    <circle cx={28} cy={28} r={24} fill="#FDE047"/>
    <ellipse cx={20} cy={24} rx={3} ry={3} fill="#1F2937"/>
    <ellipse cx={36} cy={24} rx={3} ry={3} fill="#1F2937"/>
    <path d="M18 34 Q28 44 38 34" stroke="#1F2937" strokeWidth={2.5} fill="none" strokeLinecap="round"/>
  </svg>
);
const NeutralFace = () => (
  <svg width={56} height={56} viewBox="0 0 56 56">
    <circle cx={28} cy={28} r={24} fill="#D1D5DB"/>
    <ellipse cx={20} cy={24} rx={3} ry={3} fill="#1F2937"/>
    <ellipse cx={36} cy={24} rx={3} ry={3} fill="#1F2937"/>
    <line x1={19} y1={36} x2={37} y2={36} stroke="#1F2937" strokeWidth={2.5} strokeLinecap="round"/>
  </svg>
);
const SadFace = () => (
  <svg width={56} height={56} viewBox="0 0 56 56">
    <circle cx={28} cy={28} r={24} fill="#BFDBFE"/>
    <ellipse cx={20} cy={24} rx={3} ry={3} fill="#1F2937"/>
    <ellipse cx={36} cy={24} rx={3} ry={3} fill="#1F2937"/>
    <path d="M18 40 Q28 30 38 40" stroke="#1F2937" strokeWidth={2.5} fill="none" strokeLinecap="round"/>
  </svg>
);

const TwoStepTask = ({ onDone, stepIndex, totalSteps }) => {
  const [seq, setSeq] = useState([]);
  const items = [
    { id:"rc", isRed:true,  isSquare:false, label:"Red Circle",     shape:"circle", fill:"#EF4444" },
    { id:"bs", isRed:false, isSquare:true,  label:"Blue Square",    shape:"square",  fill:"#3B82F6" },
    { id:"gt", isRed:false, isSquare:false, label:"Green Triangle", shape:"triangle",fill:"#22C55E" },
    { id:"ys", isRed:false, isSquare:true,  label:"Yellow Square",  shape:"square",  fill:"#EAB308" },
  ];
  const ShapeEl = ({ shape, fill }) => (
    <svg width={48} height={48} viewBox="0 0 48 48">
      {shape==="circle"   && <circle cx={24} cy={24} r={20} fill={fill}/>}
      {shape==="square"   && <rect x={4} y={4} width={40} height={40} fill={fill}/>}
      {shape==="triangle" && <polygon points="24,4 44,44 4,44" fill={fill}/>}
    </svg>
  );
  const tap = (item) => {
    if (seq.find(s=>s.id===item.id)) return;
    const ns = [...seq, item];
    setSeq(ns);
    if (ns.length===2) {
      const ok = ns[0].isRed && ns[1].isSquare;
      setTimeout(() => onDone(ok), 400);
    }
  };
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-white border-b px-4 py-3">
        <p className="text-xs text-center text-gray-400 mb-2">Orientation Check — Step {stepIndex+1} of {totalSteps}</p>
        <div className="flex gap-1.5">
          {Array.from({length:totalSteps}).map((_,i) => (
            <div key={i} className="flex-1 h-2 rounded-full"
              style={{ background: i < stepIndex ? "#10B981" : i===stepIndex ? "#8B5CF6" : "#E5E7EB" }}/>
          ))}
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 text-center mb-6">
            <p className="text-xl font-black text-purple-800">Tap RED first, then the SQUARE</p>
            <p className="text-sm text-purple-500 mt-1">
              {seq.length===0 ? "Touch any red item →" : seq.length===1 ? "Now touch any square →" : ""}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {items.map(item => {
              const idx = seq.findIndex(s=>s.id===item.id);
              return (
                <button key={item.id} onClick={()=>tap(item)} disabled={idx!==-1}
                  className={cx("flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all",
                    idx!==-1 ? "border-green-400 bg-green-50" : "border-gray-200 bg-white active:scale-95")}>
                  <ShapeEl shape={item.shape} fill={item.fill}/>
                  <span className="text-xs text-gray-500">{item.label}</span>
                  {idx!==-1 && <span className="text-xs font-bold text-green-600">Step {idx+1} ✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

// ════ CONSENT ════════════════════════════════════════════════════════════════
const Consent = ({ mode, onConsent }) => {
  const [ticked, setTicked] = useState({});
  const stmts = [
    "I confirm that this form has been read to me (or I have read it myself) in a language I understand.",
    "I understand that my participation is entirely voluntary and I can stop at any time without any consequence.",
    "I understand that no personal identifiers will be stored in the database — only an anonymous UID.",
    "I understand that anonymised group data may be used in scientific publications and I will not be identifiable.",
    "I agree to complete the CIBS-VALID assessment battery today and receive a personalised report.",
    "I understand that if any elevated risk is identified, I may be offered — but am not obliged to accept — further support.",
  ];
  const allTicked = stmts.every((_, i) => ticked[i]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-4 py-3 sticky top-0 z-10">
        <p className="text-xs font-black text-center text-gray-700">Informed Consent</p>
        <p className="text-xs text-center text-gray-400">
          {mode==="self" ? "Self-Administration" : "Clinician-Assisted Mode"}
        </p>
      </div>
      <div className="p-4 max-w-sm mx-auto space-y-4 pb-8">
        <div className="rounded-2xl p-4" style={{ background:"#EFF6FF", border:"1.5px solid #BFDBFE" }}>
          <p className="text-xs font-bold text-blue-700 mb-1">Ethics Approval Note</p>
          <p className="text-xs text-blue-800">
            This study has been submitted to the Ethics Committee of Dr Rinki Rughwani Children Hospital,
            Nagpur. EC reference and date will be inserted on formal approval. For any concern about
            participant rights, contact the EC directly at the hospital.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <p className="text-sm font-bold text-gray-800 mb-2">About This Assessment</p>
          <p className="text-xs text-gray-600 leading-relaxed">
            CIBS-VALID is a multi-domain mental health assessment battery developed by
            Central Institute of Behavioural Sciences (CIBS), Nagpur. It consists of
            5 validated domains covering cognitive function, personality, physical and
            mental health, depression screening, and risk factor profiling.
            <br/><br/>
            <strong>Duration:</strong> ~20–25 minutes. &nbsp;
            <strong>Format:</strong> Multiple-choice questions only.&nbsp;
            <strong>No physical procedures.</strong>
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <p className="text-sm font-bold text-gray-800 mb-3">Please confirm each statement:</p>
          <div className="space-y-3">
            {stmts.map((s, i) => (
              <label key={i} className="flex items-start gap-3 cursor-pointer"
                onClick={() => setTicked(t => ({ ...t, [i]: !t[i] }))}>
                <div className={cx(
                  "mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
                  ticked[i] ? "bg-purple-600 border-purple-600" : "border-gray-300"
                )}>
                  {ticked[i] && <span className="text-white text-xs font-bold">✓</span>}
                </div>
                <p className="text-xs text-gray-600 leading-relaxed select-none">{s}</p>
              </label>
            ))}
          </div>
        </div>

        {mode==="assisted" && (
          <div className="rounded-2xl p-3" style={{ background:"#FFFBEB", border:"1.5px solid #FCD34D" }}>
            <p className="text-xs text-amber-800">
              <strong>Examiner note:</strong> Please read all questions aloud. Record responses on the participant's behalf.
              Verbal consent has been obtained and noted in the examiner log.
            </p>
          </div>
        )}

        <button onClick={onConsent} disabled={!allTicked}
          className="w-full py-4 rounded-2xl font-black text-white text-base disabled:opacity-40"
          style={{ background: allTicked ? "linear-gradient(135deg,#8B5CF6,#6D28D9)" : "#9CA3AF" }}>
          I Consent — Begin CIBS-VALID →
        </button>
      </div>
    </div>
  );
};

// ════ DOMAIN NAVIGATOR ═══════════════════════════════════════════════════════
const DOMAIN_META = [
  { id:1, code:"D1", name:"Cognition",   color:"#3B82F6", bg:"#EFF6FF", icon:"🧩", count:22 },
  { id:2, code:"D2", name:"Personality", color:"#8B5CF6", bg:"#F5F3FF", icon:"🪞", count:10 },
  { id:3, code:"D3", name:"Health",      color:"#10B981", bg:"#F0FDF4", icon:"💚", count:17 },
  { id:4, code:"D4", name:"Risk",        color:"#EF4444", bg:"#FEF2F2", icon:"🛡", count:11 },
];

// ════ ASSESSMENT CONTAINER ════════════════════════════════════════════════════
const Assessment = ({ mode, onComplete }) => {
  const [domain, setDomain] = useState(1);
  const [resp, setResp] = useState({ d1:{}, d2:{}, d3:{}, d4:{} });
  const scrollRef = useRef(null);

  const set = (d, k, v) => setResp(r => ({ ...r, [`d${d}`]: { ...r[`d${d}`], [k]: v } }));
  const answered = (d) => {
    if (d === 1) return Object.keys(resp.d1).filter(k=>!k.startsWith('_')).length;
    if (d === 4) {
      const r = resp.d4;
      const audSkip = r.aud1 === 0;
      const cssCount = Object.keys(r).filter(k=>k.startsWith('css')).length;
      const audCount = audSkip ? (r.aud1 !== undefined ? 1 : 0) : Object.keys(r).filter(k=>k.startsWith('aud')).length;
      const sdqCount = Object.keys(r).filter(k=>k.startsWith('sdq')).length;
      return cssCount + audCount + sdqCount;
    }
    return Object.keys(resp[`d${d}`]).length;
  };
  const complete = (d) => {
    if (d === 1) {
      // Primary: CAT finished cleanly
      if (resp.d1._done === 1) return true;
      // Fallback: CAT has at least 6 answers (enough for scoring) and user is past D1
      const catAnswers = Object.keys(resp.d1).filter(k => !k.startsWith('_')).length;
      return catAnswers >= 6 && domain > 1;
    }
    if (d === 4) {
      const r = resp.d4;
      const cssCount = Object.keys(r).filter(k => k.startsWith('css')).length;
      const sdqCount = Object.keys(r).filter(k => k.startsWith('sdq')).length;
      const audNever = r.aud1 === 0; // "Never" — Q2+Q3 auto-skipped
      const audCount = audNever
        ? (r.aud1 !== undefined ? 1 : 0)
        : Object.keys(r).filter(k => k.startsWith('aud')).length;
      const required = 5 + (audNever ? 1 : 3) + 5;
      return (cssCount + audCount + sdqCount) >= required;
    }
    return Object.keys(resp[`d${d}`]).length >= DOMAIN_META[d-1].count;
  };
  const pct = () => {
    const total = DOMAIN_META.reduce((s,m)=>s+m.count,0);
    const done  = DOMAIN_META.reduce((s,m)=>s+answered(m.id),0);
    return Math.round(done/total*100);
  };
  const allDone = DOMAIN_META.every(m => complete(m.id));
  const cd = DOMAIN_META[domain-1];

  const nextDomain = () => {
    if (domain < 4) { setDomain(d=>d+1); scrollRef.current?.scrollTo(0,0); }
    else onComplete(resp);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Sticky header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-20">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-black text-purple-600">CIBS-VALID</span>
          <span className="text-xs text-gray-400">{pct()}% complete</span>
        </div>
        {/* Domain tabs */}
        <div className="flex gap-1">
          {DOMAIN_META.map(m => (
            <button key={m.id} onClick={()=>{ setDomain(m.id); scrollRef.current?.scrollTo(0,0); }}
              className="flex-1 h-2 rounded-full transition-all"
              style={{ background: complete(m.id)?"#10B981": m.id===domain? m.color:"#E5E7EB" }}/>
          ))}
        </div>
        <div className="flex mt-1">
          {DOMAIN_META.map(m => (
            <button key={m.id} onClick={()=>{ setDomain(m.id); scrollRef.current?.scrollTo(0,0); }}
              className="flex-1 text-center text-xs py-0.5 font-bold transition-all"
              style={{ color: complete(m.id)?"#10B981": m.id===domain? m.color:"#CBD5E1" }}>
              {complete(m.id) ? "✓" : m.code}
            </button>
          ))}
        </div>
      </div>

      {/* Domain pill */}
      <div className="px-4 pt-3 pb-1 max-w-sm mx-auto w-full">
        <div className="flex items-center gap-2 rounded-xl px-3 py-2"
          style={{ background: cd.bg, border:`1px solid ${cd.color}33` }}>
          <span>{cd.icon}</span>
          <div>
            <p className="text-xs font-black" style={{ color:cd.color }}>{cd.code} · {cd.name}</p>
            <p className="text-xs text-gray-400">
            {domain===1
              ? (resp.d1._done ? "Cognitive test complete ✓" : "Adaptive assessment in progress")
              : `${answered(domain)}/${cd.count} answered`}
          </p>
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-2 max-w-sm mx-auto w-full">
        {domain===1 && <DomainCognition set={(k,v)=>set(1,k,v)} color={cd.color} bg={cd.bg}/>}
        {domain===2 && <DomainPersonality resp={resp.d2} set={(k,v)=>set(2,k,v)} color={cd.color} bg={cd.bg}/>}
        {domain===3 && <DomainHealth resp={resp.d3} set={(k,v)=>set(3,k,v)} color={cd.color} bg={cd.bg}/>}
        {domain===4 && <DomainRisk resp={resp.d4} set={(k,v)=>set(4,k,v)} color={cd.color} bg={cd.bg} mode={mode}/>}

        <div className="pt-4 pb-8 space-y-3">

          {/* Per-domain unanswered warning */}
          {!complete(domain) && domain !== 1 && (
            <div className="rounded-2xl p-4" style={{background:"#FEF2F2",border:"1.5px solid #FECACA"}}>
              <p className="text-xs font-black text-red-600 mb-1">
                ⚠️ {cd.count - answered(domain)} question{cd.count - answered(domain) !== 1 ? "s" : ""} still unanswered in {cd.name}
              </p>
              <p className="text-xs text-red-500">Scroll up — every question with an empty border still needs an answer.</p>
            </div>
          )}

          {/* Continue to next domain */}
          {complete(domain) && domain < 4 && (
            <button onClick={nextDomain}
              className="w-full py-4 rounded-2xl font-black text-white text-sm"
              style={{background:`linear-gradient(135deg,${cd.color},${cd.color}cc)`}}>
              Continue → {DOMAIN_META[domain].name}
            </button>
          )}

          {/* Domain 4 — always show full progress checklist */}
          {domain === 4 && (
            <div className="rounded-2xl p-4 space-y-2" style={{background:"#F8FAFF",border:"1.5px solid #E0E7FF"}}>
              <p className="text-xs font-black text-indigo-700 mb-2">📋 Completion checklist</p>
              {DOMAIN_META.map(m => {
                const done = complete(m.id);
                return (
                  <div key={m.id} className="flex items-center justify-between py-0.5">
                    <span className="text-xs font-semibold" style={{color: done ? "#10B981" : "#EF4444"}}>
                      {done ? "✓" : "○"} {m.name}
                    </span>
                    {!done
                      ? <button onClick={() => { setDomain(m.id); scrollRef.current?.scrollTo(0,0); }}
                          className="text-xs px-3 py-1 rounded-lg font-bold text-white"
                          style={{background: m.color}}>
                          Go to {m.code} →
                        </button>
                      : <span className="text-xs font-bold" style={{color:"#10B981"}}>Done ✓</span>
                    }
                  </div>
                );
              })}
            </div>
          )}

          {/* Generate Report — only when every domain is complete */}
          {domain === 4 && allDone && (
            <button onClick={() => onComplete(resp)}
              className="w-full py-4 rounded-2xl font-black text-white text-base"
              style={{background:"linear-gradient(135deg,#10B981,#059669)",boxShadow:"0 4px 24px #10B98155"}}>
              ✅ Generate My Report
            </button>
          )}

        </div>
      </div>
    </div>
  );
};

// ════ DOMAIN 1 — COGNITION (Adaptive CAT Engine) ══════════════════════════════
const BAND_LABELS = {
  1:"Foundation Level", 2:"Standard Level", 3:"Advanced Level", 4:"Exceptional Level"
};
const BAND_TRANSITIONS = {
  1:"Great start! The patterns are about to get more interesting.",
  2:"Excellent work! You're ready for more complex reasoning challenges.",
  3:"Outstanding! You've reached our most advanced questions.",
};
const BAND_COLORS = { 1:"#3B82F6", 2:"#8B5CF6", 3:"#F59E0B", 4:"#EF4444" };
const BAND_ICONS  = { 1:"🔵", 2:"🟣", 3:"🟡", 4:"🔴" };

const DomainCognition = ({ set, color, bg }) => {
  const [phase, setPhase]     = useState('intro');      // intro | testing | transition | done
  const [band, setBand]       = useState(1);
  const [qIdx, setQIdx]       = useState(0);
  const [selected, setSelected] = useState(null);       // index of chosen option, for highlight
  const [bandCorrect, setBandCorrect] = useState({1:0,2:0,3:0,4:0});
  const [transMsg, setTransMsg] = useState('');
  const [totalQ, setTotalQ]   = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [finalBand, setFinalBand] = useState(null);

  const items   = RAVENS_CAT[band] || [];
  const item    = items[qIdx];
  const bColor  = BAND_COLORS[band];
  const qNumber = Object.values(RAVENS_CAT).slice(0,band-1).flat().length + qIdx + 1;

  const finish = useCallback((fBand, bCorrect, tQ, tC) => {
    // Store everything into parent resp.d1
    set('_done', 1);
    set('_band', fBand);
    set('_b1', bCorrect[1]);
    set('_b2', bCorrect[2]);
    set('_b3', bCorrect[3]);
    set('_b4', bCorrect[4]);
    set('_correct', tC);
    set('_total', tQ);
    setFinalBand(fBand);
    setPhase('done');
  }, [set]);

  const handleAnswer = useCallback((optIdx) => {
    if (selected !== null || phase !== 'testing') return;
    setSelected(optIdx);

    // Check against shuffled correct position
    const { newCorrectIdx: correctPos } = shuffleOptions(item.options, item.ans, item.id);
    const isCorrect = optIdx === correctPos;
    set(item.id, optIdx); // store in parent

    const newBandCorrect = { ...bandCorrect, [band]: bandCorrect[band] + (isCorrect?1:0) };
    const newTotalQ      = totalQ + 1;
    const newTotalC      = totalCorrect + (isCorrect?1:0);

    setBandCorrect(newBandCorrect);
    setTotalQ(newTotalQ);
    setTotalCorrect(newTotalC);

    setTimeout(() => {
      const nextQIdx = qIdx + 1;

      if (nextQIdx < items.length) {
        // More questions remain in this band — advance
        setQIdx(nextQIdx);
        setSelected(null);
      } else {
        // Band complete — check pass/fail
        const bc = newBandCorrect[band];
        const passed = bc >= CAT_RULES[band].passThreshold;

        if (passed && band < 4) {
          // Advance to next band — show transition screen
          setTransMsg(BAND_TRANSITIONS[band]);
          setPhase('transition');
          setTimeout(() => {
            setBand(b => b+1);
            setQIdx(0);
            setSelected(null);
            setPhase('testing');
          }, 2200);
        } else {
          // Test complete
          finish(band, newBandCorrect, newTotalQ, newTotalC);
        }
      }
    }, 650);
  }, [selected, phase, item, band, qIdx, items, bandCorrect, totalQ, totalCorrect, finish, set]);

  // ── INTRO SCREEN ───────────────────────────────────────────────────────────
  if (phase === 'intro') return (
    <div className="space-y-4">
      <div className="rounded-2xl p-5" style={{ background:bg, border:`1.5px solid ${color}44` }}>
        <p className="text-sm font-black mb-1" style={{color}}>🧩 Cognitive Pattern Completion</p>
        <p className="text-sm text-gray-700 leading-relaxed">
          You will see a series of visual patterns — shapes, dots, arrows, and grids.
          Each pattern has an empty space. <strong>Tap the picture that best completes the pattern.</strong>
        </p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
        {[
          ["🕐","Take your time","There is no time limit. Think carefully before tapping."],
          ["🔍","Look at the whole pattern","Consider rows, columns, and any rules that repeat."],
          ["✅","Tap to confirm","Once you tap an answer the next pattern appears automatically."],
        ].map(([icon,head,sub])=>(
          <div key={head} className="flex items-start gap-3">
            <span className="text-xl flex-shrink-0">{icon}</span>
            <div><p className="text-sm font-bold text-gray-800">{head}</p>
              <p className="text-xs text-gray-500">{sub}</p></div>
          </div>
        ))}
      </div>
      <button onClick={()=>setPhase('testing')}
        className="w-full py-4 rounded-2xl font-black text-white text-base"
        style={{background:`linear-gradient(135deg,${color},${color}cc)`}}>
        Begin Pattern Test →
      </button>
    </div>
  );

  // ── BAND TRANSITION SCREEN ─────────────────────────────────────────────────
  if (phase === 'transition') return (
    <div className="flex flex-col items-center justify-center py-12 px-4 space-y-5">
      <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl"
        style={{background:BAND_COLORS[band+1]+"18",border:`3px solid ${BAND_COLORS[band+1]}44`}}>
        ✨
      </div>
      <p className="text-xl font-black text-gray-800 text-center">Well done!</p>
      <p className="text-sm text-gray-600 text-center leading-relaxed max-w-xs">{transMsg}</p>
      <div className="flex gap-2 mt-2">
        {[1,2,3,4].map(b=>(
          <div key={b} className="w-3 h-3 rounded-full transition-all"
            style={{background: b<=band ? BAND_COLORS[b] : "#E5E7EB"}}/>
        ))}
      </div>
      <p className="text-xs text-gray-400">Next challenge loading…</p>
    </div>
  );

  // ── DONE SCREEN ────────────────────────────────────────────────────────────
  if (phase === 'done') {
    const result = scoreCAT({ _band:finalBand,
      _b1:bandCorrect[1],_b2:bandCorrect[2],_b3:bandCorrect[3],_b4:bandCorrect[4] });
    return (
      <div className="space-y-4">
        <div className="rounded-2xl p-5 text-center"
          style={{background:`linear-gradient(135deg,${color}12,${color}06)`,border:`2px solid ${color}33`}}>
          <p className="text-3xl mb-1">🎯</p>
          <p className="text-lg font-black text-gray-800 mb-0.5">Pattern Test Complete</p>
          <p className="text-sm text-gray-500">{totalQ} question{totalQ!==1?'s':''} answered across {finalBand} level{finalBand!==1?'s':''}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            {label:"Estimated CQ", val:`~${result.iq}`, color:"#3B82F6"},
            {label:"Classification", val:result.label, color:BAND_COLORS[finalBand]},
          ].map(item=>(
            <div key={item.label} className="bg-white rounded-2xl border border-gray-200 p-3 text-center">
              <p className="text-base font-black" style={{color:item.color}}>{item.val}</p>
              <p className="text-xs text-gray-400">{item.label}</p>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-xs font-black text-gray-500 uppercase tracking-wider mb-3">Band-by-Band Progress</p>
          {[1,2,3,4].map(b=>{
            const reached = b <= finalBand;
            const bc = bandCorrect[b];
            const bt = RAVENS_CAT[b].length;
            return (
              <div key={b} className="flex items-center gap-3 mb-2">
                <span className="text-base w-6">{reached?BAND_ICONS[b]:'⬜'}</span>
                <div className="flex-1">
                  <p className="text-xs font-bold text-gray-700">{BAND_LABELS[b]}</p>
                  <p className="text-xs text-gray-400">IQ {CAT_RULES[b].iqBase}–{CAT_RULES[b].iqBase+CAT_RULES[b].range}</p>
                </div>
                <span className="text-sm font-black" style={{color:reached?BAND_COLORS[b]:"#D1D5DB"}}>
                  {reached ? `${bc}/${bt}` : '—'}
                </span>
              </div>
            );
          })}
        </div>
        <div className="rounded-xl p-3 text-xs text-center text-gray-400"
          style={{background:"#F8FAFC",border:"1px solid #E2E8F0"}}>
          Tap <strong>"Continue → Personality"</strong> below to proceed
        </div>
      </div>
    );
  }

  // ── ACTIVE TEST SCREEN ─────────────────────────────────────────────────────
  const bandTotal = items.length;
  const bandPct   = Math.round((qIdx / bandTotal) * 100);
  const val       = selected;

  // Shuffle options deterministically for this question
  const { shuffled: shuffledOpts, newCorrectIdx } = shuffleOptions(
    item.options, item.ans, item.id
  );

  return (
    <div className="space-y-4">
      {/* Band indicator + question counter */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm">{BAND_ICONS[band]}</span>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{background:bColor+"15",color:bColor}}>{BAND_LABELS[band]}</span>
        </div>
        <span className="text-xs font-bold text-gray-400">Question {qNumber}</span>
      </div>

      {/* Active question card */}
      <div className="bg-white rounded-2xl border-2 p-4 shadow-sm"
        style={{borderColor:bColor+"44"}}>
        {/* Item header */}
        <div className="flex items-center gap-2 mb-3">
          <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white flex-shrink-0"
            style={{background:bColor}}>{qNumber}</span>
          <div>
            <p className="text-sm font-bold text-gray-800">{item.title}</p>
            <p className="text-xs text-gray-400">{item.instruction}</p>
          </div>
        </div>

        {/* Stimulus */}
        <div className="rounded-2xl overflow-hidden bg-slate-50 border border-slate-200 mb-4 flex items-center justify-center py-3">
          {item.renderStimulus()}
        </div>

        {/* 2×2 option grid — options shuffled per question */}
        <div className="grid grid-cols-2 gap-2.5">
          {shuffledOpts.map((opt, i) => (
            <button key={i} onClick={() => handleAnswer(i)}
              disabled={val !== null}
              className={cx(
                "flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl border-2 transition-all active:scale-95",
                val === i
                  ? "shadow-md scale-105"
                  : val !== null
                  ? "opacity-40 border-gray-200 bg-white"
                  : "border-gray-200 bg-white hover:border-blue-200"
              )}
              style={val===i ? {borderColor:bColor, background:bColor+"15"} : {}}>
              <div className="flex items-center justify-center h-14">
                {opt.render(52)}
              </div>
              <span className="text-xs font-semibold"
                style={{color: val===i ? bColor : "#9CA3AF"}}>{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Band progress bar */}
      <div className="px-1">
        <div className="flex justify-between mb-1">
          <span className="text-xs text-gray-400">Progress in this level</span>
          <span className="text-xs font-bold" style={{color:bColor}}>{qIdx+1}/{bandTotal}</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500"
            style={{width:`${((qIdx+1)/bandTotal)*100}%`,background:bColor}}/>
        </div>
      </div>
    </div>
  );
};

// ════ DOMAIN 2 — PERSONALITY (BFI-10) ═══════════════════════════════════════
const DomainPersonality = ({ resp, set, color, bg }) => (
  <div className="space-y-3">
    <div className="rounded-xl p-3 text-xs" style={{ background:bg, border:`1px solid ${color}33` }}>
      <strong style={{color}}>Big Five Personality — BFI-10</strong><br/>
      <span className="text-gray-600">
        Rate how well each statement describes you. <br/>
        1 = Strongly Disagree &nbsp;·&nbsp; 5 = Strongly Agree
      </span>
    </div>
    {BFI10.map(item => {
      const val = resp[item.id];
      const domLabel = { O:"Openness", C:"Conscientiousness", E:"Extraversion", A:"Agreeableness", N:"Neuroticism" }[item.dom];
      return (
        <div key={item.id} className="bg-white rounded-2xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs px-1.5 py-0.5 rounded font-medium"
              style={{ background:color+"18", color }}>{item.dom}</span>
            <span className="text-xs text-gray-400">{domLabel}</span>
            {item.rev && <span className="text-xs text-orange-400 ml-auto">reversed</span>}
          </div>
          <p className="text-sm text-gray-700 mb-3">{item.id}. {item.text}</p>
          <div className="flex gap-1.5">
            {[1,2,3,4,5].map(v => (
              <button key={v} onClick={() => set(item.id, v)}
                className={cx("flex-1 py-2.5 rounded-xl text-sm font-black border-2 transition-all",
                  val===v ? "border-purple-500 bg-purple-50 text-purple-700" : "border-gray-200 text-gray-300")}>
                {v}
              </button>
            ))}
          </div>
          <div className="flex justify-between mt-1 px-1">
            <span className="text-xs text-gray-300">Disagree</span>
            <span className="text-xs text-gray-300">Agree</span>
          </div>
        </div>
      );
    })}
  </div>
);

// ════ DOMAIN 3 — HEALTH (Duke-17) ════════════════════════════════════════════
const DomainHealth = ({ resp, set, color, bg }) => {

  // ── Option configs per question type ─────────────────────────────────────
  const FUNC_OPTS = [
    { label:"No — I could not do it at all",        icon:"🔴", sub:"Too difficult or impossible" },
    { label:"Yes — but with quite a bit of effort", icon:"🟡", sub:"Managed, but not easily" },
    { label:"Yes — easily, no problem at all",      icon:"🟢", sub:"No difficulty" },
  ];

  const FREQ_OPTS_POS = [  // positive items (higher = better)
    { label:"Never",                     icon:"😞", sub:"0 days" },
    { label:"Rarely",                    icon:"😐", sub:"1–2 days" },
    { label:"Sometimes",                 icon:"🙂", sub:"3–4 days" },
    { label:"Often",                     icon:"😊", sub:"5–6 days" },
    { label:"Always",                    icon:"😄", sub:"Every day" },
  ];

  const FREQ_OPTS_NEG = [  // negative items (higher = worse — shown in natural language, reversed internally)
    { label:"Never",                     icon:"😄", sub:"0 days" },
    { label:"Rarely",                    icon:"😊", sub:"1–2 days" },
    { label:"Sometimes",                 icon:"🙂", sub:"3–4 days" },
    { label:"Often",                     icon:"😐", sub:"5–6 days" },
    { label:"Always",                    icon:"😞", sub:"Every day" },
  ];

  const HEALTH_OPTS = [
    { label:"Very Poor",   icon:"😟", color:"#EF4444" },
    { label:"Poor",        icon:"😕", color:"#F97316" },
    { label:"Fair",        icon:"😐", color:"#EAB308" },
    { label:"Good",        icon:"🙂", color:"#84CC16" },
    { label:"Excellent",   icon:"😄", color:"#10B981" },
  ];

  const CMP_OPTS = [
    { label:"Much worse",      icon:"⬇⬇", color:"#EF4444" },
    { label:"Somewhat worse",  icon:"⬇",  color:"#F97316" },
    { label:"About the same",  icon:"↔",  color:"#6B7280" },
    { label:"Somewhat better", icon:"⬆",  color:"#84CC16" },
    { label:"Much better",     icon:"⬆⬆", color:"#10B981" },
  ];

  // ── Section divider component ─────────────────────────────────────────────
  const SectionBanner = ({ icon, title, instruction, example }) => (
    <div className="rounded-2xl p-4 mt-2" style={{ background: color+"10", border:`2px solid ${color}33` }}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{icon}</span>
        <p className="text-sm font-black" style={{ color }}>{title}</p>
      </div>
      <p className="text-sm text-gray-700 leading-relaxed mb-1">{instruction}</p>
      {example && (
        <div className="rounded-xl px-3 py-2 mt-2 text-xs"
          style={{ background:"white", border:`1px solid ${color}33` }}>
          <span className="font-bold" style={{ color }}>Example: </span>
          <span className="text-gray-600">{example}</span>
        </div>
      )}
    </div>
  );

  // ── Card per question ─────────────────────────────────────────────────────
  const QuestionCard = ({ item, opts, renderOpts }) => {
    const val = resp[item.id];
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
        <p className="text-sm font-semibold text-gray-800 mb-3 leading-snug">
          {item.q}
        </p>
        {renderOpts(val)}
      </div>
    );
  };

  // ── Render helpers per type ───────────────────────────────────────────────
  const renderFunc = (item) => {
    const val = resp[item.id];
    return (
      <div className="space-y-2">
        {FUNC_OPTS.map((opt, i) => (
          <button key={i} onClick={() => set(item.id, i)}
            className={cx(
              "w-full flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition-all active:scale-98 text-left",
              val===i
                ? "border-green-500 bg-green-50"
                : "border-gray-200 bg-white hover:border-green-300"
            )}>
            <span className="text-xl flex-shrink-0">{opt.icon}</span>
            <div>
              <p className={cx("text-sm font-bold", val===i?"text-green-800":"text-gray-700")}>{opt.label}</p>
              <p className="text-xs text-gray-400">{opt.sub}</p>
            </div>
            {val===i && <span className="ml-auto text-green-500 text-base font-black">✓</span>}
          </button>
        ))}
      </div>
    );
  };

  const renderFreq = (item) => {
    const val = resp[item.id];
    const opts = item.neg ? FREQ_OPTS_NEG : FREQ_OPTS_POS;
    return (
      <div className="grid grid-cols-5 gap-1.5">
        {opts.map((opt, i) => (
          <button key={i} onClick={() => set(item.id, i)}
            className={cx(
              "flex flex-col items-center gap-1 py-3 px-1 rounded-2xl border-2 transition-all active:scale-95",
              val===i ? "border-green-500 bg-green-50" : "border-gray-200 bg-white"
            )}>
            <span className="text-xl">{opt.icon}</span>
            <span className={cx("text-xs font-bold text-center leading-tight",
              val===i ? "text-green-700" : "text-gray-500")}>{opt.label}</span>
            <span className="text-xs text-gray-300 text-center leading-tight">{opt.sub}</span>
          </button>
        ))}
      </div>
    );
  };

  const renderHealth = (item) => {
    const val = resp[item.id];
    return (
      <div className="grid grid-cols-5 gap-1.5">
        {HEALTH_OPTS.map((opt, i) => (
          <button key={i} onClick={() => set(item.id, i)}
            className={cx(
              "flex flex-col items-center gap-1 py-3 px-1 rounded-2xl border-2 transition-all active:scale-95",
              val===i ? "border-2 shadow-sm" : "border-gray-200 bg-white"
            )}
            style={val===i ? { borderColor:opt.color, background:opt.color+"15" } : {}}>
            <span className="text-2xl">{opt.icon}</span>
            <span className="text-xs font-bold text-center leading-tight"
              style={{ color: val===i ? opt.color : "#9CA3AF" }}>
              {opt.label}
            </span>
          </button>
        ))}
      </div>
    );
  };

  const renderCompare = (item) => {
    const val = resp[item.id];
    return (
      <div className="grid grid-cols-5 gap-1.5">
        {CMP_OPTS.map((opt, i) => (
          <button key={i} onClick={() => set(item.id, i)}
            className={cx(
              "flex flex-col items-center gap-1 py-3 px-1 rounded-2xl border-2 transition-all active:scale-95",
              val===i ? "border-2 shadow-sm" : "border-gray-200 bg-white"
            )}
            style={val===i ? { borderColor:opt.color, background:opt.color+"15" } : {}}>
            <span className="text-base font-black" style={{ color: val===i ? opt.color : "#D1D5DB" }}>{opt.icon}</span>
            <span className="text-xs font-bold text-center leading-tight"
              style={{ color: val===i ? opt.color : "#9CA3AF" }}>
              {opt.label}
            </span>
          </button>
        ))}
      </div>
    );
  };

  // ── Group items by type ───────────────────────────────────────────────────
  const funcItems  = DUKE17.filter(i => i.type==="func");
  const freqItems  = DUKE17.filter(i => i.type==="freq");
  const healthItems= DUKE17.filter(i => i.type==="health");
  const cmpItems   = DUKE17.filter(i => i.type==="compare");

  return (
    <div className="space-y-3">

      {/* ── Top intro ── */}
      <div className="rounded-2xl p-4" style={{ background:bg, border:`1.5px solid ${color}44` }}>
        <p className="text-sm font-black mb-1" style={{ color }}>💚 Duke Health Profile — DUKE-17</p>
        <p className="text-sm text-gray-700 leading-relaxed">
          This section asks about your <strong>health and daily activities over the past 7 days</strong>.
          Answer based on how things have actually been — not how you would like them to be.
          There are <strong>17 questions</strong> in 4 short groups.
        </p>
      </div>

      {/* ══ GROUP 1: Physical Ability ══════════════════════════════════════ */}
      <SectionBanner
        icon="🏃"
        title="Group 1 of 4 — Physical Abilities"
        instruction="For each activity below, tell us whether you were able to do it during the past week. Tap the option that best describes your experience."
        example="If climbing stairs was very difficult or impossible for you this week, choose the red option. If you could do it easily, choose the green one."
      />
      {funcItems.map(item => (
        <div key={item.id} className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
          <p className="text-sm font-semibold text-gray-800 mb-3 leading-snug">
            During the past week, were you able to:
            <span className="block text-base font-black text-gray-900 mt-1">
              {item.q}?
            </span>
          </p>
          {renderFunc(item)}
        </div>
      ))}

      {/* ══ GROUP 2: Daily Life Frequency ══════════════════════════════════ */}
      <SectionBanner
        icon="📅"
        title="Group 2 of 4 — How Often in the Past Week"
        instruction="For each statement, choose how many days out of the past 7 days this was true for you. Tap the face that matches best."
        example="If you felt happy on most days this week, tap 'Often' or 'Always'. If you never felt worried, tap 'Never'."
      />
      {freqItems.map(item => (
        <div key={item.id} className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
          <p className="text-sm font-semibold text-gray-800 mb-1 leading-snug">
            In the past week, how often did you:
          </p>
          <p className="text-base font-black text-gray-900 mb-3">{item.q}?</p>
          {renderFreq(item)}
        </div>
      ))}

      {/* ══ GROUP 3: Health Ratings ═════════════════════════════════════════ */}
      <SectionBanner
        icon="⭐"
        title="Group 3 of 4 — Rate Your Health"
        instruction="Give an overall rating for your health in the past week. Tap the face that matches how your health has been — honestly, as it has felt to you."
        example="If your physical health felt good but not great, tap 'Good'. If your mental health felt excellent, tap 'Excellent'."
      />
      {healthItems.map(item => (
        <div key={item.id} className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
          <p className="text-base font-black text-gray-900 mb-3 leading-snug">{item.q}</p>
          {renderHealth(item)}
        </div>
      ))}

      {/* ══ GROUP 4: Comparison ════════════════════════════════════════════ */}
      <SectionBanner
        icon="⚖️"
        title="Group 4 of 4 — Compared to Others Your Age"
        instruction="Think about other people you know who are roughly the same age as you. Compared to them overall, how would you say your health is?"
        example="If most people your age seem healthier than you, choose 'Somewhat worse'. If you feel healthier than most, choose 'Somewhat better' or 'Much better'."
      />
      {cmpItems.map(item => (
        <div key={item.id} className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
          <p className="text-base font-black text-gray-900 mb-3 leading-snug">{item.q}</p>
          {renderCompare(item)}
        </div>
      ))}

    </div>
  );
};

// ════ DOMAIN 4 — RISK ════════════════════════════════════════════════════════
const DomainRisk = ({ resp, set, color, bg, mode }) => (
  <div className="space-y-4">
    <div className="rounded-xl p-3 text-xs" style={{ background:bg, border:`1px solid ${color}33` }}>
      <strong style={{color}}>⚠️ Risk Factor Profile — D4</strong><br/>
      <span className="text-gray-600">
        These questions are asked for health monitoring only. All responses are strictly confidential.
        Answer honestly — this helps identify if any support might be needed.
      </span>
    </div>

    {/* C-SSRS */}
    <p className="text-xs font-black text-gray-500 uppercase tracking-wider px-1">Part A — Suicidality Screen (C-SSRS)</p>
    {CSSRS.map((q, i) => {
      const val = resp[`css${i+1}`];
      return (
        <div key={i} className="bg-white rounded-2xl border border-gray-200 p-4">
          <p className="text-sm text-gray-700 mb-3">{i+1}. {q}</p>
          <div className="flex gap-2">
            {["Yes","No"].map((opt, j) => (
              <button key={j} onClick={() => set(`css${i+1}`, j===0)}
                className={cx("flex-1 py-2.5 rounded-xl font-bold text-sm border-2 transition-all",
                  val===(j===0) ? (j===0?"border-red-400 bg-red-50 text-red-700":"border-green-400 bg-green-50 text-green-700")
                    : "border-gray-200 text-gray-500")}>
                {opt}
              </button>
            ))}
          </div>
        </div>
      );
    })}

    {/* AUDIT-C */}
    <p className="text-xs font-black text-gray-500 uppercase tracking-wider px-1 mt-2">Part B — Alcohol Screen (AUDIT-C)</p>
    {AUDITC.map((item, i) => {
      const val = resp[`aud${i+1}`];
      if (i > 0 && resp.aud1 === 0) return null;
      return (
        <div key={i} className="bg-white rounded-2xl border border-gray-200 p-4">
          <p className="text-sm text-gray-700 mb-2">{item.q}</p>
          <div className="space-y-1.5">
            {item.opts.map((opt, j) => (
              <button key={j} onClick={() => {
                set(`aud${i+1}`, j);
                if (i === 0 && j === 0) { set('aud2', 0); set('aud3', 0); }
              }}
                className={cx("w-full text-left py-2 px-3 rounded-xl text-xs border-2 transition-all",
                  val===j ? "border-orange-500 bg-orange-50 text-orange-700 font-bold" : "border-gray-200 text-gray-600")}>
                {opt}
              </button>
            ))}
          </div>
        </div>
      );
    })}
    {resp.aud1 === 0 && (
      <div className="rounded-xl px-3 py-2 text-xs" style={{background:"#F0FDF4",border:"1px solid #86EFAC"}}>
        ✓ No alcohol use reported — questions 2 and 3 are not required.
      </div>
    )}

    {/* SDQ-CP */}
    <p className="text-xs font-black text-gray-500 uppercase tracking-wider px-1 mt-2">Part C — Conduct Profile (SDQ-CP)</p>
    {SDQCP.map((item, i) => {
      const val = resp[`sdq${i+1}`];
      return (
        <div key={i} className="bg-white rounded-2xl border border-gray-200 p-4">
          <p className="text-sm text-gray-700 mb-2">{i+1}. {item.q}</p>
          <div className="flex gap-1.5">
            {["Not True","Somewhat True","Certainly True"].map((opt, j) => (
              <button key={j} onClick={() => set(`sdq${i+1}`, j)}
                className={cx("flex-1 py-2 rounded-xl text-xs font-semibold border-2 transition-all",
                  val===j ? "border-red-400 bg-red-50 text-red-700" : "border-gray-200 text-gray-400")}>
                {opt}
              </button>
            ))}
          </div>
        </div>
      );
    })}
  </div>
);

// ════ DEMOGRAPHICS — UNIFIED MULTILINGUAL ════════════════════════════════════
const Demographics = ({ onComplete, mode, lang }) => {
  const t = VT[lang] || VT.en;
  const urlReg      = getURLParam("reg");
  const urlAssessor = getURLParam("assessor");

  const [form, setForm] = useState({
    fileNo:    urlReg || "", name:"", dob:"", gender:"",
    mobile:"", email:"", education:"", occupation:"",
    referral:"", assessor: urlAssessor || "", notes:"",
  });
  const set = (k,v) => setForm(p=>({...p,[k]:v}));

  const ageFromDOB  = calcAge(form.dob);
  const fileNoFinal = form.fileNo.trim() || autoFileNo();
  const uid         = generateUID(form.mobile, form.dob, form.gender);
  const canProceed  = form.dob !== "" && form.gender !== "";

  // Shared input / select styles — defined as plain style objects, not components
  const INP = "w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-purple-500";
  const LBL = "block text-xs font-semibold text-gray-600 mb-1";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-4 py-3 sticky top-0 z-10">
        <p className="text-xs font-black text-center text-gray-700">{t.regTitle}</p>
        <p className="text-xs text-center text-gray-400">{t.regSub}</p>
      </div>
      <div className="p-4 max-w-sm mx-auto space-y-4 pb-10">

        {/* FileNo */}
        <div className="rounded-2xl p-4" style={{background:"#F5F3FF",border:"1.5px solid #DDD6FE"}}>
          <p className="text-xs font-black text-purple-700 mb-1">{t.fileNoLabel}</p>
          {urlReg
            ? <><p className="text-lg font-mono font-black text-purple-800">{urlReg}</p>
               <p className="text-xs text-purple-500 mt-0.5">{t.fileNoPrefilled}</p></>
            : <><input value={form.fileNo} onChange={e=>set("fileNo",e.target.value)}
                placeholder="e.g. CIBS-26-0001"
                className="w-full border border-purple-300 rounded-xl px-3 py-2 text-sm font-mono outline-none focus:border-purple-600 bg-white mt-1"/>
               <p className="text-xs text-purple-400 mt-1">{t.fileNoHint}</p></>
          }
        </div>

        {/* Privacy note */}
        <div className="rounded-xl p-3 text-xs text-purple-700"
          style={{background:"#F5F3FF",border:"1px solid #DDD6FE"}}>
          🔒 {t.privacyNote}
        </div>

        {/* Name */}
        <div>
          <label className={LBL}>{t.nameLabel}</label>
          <input value={form.name} onChange={e=>set("name",e.target.value)}
            placeholder="Anonymous" type="text" className={INP}/>
        </div>

        {/* DOB */}
        <div>
          <label className={LBL}>{t.dobLabel}</label>
          <input type="date" value={form.dob} onChange={e=>set("dob",e.target.value)}
            max={new Date().toISOString().split("T")[0]} className={INP}/>
          {ageFromDOB && <p className="text-xs text-purple-600 mt-1 font-bold">{t.ageStr}: {ageFromDOB} {t.yearsStr}</p>}
        </div>

        {/* Gender */}
        <div>
          <label className={LBL}>{t.genderLabel}</label>
          <div className="grid grid-cols-4 gap-1.5">
            {["Male","Female","Other","NSD"].map((g,i)=>(
              <button key={g} onClick={()=>set("gender",g)}
                className={cx("py-2 rounded-xl text-xs font-semibold border-2 transition-all",
                  form.gender===g ? "border-purple-500 bg-purple-50 text-purple-700" : "border-gray-200 text-gray-400")}>
                {t.genders[i]}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile */}
        <div>
          <label className={LBL}>{t.mobileLabel}</label>
          <input value={form.mobile} onChange={e=>set("mobile",e.target.value)}
            placeholder="9876543210" type="tel" maxLength={10} className={INP}/>
        </div>

        {/* Email */}
        <div>
          <label className={LBL}>{t.emailLabel}</label>
          <input value={form.email} onChange={e=>set("email",e.target.value)}
            placeholder="you@email.com" type="email" className={INP}/>
        </div>

        {/* Education */}
        <div>
          <label className={LBL}>{t.eduLabel}</label>
          <select value={form.education} onChange={e=>set("education",e.target.value)}
            className={INP + " bg-white"}>
            <option value="">— —</option>
            {t.edu.map(o=><option key={o} value={o}>{o}</option>)}
          </select>
        </div>

        {/* Occupation */}
        <div>
          <label className={LBL}>{t.occLabel}</label>
          <input value={form.occupation} onChange={e=>set("occupation",e.target.value)}
            placeholder="e.g. Teacher, Farmer, Student" type="text" className={INP}/>
        </div>

        {/* Referral */}
        <div>
          <label className={LBL}>{t.refLabel}</label>
          <select value={form.referral} onChange={e=>set("referral",e.target.value)}
            className={INP + " bg-white"}>
            <option value="">— —</option>
            {t.ref.map(o=><option key={o} value={o}>{o}</option>)}
          </select>
        </div>

        {/* Assessor */}
        <div>
          <label className={LBL}>{t.assessorLabel}</label>
          <input value={form.assessor} onChange={e=>set("assessor",e.target.value)}
            placeholder="Dr. Pangaonkar" type="text" className={INP}/>
        </div>

        {/* Notes */}
        <div>
          <label className={LBL}>{t.notesLabel}</label>
          <input value={form.notes} onChange={e=>set("notes",e.target.value)}
            placeholder="Brief note…" type="text" className={INP}/>
        </div>

        {/* UID preview */}
        {canProceed && (
          <div className="rounded-xl p-3" style={{background:"#F0FDF4",border:"1px solid #86EFAC"}}>
            <p className="text-xs font-bold text-green-700 mb-0.5">{t.uidLabel}</p>
            <p className="text-sm font-mono font-black text-green-800">{uid}</p>
            <p className="text-xs text-green-600 mt-0.5">{t.fileNoDisplay}: <strong>{fileNoFinal}</strong> · {ageFromDOB} {t.yearsStr} · {form.gender}</p>
          </div>
        )}

        <button onClick={()=>onComplete({...form,fileNo:fileNoFinal,age:ageFromDOB||"",uid})}
          disabled={!canProceed}
          className="w-full py-4 rounded-2xl font-black text-white text-base disabled:opacity-40"
          style={{background:canProceed?"linear-gradient(135deg,#8B5CF6,#6D28D9)":"#9CA3AF"}}>
          {t.proceedBtn}
        </button>
      </div>
    </div>
  );
};
// ════ REPORT ══════════════════════════════════════════════════════════════════
const Report = ({ responses, demographics, mode }) => {
  const [tab, setTab] = useState(mode==="self" ? "wellbeing" : "clinical");
  const [printing, setPrinting] = useState(false);
  const reportRef = useRef(null);

  // --- Compute scores ---
  const bfi   = scoreBFI(responses.d2);
  const duke  = scoreDuke(responses.d3);
  const cssCl = scoreCSS(Object.fromEntries(
    CSSRS.map((_,i) => [`css${i+1}`, responses.d4[`css${i+1}`]])
  ));
  const audCl = scoreAUDIT(Object.fromEntries(
    AUDITC.map((_,i) => [`${i}`, responses.d4[`aud${i+1}`] !== undefined ? responses.d4[`aud${i+1}`] : 0])
  ));
  const catResult   = scoreCAT(responses.d1);
  const ravensScore = catResult.totalCorrect;
  const ravensIQ    = catResult.iq;
  const ravensLabel = catResult.label;
  const ageNorms    = getAgeNorms(demographics?.age);

  const today = new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"long",year:"numeric"});

  // ── Push data to Google Sheets once on report load ─────────────────────────
  useEffect(() => {
    if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL.startsWith("PASTE_")) return;
    const sdqTotal = SDQCP.reduce((sum, item, i) => {
      const v = responses.d4[`sdq${i+1}`];
      return sum + (v !== undefined ? (item.rev ? 2 - v : v) : 0);
    }, 0);
    const payload = {
      tool:            "CIBS-VALID",
      timestamp:       new Date().toISOString(),
      mode:            mode,
      // Universal identification
      fileNo:          demographics.fileNo      || "",
      uid:             demographics.uid         || "",
      // Universal demographics
      name:            demographics.name        || "Anonymous",
      dob:             demographics.dob         || "",
      age:             demographics.age         || "",
      gender:          demographics.gender      || "",
      mobile:          demographics.mobile      || "",
      email:           demographics.email       || "",
      education:       demographics.education   || "",
      occupation:      demographics.occupation  || "",
      referral:        demographics.referral    || "",
      assessor:        demographics.assessor    || "",
      notes:           demographics.notes       || "",
      // D1 — Cognition
      cq_iq:           catResult.iq,
      cq_ma:           catResult.ma,
      cq_label:        catResult.label,
      cq_percentile:   catResult.pctRank,
      cq_correct:      catResult.totalCorrect,
      // D2 — Personality (BFI-10)
      bfi_O:           bfi.O,
      bfi_C:           bfi.C,
      bfi_E:           bfi.E,
      bfi_A:           bfi.A,
      bfi_N:           bfi.N,
      // D3 — Health (Duke-17)
      duke_general:    duke.general,
      duke_phys:       duke.phys,
      duke_mental:     duke.mental,
      duke_social:     duke.social,
      duke_depression: duke.depression,
      duke_anxiety:    duke.anxiety,
      duke_selfEsteem: duke.selfEsteem,
      // D4 — Risk
      cssrs_level:     cssCl.level,
      cssrs_label:     cssCl.label,
      auditc_score:    audCl.score,
      auditc_label:    audCl.label,
      sdq_total:       sdqTotal,
    };
    fetch(APPS_SCRIPT_URL, {
      method:  "POST",
      mode:    "no-cors",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    }).catch(() => {}); // silent fail — report still shows
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePrint = () => {
    setPrinting(true);
    setTimeout(() => { window.print(); setPrinting(false); }, 200);
  };

  return (
    <div className="min-h-screen bg-gray-50" ref={reportRef}>
      {/* Header bar */}
      <div className="bg-white border-b px-4 py-3 print:hidden sticky top-0 z-20">
        <div className="flex items-center justify-between max-w-sm mx-auto">
          <p className="text-xs font-black text-gray-700">CIBS-VALID Report</p>
          <div className="flex gap-2">
            {["wellbeing","clinical"].map(t => (
              <button key={t} onClick={()=>setTab(t)}
                className={cx("text-xs px-3 py-1.5 rounded-lg font-bold border transition-all",
                  tab===t ? "bg-purple-600 text-white border-purple-600" : "border-gray-200 text-gray-500 bg-white")}>
                {t==="wellbeing"?"Wellbeing":"Clinical"}
              </button>
            ))}
            <button onClick={handlePrint}
              className="text-xs px-3 py-1.5 rounded-lg font-bold bg-gray-800 text-white">
              {printing?"...":"PDF"}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-sm mx-auto p-4 pb-12 space-y-4">
        {/* Subject banner */}
        <div className="rounded-2xl p-4 text-white"
          style={{ background:"linear-gradient(135deg,#1A2E4A,#243B58)" }}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-blue-300 mb-0.5">CIBS-VALID Assessment Report</p>
              <p className="text-base font-black">{demographics.name || "Anonymous Participant"}</p>
              <p className="text-xs text-blue-300">
                {demographics.age ? `Age ${demographics.age}` : ""}
                {demographics.gender ? ` · ${demographics.gender}` : ""}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-blue-300">UID</p>
              <p className="text-xs font-mono font-black">{demographics.uid}</p>
              <p className="text-xs text-blue-400 mt-0.5">{today}</p>
            </div>
          </div>
        </div>

        {tab === "wellbeing" && <WellbeingReport bfi={bfi} duke={duke} cssCl={cssCl} audCl={audCl} ravensScore={ravensScore} ravensLabel={ravensLabel} catResult={catResult} ageNorms={ageNorms} demographics={demographics}/>}
        {tab === "clinical"  && <ClinicalReport  bfi={bfi} duke={duke} cssCl={cssCl} audCl={audCl} ravensScore={ravensScore} ravensIQ={ravensIQ} ravensLabel={ravensLabel} responses={responses} mode={mode} demographics={demographics} catResult={catResult} ageNorms={ageNorms}/>}

        {/* Footer */}
        <div className="rounded-xl p-3 text-center" style={{ background:"#F8FAFC", border:"1px solid #E2E8F0" }}>
          <p className="text-xs text-gray-400">
            Central Institute of Behavioural Sciences (CIBS), Nagpur<br/>
            Dr Shailesh V. Pangaonkar · +91 9423105228 · pangaonkar11@gmail.com<br/>
            This report is for informational purposes only and does not constitute a clinical diagnosis.
          </p>
        </div>
      </div>
    </div>
  );
};

// ─── Red Flag Alert Component ────────────────────────────────────────────────
const RedFlag = ({ title, body, helplines }) => (
  <div className="rounded-2xl p-4 mt-4" style={{
    background:"linear-gradient(135deg,#FFF1F1,#FFF7F7)",
    border:"2px solid #FCA5A5"
  }}>
    <div className="flex items-start gap-2.5 mb-2">
      <span className="text-xl flex-shrink-0 mt-0.5">🚨</span>
      <div>
        <p className="text-sm font-black text-red-700 mb-1">{title}</p>
        <p className="text-xs text-red-800 leading-relaxed">{body}</p>
      </div>
    </div>
    {helplines && (
      <div className="rounded-xl p-2.5 mt-2" style={{background:"#FEE2E2"}}>
        <p className="text-xs font-bold text-red-700 mb-1">Free Support — Available Now</p>
        {helplines.map((h,i) => (
          <p key={i} className="text-xs text-red-800">📞 {h}</p>
        ))}
      </div>
    )}
  </div>
);

// ─── Gentle Amber Flag Component ─────────────────────────────────────────────
const AmberFlag = ({ title, body, action }) => (
  <div className="rounded-2xl p-4 mt-3" style={{
    background:"linear-gradient(135deg,#FFFBEB,#FFFEF5)",
    border:"2px solid #FCD34D"
  }}>
    <div className="flex items-start gap-2.5">
      <span className="text-xl flex-shrink-0 mt-0.5">⚠️</span>
      <div>
        <p className="text-sm font-bold text-amber-800 mb-1">{title}</p>
        <p className="text-xs text-amber-900 leading-relaxed">{body}</p>
        {action && <p className="text-xs font-semibold text-amber-700 mt-1.5">→ {action}</p>}
      </div>
    </div>
  </div>
);

// ─── Strength Badge Component ─────────────────────────────────────────────────
const StrengthBadge = ({ text }) => (
  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold mr-1.5 mb-1.5"
    style={{background:"#F0FDF4", color:"#15803D", border:"1px solid #86EFAC"}}>
    ✦ {text}
  </span>
);

// ══════════════════════════════════════════════════════════════════════════════
// WELLBEING REPORT — Lucid, personal, narrative-driven
// ══════════════════════════════════════════════════════════════════════════════
const WellbeingReport = ({ bfi, duke, cssCl, audCl, ravensScore, ravensLabel, catResult, ageNorms, demographics }) => {

  const dn = ageNorms || getAgeNorms(demographics?.age);

  // ── Cognitive narrative ───────────────────────────────────────────────────
  const cognitiveNarrative = () => {
    const iq = catResult.iq, ma = catResult.ma, pct = catResult.pctRank;
    if (iq >= 115) return {
      headline:"Your reasoning is exceptional",
      body:`You solved advanced multi-rule patterns that require holding several logical principles in mind at once — a result that places you at the ${pct}th percentile, with a mental age equivalent of approximately ${ma} years. You have a natural ability to spot structure in complexity, think several steps ahead, and adapt quickly when a problem changes shape.`,
      strength:"Pattern recognition · Abstract thinking · Analytical depth"
    };
    if (iq >= 100) return {
      headline:"Your reasoning is above average",
      body:`You performed well on the pattern reasoning tasks — ${pct}th percentile, mental age approximately ${ma} years. Your mind picks up sequences and logical rules efficiently, which serves you well in problem-solving, learning new skills, and making sound decisions.`,
      strength:"Logical reasoning · Quick learning · Problem solving"
    };
    if (iq >= 85) return {
      headline:"Your reasoning is solid and practical",
      body:`You answered the pattern tasks at a level consistent with most adults — ${pct}th percentile, mental age approximately ${ma} years. Steady, practical, and reliable. You may think most effectively when you can take your time and work through things step by step.`,
      strength:"Steady thinking · Practical approach · Attention to detail"
    };
    return {
      headline:"Your reasoning may benefit from practice",
      body:`The pattern tasks in this section were challenging today — ${pct}th percentile, mental age approximately ${ma} years. This does not reflect your overall intelligence. Many forms of thinking and ability are simply not measured by visual pattern tests. Step-by-step reasoning is very much a skill that can grow with practice.`,
      strength:"Persistence · Effort · Room to grow"
    };
  };
  const cog = cognitiveNarrative();

  // ── Personality narrative ─────────────────────────────────────────────────
  const bfiNarrative = {
    O: {
      high:{ line:"Curious & Creative", desc:"You have an open, imaginative mind. You are drawn to new ideas, enjoy exploring possibilities, and feel energised by learning. You likely bring fresh perspectives to situations and may sometimes feel a little different from people who prefer routine — and that is a gift, not a flaw." },
      low: { line:"Grounded & Practical", desc:"You prefer what works over what is theoretical. You are comfortable with familiar routines and tend to trust experience over speculation. This pragmatic quality makes you reliable and realistic — qualities many people around you depend on." }
    },
    C: {
      high:{ line:"Reliable & Organised", desc:"You are someone others can count on. You follow through, plan ahead, and take your responsibilities seriously. This conscientiousness is one of the strongest predictors of long-term success and wellbeing — it is a genuine asset." },
      low: { line:"Flexible & Spontaneous", desc:"You tend to live more in the moment and may sometimes find rigid structure frustrating. While this can mean things occasionally slip through the cracks, your flexibility means you adapt well to change — a strength in an unpredictable world. Building a few simple routines can help you harness the best of both." }
    },
    E: {
      high:{ line:"Sociable & Energetic", desc:"You are energised by people and connection. You enjoy being part of conversations, group activities, and social situations. Your warmth and expressiveness make you easy to be around, and people likely find you approachable and engaging." },
      low: { line:"Reflective & Self-Sufficient", desc:"You recharge by spending time with yourself and do not need a lot of external stimulation to feel at ease. This quiet self-sufficiency allows you to think deeply and work independently. It is not shyness — it is a deliberate and valued way of being in the world." }
    },
    A: {
      high:{ line:"Warm & Cooperative", desc:"You genuinely care about the people around you and tend to put relationships first. Your cooperative nature and empathy make you a trusted friend and colleague. You likely go out of your way to keep things harmonious — which is a beautiful quality, as long as you also take care of your own needs." },
      low: { line:"Direct & Independent-minded", desc:"You say what you think and do not easily back down from your position. This directness can sometimes create friction, but it also means people always know where they stand with you — a form of honesty many genuinely respect. Channelled well, this quality is a real leadership strength." }
    },
    N: {
      high:{ line:"Emotionally Sensitive", desc:"You experience your emotions deeply and are attuned to changes in mood, both in yourself and in those around you. This sensitivity is also what makes you empathetic, creative, and authentic. The challenge is that it can also mean you carry stress and worry more intensely than others — and that is something worth actively managing with support and self-care." },
      low: { line:"Emotionally Steady", desc:"You are remarkably resilient under pressure. You tend to remain calm when things go wrong and recover quickly from setbacks. This emotional stability is one of the most protective factors for long-term mental health and is something many people quietly admire about people like you." }
    },
  };

  const bfiFlags = () => {
    const flags = [];
    if (+bfi.N > 4)   flags.push({ title:"You may be carrying more stress than usual", body:"Your responses suggest you are experiencing a notable level of emotional tension or worry right now. This is something many people go through, and it does not mean anything is permanently wrong. But it is worth acknowledging — and speaking with someone you trust or a counsellor can make a real difference.", action:"Consider speaking with a counsellor or your family doctor about how you have been feeling lately." });
    if (+bfi.A < 2)   flags.push({ title:"Relationships may feel difficult right now", body:"Your responses suggest some difficulty with trust or cooperation in relationships at the moment. This can sometimes be a sign of accumulated stress, past hurt, or feeling unsafe around others. It is worth reflecting on whether this is long-standing or a recent shift.", action:"A few sessions with a counsellor can be very helpful in untangling relationship patterns." });
    if (+bfi.C < 1.8) flags.push({ title:"Day-to-day functioning may be a challenge", body:"A very low score on reliability and organisation can sometimes signal that everyday tasks are feeling overwhelming. If you are struggling to manage daily responsibilities, please consider reaching out for support.", action:"Your doctor or a mental health professional can help identify what is making things feel so hard right now." });
    return flags;
  };

  // ── Health narrative ──────────────────────────────────────────────────────
  const healthNarrative = () => {
    const g = +duke.general;
    if (g >= 75) return { head:"Your overall health and wellbeing are in excellent shape", body:"All three pillars — physical, mental, and social health — are functioning well. You are in a strong position right now. The task ahead is to protect and maintain what you have built: regular activity, meaningful connection, and time to rest and restore." };
    if (g >= 55) return { head:"Your wellbeing is in a reasonable place with some areas to nurture", body:"You have real strengths across several areas of health, but something — physical energy, mood, or social connection — may not be quite where you want it. This is a good moment to pay a little more attention to whichever area feels most depleted, before a small dip becomes a larger one." };
    if (g >= 35) return { head:"Some areas of your health need attention right now", body:"Your scores suggest you may be going through a difficult period — physically, emotionally, or both. This is not unusual, and it does not mean things cannot improve. But it does mean this is a good time to reach out — to a doctor, a friend, a counsellor, or someone you trust — rather than pushing through alone." };
    return { head:"Your health and wellbeing are under significant strain", body:"Your responses across physical health, mental health, and social functioning all point to a period of real difficulty. Please do not try to manage this alone. Talking to a healthcare professional — even a single honest conversation — can open doors to support that makes a meaningful difference." };
  };
  const health = healthNarrative();

  const healthFlags = () => {
    const flags = [];
    if (+duke.phys < 30)    flags.push({ title:"Your physical health may need medical attention", body:"Your responses suggest significant limitations in physical activity and function. This is worth a conversation with your doctor, even if you have been putting it off.", action:"Book an appointment with your physician or a nearby primary health centre." });
    if (+duke.mental < 35)  flags.push({ title:"Your mental wellbeing is at a low point", body:"Very low mental health scores on the Duke scale, combined with other findings in this report, suggest you are carrying a significant emotional burden right now. Please do not wait for things to get worse before seeking support.", action:"A mental health professional — psychiatrist, psychologist, or counsellor — can help." });
    if (+duke.social < 30)  flags.push({ title:"You may be feeling isolated right now", body:"Social isolation is one of the strongest risk factors for depression and declining health. If you feel cut off from others, reaching out — even in a small way — matters more than you may realise.", action:"Even one regular social connection can meaningfully protect your mental health." });
    return flags;
  };

  // ── Mood narrative — based on Duke Depression & Anxiety subscales ────────
  const moodNarrative = () => {
    const dep = +duke.depression;
    const anx = +duke.anxiety;
    const depHigh = dep > dn.depression[1];
    const anxHigh = anx > dn.anxiety[1];
    if (!depHigh && !anxHigh) return {
      head:"Your mood and emotional wellbeing are in a healthy place",
      body:"Your responses across the health profile show no significant signs of depression or anxiety at this time. You appear to be managing life's demands without marked emotional distress — a real positive. Continue investing in the things that keep you well: sleep, connection, movement, and moments of meaning."
    };
    if (depHigh && anxHigh) return {
      head:"Your mood and anxiety scores both need attention",
      body:`Your Duke Health Profile shows elevated depression (${dep}/100, normal 0–${dn.depression[1]}) and anxiety (${anx}/100, normal 0–${dn.anxiety[1]}) for your age group. Experiencing both together is common and very treatable. Please do not try to manage this alone — speaking to a doctor or counsellor is an important next step.`
    };
    if (depHigh) return {
      head:"Your mood score suggests you may be experiencing low mood",
      body:`Your Duke Depression subscale score (${dep}/100) is above the normal range for your age group (0–${dn.depression[1]}). This suggests you have been feeling down, sad, or lacking a sense of worth more than usual recently. These feelings are real, valid, and respond well to support.`
    };
    return {
      head:"Your anxiety score suggests you may be feeling more stressed than usual",
      body:`Your Duke Anxiety subscale score (${anx}/100) is above the normal range for your age group (0–${dn.anxiety[1]}). Worry, nervousness, and trouble sleeping are all common signs of elevated anxiety. There is effective support available — please consider speaking with your doctor or a counsellor.`
    };
  };
  const mood = moodNarrative();

  // ── Compile all active flags ───────────────────────────────────────────────
  const activeRedFlags = [];
  if (cssCl.level >= 2) activeRedFlags.push({
    title: cssCl.level >= 4 ? "You have described thoughts of suicide — please reach out right now" :
           cssCl.level >= 3 ? "You are having thoughts of suicide with a plan — please tell someone today" :
           "You are having thoughts of harming yourself — you do not have to face this alone",
    body: cssCl.level >= 3
      ? "You have shared that you are thinking about ending your life and have begun thinking about how. This is a serious signal that you need support right now — not tomorrow. Please contact a crisis line, go to your nearest hospital emergency department, or tell someone you trust immediately."
      : "Thoughts of suicide or self-harm are telling you that your pain has reached a level that needs immediate support. These thoughts can pass, and real help is available. You deserve to feel better.",
    helplines: ["iCall (TISS): 9152987821 (Mon–Sat, 8am–10pm)","Vandrevala Foundation: 1860-2662-345 (24/7)","NIMHANS Helpline: 080-46110007","Emergency: 112"]
  });
  if (+duke.depression > dn.depression[1] * 1.5) activeRedFlags.push({
    title:"Your depression score is significantly elevated — please speak to a doctor",
    body:`Your Duke Depression score (${duke.depression}/100) is well above the normal range for your age group. This level of depressive experience benefits strongly from professional support. Effective help is available — this is a health need, exactly like any other medical condition.`,
    helplines:["iCall (TISS): 9152987821","Your nearest government hospital psychiatry OPD — free of charge"]
  });
  if (audCl.score >= 8) activeRedFlags.push({
    title:"Your alcohol use is at a level that can harm your health",
    body:"Your AUDIT-C score suggests harmful or dependent alcohol use. Alcohol at this level damages physical health, worsens depression and anxiety, and affects relationships and work. The good news is that de-addiction support is effective and confidential. You deserve support without judgement.",
    helplines:["iDARC (NIMHANS): 080-46110007","Vandrevala Foundation: 1860-2662-345 (24/7)"]
  });

  const activeAmberFlags = [];
  if (+duke.depression > dn.depression[1] && +duke.depression <= dn.depression[1] * 1.5) activeAmberFlags.push({
    title:"Your mood score suggests some depressive feelings",
    body:`Your Duke Depression score (${duke.depression}/100) is above the normal range for your age (0–${dn.depression[1]}). This is worth paying attention to — speaking with a counsellor or your family doctor is a sensible step.`,
    action:"Book an appointment with a counsellor or your family doctor in the next week."
  });
  if (+duke.anxiety > dn.anxiety[1]) activeAmberFlags.push({
    title:"Your anxiety level is elevated",
    body:`Your Duke Anxiety score (${duke.anxiety}/100) is above the normal range for your age (0–${dn.anxiety[1]}). Worry, poor sleep, and tension are manageable with the right support.`,
    action:"Consider speaking with a counsellor about stress management and relaxation techniques."
  });
  if (+duke.selfEsteem < dn.selfEsteem[0]) activeAmberFlags.push({
    title:"Your sense of self-worth seems low right now",
    body:`Your Duke Self-Esteem score (${duke.selfEsteem}/100) is below the normal range for your age (${dn.selfEsteem[0]}–100). How we see ourselves shapes almost every area of life. This is absolutely something that can be worked on.`,
    action:"A few sessions with a counsellor focused on self-compassion can make a meaningful difference."
  });
  if (audCl.score >= 4 && audCl.score < 8) activeAmberFlags.push({
    title:"Your alcohol use is worth monitoring",
    body:"Your AUDIT-C score suggests hazardous drinking. At this level, alcohol may be interfering with sleep, mood, or relationships in ways you might not have connected yet.",
    action:"Consider tracking your alcohol intake for a week — it often reveals more than we expect."
  });
  bfiFlags().forEach(f => activeAmberFlags.push(f));
  healthFlags().forEach(f => activeAmberFlags.push(f));

  return (
    <div className="space-y-5">

      {/* ── Active Red Flags ── */}
      {activeRedFlags.map((f,i) => <RedFlag key={i} {...f}/>)}
      {activeAmberFlags.slice(0,2).map((f,i) => <AmberFlag key={i} {...f}/>)}

      {/* ── Cognitive section ── */}
      <div className="bg-white rounded-2xl border border-blue-200 p-5">
        <SectionHead icon="🧩" title="Your Thinking & Reasoning" color="#3B82F6"/>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            {label:"CQ Estimate", val:`~${catResult.iq}`, sub:"out of 130", color:"#3B82F6"},
            {label:"Mental Age",  val:`~${catResult.ma} yrs`, sub:catResult.label, color:"#8B5CF6"},
            {label:"Percentile",  val:`${catResult.pctRank}th`, sub:"among peers", color:"#10B981"},
          ].map(({label,val,sub,color})=>(
            <div key={label} className="rounded-xl p-2.5 text-center" style={{background:color+"10",border:`1px solid ${color}30`}}>
              <p className="text-xl font-black" style={{color}}>{val}</p>
              <p className="text-xs font-bold text-gray-600 leading-tight">{label}</p>
              <p className="text-xs text-gray-400">{sub}</p>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3 mb-3 p-3 rounded-xl" style={{background:"#EFF6FF"}}>
          <div>
            <p className="text-sm font-black text-blue-800 mb-0.5">{cog.headline}</p>
            <div className="flex flex-wrap">{cog.strength.split("·").map(s=><StrengthBadge key={s} text={s.trim()}/>)}</div>
          </div>
        </div>
        <p className="text-sm text-gray-700 leading-relaxed">{cog.body}</p>
      </div>

      {/* ── Personality section ── */}
      <div className="bg-white rounded-2xl border border-purple-200 p-5">
        <SectionHead icon="🪞" title="Your Personality & Character" color="#8B5CF6"/>
        <p className="text-xs text-gray-500 mb-4">These scores reflect how you see yourself right now — they are not fixed labels. Personality is dynamic and can shift with experience and growth.</p>
        {[["O","Openness"],["C","Conscientiousness"],["E","Extraversion"],["A","Agreeableness"],["N","Emotional Sensitivity"]].map(([d, label]) => {
          const val = +bfi[d];
          const isHigh = val > 3;
          const nar = bfiNarrative[d][isHigh?"high":"low"];
          const col = "#8B5CF6";
          return (
            <div key={d} className="mb-5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-black text-gray-700">{label}</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                  style={{background:col+"18",color:col}}>{nar.line}</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-2">
                <div className="h-full rounded-full transition-all"
                  style={{width:`${(val/5)*100}%`, background:`linear-gradient(90deg,${col}88,${col})`}}/>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">{nar.desc}</p>
            </div>
          );
        })}
      </div>

      {/* ── Health section ── */}
      <div className="bg-white rounded-2xl border border-green-200 p-5">
        <SectionHead icon="💚" title="Your Health & Wellbeing" color="#10B981"/>
        <div className="grid grid-cols-2 gap-2.5 mb-4">
          {[
            { label:"Physical",  val:duke.phys,   color:"#3B82F6", icon:"🏃" },
            { label:"Mental",    val:duke.mental,  color:"#8B5CF6", icon:"🧠" },
            { label:"Social",    val:duke.social,  color:"#10B981", icon:"🤝" },
            { label:"Overall",   val:duke.general, color:"#F59E0B", icon:"⭐" },
          ].map(item => {
            const v = +item.val;
            const tier = v>=70?"Good":v>=45?"Fair":"Low";
            const tierColor = v>=70?"#15803D":v>=45?"#B45309":"#DC2626";
            return (
              <div key={item.label} className="rounded-2xl p-3"
                style={{background:item.color+"10", border:`1.5px solid ${item.color}33`}}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-base">{item.icon}</span>
                  <span className="text-xs font-bold" style={{color:tierColor}}>{tier}</span>
                </div>
                <p className="text-2xl font-black" style={{color:item.color}}>{item.val}</p>
                <p className="text-xs text-gray-500 font-medium">{item.label} Health</p>
              </div>
            );
          })}
        </div>
        <p className="text-sm font-bold text-gray-700 mb-1">{health.head}</p>
        <p className="text-sm text-gray-600 leading-relaxed">{health.body}</p>
      </div>

      {/* ── Mood section ── */}
      {(() => {
        const dep = +duke.depression;
        const anx = +duke.anxiety;
        const se  = +duke.selfEsteem;
        const depOk = dep <= dn.depression[1];
        const anxOk = anx <= dn.anxiety[1];
        const seOk  = se  >= dn.selfEsteem[0];
        const overallOk = depOk && anxOk && seOk;
        const sectionColor = overallOk ? "#10B981" : dep > dn.depression[1]*1.5 || anx > dn.anxiety[1]*1.5 ? "#EF4444" : "#F59E0B";
        return (
          <div className="bg-white rounded-2xl p-5" style={{
            border: `2px solid ${sectionColor}66`,
            background: `linear-gradient(135deg, white, ${sectionColor}06)`
          }}>
            <SectionHead icon="🌤" title="Your Mood & Emotional Wellbeing" color={sectionColor}
              badge={{text: overallOk?"Within normal range":"Needs attention", color:sectionColor}}/>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { label:"Depression", val:dep, lo:dn.depression[0], hi:dn.depression[1], worse:"↑", color:"#6366F1" },
                { label:"Anxiety",    val:anx, lo:dn.anxiety[0],    hi:dn.anxiety[1],    worse:"↑", color:"#F59E0B" },
                { label:"Self-Esteem",val:se,  lo:dn.selfEsteem[0], hi:dn.selfEsteem[1], worse:"↓", color:"#10B981" },
              ].map(({ label, val, lo, hi, worse, color }) => {
                const ok = worse==="↑" ? val<=hi : val>=lo;
                const sc = ok ? "#059669" : "#DC2626";
                return (
                  <div key={label} className="rounded-xl p-2.5 text-center border"
                    style={{borderColor:sc+"33", background:sc+"08"}}>
                    <p className="text-2xl font-black" style={{color:sc}}>{val}</p>
                    <p className="text-xs font-bold text-gray-600">{label}</p>
                    <p className="text-xs font-semibold" style={{color:sc}}>{ok?"Normal":worse==="↑"?"Elevated":"Low"}</p>
                    <p className="text-xs text-gray-400">{worse==="↑"?`norm 0–${hi}`:`norm ${lo}–100`}</p>
                  </div>
                );
              })}
            </div>
            <p className="text-sm font-black text-gray-800 mb-1">{mood.head}</p>
            <p className="text-sm text-gray-700 leading-relaxed">{mood.body}</p>
            {(!depOk || !anxOk) && (
              <div className="mt-3 rounded-xl p-3 text-xs" style={{background:"#FFFBEB",border:"1px solid #FCD34D"}}>
                <p className="font-bold text-amber-800 mb-1">You deserve support</p>
                <p className="text-amber-900">📞 iCall (TISS): <strong>9152987821</strong> — Mon–Sat, 8am–10pm</p>
                <p className="text-amber-900">📞 Vandrevala Foundation: <strong>1860-2662-345</strong> — 24/7, free</p>
              </div>
            )}
          </div>
        );
      })()}

      {/* ── Remaining amber flags ── */}
      {activeAmberFlags.slice(2).map((f,i) => <AmberFlag key={i} {...f}/>)}

      {/* ── Closing note ── */}
      <div className="rounded-2xl p-4" style={{background:"linear-gradient(135deg,#F5F3FF,#EFF6FF)",border:"1.5px solid #DDD6FE"}}>
        <p className="text-xs font-black text-purple-700 mb-1">A note from the CIBS team</p>
        <p className="text-xs text-purple-900 leading-relaxed">
          This report is a starting point for self-understanding — not a diagnosis, and not the final word on who you are.
          Use it as a compassionate mirror. If something here resonates or concerns you, please share it with a trusted doctor
          or counsellor. You deserve support that is personal, skilled, and kind.
        </p>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// CLINICAL REPORT — Lab-style, formal, structured for clinician use
// ══════════════════════════════════════════════════════════════════════════════
const ClinicalReport = ({ bfi, duke, cssCl, audCl, ravensScore, ravensIQ, ravensLabel, responses, mode, demographics, catResult, ageNorms }) => {

  const sdqTotal = SDQCP.reduce((s,item,i) => {
    const v = responses.d4[`sdq${i+1}`] || 0;
    return s + (item.rev ? (2-v) : v);
  }, 0);

  const bfiDSM = () => {
    const N=+bfi.N, A=+bfi.A, C=+bfi.C, O=+bfi.O, E=+bfi.E;
    const clusters = [];
    if (N>3.8 && A<2.5) clusters.push("Cluster B (Emotional Dysregulation / Antagonism)");
    if (N>3.8 && C<2.5) clusters.push("Cluster C (Anxious / Avoidant traits)");
    if (O<2.5 && E<2.5 && A<2.5) clusters.push("Cluster A (Schizotypal / Detachment pattern)");
    return clusters.length ? clusters : ["No clinically significant DSM-5 Cluster A/B/C personality trait pattern identified"];
  };

  const RangeRow = ({label, val, lo, hi, unit="", flag=""}) => {
    const v = parseFloat(val);
    const inRange = v>=lo && v<=hi;
    const stateColor = inRange ? "#059669" : v>hi ? "#DC2626" : "#D97706";
    const stateLabel = inRange ? "Within Range" : v>hi ? "Above Range ↑" : "Below Range ↓";
    return (
      <tr style={{borderBottom:"1px solid #F1F5F9"}}>
        <td className="py-2 pr-3 text-xs text-gray-700 font-medium">{label}</td>
        <td className="py-2 pr-3 text-sm font-black" style={{color:stateColor}}>{val}{unit}</td>
        <td className="py-2 pr-3 text-xs text-gray-400">{lo}–{hi}{unit}</td>
        <td className="py-2">
          <span className="text-xs px-1.5 py-0.5 rounded font-semibold"
            style={{background:stateColor+"18", color:stateColor}}>{stateLabel}</span>
        </td>
      </tr>
    );
  };

  const today = new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"long",year:"numeric"});
  const reportId = "CIBS-" + (demographics?.uid?.slice(-8)||"XXXX");

  // Compile clinical alerts
  const clinAlerts = [];
  const dn = ageNorms || getAgeNorms(demographics?.age);
  if (cssCl.level >= 3) clinAlerts.push({ sev:"CRITICAL", text:`C-SSRS Level ${cssCl.level}/4 — Suicidal ideation with plan${cssCl.level>=4?" and rehearsal":""} endorsed. Immediate clinical assessment and safety planning required.` });
  if (cssCl.level >= 1 && cssCl.level < 3) clinAlerts.push({ sev:"MODERATE", text:`C-SSRS Level ${cssCl.level} — passive/active ideation without plan. Safety monitoring and 2-week follow-up recommended.` });
  // Duke Depression alert (dysfunction scale — higher=worse; normal upper limit is dn.depression[1])
  if (+duke.depression > dn.depression[1])
    clinAlerts.push({ sev:+duke.depression>60?"HIGH":"MODERATE", text:`Duke Depression subscale ${duke.depression}/100 — above age-adjusted normal range (0–${dn.depression[1]}). Depressive symptomatology indicated. Clinical interview and further evaluation recommended.` });
  // Duke Anxiety alert
  if (+duke.anxiety > dn.anxiety[1])
    clinAlerts.push({ sev:+duke.anxiety>60?"HIGH":"MODERATE", text:`Duke Anxiety subscale ${duke.anxiety}/100 — above age-adjusted normal range (0–${dn.anxiety[1]}). Anxiety symptoms present. Consider structured anxiety assessment (GAD-7/HAM-A).` });
  // Duke Self-Esteem alert (positive scale — lower=worse; normal lower limit is dn.selfEsteem[0])
  if (+duke.selfEsteem < dn.selfEsteem[0])
    clinAlerts.push({ sev:"MODERATE", text:`Duke Self-Esteem subscale ${duke.selfEsteem}/100 — below age-adjusted normal range (${dn.selfEsteem[0]}–100). Low self-worth may co-present with depressive or personality disorder features.` });
  if (audCl.score >= 8) clinAlerts.push({ sev:"HIGH", text:`AUDIT-C score ${audCl.score}/12 — Harmful or dependent use. Structured brief intervention and referral to de-addiction services indicated.` });
  if (audCl.score >= 4 && audCl.score < 8) clinAlerts.push({ sev:"MODERATE", text:`AUDIT-C score ${audCl.score}/12 — Hazardous use detected. Brief alcohol counselling recommended at next clinical contact.` });
  if (sdqTotal >= 5) clinAlerts.push({ sev:"MODERATE", text:`SDQ-Conduct subscale score ${sdqTotal}/10 — Elevated conduct symptomatology. Consider full SDQ or CBCL if paediatric/adolescent presentation.` });
  if (+bfi.N > 4 && +duke.depression > dn.depression[1]) clinAlerts.push({ sev:"MODERATE", text:`High Neuroticism (T=${Math.round(50+(+bfi.N-3)*10)}) concurrent with elevated Duke Depression — emotionally dysregulated presentation warrants psychotherapy referral.` });

  const AlertBadge = ({sev}) => {
    const cfg = {CRITICAL:{bg:"#FEE2E2",c:"#991B1B"},HIGH:{bg:"#FEF2F2",c:"#DC2626"},MODERATE:{bg:"#FFFBEB",c:"#92400E"}};
    const {bg,c} = cfg[sev]||cfg.MODERATE;
    return <span className="text-xs font-black px-2 py-0.5 rounded" style={{background:bg,color:c}}>{sev}</span>;
  };

  return (
    <div className="space-y-5 text-gray-800">

      {/* ── Lab Report Header ── */}
      <div style={{background:"#F8FAFC",border:"1.5px solid #CBD5E1",borderRadius:16}}>
        <div className="px-4 py-3 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-black text-slate-500 uppercase tracking-widest">CIBS-VALID · Psychometric Lab Report</p>
              <p className="text-xs text-slate-400 mt-0.5">Report ID: {reportId} · {today}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Administered by</p>
              <p className="text-xs font-bold text-slate-700">{mode==="assisted"?"Clinician (Assisted)":"Self-Administered"}</p>
            </div>
          </div>
        </div>
        <div className="px-4 py-3 grid grid-cols-3 gap-4 text-xs">
          {[
            ["Battery","CIBS-VALID v3.0"],
            ["Domains","4 (D1–D4)"],
            ["Total Items","~62 (adaptive)"],
            ["Instruments","Raven's CAT-22 · BFI-10 · DUKE-17 · C-SSRS · AUDIT-C · SDQ-CP"],
          ].map(([k,v])=>(
            <div key={k}>
              <p className="text-slate-400 font-medium">{k}</p>
              <p className="text-slate-700 font-bold leading-tight">{v}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Clinical Alerts Panel ── */}
      {clinAlerts.length > 0 && (
        <div style={{background:"#FFF5F5",border:"2px solid #FCA5A5",borderRadius:16,padding:16}}>
          <p className="text-xs font-black text-red-700 uppercase tracking-wider mb-3">⚠ Clinical Alerts — Action Required</p>
          <div className="space-y-2">
            {clinAlerts.map((a,i)=>(
              <div key={i} className="flex items-start gap-2.5">
                <AlertBadge sev={a.sev}/>
                <p className="text-xs text-red-900 leading-relaxed flex-1">{a.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── D1: Cognitive Function ── */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-2.5 border-b border-slate-100"
          style={{background:"linear-gradient(90deg,#3B82F608,white)"}}>
          <p className="text-xs font-black text-blue-700 uppercase tracking-wider">D1 · Cognitive Function</p>
          <p className="text-xs text-slate-400">Raven's Progressive Matrices — Adaptive CAT (CIBS Edition, 11-item pool)</p>
        </div>
        <div className="p-4">
          {/* Summary row */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            {[
              {label:"Est. CQ",       val:`~${catResult.iq}`,              color:"#3B82F6"},
              {label:"Mental Age",    val:`~${catResult.ma} yrs`,          color:"#8B5CF6"},
              {label:"Percentile",    val:`${catResult.pctRank}th`,        color:"#10B981"},
              {label:"Band / Level",  val:`${catResult.band}/4 · ${catResult.label}`, color:BAND_COLORS[catResult.band]},
            ].map(item=>(
              <div key={item.label} className="rounded-xl p-2 text-center bg-blue-50">
                <p className="text-sm font-black" style={{color:item.color}}>{item.val}</p>
                <p className="text-xs text-gray-500 leading-tight">{item.label}</p>
              </div>
            ))}
          </div>
          {/* Band-by-band table */}
          <table className="w-full mb-3">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left text-xs text-slate-400 font-medium pb-1.5">Band</th>
                <th className="text-left text-xs text-slate-400 font-medium pb-1.5">CQ / MA</th>
                <th className="text-left text-xs text-slate-400 font-medium pb-1.5">Items</th>
                <th className="text-left text-xs text-slate-400 font-medium pb-1.5">Correct</th>
                <th className="text-left text-xs text-slate-400 font-medium pb-1.5">Pass?</th>
              </tr>
            </thead>
            <tbody>
              {[1,2,3,4].map(b=>{
                const reached = b <= catResult.band;
                const bc = catResult.bandScores[b];
                const bt = RAVENS_CAT[b].length;
                const rule = CAT_RULES[b];
                const passed = b < catResult.band; // passed if they advanced past it
                const isFinal = b === catResult.band;
                const passedFinal = isFinal && bc >= rule.passThreshold;
                return (
                  <tr key={b} style={{borderBottom:"1px solid #F1F5F9",
                    background: isFinal ? BAND_COLORS[b]+"08" : "transparent"}}>
                    <td className="py-2 pr-2">
                      <span className="text-xs font-black" style={{color:reached?BAND_COLORS[b]:"#CBD5E1"}}>
                        {BAND_ICONS[b]} B{b}
                      </span>
                    </td>
                    <td className="py-2 pr-2 text-xs text-slate-500">
                      {rule.iqBase}–{rule.iqBase+rule.range} · MA {rule.maLo}–{rule.maHi}y
                    </td>
                    <td className="py-2 pr-2 text-xs text-slate-700 font-bold">
                      {reached ? `${bt}` : '—'}
                    </td>
                    <td className="py-2 pr-2 text-sm font-black"
                      style={{color:reached?(bc>=rule.passThreshold?"#059669":"#DC2626"):"#CBD5E1"}}>
                      {reached ? `${bc}/${bt}` : '—'}
                    </td>
                    <td className="py-2 text-xs font-bold">
                      {!reached ? <span className="text-slate-300">Not reached</span>
                       : passed ? <span className="text-green-600">✓ Advanced</span>
                       : passedFinal ? <span className="text-green-600">✓ Passed</span>
                       : isFinal ? <span className="text-amber-600">Final band</span>
                       : <span className="text-red-500">Stopped here</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="rounded-lg px-3 py-2 bg-blue-50 text-xs text-blue-900 mb-2">
            <strong>Interpretation:</strong> {
              catResult.iq>=125?`Exceptional non-verbal reasoning — Mental Age ~${catResult.ma} yrs (${catResult.pctRank}th percentile). Completed highest band levels with passing scores. Abstract and relational pattern recognition is a primary cognitive strength.`:
              catResult.iq>=110?`Above average fluid intelligence — Mental Age ~${catResult.ma} yrs (${catResult.pctRank}th percentile). Advanced to Band 3+, indicating strong capacity for multi-rule abstract reasoning.`:
              catResult.iq>=90?`Average to high-average cognitive screening — Mental Age ~${catResult.ma} yrs (${catResult.pctRank}th percentile). Passed foundation and standard levels. No significant impairment identified.`:
              `Below average performance on non-verbal reasoning screening — Mental Age ~${catResult.ma} yrs (${catResult.pctRank}th percentile). Stopped at Foundation level. Further formal cognitive assessment (WAIS-IV / NIMHANS Battery) is recommended.`
            }
          </div>
          <p className="text-xs text-slate-400 italic">
            Note: CQ and Mental Age are analogs based on highest band reached and within-band performance (22-item adaptive pool, 4 bands).
            Not a validated IQ/MA measure. Adaptive administration: {catResult.totalQ} of up to 22 items presented.
          </p>
        </div>
      </div>

      {/* ── D2: Personality ── */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-2.5 border-b border-slate-100"
          style={{background:"linear-gradient(90deg,#8B5CF608,white)"}}>
          <p className="text-xs font-black text-purple-700 uppercase tracking-wider">D2 · Personality Profile</p>
          <p className="text-xs text-slate-400">Big Five Inventory-10 (BFI-10; Rammstedt & John, 2007)</p>
        </div>
        <div className="p-4">
          <table className="w-full mb-3">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left text-xs text-slate-400 font-medium pb-1.5 w-6">Dom</th>
                <th className="text-left text-xs text-slate-400 font-medium pb-1.5">Facet</th>
                <th className="text-left text-xs text-slate-400 font-medium pb-1.5">Raw (1–5)</th>
                <th className="text-left text-xs text-slate-400 font-medium pb-1.5">T-Score</th>
                <th className="text-left text-xs text-slate-400 font-medium pb-1.5">Flag</th>
              </tr>
            </thead>
            <tbody>
              {[["O","Openness"],["C","Conscientiousness"],["E","Extraversion"],["A","Agreeableness"],["N","Neuroticism"]].map(([d,label])=>{
                const raw = +bfi[d];
                const tScore = Math.round(50 + (raw-3)*10);
                const nLo = ageNorms.bfi[d][0], nHi = ageNorms.bfi[d][1];
                const flag = tScore>nHi ? `↑ Elevated (T>${nHi})` : tScore<nLo ? `↓ Low (T<${nLo})` : "Within normal range";
                const fColor = tScore>nHi ? "#DC2626" : tScore<nLo ? "#D97706" : "#059669";
                return (
                  <tr key={d} style={{borderBottom:"1px solid #F1F5F9"}}>
                    <td className="py-2 pr-2 text-xs font-black text-slate-400">{d}</td>
                    <td className="py-2 pr-2 text-xs text-slate-700">{label}</td>
                    <td className="py-2 pr-2 text-sm font-black text-slate-800">{raw.toFixed(1)}</td>
                    <td className="py-2 pr-2 text-sm font-black" style={{color:fColor}}>T={tScore}</td>
                    <td className="py-2 text-xs font-semibold" style={{color:fColor}}>{flag}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="rounded-lg px-3 py-2 bg-purple-50 text-xs text-purple-900 mb-2">
            <strong>DSM-5 Personality Trait Pattern:</strong>
            <ul className="mt-1 space-y-0.5 list-disc list-inside">
              {bfiDSM().map((c,i)=><li key={i}>{c}</li>)}
            </ul>
          </div>
          <p className="text-xs text-slate-400 italic">
            Age group: <strong>{ageNorms.label}</strong>. Normal T-range is age-adjusted.
            BFI-10 is a screening instrument. PID-5 recommended if personality disorder evaluation is indicated.
          </p>
        </div>
      </div>

      {/* ── D3: Duke Health Profile ── */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-2.5 border-b border-slate-100"
          style={{background:"linear-gradient(90deg,#10B98108,white)"}}>
          <p className="text-xs font-black text-green-700 uppercase tracking-wider">D3 · Health Profile</p>
          <p className="text-xs text-slate-400">Duke Health Profile (DUKE-17; Parkerson et al., 1990) · Age group: {ageNorms.label}</p>
        </div>
        <div className="p-4">

          {/* ── Psychological Subscale Highlights ── */}
          <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Psychological Subscales</p>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { label:"Depression", val:+duke.depression, lo:ageNorms.depression[0], hi:ageNorms.depression[1], note:"↓ better", color:"#6366F1" },
              { label:"Anxiety",    val:+duke.anxiety,    lo:ageNorms.anxiety[0],    hi:ageNorms.anxiety[1],    note:"↓ better", color:"#F59E0B" },
              { label:"Self-Esteem",val:+duke.selfEsteem, lo:ageNorms.selfEsteem[0], hi:ageNorms.selfEsteem[1], note:"↑ better", color:"#10B981" },
            ].map(({ label, val, lo, hi, note, color }) => {
              const isDeprAnx = note === "↓ better";
              const ok = isDeprAnx ? val <= hi : val >= lo;
              const sc = ok ? "#059669" : "#DC2626";
              const statusLabel = ok ? "Normal" : isDeprAnx ? "Elevated ↑" : "Low ↓";
              return (
                <div key={label} className="rounded-xl p-2.5 text-center border-2"
                  style={{borderColor: sc+"44", background: sc+"0A"}}>
                  <p className="text-lg font-black" style={{color: sc}}>{val}</p>
                  <p className="text-xs font-bold text-slate-600 leading-tight">{label}</p>
                  <p className="text-xs mt-0.5 font-semibold" style={{color: sc}}>{statusLabel}</p>
                  <p className="text-xs text-slate-400">{note} · norm {isDeprAnx?`0–${hi}`:`${lo}–100`}</p>
                </div>
              );
            })}
          </div>

          {/* ── Full functional scales table ── */}
          <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Functional Health Scales</p>
          <table className="w-full mb-3">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left text-xs text-slate-400 font-medium pb-1.5">Subscale</th>
                <th className="text-left text-xs text-slate-400 font-medium pb-1.5">Score</th>
                <th className="text-left text-xs text-slate-400 font-medium pb-1.5">Age Norm</th>
                <th className="text-left text-xs text-slate-400 font-medium pb-1.5">Status</th>
              </tr>
            </thead>
            <tbody>
              <RangeRow label="Physical Health"       val={duke.phys}       lo={ageNorms.phys[0]}       hi={ageNorms.phys[1]}/>
              <RangeRow label="Mental Health"         val={duke.mental}     lo={ageNorms.mental[0]}     hi={ageNorms.mental[1]}/>
              <RangeRow label="Social Health"         val={duke.social}     lo={ageNorms.social[0]}     hi={ageNorms.social[1]}/>
              <RangeRow label="General Health"        val={duke.general}    lo={ageNorms.general[0]}    hi={ageNorms.general[1]}/>
              <RangeRow label="Perceived Health"      val={duke.perceived}  lo={ageNorms.perceived[0]}  hi={ageNorms.perceived[1]}/>
              <RangeRow label="Pain (↓ better)"       val={duke.pain}       lo={ageNorms.pain[0]}       hi={ageNorms.pain[1]}/>
              <RangeRow label="Disability (↓ better)" val={duke.disability} lo={ageNorms.disability[0]} hi={ageNorms.disability[1]}/>
            </tbody>
          </table>
          <div className="rounded-lg px-3 py-2 bg-green-50 text-xs text-green-900">
            <strong>Clinical Summary:</strong> {
              +duke.general>=ageNorms.general[0] ? "General health profile within age-adjusted normal parameters across functional domains." :
              +duke.general>=(ageNorms.general[0]*0.75) ? "Moderate health profile. One or more subscales below age-adjusted normative range. Targeted clinical attention recommended." :
              "Significantly compromised health profile. Multiple subscales below age-adjusted normative range. Multidomain clinical evaluation and intervention planning is indicated."
            }
          </div>
          <p className="text-xs text-slate-400 mt-2 italic">
            Normative reference: Age-adjusted Indian adult population norms. Higher = better for functional scales. Lower = better for Pain and Disability. Psychological subscales: Depression and Anxiety are dysfunction scales (lower=better); Self-Esteem is a positive scale (higher=better).
          </p>
        </div>
      </div>

      {/* ── D4: Risk Factor Profile ── */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-2.5 border-b border-slate-100"
          style={{background:"linear-gradient(90deg,#EF444408,white)"}}>
          <p className="text-xs font-black text-red-700 uppercase tracking-wider">D4 · Risk Factor Profile</p>
          <p className="text-xs text-slate-400">C-SSRS Screen · AUDIT-C · SDQ Conduct Subscale</p>
        </div>
        <div className="p-4 space-y-4">

          {/* C-SSRS */}
          <div>
            <p className="text-xs font-black text-slate-600 uppercase tracking-wider mb-2">Suicidality — C-SSRS (Columbia, 2008)</p>
            <table className="w-full mb-2">
              <tbody>
                {CSSRS.map((q,i)=>{
                  const v = responses.d4[`css${i+1}`];
                  return (
                    <tr key={i} style={{borderBottom:"1px solid #F8FAFC",
                      background:v===true?"#FEF2F2":"transparent"}}>
                      <td className="py-1.5 pr-2 text-xs text-slate-400">{i+1}</td>
                      <td className="py-1.5 pr-2 text-xs text-slate-700">{q}</td>
                      <td className="py-1.5 text-xs font-black text-center w-12"
                        style={{color:v===true?"#DC2626":"#10B981"}}>{v===true?"YES":v===false?"NO":"—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="rounded-lg px-3 py-2 text-xs" style={{background:cssCl.color+"12",border:`1px solid ${cssCl.color}44`}}>
              <div className="flex justify-between items-center">
                <span className="font-black" style={{color:cssCl.color}}>Level {cssCl.level}/4 — {cssCl.label}</span>
                <span className="font-semibold text-slate-600">
                  {cssCl.level===0?"No clinical action required.":
                   cssCl.level===1?"Monitor. Safety check at next appointment.":
                   cssCl.level===2?"Active ideation — safety plan required. Review in 1 week.":
                   cssCl.level===3?"Ideation with plan — urgent clinical assessment today.":
                   "CRITICAL — Imminent risk. Immediate intervention and safety measures required."}
                </span>
              </div>
            </div>
          </div>

          {/* AUDIT-C */}
          <div>
            <p className="text-xs font-black text-slate-600 uppercase tracking-wider mb-2">Alcohol Use — AUDIT-C (WHO, Bush et al. 1998)</p>
            <table className="w-full mb-2">
              <tbody>
                {AUDITC.map((item,i)=>{
                  const v = responses.d4[`aud${i+1}`];
                  const sc = item.sc[v]??0;
                  return (
                    <tr key={i} style={{borderBottom:"1px solid #F8FAFC"}}>
                      <td className="py-1.5 pr-2 text-xs text-slate-700 leading-tight">{item.q}</td>
                      <td className="py-1.5 pr-2 text-xs text-slate-500 text-right">{v!==undefined?item.opts[v]:"—"}</td>
                      <td className="py-1.5 text-sm font-black text-center w-8" style={{color:sc>=2?"#DC2626":"#374151"}}>{sc}</td>
                    </tr>
                  );
                })}
                <tr style={{borderTop:"2px solid #E2E8F0"}}>
                  <td className="py-1.5 text-xs font-black text-slate-700" colSpan={2}>AUDIT-C Total</td>
                  <td className="py-1.5 text-base font-black text-center" style={{color:audCl.color}}>{audCl.score}</td>
                </tr>
              </tbody>
            </table>
            <div className="rounded-lg px-3 py-2 text-xs" style={{background:audCl.color+"12",border:`1px solid ${audCl.color}44`}}>
              <span className="font-black" style={{color:audCl.color}}>{audCl.label} (Score {audCl.score}/12) — </span>
              <span className="text-slate-700">
                {audCl.score<=3?"No significant alcohol use detected.":
                 audCl.score<=7?"Hazardous use pattern. Brief intervention (BI) recommended at next clinical contact.":
                 "Harmful or dependent use. Structured brief intervention + referral to de-addiction services indicated. Consider CAGE or AUDIT-Full if further characterisation needed."}
              </span>
            </div>
          </div>

          {/* SDQ-CP */}
          <div>
            <p className="text-xs font-black text-slate-600 uppercase tracking-wider mb-2">Conduct — SDQ Conduct Subscale (Goodman, 1997)</p>
            <table className="w-full mb-2">
              <tbody>
                {SDQCP.map((item,i)=>{
                  const v = responses.d4[`sdq${i+1}`];
                  const sc = v!==undefined ? (item.rev?2-v:v) : 0;
                  return (
                    <tr key={i} style={{borderBottom:"1px solid #F8FAFC"}}>
                      <td className="py-1.5 pr-2 text-xs text-slate-700">{item.q}</td>
                      <td className="py-1.5 pr-2 text-xs text-slate-400 text-right">{v!==undefined?["Not True","Somewhat True","Certainly True"][v]:"—"}</td>
                      <td className="py-1.5 text-sm font-black text-center w-8">{sc}</td>
                    </tr>
                  );
                })}
                <tr style={{borderTop:"2px solid #E2E8F0"}}>
                  <td className="py-1.5 text-xs font-black text-slate-700" colSpan={2}>SDQ-Conduct Total</td>
                  <td className="py-1.5 text-base font-black text-center"
                    style={{color:sdqTotal>=5?"#DC2626":sdqTotal>=3?"#D97706":"#059669"}}>{sdqTotal}</td>
                </tr>
              </tbody>
            </table>
            <div className="rounded-lg px-3 py-2 text-xs bg-slate-50 border border-slate-200">
              <span className="font-black" style={{color:sdqTotal>=5?"#DC2626":sdqTotal>=3?"#D97706":"#059669"}}>
                {sdqTotal>=5?"Elevated":sdqTotal>=3?"Borderline":"Normal"} ({sdqTotal}/10) — </span>
              <span className="text-slate-700">
                {sdqTotal>=5?"Elevated conduct symptomatology. Full SDQ or CBCL recommended. Consider ADHD comorbidity.":
                 sdqTotal>=3?"Borderline conduct concerns. Monitor and review in clinical context.":
                 "No significant conduct concerns identified on SDQ screening subscale."}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Clinical Summary & Recommendations ── */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-2.5 border-b border-slate-100" style={{background:"#F8FAFC"}}>
          <p className="text-xs font-black text-slate-700 uppercase tracking-wider">Clinical Summary & Recommendations</p>
        </div>
        <div className="p-4 space-y-3">
          {[
            { label:"D1 Cognition",    val:`CQ ~${catResult.iq} · MA ~${catResult.ma} yrs · ${catResult.pctRank}th %ile`, note:catResult.label, color:"#3B82F6" },
            { label:"D2 Personality",  val:`N=T${Math.round(50+(+bfi.N-3)*10)} · C=T${Math.round(50+(+bfi.C-3)*10)} · E=T${Math.round(50+(+bfi.E-3)*10)}`, note:bfiDSM()[0], color:"#8B5CF6" },
            { label:"D3 Health",       val:`General=${duke.general} · Dep=${duke.depression} · Anx=${duke.anxiety}`, note:`SE=${duke.selfEsteem} · Phys=${duke.phys} · Social=${duke.social}`, color:"#10B981" },
            { label:"D4 Risk",         val:`C-SSRS Lv${cssCl.level} · AUDIT-C ${audCl.score}`, note:cssCl.label+" | "+audCl.label, color:cssCl.level>=2?"#DC2626":audCl.score>=4?"#F97316":"#10B981" },
          ].map(item=>(
            <div key={item.label} className="flex items-center gap-3 py-1.5 border-b border-slate-50">
              <span className="w-28 text-xs font-black" style={{color:item.color}}>{item.label}</span>
              <span className="text-xs font-bold text-slate-800 flex-1">{item.val}</span>
              <span className="text-xs text-slate-400 text-right">{item.note}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Examiner Notes ── */}
      {mode==="assisted" && (
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-4">
          <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">Examiner Clinical Notes</p>
          <div className="space-y-3">
            {["Behavioural observations during assessment:","Affect and presentation:","Clinical impression:","Diagnosis (provisional):", "Recommended action / Referral:","Examiner signature / date:"].map(l=>(
              <div key={l}>
                <p className="text-xs font-semibold text-slate-500 mb-0.5">{l}</p>
                <div className="h-7 border-b border-dashed border-slate-200"/>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Report Disclaimer ── */}
      <div className="rounded-xl p-3" style={{background:"#F8FAFC",border:"1px solid #E2E8F0"}}>
        <p className="text-xs text-slate-400 leading-relaxed">
          <strong className="text-slate-500">Disclaimer:</strong> This psychometric screening report is intended for use by qualified mental health
          professionals. It does not constitute a clinical diagnosis under ICD-11 or DSM-5. All findings should be
          interpreted in the context of a full clinical assessment. Instrument citations: BFI-10 (Rammstedt & John, 2007);
          DUKE-17 (Parkerson et al., 1990); C-SSRS (Posner et al., 2011);
          AUDIT-C (Bush et al., 1998); SDQ (Goodman, 1997). Age-adjusted norms: NIMHANS/ICMR adapted reference data.
        </p>
      </div>
    </div>
  );
};

// ═══════════════════════════ MAIN APP ════════════════════════════════════════

export default function CIBSValid() {
  // Screen flow: lang → demographics → welcome → eligibility → consent → assessment → report
  const [screen,       setScreen]       = useState("lang");
  const [lang,         setLang]         = useState("en");
  const [mode,         setMode]         = useState("self");
  const [demographics, setDemographics] = useState(null);
  const [responses,    setResponses]    = useState(null);

  return (
    <div className="font-sans">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;900&family=DM+Mono:wght@400;500&display=swap');
        * { font-family: 'DM Sans', sans-serif; }
        .font-mono { font-family: 'DM Mono', monospace; }
        @media print {
          .print\\:hidden { display: none !important; }
          body { background: white; }
        }
        button:active { transform: scale(0.97); }
      `}</style>

      {screen==="lang" &&
        <LanguageScreen onSelect={l=>{ setLang(l); setScreen("demographics"); }}/>}

      {screen==="demographics" &&
        <Demographics
          mode={mode} lang={lang}
          onComplete={d=>{ setDemographics(d); setScreen("welcome"); }}/>}

      {screen==="welcome" &&
        <Welcome
          onSelf={()=>{ setMode("self"); setScreen("eligibility"); }}
          onClinician={()=>{ setMode("assisted"); setScreen("eligibility"); }}/>}

      {screen==="eligibility" &&
        <Eligibility onResult={r=>{ setMode(r); setScreen("consent"); }}/>}

      {screen==="consent" &&
        <Consent mode={mode} onConsent={()=>setScreen("assessment")}/>}

      {screen==="assessment" &&
        <Assessment mode={mode} onComplete={r=>{ setResponses(r); setScreen("report"); }}/>}

      {screen==="report" && responses && demographics &&
        <Report responses={responses} demographics={demographics} mode={mode}/>}
    </div>
  );
}
