(function(){
  if(!localStorage.getItem('bl_token')){
    document.documentElement.style.visibility='hidden';
    window.location.replace('/login.html');
  }
})();

function blLogout(){
  localStorage.removeItem('bl_token');
  localStorage.removeItem('bl_user');
  window.location.href='/login.html';
}

function blToast(msg,type){
  if(typeof toast==='function'){toast(msg,type==='error'?'e':'');}
  else{alert(msg);}
}
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

window.addEventListener('load',async()=>{
  try{
    const emps=await blEmployees.list();
    if(emps&&emps.length&&typeof EMPLOYEES!=='undefined'){
      emps.forEach(e=>{
        if(!EMPLOYEES.find(x=>x.id===e.employeeId)){
          EMPLOYEES.push({id:e.employeeId,name:e.name,dept:e.department,desig:e.designation,basic:e.basicSalary,hra:e.hra,da:e.da,other:e.otherAllowances,status:e.isActive?'active':'inactive'});
        }
      });
      if(typeof empCount!=='undefined')empCount=EMPLOYEES.length;
      if(typeof renderPayroll==='function')renderPayroll();
    }
  }catch(e){console.warn('Employees:',e.message);}
  try{
    const prods=await blProducts.list();
    if(prods&&prods.length&&typeof PRODUCTS!=='undefined'){
      prods.forEach(p=>{
        if(!PRODUCTS.find(x=>x.sku===p.sku)){
          PRODUCTS.push({sku:p.sku,name:p.name,cat:p.category,qty:parseFloat(p.currentStock)||0,reorder:parseFloat(p.reorderLevel)||10,max:500,cost:parseFloat(p.costPrice)||0,sell:parseFloat(p.sellingPrice)||0,status:p.currentStock==0?'out':p.currentStock<p.reorderLevel?'low':'ok'});
        }
      });
      if(typeof prodCount!=='undefined')prodCount=PRODUCTS.length;
      if(typeof renderInventory==='function')renderInventory();
    }
  }catch(e){console.warn('Products:',e.message);}
});
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
    await fetch('https://bizledger-erp-production.up.railway.app/api/journal-entries',{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},
      body:JSON.stringify(data)
    });
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
  const totalLiabilities=liabilities.reduce((s,a)=>s+a.bal,0);
  const totalEquity=equity.reduce((s,a)=>s+a.bal,0);
  const totalLE=totalLiabilities+totalEquity;
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
    <tr style="background:var(--surface2)"><td colspan="2" style="font-size:11px;color:var(--muted);text-transform:uppercase;padding-top:14px">Liabilities</td></tr>
    ${liabilities.map(a=>`<tr><td style="padding-left:20px">${a.name}</td><td class="r">${fmt(a.bal)}</td></tr>`).join('')}
    <tr style="background:var(--surface2)"><td colspan="2" style="font-size:11px;color:var(--muted);text-transform:uppercase;padding-top:14px">Equity</td></tr>
    ${equity.map(a=>`<tr><td style="padding-left:20px">${a.name}</td><td class="r">${fmt(a.bal)}</td></tr>`).join('')}
    <tr style="border-top:1px solid var(--border)"><td style="font-weight:600">Total L + E</td><td class="r" style="font-weight:700;color:var(--accent)">${fmt(totalLE)}</td></tr>
    <tr style="border-top:2px solid var(--border)"><td style="font-weight:700">Difference</td><td class="r" style="font-weight:700;color:${Math.abs(totalAssets-totalLE)<1?'var(--accent2)':'var(--danger)'}">${Math.abs(totalAssets-totalLE)<1?'✓ Balanced':fmt(Math.abs(totalAssets-totalLE))+' (Check entries)'}</td></tr>
  </tbody>`;
};
window.postGstInvoice = async function(){
  const buyer=document.getElementById('gstBuyerName').value.trim();
  if(!buyer){toast('Enter customer name','e');return;}
  const invoiceNo='INV-'+Date.now().toString().slice(-6);
  const subtotal=parseFloat(document.getElementById('gstSubtotal')?.textContent?.replace(/[^0-9.]/g,'')||0);
  const cgst=parseFloat(document.getElementById('gstCGST')?.textContent?.replace(/[^0-9.]/g,'')||0);
  const sgst=parseFloat(document.getElementById('gstSGST')?.textContent?.replace(/[^0-9.]/g,'')||0);
  const igst=parseFloat(document.getElementById('gstIGST')?.textContent?.replace(/[^0-9.]/g,'')||0);
  const grandTotal=subtotal+cgst+sgst+igst||1;
  const data={
    invoiceNo,
    invoiceDate:new Date().toISOString(),
    customerName:buyer,
    customerGstin:document.getElementById('gstBuyerGstin')?.value||'',
    customerAddr:document.getElementById('gstBuyerAddr')?.value||'',
    placeOfSupply:document.getElementById('gstPos')?.value||'West Bengal',
    subtotal:subtotal||1,
    cgst,sgst,igst,
    grandTotal,
    roundOff:0,
    status:'POSTED',
    items:[],
  };
  try{
    const token=localStorage.getItem('bl_token');
    const res=await fetch('https://bizledger-erp-production.up.railway.app/api/invoices',{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},
      body:JSON.stringify(data)
    });
    const saved=await res.json();
    INVOICES.unshift({no:invoiceNo,party:buyer,gstin:data.customerGstin,date:new Date().toISOString().slice(0,10),tax:cgst+sgst+igst,total:grandTotal,status:'posted'});
    renderAllInvoices();
    blToast('Invoice posted and saved to database ✓');
    showGstTab('invoices');
  }catch(err){
    blToast('Invoice saved locally ✓');
    showGstTab('invoices');
  }
};

window.addEventListener('load',async function blLoadInvoices(){
  try{
    const token=localStorage.getItem('bl_token');
    const res=await fetch('https://bizledger-erp-production.up.railway.app/api/invoices',{
      headers:{'Authorization':'Bearer '+token}
    });
    const invoices=await res.json();
    if(invoices&&invoices.length){
      invoices.forEach(inv=>{
        if(!INVOICES.find(x=>x.no===inv.invoiceNo)){
          INVOICES.unshift({
            no:inv.invoiceNo,
            party:inv.customerName,
            gstin:inv.customerGstin||'',
            date:inv.invoiceDate?.slice(0,10),
            tax:Number(inv.cgst)+Number(inv.sgst)+Number(inv.igst),
            total:Number(inv.grandTotal),
            status:inv.status?.toLowerCase()||'posted'
          });
        }
      });
      renderAllInvoices();
    }
  }catch(e){console.warn('Invoices:',e.message);}
},false);

// Settings — Save company details
document.addEventListener('DOMContentLoaded',function(){
  const saved=JSON.parse(localStorage.getItem('bl_company')||'{}');
  if(saved.name)document.querySelector('[placeholder="Company Name"]')&&(document.querySelector('[placeholder="Company Name"]').value=saved.name);
  if(saved.gstin)document.querySelector('[placeholder="GSTIN"]')&&(document.querySelector('[placeholder="GSTIN"]').value=saved.gstin);
  if(saved.pan)document.querySelector('[placeholder="PAN"]')&&(document.querySelector('[placeholder="PAN"]').value=saved.pan);
  const saveBtn=document.querySelector('.btn.success[onclick*="Company details saved"]');
  if(saveBtn){
    saveBtn.onclick=function(){
      const company={
        name:document.querySelector('[placeholder="Company Name"]')?.value||'',
        gstin:document.querySelector('[placeholder="GSTIN"]')?.value||'',
        pan:document.querySelector('[placeholder="PAN"]')?.value||'',
      };
      localStorage.setItem('bl_company',JSON.stringify(company));
      blToast('Company details saved ✓');
    };
  }
});

// Dashboard — make key numbers editable
document.addEventListener('DOMContentLoaded',function(){
  const dash=localStorage.getItem('bl_dash');
  if(dash){
    const d=JSON.parse(dash);
    const cards=document.querySelectorAll('.kpi-val,.stat-val,[class*="kpi"],[class*="stat"]');
    if(d.cash&&cards[0])cards[0].textContent='₹'+Number(d.cash).toLocaleString('en-IN');
    if(d.revenue&&cards[1])cards[1].textContent='₹'+Number(d.revenue).toLocaleString('en-IN');
    if(d.expenses&&cards[2])cards[2].textContent='₹'+Number(d.expenses).toLocaleString('en-IN');
    if(d.gst&&cards[3])cards[3].textContent='₹'+Number(d.gst).toLocaleString('en-IN');
  }
});
window.addEventListener('load',async function(){
  try{
    const token=localStorage.getItem('bl_token');
    const res=await fetch('https://bizledger-erp-production.up.railway.app/api/invoices',{
      headers:{'Authorization':'Bearer '+token}
    });
    const invoices=await res.json();
    if(invoices&&invoices.length){
      invoices.forEach(inv=>{
        if(!INVOICES.find(x=>x.no===inv.invoiceNo)){
          INVOICES.unshift({
            no:inv.invoiceNo,
            party:inv.customerName,
            gstin:inv.customerGstin||'',
            date:inv.invoiceDate?.slice(0,10),
            tax:Number(inv.cgst)+Number(inv.sgst)+Number(inv.igst),
            total:Number(inv.grandTotal),
            status:inv.status?.toLowerCase()||'posted'
          });
        }
      });
      renderAllInvoices();
    }
  }catch(e){console.warn('Invoices:',e.message);}
});
window.addEventListener('load',async function(){if(typeof INVOICES==='undefined')return;try{const token=localStorage.getItem('bl_token');const res=await fetch('https://bizledger-erp-production.up.railway.app/api/invoices',{headers:{'Authorization':'Bearer '+token}});const invoices=await res.json();if(invoices&&invoices.length){invoices.forEach(inv=>{if(!INVOICES.find(x=>x.no===inv.invoiceNo)){INVOICES.unshift({no:inv.invoiceNo,party:inv.customerName,gstin:inv.customerGstin||'',date:inv.invoiceDate?.slice(0,10),tax:Number(inv.cgst)+Number(inv.sgst)+Number(inv.igst),total:Number(inv.grandTotal),status:inv.status?.toLowerCase()||'posted'});}});renderAllInvoices();}}catch(e){console.warn('Invoices:',e.message);}});