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