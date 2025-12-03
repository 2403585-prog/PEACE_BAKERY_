// PBH.js (final upgraded with LocalStorage persistence)

document.addEventListener("DOMContentLoaded", () => {
  // --- GLOBAL STATE ---
  let isAdmin = false;
  let cart = [];
  let donationHistory = [];
  let wasteHistory = [];
  let products = [];

  // --- ELEMENT HELPERS ---
  const $ = (id) => document.getElementById(id);
  const hide = (el) => el && el.classList.add("hidden");
  const show = (el) => el && el.classList.remove("hidden");

  // --- LOCALSTORAGE HELPERS ---
  function saveState() {
    localStorage.setItem("products", JSON.stringify(products));
    localStorage.setItem("cart", JSON.stringify(cart));
    localStorage.setItem("donationHistory", JSON.stringify(donationHistory));
    localStorage.setItem("wasteHistory", JSON.stringify(wasteHistory));
  }

  function loadState() {
    const prodData = localStorage.getItem("products");
    const cartData = localStorage.getItem("cart");
    const donData = localStorage.getItem("donationHistory");
    const wasteData = localStorage.getItem("wasteHistory");

    if (prodData) {
      products = JSON.parse(prodData);
    } else {
      // Default sample products if none saved yet
      products = [
        {
        
        },
        {
          
        },
        {
       
        }
      ];
    }

    if (cartData) cart = JSON.parse(cartData);
    if (donData) donationHistory = JSON.parse(donData);
    if (wasteData) wasteHistory = JSON.parse(wasteData);
  }

  // --- RENDER PRODUCTS ---
  function renderProducts() {
    const grid = $("products-grid");
    if (!grid) return;

    grid.innerHTML = "";
    products.forEach((p) => {
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <img src="${p.image || 'images/default.jpg'}" alt="${p.name}">
        <h4>${p.name}</h4>
        <p class="small">${p.desc || ""}</p>
        <p><strong>KSh ${p.price}</strong></p>
        <p class="small">In stock: ${p.qty}${p.expiry ? ` • Exp: ${p.expiry}` : ""}</p>
        <button class="add-to-cart"${p.qty <= 0 ? " disabled" : ""}>${p.qty > 0 ? "Add to Cart" : "Out of stock"}</button>
      `;
      const btn = card.querySelector(".add-to-cart");
      btn?.addEventListener("click", () => addToCart({
        id: p.id,
        name: p.name,
        price: p.price,
        image: p.image || "images/default.jpg"
      }));
      grid.appendChild(card);
    });

    refreshDonationSelect();
    renderAdminProductsList();
    saveState();
  }

  // --- CART LOGIC ---
  function updateCartUI() {
    const cartItems = $("cart-items");
    const cartTotal = $("cart-total");
    const cartCount = $("cart-count");

    if (!cartItems || !cartTotal || !cartCount) return;

    cartItems.innerHTML = "";
    let total = 0;

    cart.forEach(item => {
      total += item.price * item.quantity;
      cartItems.innerHTML += `
        <div class="cart-item">
          <img src="${item.image || 'images/default.jpg'}" alt="${item.name}">
          <div>
            <p>${item.name}</p>
            <p>KSh ${item.price} x ${item.quantity}</p>
          </div>
        </div>
      `;
    });

    cartTotal.textContent = total;
    cartCount.textContent = cart.reduce((sum, i) => sum + i.quantity, 0);
    saveState();
  }

  function addToCart(product) {
    const prod = products.find(p => p.id === product.id);
    if (!prod || prod.qty <= 0) {
      alert("Sorry, this product is out of stock.");
      return;
    }

    const existing = cart.find(p => p.id === product.id);
    const currentQtyInCart = existing ? existing.quantity : 0;

    if (currentQtyInCart >= prod.qty) {
      alert("No more stock available.");
      return;
    }

    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({ ...product, quantity: 1 });
    }

    updateCartUI();
  }

  // --- ADMIN ADD PRODUCT ---
  $("add-product-btn")?.addEventListener("click", () => {
    if (!isAdmin) {
      alert("Only admin can add products.");
      return;
    }

    const name = $("p-name")?.value?.trim();
    const category = $("p-category")?.value?.trim();
    const price = Number($("p-price")?.value);
    const qty = Number($("p-qty")?.value);
    const expiry = $("p-expiry")?.value?.trim();
    const image = $("p-image")?.value?.trim();
    const desc = $("p-desc")?.value?.trim();

    if (!name || !price || !qty || price < 0 || qty < 0) {
      alert("Name, positive price, and non-negative quantity are required.");
      return;
    }

    const newProduct = {
      id: Date.now(),
      name,
      category,
      price,
      qty,
      expiry,
      image: image || "images/default.jpg",
      desc
    };

    products.push(newProduct);
    renderProducts();
    refreshDonationSelect();
    renderAdminProductsList();
    saveState();

    ["p-name","p-category","p-price","p-qty","p-expiry","p-image","p-desc"].forEach(id => { if ($(id)) $(id).value = ""; });

    alert("Product added successfully!");
  });

  // --- DONATIONS & WASTE ---
  $("record-donation")?.addEventListener("click", () => {
    if (!isAdmin) return alert("Only admin can record donations.");

    const prodId = Number($("don-prod")?.value);
    const qty = Number($("don-qty")?.value);
    const recipient = $("don-recipient")?.value?.trim();

    const prod = products.find(p => p.id === prodId);
    if (!prod || qty <= 0 || !recipient) return alert("Invalid donation details.");
    if (prod.qty < qty) return alert("Insufficient stock.");

    prod.qty -= qty;
    donationHistory.push({ productId: prod.id, product: prod.name, qty, recipient, date: new Date().toLocaleString() });

    renderProducts();
    saveState();
    alert(`Donation recorded: ${qty} x ${prod.name} to ${recipient}.`);
  });

  $("record-waste")?.addEventListener("click", () => {
    if (!isAdmin) return alert("Only admin can record waste.");

    const prodId = Number($("don-prod")?.value);
    const qty = Number($("don-qty")?.value);
    const reason = $("waste-reason")?.value?.trim();

    const prod = products.find(p => p.id === prodId);
    if (!prod || qty <= 0 || !reason) return alert("Invalid waste details.");
    if (prod.qty < qty) return alert("Insufficient stock.");

    prod.qty -= qty;
    wasteHistory.push({ productId: prod.id, product: prod.name, qty, reason, date: new Date().toLocaleString() });

    renderProducts();
    saveState();
    alert(`Waste recorded: ${qty} x ${prod.name}. Reason: ${reason}.`);
  });

  // --- CHECKOUT ---
  $("place-order")?.addEventListener("click", () => {
    const name = $("c-name")?.value?.trim();
    const phone = $("c-phone")?.value?.trim();
    const address = $("c-address")?.value?.trim();

    if (!name || !phone || !address) {
      alert

