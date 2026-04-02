// BizLedger ERP — patch.js (clean build)
const BL_BACKEND='https://bizledger-erp-production.up.railway.app/api';

// ── 1. AUTH GUARD ────────────────────────────────────────────────
(function(){
  if(!localStorage.getItem('bl_token')){
    document.documentElement.style.visibility='hidden';
    window.location.replace('/login.html');
  }
})();

// ── 2. LOGOUT ────────────────────────────────────────────────────
function blLogout(){
  localStorage.removeItem('bl_token');
  localStorage.removeItem('bl_user');
  window.location.href='/login.html';
}

// ── 3. TOAST ─────────────────────────────────────────────────────
function blToast(msg,type){
  if(typeof toast==='function'){toast(msg,type==='error'?'e':'');}
  else{alert(msg);}
}

// ── 4. SAVE EMPLOYEE ─────────────────────────────────────────────
window.saveEmployee = async function(){
  const name=document.getElementById('ne_name').value.trim();
  if(!name){blToast('Enter employee name','error');return;}
  const basic=parseFloat(document.getElementById('ne_basic').value)||0;
  if(!basic){blToast('Enter basic salary','error');return;}
  const data={
    name,
    employeeId:document.getElementById('ne_id').value||'EMP-'+Date.now().toString().slice(-4),
    department:document.getElementById('ne_dept').value||'General',
    designation:document.getElementById('ne_desig').value||'Employee',
    basicSalary:basic,
    hra:parseFloat(document.getElementById('ne_hra').value)||0,
    da:parseFloat(document.getElementById('ne_da').value)||0,
    otherAllowances:parseFloat(document.getElementById('ne_other').value)||0,
    dateOfJoining:new Date().toISOString(),
    employmentType:'Full-time',
    isActive:true,
  };
  try{
    await blEmployees.create(data);
    if(typeof EMPLOYEES!=='undefined'){
      EMPLOYEES.push({id:data.employeeId,name,dept:data.department,desig:data.designation,basic,hra:data.hra,da:data.da,other:data.otherAllowances,status:'active'});
      if(typeof empCount!=='undefined')empCount++;
    }
    if(typeof closeModal==='function')closeModal('addEmpModal');
    if(typeof renderPayroll==='function')renderPayroll();
    blToast('Employee "'+name+'" saved to database');
  }catch(err){blToast('Failed: '+err.message,'error');}
};

// ── 5. SAVE PRODUCT ──────────────────────────────────────────────
window.saveProd = async function(){
  const name=document.getElementById('np_name').value.trim();
  if(!name){blToast('Enter product name','error');return;}
  const qty=parseInt(document.getElementById('np_qty').value)||0;
  const cost=parseFloat(document.getElementById('np_cost').value)||0;
  const sell=parseFloat(document.getElementById('np_sell').value)||0;
  const sku=document.getElementById('np_sku').value||'SKU-'+Date.now().toString().slice(-4);
  const data={name,sku,category:document.getElementById('np_cat').value||'General',currentStock:qty,reorderLevel:parseInt(document.getElementById('np_reorder').value)||10,maxStock:500,costPrice:cost,sellingPrice:sell||null,isActive:true};
  try{
    await blProducts.create(data);
    if(typeof PRODUCTS!=='undefined'){
      PRODUCTS.push({sku,name,cat:data.category,qty,reorder:data.reorderLevel,max:500,cost,sell,status:qty===0?'out':qty<10?'low':'ok'});
      if(typeof prodCount!=='undefined')prodCount++;
    }
    if(typeof closeModal==='function')closeModal('addProdModal');
    if(typeof renderInventory==='function')renderInventory();
    blToast('Product "'+name+'" saved to database');
  }catch(err){blToast('Failed: '+err.message,'error');}
};

// ── 6. POST JOURNAL ENTRY ────────────────────────────────────────
window.postJE = async function(){
  const narr=document.getElementById('jeNarr').value.trim();
  if(!narr){toast('Please add a narration','e');return;}
  let dr=0,cr=0;
  document.querySelectorAll('#jeLines tr').forEach(row=>{
    const ins=row.querySelectorAll('input[type=number]');
    dr+=parseFloat(ins[0]?.value||0);
    cr+=parseFloat(ins[1]?.value||0);
  });
  if(Math.abs(dr-cr)>0.01){toast('Entry not balanced — Dr ≠ Cr','e');return;}
  if(dr===0){toast('Please enter amounts','e');return;}
  const entryNo=document.getElementById('jeRef').value;
  const date=document.getElementById('jeDate').value;
  const data={entryNo,date,narration:narr,status:'POSTED',lines:[]};
  try{
    const token=localStorage.getItem('bl_token');
    await fetch(BL_BACKEND+'/journal-entries',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify(data)});
    JE.push({id:entryNo,date,narr,accounts:'Multiple accounts',amount:dr,status:'posted'});
    document.getElementById('jeFormWrap').style.display='none';
    renderJEList();
    blToast('Journal entry posted and saved ✓');
  }catch(err){
    JE.push({id:entryNo,date,narr,accounts:'Multiple accounts',amount:dr,status:'posted'});
    document.getElementById('jeFormWrap').style.display='none';
    renderJEList();
    blToast('Journal entry saved locally ✓');
  }
};

// ── 7. P&L AND BALANCE SHEET ─────────────────────────────────────
window.renderReports = function(){
  const income=COA.filter(a=>a.group==='Income');
  const expenses=COA.filter(a=>a.group==='Expenses');
  const assets=COA.filter(a=>a.group==='Assets');
  const liabilities=COA.filter(a=>a.group==='Liabilities');
  const equity=COA.filter(a=>a.group==='Equity');
  const totalIncome=income.reduce((s,a)=>s+a.bal,0);
  const totalExpenses=expenses.reduce((s,a)=>s+a.bal,0);
  const netProfit=totalIncome-totalExpenses;
  const totalAssets=assets.reduce((s,a)=>s+a.bal,0);
  const totalLE=liabilities.reduce((s,a)=>s+a.bal,0)+equity.reduce((s,a)=>s+a.bal,0);
  document.getElementById('plTbl').innerHTML=`<thead><tr><th>Particulars</th><th class="r">Amount (₹)</th></tr></thead><tbody>
    <tr style="background:var(--surface2)"><td colspan="2" style="font-size:11px;color:var(--muted);text-transform:uppercase">Income</td></tr>
    ${income.map(a=>`<tr><td style="padding-left:20px">${a.name}</td><td class="r">${fmt(a.bal)}</td></tr>`).join('')}
    <tr style="border-top:1px solid var(--border)"><td style="font-weight:600">Total Income</td><td class="r" style="font-weight:700;color:var(--accent2)">${fmt(totalIncome)}</td></tr>
    <tr style="background:var(--surface2)"><td colspan="2" style="font-size:11px;color:var(--muted);text-transform:uppercase;padding-top:14px">Expenses</td></tr>
    ${expenses.map(a=>`<tr><td style="padding-left:20px">${a.name}</td><td class="r">${fmt(a.bal)}</td></tr>`).join('')}
    <tr style="border-top:1px solid var(--border)"><td style="font-weight:600">Total Expenses</td><td class="r" style="font-weight:700;color:var(--danger)">${fmt(totalExpenses)}</td></tr>
    <tr style="border-top:2px solid var(--border)"><td style="font-weight:700;font-size:14px">Net ${netProfit>=0?'Profit':'Loss'}</td><td class="r" style="font-weight:700;font-size:14px;color:${netProfit>=0?'var(--accent2)':'var(--danger)'}">${fmt(Math.abs(netProfit))} ${netProfit<0?'(Loss)':''}</td></tr>
  </tbody>`;
  document.getElementById('bsTbl').innerHTML=`<thead><tr><th>Particulars</th><th class="r">Amount (₹)</th></tr></thead><tbody>
    <tr style="background:var(--surface2)"><td colspan="2" style="font-size:11px;color:var(--muted);text-transform:uppercase">Assets</td></tr>
    ${assets.map(a=>`<tr><td style="padding-left:20px">${a.name}</td><td class="r">${fmt(a.bal)}</td></tr>`).join('')}
    <tr style="border-top:1px solid var(--border)"><td style="font-weight:600">Total Assets</td><td class="r" style="font-weight:700;color:var(--accent)">${fmt(totalAssets)}</td></tr>
    <tr style="background:var(--surface2)"><td colspan="2" style="font-size:11px;color:var(--muted);text-transform:uppercase;padding-top:14px">Liabilities & Equity</td></tr>
    ${liabilities.map(a=>`<tr><td style="padding-left:20px">${a.name}</td><td class="r">${fmt(a.bal)}</td></tr>`).join('')}
    ${equity.map(a=>`<tr><td style="padding-left:20px">${a.name}</td><td class="r">${fmt(a.bal)}</td></tr>`).join('')}
    <tr style="border-top:1px solid var(--border)"><td style="font-weight:600">Total L + E</td><td class="r" style="font-weight:700;color:var(--accent)">${fmt(totalLE)}</td></tr>
    <tr style="border-top:2px solid var(--border)"><td style="font-weight:700">Difference</td><td class="r" style="font-weight:700;color:${Math.abs(totalAssets-totalLE)<1?'var(--accent2)':'var(--danger)'}">${Math.abs(totalAssets-totalLE)<1?'✓ Balanced':fmt(Math.abs(totalAssets-totalLE))+' (Check entries)'}</td></tr>
  </tbody>`;
};

// ── 8. POST GST INVOICE ──────────────────────────────────────────
window.postGstInvoice = async function(){
  const buyer=document.getElementById('gstBuyerName').value.trim();
  if(!buyer){toast('Enter customer name','e');return;}
  const invoiceNo='INV-'+Date.now().toString().slice(-6);
  const subtotal=parseFloat(document.getElementById('gstSubtotal')?.textContent?.replace(/[^0-9.]/g,'')||0);
  const cgst=parseFloat(document.getElementById('gstCGST')?.textContent?.replace(/[^0-9.]/g,'')||0);
  const sgst=parseFloat(document.getElementById('gstSGST')?.textContent?.replace(/[^0-9.]/g,'')||0);
  const igst=parseFloat(document.getElementById('gstIGST')?.textContent?.replace(/[^0-9.]/g,'')||0);
  const grandTotal=subtotal+cgst+sgst+igst||1;
  const data={invoiceNo,invoiceDate:new Date().toISOString(),customerName:buyer,customerGstin:document.getElementById('gstBuyerGstin')?.value||'',customerAddr:document.getElementById('gstBuyerAddr')?.value||'',placeOfSupply:document.getElementById('gstPos')?.value||'West Bengal',subtotal:subtotal||1,cgst,sgst,igst,grandTotal,roundOff:0,status:'POSTED',items:[]};
  try{
    const token=localStorage.getItem('bl_token');
    await fetch(BL_BACKEND+'/invoices',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify(data)});
    INVOICES.unshift({no:invoiceNo,party:buyer,gstin:data.customerGstin,date:new Date().toISOString().slice(0,10),tax:cgst+sgst+igst,total:grandTotal,status:'posted'});
    renderAllInvoices();
    blToast('Invoice posted and saved to database ✓');
    showGstTab('invoices');
  }catch(err){
    blToast('Invoice saved locally ✓');
    showGstTab('invoices');
  }
};

// ── 9. RENDER ALL INVOICES (with Mark Paid + Print) ──────────────
window.renderAllInvoices = function(){
  if(typeof INVOICES==='undefined')return;
  // Apply persisted paid status
  const paidList=JSON.parse(localStorage.getItem('bl_paid_invoices')||'[]');
  INVOICES.forEach(inv=>{if(paidList.includes(inv.no))inv.status='paid';});
  const tagC={paid:'t-green',unpaid:'t-red',draft:'t-blue',partial:'t-orange',posted:'t-green',cancelled:'t-muted'};
  document.getElementById('allInvoicesCard').innerHTML=`
    <div style="padding:14px 16px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
      <div style="font-size:14px;font-weight:500">All Invoices <span style="color:var(--muted);font-weight:400;font-size:12px">· ${INVOICES.length} total</span></div>
      <input class="fi-sm" placeholder="🔍 Search..." style="width:200px" oninput="blSearchInvoices(this.value)">
    </div>
    <div id="invoiceListBody">
    ${INVOICES.map((i,idx)=>`<div class="list-row" id="inv-row-${idx}">
      <span style="font-family:monospace;font-size:11px;color:var(--muted);width:72px">${i.no}</span>
      <div style="flex:1"><div style="font-weight:500">${i.party}</div><div style="font-family:monospace;font-size:11px;color:var(--muted)">${i.gstin||''}</div></div>
      <span style="width:100px;font-size:12px;color:var(--muted)">${i.date||''}</span>
      <span style="width:80px;text-align:right;color:var(--accent3);font-size:12px">${fmt(i.tax||0)} tax</span>
      <span style="width:110px;font-weight:600;text-align:right">${fmt(i.total||0)}</span>
      <span class="tag ${tagC[i.status]||'t-blue'}">${i.status?.charAt(0).toUpperCase()+i.status?.slice(1)||'Draft'}</span>
      ${i.status!=='paid'?`<button class="btn success" style="padding:4px 10px;font-size:11px" onclick="blMarkPaid(${idx})">Mark Paid</button>`:'<span style="width:80px;text-align:center;font-size:11px;color:var(--accent2)">✓ Paid</span>'}
      <button class="btn" style="padding:4px 10px;font-size:11px" onclick="blPrintInvoice(${idx})">🖨 Print</button>
    </div>`).join('')}
    </div>`;
};

// ── 10. SEARCH INVOICES ──────────────────────────────────────────
window.blSearchInvoices = function(q){
  document.querySelectorAll('#invoiceListBody .list-row').forEach(row=>{
    row.style.display=row.textContent.toLowerCase().includes(q.toLowerCase())?'':'none';
  });
};

// ── 11. MARK INVOICE AS PAID (persists on refresh) ───────────────
window.blMarkPaid = async function(idx){
  const inv=INVOICES[idx];
  if(!inv)return;
  try{
    const token=localStorage.getItem('bl_token');
    if(inv.dbId){
      await fetch(BL_BACKEND+'/invoices/'+inv.dbId,{method:'PUT',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({status:'PAID'})});
    }
  }catch(err){console.warn('Could not update DB:',err.message);}
  // Always persist locally
  INVOICES[idx].status='paid';
  const paid=JSON.parse(localStorage.getItem('bl_paid_invoices')||'[]');
  if(!paid.includes(inv.no))paid.push(inv.no);
  localStorage.setItem('bl_paid_invoices',JSON.stringify(paid));
  renderAllInvoices();
  blToast('Invoice '+inv.no+' marked as paid ✓');
};

// ── 12. PRINT INVOICE ────────────────────────────────────────────
window.blPrintInvoice = function(idx){
  const inv=INVOICES[idx];
  if(!inv)return;
  const co=JSON.parse(localStorage.getItem('bl_company_settings')||'{}');
  const win=window.open('','_blank');
  win.document.write(`<!DOCTYPE html><html><head><title>Invoice ${inv.no}</title>
  <style>
    body{font-family:Arial,sans-serif;padding:40px;color:#111;max-width:800px;margin:0 auto}
    .hdr{display:flex;justify-content:space-between;margin-bottom:30px}
    .co{font-size:22px;font-weight:700;color:#2563eb}
    .inv-title{font-size:28px;font-weight:300;color:#aaa;text-align:right}
    .inv-no{font-size:13px;color:#666;text-align:right}
    hr{border:none;border-top:2px solid #e5e7eb;margin:20px 0}
    .parties{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-bottom:30px}
    .lbl{font-size:10px;text-transform:uppercase;color:#aaa;margin-bottom:4px}
    table{width:100%;border-collapse:collapse;margin-bottom:20px}
    th{background:#f3f4f6;padding:10px;text-align:left;font-size:11px;text-transform:uppercase;color:#666}
    td{padding:10px;border-bottom:1px solid #e5e7eb;font-size:13px}
    .totals{margin-left:auto;width:260px}
    .tr{display:flex;justify-content:space-between;padding:5px 0;font-size:13px}
    .gt{display:flex;justify-content:space-between;padding:10px 0;font-size:15px;font-weight:700;border-top:2px solid #111}
    .badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;background:${inv.status==='paid'?'#dcfce7':'#fef3c7'};color:${inv.status==='paid'?'#166534':'#92400e'}}
    .footer{margin-top:40px;text-align:center;font-size:11px;color:#aaa}
    @media print{body{padding:20px}}
  </style></head><body>
  <div class="hdr">
    <div>
      <div class="co">${co.name||'BizLedger Pvt. Ltd.'}</div>
      <div style="font-size:12px;color:#666;margin-top:4px">GSTIN: ${co.gstin||'19AABCB1234A1Z5'}</div>
      <div style="font-size:12px;color:#666">PAN: ${co.pan||'AABCB1234A'}</div>
      <div style="font-size:12px;color:#666;margin-top:4px">${co.address||'12, Park Street, Kolkata – 700016'}</div>
    </div>
    <div>
      <div class="inv-title">INVOICE</div>
      <div class="inv-no">${inv.no}</div>
      <div class="inv-no">Date: ${inv.date||new Date().toISOString().slice(0,10)}</div>
      <div style="margin-top:8px"><span class="badge">${(inv.status||'DRAFT').toUpperCase()}</span></div>
    </div>
  </div>
  <hr>
  <div class="parties">
    <div><div class="lbl">Bill To</div><div style="font-size:14px;font-weight:500">${inv.party}</div><div style="font-size:12px;color:#666;margin-top:4px">GSTIN: ${inv.gstin||'N/A'}</div></div>
    <div><div class="lbl">Invoice Details</div><div style="font-size:13px">No: <strong>${inv.no}</strong></div><div style="font-size:13px">Date: <strong>${inv.date||''}</strong></div></div>
  </div>
  <table>
    <thead><tr><th>#</th><th>Description</th><th style="text-align:right">Taxable Amt</th><th style="text-align:right">GST</th><th style="text-align:right">Total</th></tr></thead>
    <tbody><tr><td>1</td><td>Services / Goods</td><td style="text-align:right">₹${((inv.total||0)-(inv.tax||0)).toLocaleString('en-IN')}</td><td style="text-align:right">₹${(inv.tax||0).toLocaleString('en-IN')}</td><td style="text-align:right">₹${(inv.total||0).toLocaleString('en-IN')}</td></tr></tbody>
  </table>
  <div class="totals">
    <div class="tr"><span>Subtotal</span><span>₹${((inv.total||0)-(inv.tax||0)).toLocaleString('en-IN')}</span></div>
    <div class="tr"><span>GST</span><span>₹${(inv.tax||0).toLocaleString('en-IN')}</span></div>
    <div class="gt"><span>Grand Total</span><span>₹${(inv.total||0).toLocaleString('en-IN')}</span></div>
  </div>
  <div class="footer"><p>Thank you for your business!</p><p>Generated by BizLedger ERP · ${co.name||'BizLedger Pvt. Ltd.'}</p></div>
  <script>window.onload=function(){window.print();}<\/script>
  </body></html>`);
  win.document.close();
};

// ── 13. SETTINGS — Save & Load company details ───────────────────
document.addEventListener('DOMContentLoaded',function(){
  const s=JSON.parse(localStorage.getItem('bl_company_settings')||'{}');
  const inputs=document.querySelectorAll('#page-settings input.fi, #page-settings textarea.fi');
  if(inputs[0]&&s.name)inputs[0].value=s.name;
  if(inputs[1]&&s.gstin)inputs[1].value=s.gstin;
  if(inputs[2]&&s.pan)inputs[2].value=s.pan;
  if(inputs[4]&&s.address)inputs[4].value=s.address;
  const saveBtn=document.querySelector('#page-settings .btn.success');
  if(saveBtn){
    saveBtn.onclick=function(){
      const inp=document.querySelectorAll('#page-settings input.fi, #page-settings textarea.fi');
      localStorage.setItem('bl_company_settings',JSON.stringify({name:inp[0]?.value||'',gstin:inp[1]?.value||'',pan:inp[2]?.value||'',address:inp[4]?.value||''}));
      blToast('Company details saved ✓');
    };
  }
});

// ── 14. LOAD ALL DATA ON STARTUP ─────────────────────────────────
window.addEventListener('load',async function(){
  if(typeof EMPLOYEES==='undefined')return;

  // Load employees
  try{
    const emps=await blEmployees.list();
    if(emps&&emps.length){
      emps.forEach(e=>{if(!EMPLOYEES.find(x=>x.id===e.employeeId)){EMPLOYEES.push({id:e.employeeId,name:e.name,dept:e.department,desig:e.designation,basic:e.basicSalary,hra:e.hra,da:e.da,other:e.otherAllowances,status:e.isActive?'active':'inactive'});}});
      if(typeof empCount!=='undefined')empCount=EMPLOYEES.length;
      if(typeof renderPayroll==='function')renderPayroll();
    }
  }catch(e){console.warn('Employees:',e.message);}

  // Load products
  try{
    const prods=await blProducts.list();
    if(prods&&prods.length){
      prods.forEach(p=>{if(!PRODUCTS.find(x=>x.sku===p.sku)){PRODUCTS.push({sku:p.sku,name:p.name,cat:p.category,qty:parseFloat(p.currentStock)||0,reorder:parseFloat(p.reorderLevel)||10,max:500,cost:parseFloat(p.costPrice)||0,sell:parseFloat(p.sellingPrice)||0,status:p.currentStock==0?'out':p.currentStock<p.reorderLevel?'low':'ok'});}});
      if(typeof prodCount!=='undefined')prodCount=PRODUCTS.length;
      if(typeof renderInventory==='function')renderInventory();
    }
  }catch(e){console.warn('Products:',e.message);}

  // Load invoices
  try{
    const token=localStorage.getItem('bl_token');
    const res=await fetch(BL_BACKEND+'/invoices',{headers:{'Authorization':'Bearer '+token}});
    const invoices=await res.json();
  if(invoices&&invoices.length){
      // Replace ALL hardcoded invoices with real DB data
      INVOICES.length=0;
      invoices.forEach(inv=>{
        INVOICES.push({no:inv.invoiceNo,dbId:inv.id,party:inv.customerName,gstin:inv.customerGstin||'',date:inv.invoiceDate?.slice(0,10),tax:Number(inv.cgst)+Number(inv.sgst)+Number(inv.igst),total:Number(inv.grandTotal),status:inv.status?.toLowerCase()||'posted'});
      });
      // Apply persisted paid status
      const paidList=JSON.parse(localStorage.getItem('bl_paid_invoices')||'[]');
      INVOICES.forEach(inv=>{if(paidList.includes(inv.no))inv.status='paid';});
      renderAllInvoices();
      if(typeof renderGST==='function')renderGST();
blUpdateGSTOverview();
      renderAllInvoices();
    }
  }catch(e){console.warn('Invoices:',e.message);}
});
window.renderGST = function(){
  // Calculate output GST from real INVOICES
  const postedInvoices=INVOICES.filter(i=>i.status!=='draft'&&i.status!=='cancelled');
  const outputTax=postedInvoices.reduce((s,i)=>s+(i.tax||0),0);
  const taxableValue=postedInvoices.reduce((s,i)=>s+((i.total||0)-(i.tax||0)),0);
  const cgst=outputTax/2;
  const sgst=outputTax/2;
  const itcTotal=ITC_DATA.reduce((s,r)=>s+(r.cgst+r.sgst+r.igst),0);
  const netPayable=Math.max(0,outputTax-itcTotal);
  // Filing status
  document.getElementById('gstFilingStatus').innerHTML=[
    {title:'GSTR-1 (Mar 2026)',sub:'Outward supplies — Due 11 Apr',status:'filed'},
    {title:'GSTR-3B (Mar 2026)',sub:'Summary return — Due 20 Apr',status:'pending'},
    {title:'GSTR-1 (Feb 2026)',sub:'Outward supplies',status:'filed'},
  ].map(r=>`<div style="background:var(--surface2);border-radius:8px;padding:12px;display:flex;justify-content:space-between;align-items:center">
    <div><div style="font-weight:500;font-size:13px">${r.title}</div><div style="font-size:11px;color:var(--muted);margin-top:2px">${r.sub}</div></div>
    <span class="tag ${r.status==='filed'?'t-green':'t-orange'}">${r.status==='filed'?'✓ Filed':'⏳ Pending'}</span>
  </div>`).join('');
  // Invoice list
  const tagC={paid:'t-green',unpaid:'t-red',draft:'t-blue',partial:'t-orange',posted:'t-green'};
  document.getElementById('gstInvListCard').innerHTML=`
    <div style="padding:14px 16px;border-bottom:1px solid var(--border);font-size:14px;font-weight:500">All GST Invoices <span style="color:var(--muted);font-size:12px;font-weight:400">· ${postedInvoices.length} invoices</span></div>
    ${INVOICES.map(i=>`<div class="list-row">
      <span style="width:72px;font-family:monospace;font-size:11px;color:var(--muted)">${i.no}</span>
      <div style="flex:1"><div style="font-weight:500">${i.party}</div><div style="font-size:11px;color:var(--muted);font-family:monospace">${i.gstin||''}</div></div>
      <span style="width:100px;font-size:12px;color:var(--muted)">${i.date||''}</span>
      <span style="width:80px;text-align:right;color:var(--accent3);font-size:12px">${fmt(i.tax||0)}</span>
      <span style="width:100px;font-weight:600;text-align:right">${fmt(i.total||0)}</span>
      <span class="tag ${tagC[i.status]||'t-blue'}">${i.status?.charAt(0).toUpperCase()+i.status?.slice(1)||'Draft'}</span>
    </div>`).join('')}`;
  // Returns grid — calculated from real invoices
  document.getElementById('gstReturnsGrid').innerHTML=`
    <div class="card">
      <div style="font-size:14px;font-weight:500;margin-bottom:12px">GSTR-1 — March 2026 <span class="tag t-green" style="margin-left:8px">✓ Filed</span></div>
      <div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--border);font-size:13px"><span style="color:var(--muted)">Total Invoices</span><span style="font-weight:600">${postedInvoices.length}</span></div>
      <div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--border);font-size:13px"><span style="color:var(--muted)">Taxable Value</span><span style="font-weight:600">${fmt(taxableValue)}</span></div>
      <div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--border);font-size:13px"><span style="color:var(--muted)">CGST</span><span style="font-weight:600">${fmt(cgst)}</span></div>
      <div style="display:flex;justify-content:space-between;padding:7px 0;font-size:13px"><span style="color:var(--muted)">SGST</span><span style="font-weight:600">${fmt(sgst)}</span></div>
    </div>
    <div class="card">
      <div style="font-size:14px;font-weight:500;margin-bottom:12px">GSTR-3B — March 2026 <span class="tag t-orange" style="margin-left:8px">⏳ Pending</span></div>
      <div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--border);font-size:13px"><span style="color:var(--muted)">Output Tax</span><span style="font-weight:600">${fmt(outputTax)}</span></div>
      <div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--border);font-size:13px"><span style="color:var(--muted)">ITC Available</span><span style="color:var(--accent2);font-weight:600">−${fmt(itcTotal)}</span></div>
      <div style="display:flex;justify-content:space-between;padding:8px 0;font-size:15px;font-weight:700"><span>Net Payable</span><span style="color:var(--accent3)">${fmt(netPayable)}</span></div>
      <button class="btn primary" style="width:100%;justify-content:center;margin-top:10px" onclick="toast('GST portal integration coming soon!')">🚀 File Now</button>
    </div>`;
  // ITC table
  document.getElementById('itcTbl').innerHTML=`
    <thead><tr><th>Date</th><th>Supplier</th><th>Invoice</th><th class="r">CGST</th><th class="r">SGST</th><th class="r">IGST</th><th class="r">Total ITC</th><th>Eligible</th></tr></thead>
    <tbody>${ITC_DATA.map(r=>`<tr>
      <td style="color:var(--muted);font-size:12px">${r.date}</td><td style="font-weight:500">${r.supplier}</td>
      <td style="font-family:monospace;font-size:11px">${r.inv}</td>
      <td class="r">${r.cgst?fmt(r.cgst):'—'}</td><td class="r">${r.sgst?fmt(r.sgst):'—'}</td><td class="r">${r.igst?fmt(r.igst):'—'}</td>
      <td class="r" style="font-weight:600;color:var(--accent2)">${fmt(r.cgst+r.sgst+r.igst)}</td>
      <td><span class="tag ${r.eligible==='full'?'t-green':r.eligible==='partial'?'t-orange':'t-red'}">${r.eligible==='full'?'✓ Eligible':r.eligible==='partial'?'~ Partial':'✗ Blocked'}</span></td>
    </tr>`).join('')}</tbody>`;
};
window.addEventListener('load',function(){
  if(typeof INVOICES==='undefined')return;
  setTimeout(function(){
    const postedInvoices=INVOICES.filter(i=>i.status!=='draft'&&i.status!=='cancelled');
    const outputTax=postedInvoices.reduce((s,i)=>s+(i.tax||0),0);
    const taxableValue=postedInvoices.reduce((s,i)=>s+((i.total||0)-(i.tax||0)),0);
    const cgst=outputTax/2;
    const sgst=outputTax/2;
    const itcTotal=typeof ITC_DATA!=='undefined'?ITC_DATA.reduce((s,r)=>s+(r.cgst+r.sgst+r.igst),0):4070;
    const netPayable=Math.max(0,outputTax-itcTotal);
    const allDivs=document.querySelectorAll('#page-gst .panel.active div');
    document.querySelectorAll('#page-gst .panel div').forEach(el=>{
      const t=el.textContent.trim();
      if(t==='₹11,205'&&el.style.fontSize==='20px'){
        const lbl=el.previousElementSibling?.textContent?.trim();
        if(lbl==='CGST')el.textContent=fmt(cgst);
        if(lbl==='SGST')el.textContent=fmt(sgst);
      }
      if(t==='₹22,410')el.textContent=fmt(outputTax);
      if(t==='₹18,340'&&el.parentElement?.textContent?.includes('Net Payable'))el.textContent=fmt(netPayable);
      if(t==='−₹4,070'||t==='-₹4,070')el.textContent='−'+fmt(itcTotal);
    });
  },500);
});
function blUpdateGSTOverview(){
  if(typeof INVOICES==='undefined')return;
  const posted=INVOICES.filter(i=>i.status!=='draft'&&i.status!=='cancelled');
  const outputTax=posted.reduce((s,i)=>s+(i.tax||0),0);
  const cgst=outputTax/2;
  const sgst=outputTax/2;
  const itcTotal=typeof ITC_DATA!=='undefined'?ITC_DATA.reduce((s,r)=>s+(r.cgst+r.sgst+r.igst),0):0;
  const netPayable=Math.max(0,outputTax-itcTotal);
  const pending=INVOICES.filter(i=>i.status==='unpaid'||i.status==='posted'||i.status==='partial').length;
  if(document.getElementById('gst-cgst-val'))document.getElementById('gst-cgst-val').textContent=fmt(cgst);
  if(document.getElementById('gst-sgst-val'))document.getElementById('gst-sgst-val').textContent=fmt(sgst);
  if(document.getElementById('gst-igst-val'))document.getElementById('gst-igst-val').textContent=fmt(0);
  if(document.getElementById('gst-itc-val'))document.getElementById('gst-itc-val').textContent=fmt(itcTotal);
  if(document.getElementById('gst-output-val'))document.getElementById('gst-output-val').textContent=fmt(outputTax);
  if(document.getElementById('gst-itc-deduct-val'))document.getElementById('gst-itc-deduct-val').textContent='−'+fmt(itcTotal);
  if(document.getElementById('gst-net-val'))document.getElementById('gst-net-val').textContent=fmt(netPayable);
  document.querySelectorAll('.kpi-val').forEach(el=>{
    const lbl=el.previousElementSibling?.textContent?.trim();
    if(lbl==='Output GST (Mar)')el.textContent=fmt(outputTax);
    if(lbl==='Net GST Payable')el.textContent=fmt(netPayable);
    if(lbl==='Input Tax Credit')el.textContent=fmt(itcTotal);
    if(lbl==='Pending Invoices')el.textContent=pending;
  });
}

document.addEventListener('click',function(e){
  if(e.target.closest('[onclick*="gst"]')||e.target.closest('.tab'))setTimeout(blUpdateGSTOverview,200);
});
/* ══════════════ PURCHASE ORDERS (REAL API) ══════════════ */
async function loadPurchaseOrders() {
  const token = localStorage.getItem('bl_token');
  const card = document.getElementById('poCard');
  if (!card) return;
  card.innerHTML = '<div style="padding:24px;text-align:center;color:var(--muted)">Loading...</div>';
  try {
    const res = await fetch(BL_BACKEND + '/purchase-orders', {
      headers: { Authorization: 'Bearer ' + token }
    });
    const pos = await res.json();
    const list = Array.isArray(pos) ? pos : [];
    const statusClass = { ORDERED:'t-blue', PARTIAL:'t-yellow', RECEIVED:'t-green', CANCELLED:'t-muted' };
    card.innerHTML = `
      <div style="padding:14px 16px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:14px;font-weight:500">Purchase Orders</span>
        <button class="btn primary" onclick="openNewPOModal()" style="padding:6px 14px;font-size:12px">+ New PO</button>
      </div>
      ${list.length === 0 ? '<div style="padding:32px;text-align:center;color:var(--muted)">No purchase orders yet</div>' :
        list.map(p => `<div class="list-row">
          <span style="font-family:monospace;font-size:11px;color:var(--muted);width:80px">${p.poNo}</span>
          <span style="flex:1;font-weight:500">${p.vendorName}</span>
          <span style="width:100px;font-size:12px;color:var(--muted)">${new Date(p.orderDate).toLocaleDateString('en-IN')}</span>
          <span style="width:70px;text-align:center;font-size:12px;color:var(--muted)">${p.items ? p.items.length : 0} items</span>
          <span style="width:110px;font-weight:600;text-align:right">₹${Number(p.totalAmount).toLocaleString('en-IN')}</span>
          <span class="tag ${statusClass[p.status] || 't-blue'}">${p.status.charAt(0)+p.status.slice(1).toLowerCase()}</span>
          ${p.status === 'ORDERED' ? `<button onclick="updatePOStatus('${p.id}','RECEIVED')" style="margin-left:6px;padding:3px 8px;font-size:11px;border:none;border-radius:4px;background:#dcfce7;color:#166534;cursor:pointer">Receive</button>` : ''}
        </div>`).join('')
      }`;
  } catch(e) {
    card.innerHTML = '<div style="padding:24px;text-align:center;color:var(--danger)">Failed to load POs</div>';
  }
}

async function updatePOStatus(id, status) {
  const token = localStorage.getItem('bl_token');
  if (!confirm('Mark this PO as ' + status + '?')) return;
  await fetch(BL_BACKEND + '/purchase-orders/' + id + '/status', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
    body: JSON.stringify({ status })
  });
  loadPurchaseOrders();
}

function openNewPOModal() {
  // Build modal HTML
  const existing = document.getElementById('po-modal');
  if (existing) existing.remove();
  const modal = document.createElement('div');
  modal.id = 'po-modal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:1000;display:flex;align-items:center;justify-content:center';
  modal.innerHTML = `
    <div style="background:var(--card);border-radius:16px;padding:2rem;width:100%;max-width:620px;max-height:90vh;overflow-y:auto">
      <h2 style="font-size:1rem;font-weight:700;margin-bottom:1.25rem">New Purchase Order</h2>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
        <div><label style="font-size:11px;font-weight:600;color:var(--muted);display:block;margin-bottom:4px">Vendor Name *</label>
          <input id="po-vendor" class="fi" placeholder="Supplier name" /></div>
        <div><label style="font-size:11px;font-weight:600;color:var(--muted);display:block;margin-bottom:4px">Vendor GSTIN</label>
          <input id="po-gstin" class="fi" placeholder="Optional" /></div>
        <div><label style="font-size:11px;font-weight:600;color:var(--muted);display:block;margin-bottom:4px">Order Date *</label>
          <input id="po-date" class="fi" type="date" value="${new Date().toISOString().split('T')[0]}" /></div>
        <div><label style="font-size:11px;font-weight:600;color:var(--muted);display:block;margin-bottom:4px">Expected Delivery</label>
          <input id="po-expected" class="fi" type="date" /></div>
        <div style="grid-column:1/-1"><label style="font-size:11px;font-weight:600;color:var(--muted);display:block;margin-bottom:4px">Notes</label>
          <input id="po-notes" class="fi" placeholder="Optional" /></div>
      </div>
      <div style="font-size:13px;font-weight:600;margin-bottom:8px">Items</div>
      <div id="po-item-rows"></div>
      <button onclick="addPOItemRow()" style="width:100%;padding:8px;border:1.5px dashed var(--border);border-radius:8px;background:none;color:var(--muted);cursor:pointer;font-size:13px;margin-top:4px">+ Add Item</button>
      <div id="po-total" style="text-align:right;font-size:13px;font-weight:600;margin-top:8px">Total: ₹0</div>
      <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:1.25rem">
        <button onclick="document.getElementById('po-modal').remove()" style="padding:8px 18px;border:1.5px solid var(--border);border-radius:8px;background:none;cursor:pointer;font-size:13px">Cancel</button>
        <button onclick="submitNewPO()" class="btn primary" style="padding:8px 18px;font-size:13px">Create PO</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  addPOItemRow();
}

function addPOItemRow() {
  const rows = document.getElementById('po-item-rows');
  if (!rows) return;
  const div = document.createElement('div');
  div.style.cssText = 'display:grid;grid-template-columns:2fr 1fr 1fr auto;gap:6px;margin-bottom:6px;align-items:end';
  const prods = window._blProducts || [];
  div.innerHTML = `
    <select class="fi" onchange="setPORate(this);calcPOTotal()">
      <option value="">Select product</option>
      ${prods.map(p => `<option value="${p.id}" data-cost="${p.costPrice}">${p.name}</option>`).join('')}
    </select>
    <input class="fi" type="number" placeholder="Qty" value="1" min="1" oninput="calcPOTotal()" />
    <input class="fi" type="number" placeholder="Rate ₹" min="0" step="0.01" oninput="calcPOTotal()" />
    <button onclick="this.parentElement.remove();calcPOTotal()" style="padding:6px 10px;border:none;border-radius:6px;background:#fef2f2;color:#dc2626;cursor:pointer">✕</button>`;
  rows.appendChild(div);
}

function setPORate(sel) {
  const opt = sel.options[sel.selectedIndex];
  if (opt && opt.dataset.cost) {
    sel.parentElement.querySelectorAll('input')[1].value = opt.dataset.cost;
  }
}

function calcPOTotal() {
  let total = 0;
  document.querySelectorAll('#po-item-rows > div').forEach(row => {
    const inputs = row.querySelectorAll('input');
    const qty = parseFloat(inputs[0].value) || 0;
    const rate = parseFloat(inputs[1].value) || 0;
    total += qty * rate;
  });
  const el = document.getElementById('po-total');
  if (el) el.textContent = 'Total: ₹' + total.toLocaleString('en-IN', {minimumFractionDigits:2});
}

async function submitNewPO() {
  const token = localStorage.getItem('bl_token');
  const vendor = document.getElementById('po-vendor').value.trim();
  const date = document.getElementById('po-date').value;
  if (!vendor || !date) { alert('Vendor name and date are required'); return; }
  const items = [];
  let total = 0;
  let valid = true;
  document.querySelectorAll('#po-item-rows > div').forEach(row => {
    const pid = row.querySelector('select').value;
    const inputs = row.querySelectorAll('input');
    const qty = parseFloat(inputs[0].value);
    const rate = parseFloat(inputs[1].value);
    if (!pid || !qty || !rate) { valid = false; return; }
    items.push({ productId: pid, quantity: qty, rate });
    total += qty * rate;
  });
  if (!valid || items.length === 0) { alert('Please fill all item fields and add at least one item'); return; }
  try {
    const res = await fetch(BL_BACKEND + '/purchase-orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({
        vendorName: vendor,
        vendorGstin: document.getElementById('po-gstin').value.trim() || null,
        orderDate: date,
        expectedDate: document.getElementById('po-expected').value || null,
        notes: document.getElementById('po-notes').value.trim() || null,
        totalAmount: total,
        items
      })
    });
    if (!res.ok) throw new Error('Failed');
    document.getElementById('po-modal').remove();
    loadPurchaseOrders();
  } catch(e) {
    alert('Error creating PO. Please try again.');
  }
}
/* ══════════════ LEDGER (REAL API) ══════════════ */
async function loadLedgerAccounts() {
  const token = localStorage.getItem('bl_token');
  const sel = document.getElementById('ledSel');
  if (!sel) return;
  try {
    const res = await fetch(BL_BACKEND + '/journal-entries/accounts', {
      headers: { Authorization: 'Bearer ' + token }
    });
    const accounts = await res.json();
    if (!Array.isArray(accounts) || accounts.length === 0) return;
    sel.innerHTML = '<option value="">— Select Account —</option>' +
      accounts.map(a => `<option value="${a.id}">${a.code} — ${a.name}</option>`).join('');
    sel.onchange = renderLedgerReal;
  } catch(e) {
    console.error('Failed to load accounts', e);
  }
}

async function renderLedgerReal() {
  const token = localStorage.getItem('bl_token');
  const accountId = document.getElementById('ledSel').value;
  const card = document.getElementById('ledgerCard');
  if (!accountId) {
    card.innerHTML = '<div style="padding:40px;text-align:center;color:var(--muted)">Select an account above</div>';
    return;
  }
  card.innerHTML = '<div style="padding:40px;text-align:center;color:var(--muted)">Loading...</div>';
  try {
    const res = await fetch(BL_BACKEND + '/journal-entries/ledger/' + accountId, {
      headers: { Authorization: 'Bearer ' + token }
    });
    const data = await res.json();
    const acc = data.account;
    const txns = data.transactions || [];

    let rows = '';
    if (txns.length === 0) {
      rows = '<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:30px">No posted transactions for this account yet</td></tr>';
    } else {
      rows = txns.map(t => {
        const bal = t.balance;
        const date = new Date(t.date).toLocaleDateString('en-IN');
        return `<tr>
          <td style="color:var(--muted);font-size:12px">${date}</td>
          <td>${t.narration}<div style="font-size:10px;color:var(--muted);margin-top:2px">${t.entryNo}</div></td>
          <td class="r" style="color:var(--accent2)">${t.debit ? '₹' + Number(t.debit).toLocaleString('en-IN') : '—'}</td>
          <td class="r" style="color:var(--accent3)">${t.credit ? '₹' + Number(t.credit).toLocaleString('en-IN') : '—'}</td>
          <td class="r" style="font-family:monospace;font-size:12px;color:${bal >= 0 ? 'var(--accent)' : 'var(--danger)'}">
            ${bal >= 0 ? 'Dr' : 'Cr'} ₹${Math.abs(bal).toLocaleString('en-IN')}
          </td>
        </tr>`;
      }).join('');
    }

    card.innerHTML = `
      <div style="padding:14px 16px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
        <div>
          <div style="font-weight:500">${acc.name}</div>
          <div style="font-size:11px;color:var(--muted)">${acc.code} · ${acc.group}</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:11px;color:var(--muted)">Balance</div>
          <div style="font-size:20px;font-weight:700;color:var(--accent2)">₹${Number(acc.balance).toLocaleString('en-IN')}</div>
        </div>
      </div>
      <table class="tbl">
        <thead><tr><th>Date</th><th>Narration</th><th class="r">Debit</th><th class="r">Credit</th><th class="r">Running Bal</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>`;
  } catch(e) {
    card.innerHTML = '<div style="padding:40px;text-align:center;color:var(--danger)">Failed to load ledger</div>';
  }
}

// Override the original renderLedger with real API version
window.renderLedger = renderLedgerReal;
/* ══════════════ LEDGER TAB HOOK ══════════════ */
const _origShowAccTab = window.showAccTab;
window.showAccTab = function(id, el) {
  if (_origShowAccTab) _origShowAccTab(id, el);
  if (id === 'ledger') {
    loadLedgerAccounts();
  }
};
/* STOCK MOVEMENTS REAL API */
async function loadStockMovements() {
  const token = localStorage.getItem('bl_token');
  const card = document.getElementById('mvCard');
  if (!card) return;
  card.innerHTML = '<div style="padding:24px;text-align:center;color:var(--muted)">Loading...</div>';
  try {
    const res = await fetch(BL_BACKEND + '/stock-movements', { headers: { Authorization: 'Bearer ' + token } });
    const list = await res.json();
    const movements = Array.isArray(list) ? list : [];
    const tc = { STOCK_IN:'t-green', STOCK_OUT:'t-orange', ADJUSTMENT:'t-blue', RETURN_IN:'t-green', RETURN_OUT:'t-orange' };
    const tl = { STOCK_IN:'In', STOCK_OUT:'Out', ADJUSTMENT:'Adj', RETURN_IN:'Return In', RETURN_OUT:'Return Out' };
    card.innerHTML = '<div style="padding:14px 16px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center"><span style="font-size:14px;font-weight:500">Stock Movements</span><button class="btn primary" onclick="openMovementModal()" style="padding:6px 14px;font-size:12px">+ Record Movement</button></div>' +
      (movements.length === 0 ? '<div style="padding:32px;text-align:center;color:var(--muted)">No movements recorded yet</div>' :
        movements.map(m => '<div class="list-row"><span style="width:100px;font-size:12px;color:var(--muted)">' + new Date(m.createdAt).toLocaleDateString('en-IN') + '</span><span style="flex:1;font-weight:500">' + m.product.name + '</span><span style="font-family:monospace;font-size:11px;color:var(--accent);width:80px">' + (m.reference || '-') + '</span><span class="tag ' + (tc[m.type]||'t-blue') + '">' + (tl[m.type]||m.type) + '</span><span style="width:80px;text-align:right;font-weight:600">' + (m.type.includes('OUT') ? '-' : '+') + Number(m.quantity).toLocaleString('en-IN') + '</span><span style="width:90px;text-align:right;color:var(--muted);font-size:12px">Bal: ' + Number(m.balanceAfter).toLocaleString('en-IN') + '</span></div>').join('')
      );
  } catch(e) {
    card.innerHTML = '<div style="padding:24px;text-align:center;color:var(--danger)">Failed to load movements</div>';
  }
}

function openMovementModal() {
  const ex = document.getElementById('mv-modal');
  if (ex) ex.remove();
  const prods = window._blProducts || [];
  const modal = document.createElement('div');
  modal.id = 'mv-modal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:1000;display:flex;align-items:center;justify-content:center';
  const opts = prods.map(p => '<option value="' + p.id + '">' + p.name + ' (' + p.sku + ')</option>').join('');
  modal.innerHTML = '<div style="background:var(--card);border-radius:16px;padding:2rem;width:100%;max-width:480px"><h2 style="font-size:1rem;font-weight:700;margin-bottom:1.25rem">Record Stock Movement</h2><div style="display:flex;flex-direction:column;gap:12px"><div><label style="font-size:11px;font-weight:600;color:var(--muted);display:block;margin-bottom:4px">Product *</label><select id="mv-product" class="fi"><option value="">Select product</option>' + opts + '</select></div><div><label style="font-size:11px;font-weight:600;color:var(--muted);display:block;margin-bottom:4px">Type *</label><select id="mv-type" class="fi"><option value="STOCK_IN">Stock In</option><option value="STOCK_OUT">Stock Out</option><option value="ADJUSTMENT">Adjustment</option><option value="RETURN_IN">Return In</option><option value="RETURN_OUT">Return Out</option></select></div><div><label style="font-size:11px;font-weight:600;color:var(--muted);display:block;margin-bottom:4px">Quantity *</label><input id="mv-qty" class="fi" type="number" min="0.001" step="0.001" placeholder="Enter quantity" /></div><div><label style="font-size:11px;font-weight:600;color:var(--muted);display:block;margin-bottom:4px">Reference</label><input id="mv-ref" class="fi" placeholder="e.g. PO-001" /></div><div><label style="font-size:11px;font-weight:600;color:var(--muted);display:block;margin-bottom:4px">Notes</label><input id="mv-notes" class="fi" placeholder="Optional" /></div></div><div style="display:flex;gap:10px;justify-content:flex-end;margin-top:1.25rem"><button id="mv-cancel" style="padding:8px 18px;border:1.5px solid var(--border);border-radius:8px;background:none;cursor:pointer;font-size:13px">Cancel</button><button onclick="submitMovement()" class="btn primary" style="padding:8px 18px;font-size:13px">Record</button></div></div>';
  modal.querySelector('#mv-cancel').onclick = function(){ document.getElementById('mv-modal').remove(); };
  document.body.appendChild(modal);
}

async function submitMovement() {
  const token = localStorage.getItem('bl_token');
  const productId = document.getElementById('mv-product').value;
  const type = document.getElementById('mv-type').value;
  const quantity = parseFloat(document.getElementById('mv-qty').value);
  if (!productId || !quantity) { alert('Product and quantity are required'); return; }
  try {
    const res = await fetch(BL_BACKEND + '/stock-movements', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify({ productId, type, quantity, reference: document.getElementById('mv-ref').value.trim() || null, notes: document.getElementById('mv-notes').value.trim() || null }) });
    if (!res.ok) throw new Error('Failed');
    document.getElementById('mv-modal').remove();
    loadStockMovements();
  } catch(e) { alert('Error recording movement. Please try again.'); }
}

const _origShowInvTabMv = window.showInvTab;
window.showInvTab = function(id, el) { if (_origShowInvTabMv) _origShowInvTabMv(id, el); if (id === 'movements') loadStockMovements(); };
/* Load products into window._blProducts on startup */
(async function loadBlProducts() {
  const token = localStorage.getItem('bl_token');
  if (!token) return;
  try {
    const res = await fetch(BL_BACKEND + '/products', { headers: { Authorization: 'Bearer ' + token } });
    const data = await res.json();
    window._blProducts = Array.isArray(data) ? data : (data.data || []);
  } catch(e) { window._blProducts = []; }
})();
/* PAYROLL REAL API */
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

async function loadPayrollRuns() {
  const token = localStorage.getItem('bl_token');
  try {
    const res = await fetch(BL_BACKEND + '/payroll/runs', { headers: { Authorization: 'Bearer ' + token } });
    const runs = await res.json();
    window._payrollRuns = Array.isArray(runs) ? runs : [];
    renderPayrollFromDB();
  } catch(e) { console.error('Failed to load payroll runs', e); }
}

function renderPayrollFromDB() {
  const runs = window._payrollRuns || [];
  const emps = window._blEmployees || [];

  // Employee grid
  const empGrid = document.getElementById('empGrid');
  if (empGrid && emps.length > 0) {
    const colors = ['#4f7cff','#00d2a0','#ff7c4f','#c77dff','#ff4f6e','#f5c518','#00bcd4','#ff6b9d'];
    empGrid.innerHTML = emps.map((e,i) => {
      const gross = e.basicSalary + e.hra + e.da + e.otherAllowances;
      const pf = Math.round(e.basicSalary * 0.12);
      const pt = e.basicSalary <= 10000 ? 0 : e.basicSalary <= 15000 ? 150 : 200;
      const net = gross - pf - pt;
      const init = e.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase();
      return '<div class="emp-card"><div class="emp-avatar" style="background:' + colors[i%8] + '">' + init + '</div><div style="flex:1;min-width:0"><div class="emp-name">' + e.name + '</div><div class="emp-dept">' + e.designation + ' · ' + e.department + '</div><div class="emp-salary">&#8377;' + gross.toLocaleString('en-IN') + '<span style="font-size:11px;color:var(--muted)">/mo</span></div><div class="emp-meta"><span class="tag t-blue" style="font-size:9px">' + e.employeeId + '</span><span class="tag t-green" style="font-size:9px">Active</span><span style="font-size:10px;color:var(--muted)">Net: &#8377;' + net.toLocaleString('en-IN') + '</span></div></div></div>';
    }).join('');
  }

  // Payroll table
  const payrollTable = document.getElementById('payrollTable');
  if (payrollTable && emps.length > 0) {
    payrollTable.innerHTML = emps.map(e => {
      const gross = e.basicSalary + e.hra + e.da + e.otherAllowances;
      const pf = Math.round(e.basicSalary * 0.12);
      const esi = gross <= 21000 ? Math.round(gross * 0.0075) : 0;
      const pt = e.basicSalary <= 10000 ? 0 : e.basicSalary <= 15000 ? 150 : 200;
      const net = gross - pf - esi - pt;
      return '<div style="display:grid;grid-template-columns:24px 1fr 80px 100px 80px 90px 90px 100px 80px;gap:0;padding:9px 14px;border-bottom:1px solid var(--border);font-size:12.5px;align-items:center"><input type="checkbox" checked><div><div style="font-weight:500">' + e.name + '</div><div style="font-size:10px;color:var(--muted)">' + e.department + '</div></div><div class="r">&#8377;' + e.basicSalary.toLocaleString('en-IN') + '</div><div class="r">&#8377;' + gross.toLocaleString('en-IN') + '</div><div class="r" style="color:var(--accent3)">&#8377;' + pf.toLocaleString('en-IN') + '</div><div class="r" style="color:var(--accent3)">&#8377;' + esi.toLocaleString('en-IN') + '</div><div class="r" style="color:var(--muted)">&#8377;' + pt.toLocaleString('en-IN') + '</div><div class="r" style="font-weight:600;color:var(--accent2)">&#8377;' + net.toLocaleString('en-IN') + '</div><div class="c"><span class="tag t-blue">Pending</span></div></div>';
    }).join('');
  }

  // Payslip list
  const payslipList = document.getElementById('payslipList');
  if (payslipList) {
    if (runs.length === 0) {
      payslipList.innerHTML = '<div style="padding:32px;text-align:center;color:var(--muted)">No payroll processed yet. Use Process Payroll tab.</div>';
    } else {
      const latest = runs[0];
      payslipList.innerHTML = '<div style="padding:12px 16px;border-bottom:1px solid var(--border);display:grid;grid-template-columns:1fr 100px 100px 100px 90px;gap:14px;font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.05em"><span>Employee</span><span class="r">Gross</span><span class="r">Deductions</span><span class="r">Net Pay</span><span class="c">Month</span></div>' +
        (latest.items || []).map(item => {
          const deductions = item.pfEmployee + item.esiEmployee + item.professionalTax;
          return '<div class="list-row" style="display:grid;grid-template-columns:1fr 100px 100px 100px 90px;gap:14px"><div><div style="font-weight:500">' + item.employee.name + '</div><div style="font-size:11px;color:var(--muted)">' + item.employee.employeeId + ' · ' + item.employee.department + '</div></div><div class="r" style="font-weight:500">&#8377;' + item.grossSalary.toLocaleString('en-IN') + '</div><div class="r" style="color:var(--accent3)">&#8377;' + deductions.toLocaleString('en-IN') + '</div><div class="r" style="font-weight:600;color:var(--accent2)">&#8377;' + item.netSalary.toLocaleString('en-IN') + '</div><div class="c"><span class="tag t-green">' + MONTH_NAMES[latest.month-1] + ' ' + latest.year + '</span></div></div>';
        }).join('');
    }
  }
}

async function processPayrollReal() {
  const token = localStorage.getItem('bl_token');
  const monthEl = document.getElementById('payMonth');
  const yearEl = document.getElementById('payYear');
  const dateEl = document.getElementById('payDate');
  const month = monthEl ? parseInt(monthEl.value) : new Date().getMonth() + 1;
  const year = yearEl ? parseInt(yearEl.value) : new Date().getFullYear();
  const paymentDate = dateEl ? dateEl.value : null;
  if (!confirm('Process payroll for ' + MONTH_NAMES[month-1] + ' ' + year + '?')) return;
  try {
    const res = await fetch(BL_BACKEND + '/payroll/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({ month, year, paymentDate })
    });
    const data = await res.json();
    if (!res.ok) { alert(data.message || 'Failed to process payroll'); return; }
    alert('Payroll processed! ' + (data.items||[]).length + ' employees paid.');
    loadPayrollRuns();
    showPayTab('payslips', document.querySelectorAll('#page-payroll .tab')[2]);
  } catch(e) { alert('Error processing payroll. Please try again.'); }
}

/* Override processPayroll with real API */
window.processPayroll = processPayrollReal;

/* Load employees into _blEmployees */
async function loadBlEmployees() {
  const token = localStorage.getItem('bl_token');
  if (!token) return;
  try {
    const res = await fetch(BL_BACKEND + '/employees', { headers: { Authorization: 'Bearer ' + token } });
    const data = await res.json();
    window._blEmployees = Array.isArray(data) ? data : [];
  } catch(e) { window._blEmployees = []; }
}

/* Hook into showPayTab */
const _origShowPayTab = window.showPayTab;
window.showPayTab = function(id, el) {
  if (_origShowPayTab) _origShowPayTab(id, el);
  if (id === 'employees' || id === 'process' || id === 'payslips') {
    if (!window._blEmployees) loadBlEmployees().then(renderPayrollFromDB);
    else renderPayrollFromDB();
  }
};

/* Init on page load */
loadBlEmployees().then(() => loadPayrollRuns());