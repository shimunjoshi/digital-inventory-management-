const STORAGE_KEY = "smartstock_products_v1";
const SALES_KEY = "smartstock_sales_v1";
const $ = (id) => document.getElementById(id);
const money = (n) => new Intl.NumberFormat("en-IN", {style:"currency",currency:"INR",maximumFractionDigits:2}).format(Number(n)||0);
const escapeHTML = (value) => String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let products = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
let sales = JSON.parse(localStorage.getItem(SALES_KEY) || "[]");
if (!Array.isArray(products)) {
  products = [
    {id:crypto.randomUUID(),name:"A4 Notebook",category:"Stationery",price:65,quantity:32,threshold:8},
    {id:crypto.randomUUID(),name:"Ball Pen Pack",category:"Stationery",price:40,quantity:6,threshold:10},
    {id:crypto.randomUUID(),name:"Water Bottle",category:"Accessories",price:180,quantity:18,threshold:5},
    {id:crypto.randomUUID(),name:"Desk Organizer",category:"Accessories",price:250,quantity:3,threshold:5},
    {id:crypto.randomUUID(),name:"LED Bulb 9W",category:"Electronics",price:120,quantity:24,threshold:6}
  ];
  save();
}
function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(products));localStorage.setItem(SALES_KEY,JSON.stringify(sales));}
function toast(message){const el=$("toast");el.textContent=message;el.classList.add("show");clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove("show"),2500);}
function statusFor(p){return p.quantity===0?'<span class="pill">Out of stock</span>':p.quantity<=p.threshold?'<span class="pill">Low stock</span>':'<span class="pill good">In stock</span>';}
function render(){
  const low=products.filter(p=>p.quantity<=p.threshold);
  $("stat-products").textContent=products.length;
  $("stat-units").textContent=products.reduce((s,p)=>s+p.quantity,0);
  $("stat-value").textContent=money(products.reduce((s,p)=>s+p.price*p.quantity,0));
  $("stat-low").textContent=low.length;
  $("low-stock-list").innerHTML=low.length?low.slice(0,5).map(p=>`<div class="alert-item"><div><div class="item-name">${escapeHTML(p.name)}</div><div class="item-sub">${escapeHTML(p.category)}</div></div><span class="pill">${p.quantity} left</span></div>`).join(""):'<p class="muted">All products are sufficiently stocked. Nice work!</p>';
  const recent=[...sales].reverse().slice(0,4);
  $("recent-sales").innerHTML=recent.length?`<table class="mini-table">${recent.map(s=>`<tr><td><strong>${escapeHTML(s.productName)}</strong><div class="item-sub">${new Date(s.date).toLocaleDateString("en-IN")}</div></td><td>${s.quantity} sold</td><td>${money(s.total)}</td></tr>`).join("")}</table>`:'<p class="muted">No sales recorded yet.</p>';
  const categories={};products.forEach(p=>categories[p.category]=(categories[p.category]||0)+1);
  $("category-list").innerHTML=Object.keys(categories).length?Object.entries(categories).map(([name,count])=>`<div class="category-card"><strong>${escapeHTML(name)}</strong><span>${count} product${count===1?"":"s"}</span></div>`).join(""):'<p class="muted">Add products to see categories.</p>';
  renderProducts();renderSales();updateCategoryFilter();updateSaleOptions();
}
function renderProducts(){
  const term=$("search").value.trim().toLowerCase(),cat=$("category-filter").value;
  const filtered=products.filter(p=>(p.name.toLowerCase().includes(term)||p.category.toLowerCase().includes(term))&&(!cat||p.category===cat));
  $("product-rows").innerHTML=filtered.map(p=>`<tr><td><strong>${escapeHTML(p.name)}</strong></td><td>${escapeHTML(p.category)}</td><td>${money(p.price)}</td><td>${p.quantity}</td><td>${statusFor(p)}</td><td><div class="actions"><button class="small-btn" data-edit="${p.id}">Edit</button><button class="small-btn danger" data-delete="${p.id}">Delete</button></div></td></tr>`).join("");
  $("empty-products").classList.toggle("hidden",filtered.length!==0);
}
function renderSales(){
  $("sales-count").textContent=sales.length;
  $("sales-revenue").textContent=money(sales.reduce((s,x)=>s+x.total,0));
  $("sales-rows").innerHTML=[...sales].reverse().map(s=>`<tr><td>${new Date(s.date).toLocaleString("en-IN")}</td><td><strong>${escapeHTML(s.productName)}</strong></td><td>${s.quantity}</td><td>${money(s.price)}</td><td><strong>${money(s.total)}</strong></td></tr>`).join("");
  $("empty-sales").classList.toggle("hidden",sales.length!==0);
}
function updateCategoryFilter(){
  const select=$("category-filter"),selected=select.value,cats=[...new Set(products.map(p=>p.category))].sort();
  select.innerHTML='<option value="">All categories</option>'+cats.map(c=>`<option value="${escapeHTML(c)}">${escapeHTML(c)}</option>`).join("");
  select.value=cats.includes(selected)?selected:"";
}
function updateSaleOptions(){
  const select=$("sale-product"),available=products.filter(p=>p.quantity>0);
  select.innerHTML=available.length?available.map(p=>`<option value="${p.id}">${escapeHTML(p.name)} — ${p.quantity} available</option>`).join(""):'<option value="">No stock available</option>';
  updateSaleHint();
}
function updateSaleHint(){const p=products.find(x=>x.id===$("sale-product").value);$("sale-stock-hint").textContent=p?`Available: ${p.quantity} · Unit price: ${money(p.price)}`:"There are no products with available stock.";}
function showView(name){
  document.querySelectorAll(".view").forEach(v=>v.classList.add("hidden"));
  $(name+"-view").classList.remove("hidden");
  document.querySelectorAll(".nav-link").forEach(b=>b.classList.toggle("active",b.dataset.view===name));
  $("page-title").textContent=name[0].toUpperCase()+name.slice(1);
}
function openProduct(product=null){
  $("product-form").reset();$("product-id").value=product?.id||"";
  $("product-modal-title").textContent=product?"Edit product":"Add product";
  $("product-name").value=product?.name||"";$("product-category").value=product?.category||"";
  $("product-price").value=product?.price??"";$("product-quantity").value=product?.quantity??"";
  $("product-threshold").value=product?.threshold??5;
  $("product-modal").classList.remove("hidden");$("product-name").focus();
}
function closeModal(id){$(id).classList.add("hidden");}
document.querySelectorAll(".nav-link").forEach(b=>b.addEventListener("click",()=>showView(b.dataset.view)));
document.querySelectorAll("[data-go]").forEach(b=>b.addEventListener("click",()=>showView(b.dataset.go)));
$("quick-add").addEventListener("click",()=>{showView("inventory");openProduct();});
$("add-product").addEventListener("click",()=>openProduct());
$("product-form").addEventListener("submit",e=>{
  e.preventDefault();const id=$("product-id").value;
  const item={id:id||crypto.randomUUID(),name:$("product-name").value.trim(),category:$("product-category").value.trim(),price:Number($("product-price").value),quantity:Number($("product-quantity").value),threshold:Number($("product-threshold").value)};
  if(!item.name||!item.category||item.price<=0||item.quantity<0||item.threshold<0){toast("Please enter valid product details.");return;}
  const index=products.findIndex(p=>p.id===id);if(index>=0)products[index]=item;else products.push(item);
  save();render();closeModal("product-modal");toast(index>=0?"Product updated.":"Product added successfully.");
});
$("product-rows").addEventListener("click",e=>{
  const edit=e.target.closest("[data-edit]"),del=e.target.closest("[data-delete]");
  if(edit){const p=products.find(x=>x.id===edit.dataset.edit);if(p)openProduct(p);}
  if(del){const p=products.find(x=>x.id===del.dataset.delete);if(p&&confirm(`Delete ${p.name}?`)){products=products.filter(x=>x.id!==p.id);save();render();toast("Product deleted.");}}
});
$("search").addEventListener("input",renderProducts);$("category-filter").addEventListener("change",renderProducts);
$("record-sale").addEventListener("click",()=>{updateSaleOptions();if(!products.some(p=>p.quantity>0)){toast("Add stock before recording a sale.");return;}$("sale-modal").classList.remove("hidden");});
$("sale-product").addEventListener("change",updateSaleHint);
$("sale-form").addEventListener("submit",e=>{
  e.preventDefault();const p=products.find(x=>x.id===$("sale-product").value),qty=Number($("sale-quantity").value);
  if(!p||!Number.isInteger(qty)||qty<1||qty>p.quantity){toast("Please enter a valid quantity within available stock.");return;}
  p.quantity-=qty;sales.push({id:crypto.randomUUID(),productId:p.id,productName:p.name,quantity:qty,price:p.price,total:qty*p.price,date:new Date().toISOString()});
  save();render();closeModal("sale-modal");toast("Sale recorded and stock updated.");
});
document.querySelectorAll("[data-close]").forEach(b=>b.addEventListener("click",()=>closeModal(b.dataset.close)));
document.querySelectorAll(".modal-backdrop").forEach(backdrop=>backdrop.addEventListener("click",e=>{if(e.target===backdrop)closeModal(backdrop.id);}));
$("today").textContent=new Date().toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"short",year:"numeric"});
render();