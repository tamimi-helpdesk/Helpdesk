import subprocess

new_ka = '''ka=({isOpen:m,onClose:n,onSave:l})=>{
  const[t,r]=E.useState({
    property:"TBCV",
    propertyName:"TBCV",
    sector:"S01",
    house:"",
    buildingNo:"",
    unitNo:"",
    floor:"GF",
    unitSerialNo:"",
    propertyType:"Executive",
    contractType:"Permanent",
    occupancy:"Single Occupancy",
    status:"Checked in",
    employmentId:"",
    name:"",
    gender:"Male",
    company:"Red Sea Global",
    department:"Operations",
    division:"Projects Delivery",
    asset:"Coastal Village",
    designation:"Specialist",
    category:"Rsg Visitor",
    idIqama:"",
    idExpiryDate:"",
    passport:"",
    passportExpiryDate:"",
    mobile:"",
    email:"",
    nationality:"Saudi Arabia",
    dob:"",
    moveInDate:qe(),
    moveOutDate:"2026-12-31",
    contractStartDate:qe(),
    contractEndDate:"2026-12-31",
    emergencyMobile:"",
    emergencyName:"None",
    vehicleRegNo:"",
    vehicleModel:"",
    carParkSpace:""
  }),
  [a,d]=E.useState(!1);

  if(!m)return null;

  const N=(b,p)=>{
    r(i=>{
      const updated={...i,[b]:p};
      if(["property","propertyName","sector","buildingNo","floor","unitNo"].includes(b)){
        const prop=updated.propertyName||updated.property||"TBCV",sec=updated.sector||"S01",bldg=updated.buildingNo||"",fl=updated.floor||"GF",u=updated.unitNo||"";
        if(bldg&&u){
          updated.unit=`${prop} - ${sec}- ${bldg}- ${fl}- ${u}`;
          if(!i.unitSerialNo||i.unitSerialNo.startsWith("TBCV -")){
            updated.unitSerialNo=`${prop} - ${sec}- ${bldg}- ${fl}- ${u}`;
          }
        }
      }
      return updated;
    });
  },
  c=b=>{
    var p,i;
    if(b.preventDefault(),!((p=t.name)!=null&&p.trim())){
      J.warn("Please enter the resident full name.");
      return;
    }
    if(!((i=t.employmentId)!=null&&i.trim())){
      J.warn("Please enter an Employment ID or Badge Number.");
      return;
    }
    d(!0);
    try{
      const s=(t.buildingNo||t.house||"B01").trim(),
            o=(t.unitNo||t.room||"101").trim(),
            prop=(t.propertyName||t.property||"TBCV").trim(),
            sec=t.sector||"S01",
            fl=t.floor||"GF",
            fullUnit=t.unit||`${prop} - ${sec}- ${s}- ${fl}- ${o}`,
            serial=t.unitSerialNo||fullUnit,
            u={
              ...fe,
              ...t,
              id:`custom-emp-${Date.now()}-${Math.random().toString(36).substring(2,7)}`,
              house:s,
              room:o,
              buildingNo:s,
              unitNo:o,
              floor:fl,
              property:prop,
              propertyName:prop,
              unit:fullUnit,
              unitSerialNo:serial,
              employmentId:(t.employmentId||"").trim(),
              name:(t.name||"").trim(),
              idIqama:(t.idIqama||"").trim(),
              idExpiryDate:t.idExpiryDate||"",
              passport:(t.passport||"").trim(),
              passportExpiryDate:t.passportExpiryDate||"",
              mobile:(t.mobile||"").trim(),
              email:(t.email||"").trim(),
              nationality:(t.nationality||"Saudi Arabia").trim(),
              propertyType:t.propertyType||"Executive",
              status:t.status||"Checked in",
              category:t.category||(t.company?.toLowerCase().includes("visitor")?"Rsg Visitor":"Rsg Staff"),
              company:(t.company||"Red Sea Global").trim(),
              department:(t.department||"Operations").trim(),
              division:(t.division||"Projects Delivery").trim(),
              asset:(t.asset||"").trim(),
              designation:(t.designation||"Specialist").trim(),
              moveInDate:t.moveInDate||qe(),
              moveOutDate:t.moveOutDate||"2026-12-31",
              contractStartDate:t.contractStartDate||t.moveInDate||qe(),
              contractEndDate:t.contractEndDate||t.moveOutDate||"2026-12-31",
              dob:t.dob||"",
              emergencyName:t.emergencyName||"None",
              emergencyMobile:t.emergencyMobile||"",
              vehicleRegNo:t.vehicleRegNo||"",
              vehicleModel:t.vehicleModel||"",
              carParkSpace:t.carParkSpace||"",
              isCustom:!0,
              uploadedAt:new Date().toISOString()
            };
      l(u);
      n();
    }catch(s){
      J.warn((s==null?void 0:s.message)||"Could not save resident record");
    }finally{
      d(!1);
    }
  };

  return e.jsxDEV("div",{className:"fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn",children:
    e.jsxDEV("div",{className:"bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden",children:[
      e.jsxDEV("div",{className:"p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-blue-50/50 via-white to-indigo-50/40 dark:from-slate-900 dark:to-slate-900",children:[
        e.jsxDEV("div",{className:"flex items-center space-x-3",children:[
          e.jsxDEV("div",{className:"w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20",children:
            e.jsxDEV(Yt,{className:"w-5 h-5"},void 0,!1,{},this)
          },void 0,!1,{},this),
          e.jsxDEV("div",{children:[
            e.jsxDEV("h3",{className:"text-base font-bold text-slate-900 dark:text-white flex items-center gap-2",children:[
              e.jsxDEV("span",{children:"Add Resident & Move-In Form Profile"},void 0,!1,{},this),
              e.jsxDEV("span",{className:"text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300",children:"Auto-Syncs"},void 0,!1,{},this)
            ]},void 0,!0,{},this),
            e.jsxDEV("p",{className:"text-xs text-slate-500 dark:text-slate-400",children:"Enter complete Move-In & Move-Out Form (From.docx) information. Once added, instant Word download is ready."},void 0,!1,{},this)
          ]},void 0,!0,{},this)
        ]},void 0,!0,{},this),
        e.jsxDEV("button",{type:"button",onClick:n,className:"w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer",children:
          e.jsxDEV(ye,{className:"w-4 h-4"},void 0,!1,{},this)
        },void 0,!1,{},this)
      ]},void 0,!0,{},this),

      e.jsxDEV("form",{onSubmit:c,className:"flex-1 overflow-y-auto p-4 sm:p-6 space-y-4",children:[
        /* 1. Tenant Details & Personal Documents */
        e.jsxDEV("div",{className:"bg-slate-50/60 dark:bg-slate-800/30 p-3.5 sm:p-4 rounded-2xl border border-slate-200/70 dark:border-slate-800 space-y-3",children:[
          e.jsxDEV("h4",{className:"text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2",children:[
            e.jsxDEV(rt,{className:"w-4 h-4 text-blue-600 dark:text-blue-400"},void 0,!1,{},this),
            e.jsxDEV("span",{children:"1. Tenant Details & Personal Documents (From.docx Section 1)"},void 0,!1,{},this)
          ]},void 0,!0,{},this),
          e.jsxDEV("div",{className:"grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs",children:[
            e.jsxDEV("div",{className:"sm:col-span-2",children:[
              e.jsxDEV("label",{className:"text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1",children:["Resident Full Name ",e.jsxDEV("span",{className:"text-rose-500",children:"*"},void 0,!1,{},this)]},void 0,!0,{},this),
              e.jsxDEV("input",{type:"text",required:!0,value:t.name||"",onChange:b=>N("name",b.target.value),placeholder:"e.g. Tariq Al otaibi",className:"w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"},void 0,!1,{},this)
            ]},void 0,!0,{},this),
            e.jsxDEV("div",{className:"sm:col-span-2",children:[
              e.jsxDEV("label",{className:"text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1",children:["Employment ID / Badge ",e.jsxDEV("span",{className:"text-rose-500",children:"*"},void 0,!1,{},this)]},void 0,!0,{},this),
              e.jsxDEV("input",{type:"text",required:!0,value:t.employmentId||"",onChange:b=>N("employmentId",b.target.value),placeholder:"e.g. 108939",className:"w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"},void 0,!1,{},this)
            ]},void 0,!0,{},this),
            e.jsxDEV("div",{children:[
              e.jsxDEV("label",{className:"text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1",children:"National ID / Iqama"},void 0,!1,{},this),
              e.jsxDEV("input",{type:"text",value:t.idIqama||"",onChange:b=>N("idIqama",b.target.value),placeholder:"e.g. 1096708498",className:"w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"},void 0,!1,{},this)
            ]},void 0,!0,{},this),
            e.jsxDEV("div",{children:[
              e.jsxDEV("label",{className:"text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1",children:"ID / Iqama Expiry Date"},void 0,!1,{},this),
              e.jsxDEV("input",{type:"date",value:t.idExpiryDate||"",onChange:b=>N("idExpiryDate",b.target.value),className:"w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"},void 0,!1,{},this)
            ]},void 0,!0,{},this),
            e.jsxDEV("div",{children:[
              e.jsxDEV("label",{className:"text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1",children:"Passport Number"},void 0,!1,{},this),
              e.jsxDEV("input",{type:"text",value:t.passport||"",onChange:b=>N("passport",b.target.value),placeholder:"e.g. N1234567",className:"w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"},void 0,!1,{},this)
            ]},void 0,!0,{},this),
            e.jsxDEV("div",{children:[
              e.jsxDEV("label",{className:"text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1",children:"Passport Expiry Date"},void 0,!1,{},this),
              e.jsxDEV("input",{type:"date",value:t.passportExpiryDate||"",onChange:b=>N("passportExpiryDate",b.target.value),className:"w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"},void 0,!1,{},this)
            ]},void 0,!0,{},this),
            e.jsxDEV("div",{children:[
              e.jsxDEV("label",{className:"text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1",children:"Nationality"},void 0,!1,{},this),
              e.jsxDEV("input",{type:"text",value:t.nationality||"",onChange:b=>N("nationality",b.target.value),placeholder:"e.g. Saudi Arabia, Jordan",className:"w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"},void 0,!1,{},this)
            ]},void 0,!0,{},this),
            e.jsxDEV("div",{children:[
              e.jsxDEV("label",{className:"text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1",children:"Gender"},void 0,!1,{},this),
              e.jsxDEV("select",{value:t.gender||"Male",onChange:b=>N("gender",b.target.value),className:"w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer",children:[
                e.jsxDEV("option",{value:"Male",children:"Male"},void 0,!1,{},this),
                e.jsxDEV("option",{value:"Female",children:"Female"},void 0,!1,{},this)
              ]},void 0,!0,{},this)
            ]},void 0,!0,{},this),
            e.jsxDEV("div",{children:[
              e.jsxDEV("label",{className:"text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1",children:"Date of Birth (D.O.B)"},void 0,!1,{},this),
              e.jsxDEV("input",{type:"date",value:t.dob||"",onChange:b=>N("dob",b.target.value),className:"w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"},void 0,!1,{},this)
            ]},void 0,!0,{},this),
            e.jsxDEV("div",{children:[
              e.jsxDEV("label",{className:"text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1",children:"Mobile Number"},void 0,!1,{},this),
              e.jsxDEV("input",{type:"text",value:t.mobile||"",onChange:b=>N("mobile",b.target.value),placeholder:"e.g. 0546844775",className:"w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"},void 0,!1,{},this)
            ]},void 0,!0,{},this),
            e.jsxDEV("div",{className:"sm:col-span-2",children:[
              e.jsxDEV("label",{className:"text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1",children:"Email Address"},void 0,!1,{},this),
              e.jsxDEV("input",{type:"email",value:t.email||"",onChange:b=>N("email",b.target.value),placeholder:"resident@example.com",className:"w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"},void 0,!1,{},this)
            ]},void 0,!0,{},this)
          ]},void 0,!0,{},this)
        ]},void 0,!0,{},this),

        /* 2. Accommodation & Unit Information */
        e.jsxDEV("div",{className:"bg-slate-50/60 dark:bg-slate-800/30 p-3.5 sm:p-4 rounded-2xl border border-slate-200/70 dark:border-slate-800 space-y-3",children:[
          e.jsxDEV("h4",{className:"text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2",children:[
            e.jsxDEV(rt,{className:"w-4 h-4 text-emerald-600 dark:text-emerald-400"},void 0,!1,{},this),
            e.jsxDEV("span",{children:"2. Accommodation & Unit Information (From.docx Header)"},void 0,!1,{},this)
          ]},void 0,!0,{},this),
          e.jsxDEV("div",{className:"grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs",children:[
            e.jsxDEV("div",{children:[
              e.jsxDEV("label",{className:"text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1",children:"Property Name (From.docx)"},void 0,!1,{},this),
              e.jsxDEV("input",{type:"text",value:t.propertyName||t.property||"TBCV",onChange:b=>{N("propertyName",b.target.value);N("property",b.target.value);},placeholder:"e.g. TBCV",className:"w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"},void 0,!1,{},this)
            ]},void 0,!0,{},this),
            e.jsxDEV("div",{children:[
              e.jsxDEV("label",{className:"text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1",children:["Building No (House) ",e.jsxDEV("span",{className:"text-rose-500",children:"*"},void 0,!1,{},this)]},void 0,!0,{},this),
              e.jsxDEV("input",{type:"text",required:!0,value:t.buildingNo||"",onChange:b=>N("buildingNo",b.target.value),placeholder:"e.g. H03 or D01",className:"w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"},void 0,!1,{},this)
            ]},void 0,!0,{},this),
            e.jsxDEV("div",{children:[
              e.jsxDEV("label",{className:"text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1",children:["Unit / Room No ",e.jsxDEV("span",{className:"text-rose-500",children:"*"},void 0,!1,{},this)]},void 0,!0,{},this),
              e.jsxDEV("input",{type:"text",required:!0,value:t.unitNo||"",onChange:b=>N("unitNo",b.target.value),placeholder:"e.g. 15 or 112",className:"w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"},void 0,!1,{},this)
            ]},void 0,!0,{},this),
            e.jsxDEV("div",{children:[
              e.jsxDEV("label",{className:"text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1",children:"Floor"},void 0,!1,{},this),
              e.jsxDEV("input",{type:"text",value:t.floor||"",onChange:b=>N("floor",b.target.value),placeholder:"e.g. GF, FF, 1st",className:"w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"},void 0,!1,{},this)
            ]},void 0,!0,{},this),
            e.jsxDEV("div",{children:[
              e.jsxDEV("label",{className:"text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1",children:"Property Type (From.docx Checkbox)"},void 0,!1,{},this),
              e.jsxDEV("select",{value:t.propertyType||"Executive",onChange:b=>N("propertyType",b.target.value),className:"w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer",children:[
                e.jsxDEV("option",{value:"Executive",children:"Executive"},void 0,!1,{},this),
                e.jsxDEV("option",{value:"Senior",children:"Senior"},void 0,!1,{},this),
                e.jsxDEV("option",{value:"Junior",children:"Junior"},void 0,!1,{},this),
                e.jsxDEV("option",{value:"Worker",children:"Worker"},void 0,!1,{},this)
              ]},void 0,!0,{},this)
            ]},void 0,!0,{},this),
            e.jsxDEV("div",{className:"sm:col-span-2",children:[
              e.jsxDEV("label",{className:"text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1",children:"Unit Serial No (Auto-filled on Form)"},void 0,!1,{},this),
              e.jsxDEV("input",{type:"text",value:t.unitSerialNo||"",onChange:b=>N("unitSerialNo",b.target.value),placeholder:"e.g. TBCV - S01- H03- GF- 15",className:"w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"},void 0,!1,{},this)
            ]},void 0,!0,{},this),
            e.jsxDEV("div",{children:[
              e.jsxDEV("label",{className:"text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1",children:"Contract Type"},void 0,!1,{},this),
              e.jsxDEV("select",{value:t.contractType||"Permanent",onChange:b=>N("contractType",b.target.value),className:"w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer",children:[
                e.jsxDEV("option",{value:"Permanent",children:"Permanent"},void 0,!1,{},this),
                e.jsxDEV("option",{value:"Temporary",children:"Temporary"},void 0,!1,{},this),
                e.jsxDEV("option",{value:"Visitor",children:"Visitor"},void 0,!1,{},this)
              ]},void 0,!0,{},this)
            ]},void 0,!0,{},this),
            e.jsxDEV("div",{children:[
              e.jsxDEV("label",{className:"text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1",children:"Occupancy Status"},void 0,!1,{},this),
              e.jsxDEV("select",{value:t.status||"Checked in",onChange:b=>N("status",b.target.value),className:"w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer",children:[
                e.jsxDEV("option",{value:"Checked in",children:"Checked in"},void 0,!1,{},this),
                e.jsxDEV("option",{value:"Active",children:"Active"},void 0,!1,{},this),
                e.jsxDEV("option",{value:"Checked out",children:"Checked out"},void 0,!1,{},this)
              ]},void 0,!0,{},this)
            ]},void 0,!0,{},this)
          ]},void 0,!0,{},this)
        ]},void 0,!0,{},this),

        /* 3. Stay & Contract Dates */
        e.jsxDEV("div",{className:"bg-slate-50/60 dark:bg-slate-800/30 p-3.5 sm:p-4 rounded-2xl border border-slate-200/70 dark:border-slate-800 space-y-3",children:[
          e.jsxDEV("h4",{className:"text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2",children:[
            e.jsxDEV(rt,{className:"w-4 h-4 text-purple-600 dark:text-purple-400"},void 0,!1,{},this),
            e.jsxDEV("span",{children:"3. Stay & Contract Dates (From.docx Header)"},void 0,!1,{},this)
          ]},void 0,!0,{},this),
          e.jsxDEV("div",{className:"grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs",children:[
            e.jsxDEV("div",{children:[
              e.jsxDEV("label",{className:"text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1",children:["Check-In Date ",e.jsxDEV("span",{className:"text-rose-500",children:"*"},void 0,!1,{},this)]},void 0,!0,{},this),
              e.jsxDEV("input",{type:"date",required:!0,value:t.moveInDate||"",onChange:b=>N("moveInDate",b.target.value),className:"w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"},void 0,!1,{},this)
            ]},void 0,!0,{},this),
            e.jsxDEV("div",{children:[
              e.jsxDEV("label",{className:"text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1",children:"Check-Out Date"},void 0,!1,{},this),
              e.jsxDEV("input",{type:"date",value:t.moveOutDate||"",onChange:b=>N("moveOutDate",b.target.value),className:"w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"},void 0,!1,{},this)
            ]},void 0,!0,{},this),
            e.jsxDEV("div",{children:[
              e.jsxDEV("label",{className:"text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1",children:"Contract Start Date"},void 0,!1,{},this),
              e.jsxDEV("input",{type:"date",value:t.contractStartDate||"",onChange:b=>N("contractStartDate",b.target.value),className:"w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"},void 0,!1,{},this)
            ]},void 0,!0,{},this),
            e.jsxDEV("div",{children:[
              e.jsxDEV("label",{className:"text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1",children:"Contract End Date"},void 0,!1,{},this),
              e.jsxDEV("input",{type:"date",value:t.contractEndDate||"",onChange:b=>N("contractEndDate",b.target.value),className:"w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"},void 0,!1,{},this)
            ]},void 0,!0,{},this)
          ]},void 0,!0,{},this)
        ]},void 0,!0,{},this),

        /* 4. Company, Division & Assigned Project */
        e.jsxDEV("div",{className:"bg-slate-50/60 dark:bg-slate-800/30 p-3.5 sm:p-4 rounded-2xl border border-slate-200/70 dark:border-slate-800 space-y-3",children:[
          e.jsxDEV("h4",{className:"text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2",children:[
            e.jsxDEV(rt,{className:"w-4 h-4 text-indigo-600 dark:text-indigo-400"},void 0,!1,{},this),
            e.jsxDEV("span",{children:"4. Company, Division & Assigned Project (From.docx Tenant Details)"},void 0,!1,{},this)
          ]},void 0,!0,{},this),
          e.jsxDEV("div",{className:"grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs",children:[
            e.jsxDEV("div",{children:[
              e.jsxDEV("label",{className:"text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1",children:"Company Name"},void 0,!1,{},this),
              e.jsxDEV("input",{type:"text",value:t.company||"",onChange:b=>N("company",b.target.value),placeholder:"e.g. Red Sea Global",className:"w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"},void 0,!1,{},this)
            ]},void 0,!0,{},this),
            e.jsxDEV("div",{children:[
              e.jsxDEV("label",{className:"text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1",children:"Department"},void 0,!1,{},this),
              e.jsxDEV("input",{type:"text",value:t.department||"",onChange:b=>N("department",b.target.value),placeholder:"e.g. Operations",className:"w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"},void 0,!1,{},this)
            ]},void 0,!0,{},this),
            e.jsxDEV("div",{children:[
              e.jsxDEV("label",{className:"text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1",children:"Designation / Role"},void 0,!1,{},this),
              e.jsxDEV("input",{type:"text",value:t.designation||"",onChange:b=>N("designation",b.target.value),placeholder:"e.g. Specialist",className:"w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"},void 0,!1,{},this)
            ]},void 0,!0,{},this),
            e.jsxDEV("div",{children:[
              e.jsxDEV("label",{className:"text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1",children:"Program (Division)"},void 0,!1,{},this),
              e.jsxDEV("input",{type:"text",value:t.division||"",onChange:b=>N("division",b.target.value),placeholder:"e.g. Projects Delivery",className:"w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"},void 0,!1,{},this)
            ]},void 0,!0,{},this),
            e.jsxDEV("div",{children:[
              e.jsxDEV("label",{className:"text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1",children:"Assigned Asset"},void 0,!1,{},this),
              e.jsxDEV("input",{type:"text",value:t.asset||"",onChange:b=>N("asset",b.target.value),placeholder:"e.g. Coastal Village",className:"w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"},void 0,!1,{},this)
            ]},void 0,!0,{},this)
          ]},void 0,!0,{},this)
        ]},void 0,!0,{},this),

        /* 5. Emergency Contact & Vehicle Details */
        e.jsxDEV("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-4",children:[
          /* Emergency Contact */
          e.jsxDEV("div",{className:"bg-slate-50/60 dark:bg-slate-800/30 p-3.5 sm:p-4 rounded-2xl border border-slate-200/70 dark:border-slate-800 space-y-3",children:[
            e.jsxDEV("h4",{className:"text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2",children:[
              e.jsxDEV(rt,{className:"w-4 h-4 text-rose-600 dark:text-rose-400"},void 0,!1,{},this),
              e.jsxDEV("span",{children:"5. Emergency Contact"},void 0,!1,{},this)
            ]},void 0,!0,{},this),
            e.jsxDEV("div",{className:"grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs",children:[
              e.jsxDEV("div",{children:[
                e.jsxDEV("label",{className:"text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1",children:"Contact Person Name"},void 0,!1,{},this),
                e.jsxDEV("input",{type:"text",value:t.emergencyName||"",onChange:b=>N("emergencyName",b.target.value),placeholder:"e.g. Family member or None",className:"w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"},void 0,!1,{},this)
              ]},void 0,!0,{},this),
              e.jsxDEV("div",{children:[
                e.jsxDEV("label",{className:"text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1",children:"Emergency Phone"},void 0,!1,{},this),
                e.jsxDEV("input",{type:"text",value:t.emergencyMobile||"",onChange:b=>N("emergencyMobile",b.target.value),placeholder:"e.g. 0546844775",className:"w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"},void 0,!1,{},this)
              ]},void 0,!0,{},this)
            ]},void 0,!0,{},this)
          ]},void 0,!0,{},this),

          /* Vehicle Details */
          e.jsxDEV("div",{className:"bg-slate-50/60 dark:bg-slate-800/30 p-3.5 sm:p-4 rounded-2xl border border-slate-200/70 dark:border-slate-800 space-y-3",children:[
            e.jsxDEV("h4",{className:"text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2",children:[
              e.jsxDEV(rt,{className:"w-4 h-4 text-amber-600 dark:text-amber-400"},void 0,!1,{},this),
              e.jsxDEV("span",{children:"6. Vehicle & Parking Details (Optional)"},void 0,!1,{},this)
            ]},void 0,!0,{},this),
            e.jsxDEV("div",{className:"grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs",children:[
              e.jsxDEV("div",{children:[
                e.jsxDEV("label",{className:"text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1",children:"Reg. Number"},void 0,!1,{},this),
                e.jsxDEV("input",{type:"text",value:t.vehicleRegNo||"",onChange:b=>N("vehicleRegNo",b.target.value),placeholder:"e.g. 1234 ABC",className:"w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"},void 0,!1,{},this)
              ]},void 0,!0,{},this),
              e.jsxDEV("div",{children:[
                e.jsxDEV("label",{className:"text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1",children:"Make / Model / Color"},void 0,!1,{},this),
                e.jsxDEV("input",{type:"text",value:t.vehicleModel||"",onChange:b=>N("vehicleModel",b.target.value),placeholder:"e.g. Toyota Camry White",className:"w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"},void 0,!1,{},this)
              ]},void 0,!0,{},this),
              e.jsxDEV("div",{children:[
                e.jsxDEV("label",{className:"text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1",children:"Car Park Space No."},void 0,!1,{},this),
                e.jsxDEV("input",{type:"text",value:t.carParkSpace||"",onChange:b=>N("carParkSpace",b.target.value),placeholder:"e.g. P-42",className:"w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"},void 0,!1,{},this)
              ]},void 0,!0,{},this)
            ]},void 0,!0,{},this)
          ]},void 0,!0,{},this)
        ]},void 0,!0,{},this),

        /* Footer Actions */
        e.jsxDEV("div",{className:"pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between",children:[
          e.jsxDEV("span",{className:"text-[11px] text-slate-500 hidden sm:inline-block",children:"Resident will be saved to server, selected automatically, and ready for Word Form download."},void 0,!1,{},this),
          e.jsxDEV("div",{className:"flex items-center space-x-2.5 ml-auto",children:[
            e.jsxDEV("button",{type:"button",onClick:n,className:"px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition cursor-pointer",children:"Cancel"},void 0,!1,{},this),
            e.jsxDEV("button",{type:"submit",disabled:a,className:"px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold flex items-center space-x-2 transition shadow-md cursor-pointer disabled:opacity-50",children:[
              e.jsxDEV(be,{className:"w-4 h-4"},void 0,!1,{},this),
              e.jsxDEV("span",{children:a?"Saving...":"Save & Select Resident"},void 0,!1,{},this)
            ]},void 0,!0,{},this)
          ]},void 0,!0,{},this)
        ]},void 0,!0,{},this)
      ]},void 0,!0,{},this)
    ]},void 0,!0,{},this)
  },void 0,!1,{},this);
}'''

with open('docs/assets/BlankFormsManager-9T2xyd-A.js', 'r') as f:
    c = f.read()

start_ka = c.find('ka=({isOpen:m,onClose:n,onSave:l})=>')
pos_next = c.find(',qt=""+\nnew URL' if ',qt=""+\nnew URL' in c else ',qt=""+\nnew URL')
if pos_next == -1:
    pos_next = c.find(',qt=""')

if start_ka == -1 or pos_next == -1:
    print('Failed to locate ka bounds!')
    exit(1)

c_new = c[:start_ka] + new_ka + c[pos_next:]

with open('docs/assets/BlankFormsManager-9T2xyd-A.js', 'w') as f:
    f.write(c_new)

print('Successfully replaced ka! New length:', len(c_new))
