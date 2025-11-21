// PBH.js

document.addEventListener("DOMContentLoaded", () => {
  // --- GLOBAL STATE ---
  let isAdmin = false; // tracks admin login status
  let cart = [];

  // --- SAMPLE PRODUCTS (you can replace with your own data source) ---
  const products = [
    {
      id: 1,
      name: "Vanilla Cupcake",
      category: "Pastry",
      price: 130,
      qty: 50,
      expiry: "2025-12-31",
      image: "https://images.unsplash.com/photo-1464347744102-1b0d5c0c3a83?q=80&w=600&auto=format&fit=crop",
      desc: "It's topped with buttercream frosting"
    },
    {
      id: 2,
      name: "Banana Bread",
      category: "Bread",
      price: 100,
      qty: 20,
      expiry: "2025-11-30",
      image: "https://images.unsplash.com/photo-1549575815-3e73b8ff9252?q=80&w=600&auto=format&fit=crop",
      desc: "Moist and flavorful"
    },
    {
      id: 3,
      name: "Carrot Cake",
      category: "Cake",
      price: 200,
      qty: 12,
      expiry: "2025-12-15",
      image: "https://images.unsplash.com/photo-1551024601-bec3ebc12e5e?q=80&w=600&auto=format&fit=crop",
      desc: "Classic with cream cheese icing"
    }
  ];

  // --- ELEMENT HELPERS ---
  const $ = (id) => document.getElementById(id);
  const hide = (el) => el && el.classList.add("hidden");
  const show = (el) => el && el.classList.remove("hidden");

  // --- RENDER PRODUCTS ---
  function renderProducts() {
    const grid = $("products-grid");
    if (!grid) return;

    grid.innerHTML = "";
    products.forEach((p) => {
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <img src="${p.image || ""}" alt="${p.name}">
        <h4>${p.name}</h4>
        <p class="small">${p.desc || ""}</p>
        <p><strong>KSh ${p.price}</strong></p>
        <button class="add-to-cart">Add to Cart</button>
      `;
      const btn = card.querySelector(".add-to-cart");
      btn.addEventListener("click", () => addToCart({
        name: p.name,
        price: p.price,
        image: p.image
      }));
      grid.appendChild(card);
    });

    refreshDonationSelect();
    renderAdminProductsList();
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
          <img src="${item.image || ''}" alt="${item.name}">
          <div>
            <p>${item.name}</p>
            <p>KSh ${item.price} x ${item.quantity}</p>
          </div>
        </div>
      `;
    });

    cartTotal.textContent = total;
    cartCount.textContent = cart.reduce((sum, i) => sum + i.quantity, 0);
  }

  function addToCart(product) {
    const existing = cart.find(p => p.name === product.name);
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({ ...product, quantity: 1 });
    }
    updateCartUI();
  }

  // --- CART PANEL ---
  $("open-cart")?.addEventListener("click", () => show($("cart-panel")));
  $("close-cart")?.addEventListener("click", () => hide($("cart-panel")));
  $("clear-cart")?.addEventListener("click", () => {
    cart = [];
    updateCartUI();
  });

  // --- NAVIGATION MENU ---
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

  // Shop Now goes to products
  $("shop-now")?.addEventListener("click", () => {
    hide($("hero"));
    show($("products-section"));
    hide($("about-section"));
    hide($("contact-section"));
  });

  // --- ADMIN MODAL OPEN/CLOSE ---
  // Important: Admin button should ALWAYS open modal so user can log in.
  $("btn-admin")?.addEventListener("click", () => show($("admin-modal")));
  $("admin-close")?.addEventListener("click", () => hide($("admin-modal")));

  // --- ADMIN LOGIN ---
  $("admin-login")?.addEventListener("click", () => {
    const pw = $("admin-pw")?.value || "";
    if (pw === "peace123") { // change this to your desired password or server check
      isAdmin = true;
      $("admin-pw").value = "";
      hide($("admin-login-box"));
      show($("admin-panel-box"));
      // Default to show Add Product section when logging in
      openAdminSection("add-product");
      alert("Admin logged in successfully!");
    } else {
      alert("Wrong password!");
    }
  });

  // --- ADMIN LOGOUT ---
  $("admin-logout")?.addEventListener("click", () => {
    isAdmin = false;
    show($("admin-login-box"));
    hide($("admin-panel-box"));
    document.querySelectorAll(".admin-section").forEach(sec => sec.classList.add("hidden"));
    alert("Logged out.");
  });

  // --- ADMIN TAB ACCESS CONTROL ---
  document.querySelectorAll(".admin-tab").forEach(btn => {
    btn.addEventListener("click", () => {
      if (!isAdmin) {
        alert("Access denied. Please log in as admin.");
        return;
      }
      const target = btn.dataset.section;
      openAdminSection(target);
    });
  });

  function openAdminSection(id) {
    document.querySelectorAll(".admin-section").forEach(sec => sec.classList.add("hidden"));
    const targetEl = $(id);
    if (targetEl) targetEl.classList.remove("hidden");
    // Refresh admin views when sections open
    if (id === "manage-products") renderAdminProductsList();
    if (id === "donations") refreshDonationSelect();
  }

  // --- PROTECTED ACTIONS ---
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

    if (!name || !price || !qty) {
      alert("Name, price, and quantity are required.");
      return;
    }

    const newProduct = {
      id: Date.now(),
      name,
      category,
      price,
      qty,
      expiry,
      image,
      desc
    };

    products.push(newProduct);
    renderProducts();
    refreshDonationSelect();
    renderAdminProductsList();

    // clear form
    ["p-name","p-category","p-price","p-qty","p-expiry","p-image","p-desc"].forEach(id => { if ($(id)) $(id).value = ""; });

    alert("Product added successfully!");
  });

  $("record-donation")?.addEventListener("click", () => {
    if (!isAdmin) {
      alert("Only admin can record donations.");
      return;
    }

    const prodId = Number($("don-prod")?.value);
    const qty = Number($("don-qty")?.value);
    const recipient = $("don-recipient")?.value?.trim();

    if (!prodId || !qty || qty <= 0 || !recipient) {
      alert("Please select product, enter a valid quantity, and recipient.");
      return;
    }

    const prod = products.find(p => p.id === prodId);
    if (!prod) {
      alert("Product not found.");
      return;
    }
    if (prod.qty < qty) {
      alert("Insufficient stock for donation.");
      return;
    }

    prod.qty -= qty;
    renderProducts();
    refreshDonationSelect();
    renderAdminProductsList();

    // clear fields
    ["don-qty","don-recipient"].forEach(id => { if ($(id)) $(id).value = ""; });

    alert(`Donation recorded: ${qty} x ${prod.name} to ${recipient}.`);
  });

  $("record-waste")?.addEventListener("click", () => {
    if (!isAdmin) {
      alert("Only admin can record waste.");
      return;
    }

    const prodId = Number($("don-prod")?.value);
    const qty = Number($("don-qty")?.value);
    const reason = $("waste-reason")?.value?.trim();

    if (!prodId || !qty || qty <= 0 || !reason) {
      alert("Please select product, enter a valid quantity, and reason.");
      return;
    }

    const prod = products.find(p => p.id === prodId);
    if (!prod) {
      alert("Product not found.");
      return;
    }
    if (prod.qty < qty) {
      alert("Insufficient stock to mark waste.");
      return;
    }

    prod.qty -= qty;
    renderProducts();
    refreshDonationSelect();
    renderAdminProductsList();

    // clear fields
    ["don-qty","waste-reason"].forEach(id => { if ($(id)) $(id).value = ""; });

    alert(`Waste recorded: ${qty} x ${prod.name}. Reason: ${reason}.`);
  });

  // --- ADMIN: MANAGE PRODUCTS LIST ---
  function renderAdminProductsList() {
    const container = $("admin-products-list");
    if (!container) return;

    container.innerHTML = "";
    products.forEach(p => {
      const row = document.createElement("div");
      row.className = "admin-product-row";
      row.style.display = "flex";
      row.style.justifyContent = "space-between";
      row.style.alignItems = "center";
      row.style.marginBottom = "8px";

      row.innerHTML = `
        <div>
          <strong>${p.name}</strong> — KSh ${p.price} — Qty: ${p.qty}
          <span class="small">(${p.category || "Uncategorized"})</span>
        </div>
        <div>
          <button class="primary edit-btn">Edit Qty</button>
          <button class="danger delete-btn">Delete</button>
        </div>
      `;

      const editBtn = row.querySelector(".edit-btn");
      const deleteBtn = row.querySelector(".delete-btn");

      editBtn.addEventListener("click", () => {
        if (!isAdmin) {
          alert("Only admin can manage products.");
          return;
        }
        const newQty = Number(prompt(`Enter new quantity for ${p.name}:`, p.qty));
        if (Number.isFinite(newQty) && newQty >= 0) {
          p.qty = newQty;
          renderProducts();
          renderAdminProductsList();
          alert("Quantity updated.");
        } else {
          alert("Invalid quantity.");
        }
      });

      deleteBtn.addEventListener("click", () => {
        if (!isAdmin) {
          alert("Only admin can manage products.");
          return;
        }
        const ok = confirm(`Delete ${p.name}?`);
        if (ok) {
          const idx = products.findIndex(x => x.id === p.id);
          if (idx >= 0) {
            products.splice(idx, 1);
            renderProducts();
            refreshDonationSelect();
            renderAdminProductsList();
            alert("Product deleted.");
          }
        }
      });

      container.appendChild(row);
    });
  }

  // --- DONATIONS SELECT OPTIONS ---
  function refreshDonationSelect() {
    const sel = $("don-prod");
    if (!sel) return;

    sel.innerHTML = "";
    products.forEach(p => {
      const opt = document.createElement("option");
      opt.value = p.id;
      opt.textContent = `${p.name} (Qty: ${p.qty})`;
      sel.appendChild(opt);
    });
  }

  // --- CHECKOUT MODAL ---
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

    alert("Order placed successfully!");
    hide($("checkout-modal"));
    cart = [];
    updateCartUI();

    // Clear checkout fields
    ["c-name","c-phone","c-address"].forEach(id => { if ($(id)) $(id).value = ""; });
  });

  // --- INITIALIZE ---
  renderProducts();
  updateCartUI();
});
