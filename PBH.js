// PBH.js — fixed to match your HTML IDs, with LocalStorage and image support
document.addEventListener("DOMContentLoaded", () => {
  // --- GLOBAL STATE ---
  let isAdmin = false;
  let products = [];
  let cart = [];
  let donationHistory = [];
  let wasteHistory = [];

  // --- HELPERS ---
  const $ = (id) => document.getElementById(id);
  const hide = (el) => el && el.classList.add("hidden");
  const show = (el) => el && el.classList.remove("hidden");

  // --- LOCALSTORAGE ---
  function saveState() {
    localStorage.setItem("pbh_products", JSON.stringify(products));
    localStorage.setItem("pbh_cart", JSON.stringify(cart));
    localStorage.setItem("pbh_donations", JSON.stringify(donationHistory));
    localStorage.setItem("pbh_waste", JSON.stringify(wasteHistory));
  }

  function loadState() {
    try {
      products = JSON.parse(localStorage.getItem("pbh_products")) || [];
      cart = JSON.parse(localStorage.getItem("pbh_cart")) || [];
      donationHistory = JSON.parse(localStorage.getItem("pbh_donations")) || [];
      wasteHistory = JSON.parse(localStorage.getItem("pbh_waste")) || [];
    } catch (e) {
      console.error("Failed to parse saved state:", e);
      products = [];
      cart = [];
      donationHistory = [];
      wasteHistory = [];
    }

    // If first run, populate sample products
    if (!products || products.length === 0) {
      products = [
        {
          id: 1,
          name: "Vanilla Cupcake",
          category: "Pastry",
          price: 130,
          qty: 50,
          expiry: "2025-12-31",
          image: "https://images.unsplash.com/photo-1464347744102-1b0d5c0c3a83?w=600",
          desc: "Topped with buttercream."
        },
        {
          id: 2,
          name: "Banana Bread",
          category: "Bread",
          price: 100,
          qty: 20,
          expiry: "2025-11-30",
          image: "https://images.unsplash.com/photo-1549575815-3e73b8ff9252?w=600",
          desc: "Moist and flavorful."
        }
      ];
      saveState();
    }
  }

  // --- RENDER PRODUCTS (main grid) ---
  function renderProducts() {
    const grid = $("products-grid");
    if (!grid) return;
    grid.innerHTML = "";

    products.forEach(p => {
      const card = document.createElement("div");
      card.className = "card";
      // sanitize / fallback values
      const imgSrc = p.image && p.image.trim() ? p.image.trim() : "images/default.jpg";
      const name = p.name || "Unnamed";
      const desc = p.desc || "";
      const price = Number.isFinite(p.price) ? p.price : 0;
      const qty = Number.isFinite(p.qty) ? p.qty : 0;
      const expiryText = p.expiry ? ` • Exp: ${p.expiry}` : "";

      card.innerHTML = `
        <img src="${imgSrc}" alt="${name}" onerror="this.src='images/default.jpg'">
        <h4>${name}</h4>
        <p class="small">${desc}</p>
        <p><strong>KSh ${price}</strong></p>
        <p class="small">In stock: ${qty}${expiryText}</p>
        <button class="add-to-cart"${qty <= 0 ? " disabled" : ""}>${qty > 0 ? "Add to Cart" : "Out of stock"}</button>
      `;

      const btn = card.querySelector(".add-to-cart");
      btn?.addEventListener("click", () => addToCart(p.id));
      grid.appendChild(card);
    });

    refreshDonationSelect();
    renderAdminProductsList();
    updateCartUI();
    saveState();
  }

  // --- CART LOGIC ---
  function updateCartUI() {
    const items = $("cart-items");
    const totalEl = $("cart-total");
    const countEl = $("cart-count");
    if (!items || !totalEl || !countEl) return;

    items.innerHTML = "";
    let total = 0;

    cart.forEach(ci => {
      total += ci.price * ci.quantity;
      const div = document.createElement("div");
      div.className = "cart-item";
      div.innerHTML = `
        <img src="${ci.image || 'images/default.jpg'}" alt="${ci.name}" onerror="this.src='images/default.jpg'">
        <div>
          <p>${ci.name}</p>
          <p>KSh ${ci.price} x ${ci.quantity}</p>
        </div>
      `;
      items.appendChild(div);
    });

    totalEl.textContent = total;
    countEl.textContent = cart.reduce((s, i) => s + i.quantity, 0);
    saveState();
  }

  function addToCart(productId) {
    const prod = products.find(p => p.id === productId);
    if (!prod) return alert("Product not found.");
    if (prod.qty <= 0) return alert("Sorry, this product is out of stock.");

    const existing = cart.find(c => c.id === productId);
    const currentQtyInCart = existing ? existing.quantity : 0;
    if (currentQtyInCart >= prod.qty) return alert("No more stock available.");

    if (existing) existing.quantity += 1;
    else cart.push({ id: prod.id, name: prod.name, price: prod.price, image: prod.image, quantity: 1 });

    updateCartUI();
  }

  // --- NAVIGATION (matches your HTML IDs) ---
  $("btn-home")?.addEventListener("click", () => {
    show($("hero"));
    hide($("products-section"));
    hide($("about-section"));
    hide($("contact-section"));
  });

  $("btn-products")?.addEventListener("click", () => {
    hide($("hero"));
    show($("products-section"));
    hide($("about-section"));
    hide($("contact-section"));
  });

  $("btn-about")?.addEventListener("click", () => {
    hide($("hero"));
    hide($("products-section"));
    show($("about-section"));
    hide($("contact-section"));
  });

  $("btn-contact")?.addEventListener("click", () => {
    hide($("hero"));
    hide($("products-section"));
    hide($("about-section"));
    show($("contact-section"));
  });

  $("shop-now")?.addEventListener("click", () => {
    hide($("hero"));
    show($("products-section"));
  });

  // --- CART PANEL buttons (IDs match your HTML) ---
  $("open-cart")?.addEventListener("click", () => show($("cart-panel")));
  $("close-cart")?.addEventListener("click", () => hide($("cart-panel")));
  $("clear-cart")?.addEventListener("click", () => {
    cart = [];
    updateCartUI();
    saveState();
  });

  // --- CHECKOUT modal buttons ---
  $("checkout-btn")?.addEventListener("click", () => show($("checkout-modal")));
  $("checkout-close")?.addEventListener("click", () => hide($("checkout-modal")));
  $("place-order")?.addEventListener("click", () => {
    const name = $("c-name")?.value?.trim();
    const phone = $("c-phone")?.value?.trim();
    const address = $("c-address")?.value?.trim();

    if (!name || !phone || !address) {
      alert("Please fill in name, phone, and address.");
      return;
    }

    if (cart.length === 0) {
      alert("Your cart is empty.");
      hide($("checkout-modal"));
      return;
    }

    // reduce product stock
    cart.forEach(ci => {
      const prod = products.find(p => p.id === ci.id);
      if (prod) {
        prod.qty = Math.max(0, prod.qty - ci.quantity);
      }
    });

    // simple order confirmation (you could save orders to history)
    alert("Order placed successfully! Thank you.");
    cart = [];
    updateCartUI();
    renderProducts();
    hide($("checkout-modal"));

    // clear fields
    ["c-name","c-phone","c-address"].forEach(id => { if ($(id)) $(id).value = ""; });
    saveState();
  });

  // --- ADMIN MODAL open/close (btn-admin opens modal; admin-close closes) ---
  $("btn-admin")?.addEventListener("click", () => show($("admin-modal")));
  $("admin-close")?.addEventListener("click", () => hide($("admin-modal")));

  // --- ADMIN LOGIN / LOGOUT (IDs from your HTML) ---
  $("admin-login")?.addEventListener("click", () => {
    const pw = $("admin-pw")?.value || "";
    if (pw === "peace123") {
      isAdmin = true;
      $("admin-pw").value = "";
      hide($("admin-login-box"));
      show($("admin-panel-box"));
      // show add-product section by default
      openAdminSection("add-product");
      alert("Admin logged in.");
    } else {
      alert("Wrong password.");
    }
  });

  $("admin-logout")?.addEventListener("click", () => {
    isAdmin = false;
    show($("admin-login-box"));
    hide($("admin-panel-box"));
    document.querySelectorAll(".admin-section").forEach(s => s.classList.add("hidden"));
    alert("Logged out.");
  });

  // --- ADMIN TABS (class .admin-tab data-section matches your HTML) ---
  document.querySelectorAll(".admin-tab").forEach(btn => {
    btn.addEventListener("click", () => {
      if (!isAdmin) return alert("Access denied. Please log in as admin.");
      const target = btn.dataset.section;
      openAdminSection(target);
    });
  });

  function openAdminSection(id) {
    document.querySelectorAll(".admin-section").forEach(sec => sec.classList.add("hidden"));
    const el = $(id);
    if (el) el.classList.remove("hidden");

    // refresh specialized views
    if (id === "manage-products") renderAdminProductsList();
    if (id === "donations") refreshDonationSelect();
  }

  // --- ADD PRODUCT (uses p-image as URL input in your HTML) ---
  $("add-product-btn")?.addEventListener("click", () => {
    if (!isAdmin) return alert("Only admin can add products.");

    const name = ($("p-name")?.value || "").trim();
    const category = ($("p-category")?.value || "").trim();
    const price = Number($("p-price")?.value || 0);
    const qty = Number($("p-qty")?.value || 0);
    const expiry = ($("p-expiry")?.value || "").trim();
    const image = ($("p-image")?.value || "").trim();
    const desc = ($("p-desc")?.value || "").trim();

    if (!name) return alert("Product name is required.");
    if (!Number.isFinite(price) || price < 0) return alert("Enter a valid price.");
    if (!Number.isFinite(qty) || qty < 0) return alert("Enter a valid quantity.");

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
    saveState();
    renderProducts();

    // clear form inputs
    ["p-name","p-category","p-price","p-qty","p-expiry","p-image","p-desc"].forEach(id => { if ($(id)) $(id).value = ""; });
    alert("Product added and saved.");
  });

  // --- DONATIONS & WASTE (IDs match your HTML) ---
  $("record-donation")?.addEventListener("click", () => {
    if (!isAdmin) return alert("Only admin can record donations.");
    const prodId = Number($("don-prod")?.value || 0);
    const qty = Number($("don-qty")?.value || 0);
    const recipient = ($("don-recipient")?.value || "").trim();

    if (!prodId || qty <= 0 || !recipient) return alert("Please provide valid donation details.");

    const prod = products.find(p => p.id === prodId);
    if (!prod) return alert("Product not found.");
    if (prod.qty < qty) return alert("Insufficient stock for donation.");

    prod.qty -= qty;
    donationHistory.push({ productId: prodId, product: prod.name, qty, recipient, date: new Date().toLocaleString() });

    saveState();
    renderProducts();
    refreshDonationSelect();

    ["don-qty","don-recipient"].forEach(id => { if ($(id)) $(id).value = ""; });
    alert("Donation recorded.");
  });

  $("record-waste")?.addEventListener("click", () => {
    if (!isAdmin) return alert("Only admin can record waste.");
    const prodId = Number($("don-prod")?.value || 0);
    const qty = Number($("don-qty")?.value || 0);
    const reason = ($("waste-reason")?.value || "").trim();

    if (!prodId || qty <= 0 || !reason) return alert("Please provide valid waste details.");

    const prod = products.find(p => p.id === prodId);
    if (!prod) return alert("Product not found.");
    if (prod.qty < qty) return alert("Insufficient stock to mark waste.");

    prod.qty -= qty;
    wasteHistory.push({ productId: prodId, product: prod.name, qty, reason, date: new Date().toLocaleString() });

    saveState();
    renderProducts();
    refreshDonationSelect();

    ["don-qty","waste-reason"].forEach(id => { if ($(id)) $(id).value = ""; });
    alert("Waste recorded.");
  });

  // --- ADMIN: manage products list with edit/delete ---
  function renderAdminProductsList() {
    const list = $("admin-products-list");
    if (!list) return;
    list.innerHTML = "";

    products.forEach(p => {
      const row = document.createElement("div");
      row.className = "admin-product-row";
      row.style.display = "flex";
      row.style.justifyContent = "space-between";
      row.style.alignItems = "center";
      row.style.marginBottom = "8px";

      const left = document.createElement("div");
      left.innerHTML = `<strong>${p.name}</strong> — KSh ${p.price} — Qty: ${p.qty} <span class="small">(${p.category || 'Uncategorized'})</span>`;

      const right = document.createElement("div");
      const editBtn = document.createElement("button");
      editBtn.textContent = "Edit Qty";
      editBtn.className = "primary";
      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "Delete";
      deleteBtn.className = "danger";

      editBtn.addEventListener("click", () => {
        if (!isAdmin) return alert("Only admin can edit.");
        const newQty = Number(prompt(`Enter new quantity for ${p.name}:`, p.qty));
        if (!Number.isFinite(newQty) || newQty < 0) return alert("Invalid quantity.");
        p.qty = newQty;
        saveState();
        renderProducts();
        renderAdminProductsList();
      });

      deleteBtn.addEventListener("click", () => {
        if (!isAdmin) return alert("Only admin can delete.");
        if (!confirm(`Delete ${p.name}?`)) return;
        products = products.filter(x => x.id !== p.id);
        saveState();
        renderProducts();
        renderAdminProductsList();
      });

      right.appendChild(editBtn);
      right.appendChild(deleteBtn);
      row.appendChild(left);
      row.appendChild(right);
      list.appendChild(row);
    });
  }

  // --- REFRESH donation select options ---
  function refreshDonationSelect() {
    const sel = $("don-prod");
    if (!sel) return;
    sel.innerHTML = "";
    products.forEach(p => {
      const opt = document.createElement("option");
      opt.value = p.id;
      opt.textContent = `${p.name} (Stock: ${p.qty})`;
      sel.appendChild(opt);
    });
  }

  // --- INITIALIZE ---
  loadState();
  renderProducts();
  updateCartUI();

  // Ensure hero is visible on load and others hidden (consistent start)
  show($("hero"));
  hide($("products-section"));
  hide($("about-section"));
  hide($("contact-section"));
});

