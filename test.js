
const document = {
  getElementById: id => ({
    value: id === 'time-view' ? '120' : (id === 'username' ? 'demo' : ''),
    classList: { add:()=>0, remove:()=>0, toggle:()=>0 },
    innerText: '',
    innerHTML: '',
    getContext: () => ({}),
    getAttribute: () => 'test',
    checkValidity: () => true,
    addEventListener: () => {},
    querySelector: () => ({ innerHTML: '' })
  }),
  querySelectorAll: () => []
};
const window = {
  localStorage: {
    getItem: () => null,
    setItem: () => {}
  }
};
const localStorage = window.localStorage;
const prompt = () => {};
const alert = () => {};
class Chart { destroy() {} }
const Intl = { NumberFormat: class { format(x) { return x; } } };

// === State & Defaults ===
const DEFAULTS = {
  initialCash: 0,
  purchasePrice: 13000000, downPaymentPct: 5, loanTermYears: 8,
  salary: 90000, salaryGrowth: 10, bonus: 1250000, bonusGrowth: 0,
  otherIncome: 0, otherIncomeGrowth: 0,
  rent: 18000, rentStopMonth: 60, homeExp: 15000, homeExpGrowth: 20,
  alexExp: 10000, alexExpGrowth: 0, verenaExp: 4000, verenaExpGrowth: 20,
  emadExp: 17000, personalExp: 20000, nurseryExp: 10000, nurseryStartMonth: 12,
  schoolExp: 200000, schoolStartYear: 4
};

let user = null, scenarios = [], currIdx = 0, chartInst = null, uploadData = [];
const fmt = new Intl.NumberFormat()
const v = id => parseFloat(document.getElementById(id).value) || 0;
const getId = id => document.getElementById(id);

// === Auth & Storage ===
function login() {
  const u = getId('username').value.trim();
  if(!u) return;
  user = u;
  getId('login-screen').classList.add('hidden');
  getId('app-screen').classList.remove('hidden');
  getId('user-display').innerText = u;
  let data = localStorage.getItem('cfm_' + user);
  if(data) { 
    scenarios = JSON.parse(data); 
    scenarios.forEach(s => s.assumptions = Object.assign({}, DEFAULTS, s.assumptions));
  }
  else { scenarios = [createScenario('Current Plan')]; save(); }
  currIdx = Math.min(currIdx, Math.max(0, scenarios.length - 1));
  loadUI();
}

function logout() {
  user = null; scenarios = []; currIdx = 0;
  getId('login-screen').classList.remove('hidden');
  getId('app-screen').classList.add('hidden');
  getId('username').value = '';
}

function save() {
  if(user) localStorage.setItem('cfm_' + user, JSON.stringify(scenarios));
}

function createScenario(name) {
  return { id: Date.now(), name, displayCurr: 'EGP', rates: { USD: 50, AED: 13.6 }, assumptions: {...DEFAULTS}, customItems: [] };
}

// === Scenario Management ===
function switchScenario() {
  currIdx = parseInt(getId('scenario-select').value);
  loadUI();
}
function newScenario() {
  let n = prompt("Scenario Name:");
  if(!n) return;
  scenarios.push(createScenario(n));
  currIdx = scenarios.length - 1;
  save(); loadUI();
}
function copyScenario() {
  let n = prompt("New Scenario Name:", scenarios[currIdx].name + " Copy");
  if(!n) return;
  let s = JSON.parse(JSON.stringify(scenarios[currIdx]));
  s.id = Date.now(); s.name = n;
  scenarios.push(s);
  currIdx = scenarios.length - 1;
  save(); loadUI();
}
function delScenario() {
  if(scenarios.length <= 1) return alert("Cannot delete last scenario.");
  if(!confirm("Delete scenario?")) return;
  scenarios.splice(currIdx, 1);
  currIdx = Math.max(0, currIdx - 1);
  save(); loadUI();
}

// === UI Syncing ===
function loadUI() {
  let sc = scenarios[currIdx];
  // Rebuild select
  const sel = getId('scenario-select');
  sel.innerHTML = scenarios.map((s,i) => `<option value="${i}">${s.name}</option>`).join('');
  sel.value = currIdx;
  
  getId('disp-curr').value = sc.displayCurr;
  getId('rate-usd').value = sc.rates.USD;
  getId('rate-aed').value = sc.rates.AED;
  
  // Populate inputs
  document.querySelectorAll('[data-model]').forEach(el => {
    let k = el.getAttribute('data-model');
    if(sc.assumptions[k] !== undefined) el.value = sc.assumptions[k];
  });
  
  render();
}

function saveInputs() {
  let sc = scenarios[currIdx];
  document.querySelectorAll('[data-model]').forEach(el => {
    let k = el.getAttribute('data-model');
    if(el.checkValidity()) sc.assumptions[k] = parseFloat(el.value) || 0;
  });
  save(); render();
}

function updateDispCurr() { scenarios[currIdx].displayCurr = getId('disp-curr').value; save(); render(); }
function saveRates() {
  scenarios[currIdx].rates.USD = v('rate-usd') || 50;
  scenarios[currIdx].rates.AED = v('rate-aed') || 13.6;
  save(); render();
  getId('rate-modal').classList.add('hidden');
}

// === Custom Items ===
let editCiId = -1;
function renderCustomItems() {
  const sc = scenarios[currIdx];
  const list = getId('custom-items-list');
  list.innerHTML = sc.customItems.map((ci, i) => `
    <div class="flex justify-between items-center bg-slate-100 border p-2 rounded">
      <div>
        <div class="font-bold whitespace-nowrap overflow-hidden text-ellipsis w-24 md:w-32">${ci.name}</div>
        <div class="${ci.type === 'income' ? 'text-green-600' : 'text-red-600'} text-xs">
          ${fmt.format(ci.amount)} ${ci.currency} (${ci.freq})
        </div>
        <div class="text-[10px] text-gray-500">Y${ci.sy}M${ci.sm} to Y${ci.ey}M${ci.em}</div>
      </div>
      <div class="flex flex-col gap-1">
        <button onclick="openCustomModal(${i})" class="text-xs bg-white border px-2 py-1 rounded shadow-sm hover:bg-slate-50">Edit</button>
        <button onclick="delCustomItem(${i})" class="text-xs bg-red-100 text-red-700 px-2 py-1 rounded shadow-sm hover:bg-red-200">Del</button>
      </div>
    </div>
  `).join('');
}

function openCustomModal(i) {
  editCiId = i;
  const sc = scenarios[currIdx];
  getId('ci-modal-title').innerText = i < 0 ? "New Custom Item" : "Edit Custom Item";
  let ci = i >= 0 ? sc.customItems[i] : { name:'', type:'expense', currency:'EGP', amount:'', freq:'monthly', growth:0, sy:1, sm:1, ey:10, em:12 };
  
  getId('ci-name').value = ci.name; getId('ci-type').value = ci.type;
  getId('ci-currency').value = ci.currency; getId('ci-amount').value = ci.amount;
  getId('ci-freq').value = ci.freq; getId('ci-growth').value = ci.growth;
  getId('ci-start-y').value = ci.sy; getId('ci-start-m').value = ci.sm;
  getId('ci-end-y').value = ci.ey; getId('ci-end-m').value = ci.em;
  
  getId('custom-item-modal').classList.remove('hidden');
}

function saveCustomItem() {
  const sy = v('ci-start-y'), sm = v('ci-start-m'), ey = v('ci-end-y'), em = v('ci-end-m');
  if(sy*12 + sm > ey*12 + em) return alert("Start date must be before end date");
  if(v('ci-amount') < 0) return alert("Amount must be positive");
  
  let ci = {
    id: editCiId < 0 ? Date.now() : scenarios[currIdx].customItems[editCiId].id,
    name: getId('ci-name').value || 'Item', type: getId('ci-type').value,
    currency: getId('ci-currency').value, amount: v('ci-amount'),
    freq: getId('ci-freq').value, growth: v('ci-growth'),
    sy, sm, ey, em
  };
  
  if(editCiId < 0) scenarios[currIdx].customItems.push(ci);
  else scenarios[currIdx].customItems[editCiId] = ci;
  
  save(); render();
  getId('custom-item-modal').classList.add('hidden');
}

function delCustomItem(i) {
  scenarios[currIdx].customItems.splice(i, 1);
  save(); render();
}

// === Calculation Engine ===
function calcCashFlow(sc, months) {
  const rT = c => c==='USD'?sc.rates.USD : c==='AED'?sc.rates.AED : 1;
  const cvt = (amt, from, to) => amt * rT(from) / rT(to);
  const a = sc.assumptions;
  let flow = [], cum = 0, dC = sc.displayCurr;
  
  let dp = a.purchasePrice * (a.downPaymentPct / 100);
  let inst = (a.purchasePrice - dp) / (a.loanTermYears * 4);
  let loanMs = a.loanTermYears * 12;
  
  let initial = a.initialCash || 0;
  flow.push({ m:0, y:0, miny:0, inc:0, exp:cvt(dp,'EGP',dC), net:cvt(initial-dp,'EGP',dC), cum:cvt(initial-dp,'EGP',dC) });
  cum = initial - dp; // Keep internal cum in EGP

  for(let m=1; m<=months; m++) {
    let y = Math.ceil(m/12), miny = m - (y-1)*12;
    let inE=0, exE=0;
    
    // Core
    inE += a.salary * Math.pow(1 + (a.salaryGrowth||0)/100, y-1);
    inE += (a.otherIncome||0) * Math.pow(1 + (a.otherIncomeGrowth||0)/100, y-1);
    if(miny === 3) inE += (a.bonus||0) * Math.pow(1 + (a.bonusGrowth||0)/100, y-1);
    
    if(m <= a.rentStopMonth) exE += a.rent;
    exE += a.homeExp * Math.pow(1 + a.homeExpGrowth/100, y-1);
    exE += a.alexExp * Math.pow(1 + a.alexExpGrowth/100, y-1);
    exE += a.verenaExp * Math.pow(1 + a.verenaExpGrowth/100, y-1);
    exE += a.emadExp + a.personalExp;
    
    if(m >= a.nurseryStartMonth && m <= (a.schoolStartYear-1)*12) exE += a.nurseryExp;
    if(y >= a.schoolStartYear && miny === 3) exE += a.schoolExp;
    if(m%3 === 0 && m <= loanMs) exE += inst;
    
    // Custom
    for(let ci of sc.customItems) {
      let stM = (ci.sy-1)*12 + ci.sm, enM = (ci.ey-1)*12 + ci.em;
      if(m >= stM && m <= enM) {
        let act = false;
        if(ci.freq === 'monthly') act = true;
        else if(ci.freq === 'annual' && (m-stM)%12 === 0) act = true;
        else if(ci.freq === 'one-time' && m === stM) act = true;
        
        if(act) {
          let cY = Math.floor((m-stM)/12);
          let amt = ci.amount * Math.pow(1 + ci.growth/100, cY);
          let valE = cvt(amt, ci.currency, 'EGP');
          if(ci.type === 'income') inE += valE; else exE += valE;
        }
      }
    }
    
    cum += (inE - exE);
    flow.push({ 
      m, y, miny, 
      inc: cvt(inE,'EGP',dC), exp: cvt(exE,'EGP',dC), 
      net: cvt(inE-exE,'EGP',dC), cum: cvt(cum,'EGP',dC) 
    });
  }
  return flow;
}

// === Rendering ===
function render() {
  renderCustomItems();
  const sc = scenarios[currIdx];
  const tv = parseInt(getId('time-view').value);
  const flow = calcCashFlow(sc, tv);
  
  // Warning
  let minC = 0, minF = null, minL = null;
  for(let f of flow) {
    if(f.cum < 0) {
      if(minF === null) minF = f.m;
      minL = f.m;
      minC = Math.min(minC, f.cum);
    }
  }
  const wb = getId('warning-banner');
  if(minC < 0) {
    wb.classList.remove('hidden');
    wb.innerHTML = `<b>⚠️ Deficit detected!</b> Cash balance is negative from Month <b>${minF}</b> to <b>${minL}</b>. Lowest point: <b>${fmt.format(Math.abs(minC))} ${sc.displayCurr}</b> shortfall.`;
  } else wb.classList.add('hidden');
  
  // KPIs
  let totalInc = flow.reduce((s,f) => s+f.inc, 0);
  let totalExp = flow.reduce((s,f) => s+f.exp, 0);
  let endBal = flow[flow.length-1].cum;
  getId('kpi-dashboard').innerHTML = `
    <div class="bg-white p-4 rounded shadow border-l-4 border-blue-500 flex flex-col justify-center">
      <div class="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Starting Cash</div>
      <div class="text-xl font-black text-slate-800">${fmt.format(sc.assumptions.initialCash || 0)} <span class="text-xs text-slate-500 font-normal">EGP</span></div>
    </div>
    <div class="bg-white p-4 rounded shadow border-l-4 border-green-500 flex flex-col justify-center">
      <div class="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Period Income</div>
      <div class="text-xl font-black text-green-700">${fmt.format(totalInc)} <span class="text-xs text-green-600/70 font-normal">${dC}</span></div>
    </div>
    <div class="bg-white p-4 rounded shadow border-l-4 border-red-500 flex flex-col justify-center">
      <div class="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Period Expense</div>
      <div class="text-xl font-black text-red-700">${fmt.format(totalExp)} <span class="text-xs text-red-600/70 font-normal">${dC}</span></div>
    </div>
    <div class="bg-white p-4 rounded shadow border-l-4 ${endBal >= 0 ? 'border-indigo-500' : 'border-red-500'} flex flex-col justify-center">
      <div class="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Ending Net Balance</div>
      <div class="text-xl font-black ${endBal >= 0 ? 'text-indigo-700' : 'text-red-700'}">${fmt.format(endBal)} <span class="text-xs text-indigo-500/70 font-normal">${dC}</span></div>
    </div>
  `;

  // Chart
  const ctx = getId('cfChart').getContext('2d');
  if(chartInst) chartInst.destroy();
  const cType = getId('chart-type').value;
  const dC = sc.displayCurr;
  
  if(cType === 'line') {
    chartInst = new Chart(ctx, {
      type: 'line',
      data: {
        labels: flow.map(f => f.m===0?'Start':`M${f.m}`),
        datasets: [{ label:`Cum. Balance (${dC})`, data: flow.map(f=>f.cum), borderColor: '#2563eb', backgroundColor:'rgba(37,99,235,0.1)', fill:true }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  } else if(cType === 'stacked') {
    chartInst = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: flow.map(f => f.m===0?'Start':`M${f.m}`),
        datasets: [
          { label:'Income', data: flow.map(f=>f.inc), backgroundColor: '#16a34a' },
          { label:'Expense', data: flow.map(f=>f.exp), backgroundColor: '#dc2626' }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false, scales: { x:{stacked:true}, y:{stacked:true} } }
    });
  } else {
    let ys = [], yl = [];
    for(let i=1; i<=Math.ceil(tv/12); i++){
      let mo = flow.find(x => x.y === i && x.miny === 12) || flow.filter(x=>x.y===i).pop();
      if(mo) { ys.push(mo.cum); yl.push(`Year ${i}`); }
    }
    chartInst = new Chart(ctx, {
      type: 'bar',
      data: { labels: yl, datasets: [{ label:`Year-End Balance (${dC})`, data: ys, backgroundColor: '#ca8a04' }] },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }
  
  // Tables
  const tcls = v => v >= 0 ? 'text-green-700 font-medium' : 'text-red-700 font-bold';
  const aTb = getId('annual-table').querySelector('tbody'), mTb = getId('monthly-table').querySelector('tbody');
  
  let aT = '', yrs = Math.ceil(tv/12);
  for(let y=1; y<=yrs; y++){
    let yf = flow.filter(f => f.y === y);
    let inc = yf.reduce((s,f)=>s+f.inc, 0), exp = yf.reduce((s,f)=>s+f.exp, 0);
    if(y===1) { exp += flow[0].exp; }
    let net = inc - exp, cum = yf[yf.length-1]?yf[yf.length-1].cum:0;
    aT += `<tr><td class="text-left p-2 border-b">Year ${y}</td><td class="p-2 border-b">${fmt.format(inc)}</td><td class="p-2 border-b">${fmt.format(exp)}</td><td class="p-2 border-b ${tcls(net)}">${fmt.format(net)}</td><td class="p-2 border-b ${tcls(cum)}">${fmt.format(cum)}</td></tr>`;
  }
  aTb.innerHTML = aT;
  
  mTb.innerHTML = flow.map(f => `<tr><td class="text-left p-2 border-b">${f.m===0?'Start':`M${f.m} (Y${f.y})`}</td><td class="p-2 border-b text-green-700">${fmt.format(f.inc)}</td><td class="p-2 border-b text-red-700">${fmt.format(f.exp)}</td><td class="p-2 border-b ${tcls(f.net)}">${fmt.format(f.net)}</td><td class="p-2 border-b ${tcls(f.cum)}">${fmt.format(f.cum)}</td></tr>`).join('');
}

// Table sorting logic (alphabetical parsing numbers)
document.querySelectorAll('th').forEach(th => th.addEventListener('click', function() {
  const table = th.closest('table'), tbody = table.querySelector('tbody');
  const dir = this.asc = !this.asc;
  const idx = Array.from(th.parentNode.children).indexOf(th);
  Array.from(tbody.querySelectorAll('tr')).sort((a,b) => {
    let v1 = a.children[idx].innerText.replace(/,/g,''), v2 = b.children[idx].innerText.replace(/,/g,'');
    let n1 = parseFloat(v1), n2 = parseFloat(v2);
    if(!isNaN(n1) && !isNaN(n2)) return dir ? n1 - n2 : n2 - n1;
    return dir ? v1.localeCompare(v2) : v2.localeCompare(v1);
  }).forEach(tr => tbody.appendChild(tr));
}));

// === Excel Processing ===
getId('excel-file').addEventListener('change', e => {
  let file = e.target.files[0];
  if(!file) return;
  let reader = new FileReader();
  reader.onload = evt => {
    let wb = XLSX.read(evt.target.result, {type: 'binary'});
    let json = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {header:1, defval:''});
    if(json.length < 2) return alert("Empty or invalid file");
    
    let heads = json[0].map(String);
    uploadData = json.slice(1);
    
    let reqs = ['Name','Type','Amount','Currency','Frequency','StartYear','StartMonth','EndYear','EndMonth'];
    getId('mapping-fields').innerHTML = reqs.map(r => {
      let mIdx = heads.findIndex(h => h.toLowerCase().trim() === r.toLowerCase());
      let opts = heads.map((h,i) => `<option value="${i}" ${i===mIdx?'selected':''}>${h}</option>`).join('');
      return `<div><label class="block text-xs">${r}</label><select id="map-${r}" class="border w-full p-1"><option value="">-- Ignore/Default --</option>${opts}</select></div>`;
    }).join('');
    
    getId('mapping-area').classList.remove('hidden');
    getId('upload-process-btn').classList.remove('hidden');
  };
  reader.readAsBinaryString(file);
});

function processUpload() {
  let sc = scenarios[currIdx];
  if(getId('replace-items').checked) sc.customItems = [];
  const gM = id => getId('map-'+id).value, pI = (v,d) => parseInt(v)||d, pF = (v,d) => parseFloat(v)||d;
  
  let m = {n:gM('Name'), t:gM('Type'), a:gM('Amount'), c:gM('Currency'), f:gM('Frequency'), sy:gM('StartYear'), sm:gM('StartMonth'), ey:gM('EndYear'), em:gM('EndMonth')};
  
  uploadData.forEach(r => {
    if(m.n==="" || m.a==="" || !r[m.n] || !r[m.a]) return;
    sc.customItems.push({
      id: Date.now()+Math.random(),
      name: r[m.n], type: (r[m.t]||'expense').toString().toLowerCase(), amount: pF(r[m.a],0),
      currency: (r[m.c]||'EGP').toString().toUpperCase(), freq: (r[m.f]||'monthly').toString().toLowerCase(),
      growth: 0, sy: pI(r[m.sy],1), sm: pI(r[m.sm],1), ey: pI(r[m.ey],10), em: pI(r[m.em],12)
    });
  });
  
  save(); render(); closeUpload();
}

function closeUpload() { getId('upload-modal').classList.add('hidden'); getId('excel-file').value = ''; getId('mapping-area').classList.add('hidden'); getId('upload-process-btn').classList.add('hidden'); }

// === CSV Export ===
function exportCSV(type) {
  let sc = scenarios[currIdx], tv = parseInt(getId('time-view').value), flow = calcCashFlow(sc, tv);
  let csv = '', d = new Date().toISOString().split('T')[0];
  
  if(type === 'annual') {
    csv = 'Year,Income,Expense,Net,EndBalance\n';
    let yrs = Math.ceil(tv/12);
    for(let y=1; y<=yrs; y++){
      let yf = flow.filter(f=>f.y===y);
      let inc = yf.reduce((s,f)=>s+f.inc,0), exp = yf.reduce((s,f)=>s+f.exp,0);
      if(y===1) exp += flow[0].exp;
      csv += `${y},${inc},${exp},${inc-exp},${yf.length?yf[yf.length-1].cum:0}\n`;
    }
  } else {
    csv = 'Month,Year,Income,Expense,Net,CumulativeBalance\n';
    flow.forEach(f => csv += `${f.m},${f.y},${f.inc},${f.exp},${f.net},${f.cum}\n`);
  }
  
  let blob = new Blob([csv], {type: 'text/csv;charset=utf-8;'});
  let link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `CashFlow_${type}_${d}.csv`;
  link.click();
}


login();
console.log("calcCashFlow completed, flow length: " + calcCashFlow(scenarios[0], 120).length);
render();
console.log("render completed!");
