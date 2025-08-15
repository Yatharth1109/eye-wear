/* ========= Basics / Nav / Year ========= */
const $ = (q, ctx=document) => ctx.querySelector(q);
const $$ = (q, ctx=document) => [...ctx.querySelectorAll(q)];
const body = document.body;

const yearEl = $("#year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* Mobile nav */
const burger = $(".hamburger");
const navLinks = $(".nav-links");
if (burger && navLinks) {
  burger.addEventListener("click", () => {
    const open = navLinks.classList.toggle("show");
    burger.setAttribute("aria-expanded", open ? "true" : "false");
  });
}

/* ========= Cart Store (localStorage) ========= */
const CART_KEY = "eyewear_cart_v1";
const getCart = () => JSON.parse(localStorage.getItem(CART_KEY) || "[]");
const setCart = (c) => localStorage.setItem(CART_KEY, JSON.stringify(c));
const cartCount = () => getCart().reduce((n,i)=>n+i.qty,0);

function updateCartPills(){
  const count = cartCount();
  const places = [$("#navCartCount"), $("#footerCartCount")].filter(Boolean);
  places.forEach(p=>p.textContent = count);
}
updateCartPills();

/* ========= Product Data =========
   One frame with 6 colors. Replace image filenames with your actual assets.
*/
const PRODUCT = {
  id: "one-frame",
  title: "The One Frame",
  basePrice: 1999, // INR
  colors: [
    { key:"white",   name:"Soft White",   hex:"#F5F6F6", img:"eyewear-white.jfif" },
    { key:"aqua",    name:"Light Aqua",   hex:"#75CED2", img:"eyewear-aqua.jfif" },
    { key:"teal",    name:"Teal",         hex:"#618E8D", img:"eyewear-teal.jfif" },
    { key:"gray",    name:"Graphite",     hex:"#7F7F89", img:"eyewear-gray.jfif" },
    { key:"navy",    name:"Deep Navy",    hex:"#171931", img:"eyewear-navy.jfif" },
    { key:"classic", name:"Classic Black",hex:"#000000", img:"eyewear-black.jfif" },
  ],
  lenses: ["Blue-Cut","Sunglass"]
};

/* ========= Product Page Wiring ========= */
(function initProductPage(){
  const mainImg = $("#mainImg");
  const colorSwatches = $("#colorSwatches");
  const colorThumbs = $("#colorThumbs");
  const lensSeg = $("#lensSeg");
  const qtyInp = $("#qtyInput");
  const addBtn = $("#addToCart");
  const priceEl = $("#pPrice");

  if(!mainImg || !colorSwatches || !lensSeg) return;

  let state = {
    color: PRODUCT.colors[0].key,
    lens: PRODUCT.lenses[0],
    qty: 1
  };

  // Render swatches
  PRODUCT.colors.forEach((c, idx) => {
    const s = document.createElement("button");
    s.className = "swatch" + (idx===0 ? " active" : "");
    s.style.background = c.hex;
    s.title = c.name;
    s.dataset.color = c.key;
    colorSwatches.appendChild(s);

    const t = document.createElement("button");
    t.className = "thumb" + (idx===0 ? " active" : "");
    t.innerHTML = `<img alt="${c.name}" src="${c.img}">`;
    t.dataset.color = c.key;
    colorThumbs?.appendChild(t);
  });

  function setColor(key){
    const c = PRODUCT.colors.find(x=>x.key===key) || PRODUCT.colors[0];
    state.color = c.key;
    mainImg.src = c.img;
    // active styles
    $$(".swatch").forEach(b=>b.classList.toggle("active", b.dataset.color===key));
    $$(".thumb").forEach(b=>b.classList.toggle("active", b.dataset.color===key));
  }

  colorSwatches.addEventListener("click", (e)=>{
    const btn = e.target.closest(".swatch"); if(!btn) return;
    setColor(btn.dataset.color);
  });
  colorThumbs?.addEventListener("click", (e)=>{
    const btn = e.target.closest(".thumb"); if(!btn) return;
    setColor(btn.dataset.color);
  });

  lensSeg.addEventListener("click", (e)=>{
    const b = e.target.closest(".seg-btn"); if(!b) return;
    $$(".seg-btn", lensSeg).forEach(x=>x.classList.remove("active"));
    b.classList.add("active");
    state.lens = b.dataset.lens;
  });

  $("#qtyInc").addEventListener("click", ()=> qtyInp.value = (+qtyInp.value||1)+1);
  $("#qtyDec").addEventListener("click", ()=> qtyInp.value = Math.max(1,(+qtyInp.value||1)-1));

  function computePrice(){
    // Example: Sunglass +200
    const extra = state.lens === "Sunglass" ? 200 : 0;
    return PRODUCT.basePrice + extra;
  }
  function renderPrice(){
    priceEl.textContent = `₹${computePrice().toLocaleString("en-IN")}`;
  }
  renderPrice();
  lensSeg.addEventListener("click", renderPrice);

  addBtn.addEventListener("click", ()=>{
    state.qty = Math.max(1, +qtyInp.value || 1);
    const item = {
      pid: PRODUCT.id,
      title: PRODUCT.title,
      color: state.color,
      lens: state.lens,
      price: computePrice(),
      img: (PRODUCT.colors.find(x=>x.key===state.color)||PRODUCT.colors[0]).img,
      qty: state.qty
    };
    const cart = getCart();
    const existing = cart.find(i => i.pid===item.pid && i.color===item.color && i.lens===item.lens);
    if (existing) existing.qty += item.qty; else cart.push(item);
    setCart(cart);
    updateCartPills();
    addBtn.textContent = "Added ✓";
    setTimeout(()=> addBtn.textContent = "Add to Cart", 1200);
  });
})();

/* ========= Cart Page ========= */
(function initCartPage(){
  const list = $("#cartList");
  if(!list) return;

  function rowHTML(item, idx){
    return `
      <div class="cart-item" data-idx="${idx}">
        <img class="cart-thumb" src="${item.img}" alt="${item.title}">
        <div>
          <div><strong>${item.title}</strong></div>
          <div class="item-meta">Color: ${item.color} • Lens: ${item.lens}</div>
          <div class="item-controls">
            <button class="qty-btn minus">−</button>
            <input class="qty" type="number" min="1" value="${item.qty}" />
            <button class="qty-btn plus">+</button>
            <button class="remove">Remove</button>
          </div>
        </div>
        <div><strong>₹${(item.price*item.qty).toLocaleString("en-IN")}</strong></div>
      </div>`;
  }

  function render(){
    const cart = getCart();
    if(cart.length===0){
      list.innerHTML = `<div class="card"><p>Your cart is empty.</p><a class="btn btn-primary" href="product.html">Shop Now</a></div>`;
      $("#subTotal").textContent = "₹0";
      $("#shipCost").textContent = "₹0";
      $("#grandTotal").textContent = "₹0";
      updateCartPills();
      return;
    }
    list.innerHTML = cart.map(rowHTML).join("");

    const sub = cart.reduce((n,i)=>n + i.price*i.qty, 0);
    const ship = sub>1499 ? 0 : 99;
    const total = sub + ship;
    $("#subTotal").textContent = `₹${sub.toLocaleString("en-IN")}`;
    $("#shipCost").textContent = `₹${ship.toLocaleString("en-IN")}`;
    $("#grandTotal").textContent = `₹${total.toLocaleString("en-IN")}`;
    updateCartPills();
  }
  render();

  list.addEventListener("click", (e)=>{
    const row = e.target.closest(".cart-item"); if(!row) return;
    const idx = +row.dataset.idx;
    const cart = getCart();
    if(e.target.classList.contains("remove")){
      cart.splice(idx,1);
      setCart(cart); render();
    }
    if(e.target.classList.contains("minus")){
      cart[idx].qty = Math.max(1, cart[idx].qty - 1);
      setCart(cart); render();
    }
    if(e.target.classList.contains("plus")){
      cart[idx].qty += 1;
      setCart(cart); render();
    }
  });

  list.addEventListener("change", (e)=>{
    const row = e.target.closest(".cart-item"); if(!row) return;
    if(!e.target.classList.contains("qty")) return;
    const idx = +row.dataset.idx;
    const cart = getCart();
    cart[idx].qty = Math.max(1, +e.target.value||1);
    setCart(cart); render();
  });

  // Checkout (frontend success demo)
  const form = $("#checkoutForm");
  const success = $("#orderSuccess");
  const orderIdEl = $("#orderId");
  if(form){
    form.addEventListener("submit",(e)=>{
      e.preventDefault();
      const id = "ORD" + Math.random().toString(36).slice(2,8).toUpperCase();
      orderIdEl.textContent = id;
      form.hidden = true; success.hidden = false;
      // In real backend: create order, charge payment, send email/SMS.
      setCart([]); updateCartPills();
    });
  }

})();
