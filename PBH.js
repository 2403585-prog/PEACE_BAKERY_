// PBH.js — Fully working version for your HTML
document.addEventListener("DOMContentLoaded", () => {

  // ---------- GLOBAL STATE ----------
  let isAdmin = false;
  let products = [];
  let cart = [];
  let donationHistory = [];
  let wasteHistory = [];

  // ---------- HELPERS ----------
  const $ = (id) => document.getElementById(id);
  const show = (el) => el.classList.remove("hidden");
  const hide = (el) => el.classList.add("hidden");

  // ---------- LOCAL STORAGE ----------
  function loadState() {
    products = JSON.parse(localStorage.getItem("pbh_products")) || [];
    cart = JSON.parse(localStorage.getItem("pbh_cart")) || [];
    donationHistory = JSON.parse(localStorage.getItem("pbh_donation")) || [];
    wasteHistory = JSON.parse(localStorage.getItem("pbh_waste")) || [];

    if (products.length === 0) {
      // Default sample products
      products = [
        {
          id: 1,
          name: "Vanilla Cupcake",
          category: "Pastry",
          price: 130,
          qty: 50,
          expiry: "2025-12-31",
          image: "https://images.unsplash.com/photo-1464347744102-1b0d5c0c3a83?w=600",
          desc: "Topped with buttercream"
        },
        {
          id: 2,
          name: "Banana Bread",
          category: "Bread",
          price: 100,
          qty: 20,
          expiry: "2025-11-30",
          image: "https://images.unsplash.com/photo-1549575815-3e73b8ff9252?w=600",
          desc: "Moist & delicious"
        }
      ];
    }
  }

  function saveState() {
    localStorage.setItem("pbh_products", JSON.stringify(products));
    localStorage.setItem("pbh_cart", JSON.stringify(cart));
    localStorage.setItem("pbh_donation", JSON.stringify(donationHistory));
    localStorage.setItem("pbh_waste", JSON.stringify(wasteHistory));
  }

  // ---------- RENDER PRODUCTS ----------
  function renderProducts() {
    const grid = $("products-grid");
    grid.innerHTML = "";

    products.forEach(p => {
      const card = document.createElement("div");
      card.className = "card";

      card.innerHTML = `
        <img src="${p.image}" onerror="this.src='images/default.jpg';">
        <h4>${p.name}</h4>
        <p>${p.desc}</p>
        <p><strong>KSh ${p.price}</strong></p>
        <button class="add-to-cart" ${p.qty <= 0 ? "disabled" : ""}>
          ${p.qty > 0 ? "Add to Cart" : "Out of Stock"}
        </button>
      `;

      card.querySelector(".add-to-cart").addEventListener("click", () =>
        addToCart(p.id)
      );

      grid.appendChild(card);
    });

    refreshDonationSelect();
    renderAdminProductsList();
    updateCartUI();
    saveState();
  }

  // ---------- CART ----------
  function addToCart(id) {
    const prod = products.find(p => p.id === id);
    if (!prod || prod.qty <= 0) return alert("Out of stock!");

    const item = cart.find(i => i.id === id);
    if (item) {
      if (item.quantity >= prod.qty)
        return alert("No more stock available.");
      item.quantity++;
    } else {
      cart.push({
        id: prod.id,
        name: prod.name,
        price: prod.price,
        image: prod.image,
        quantity: 1
      });
    }

    updateCartUI();
  }

  function updateCartUI() {
    const list = $("cart-items");
    const totalEl = $("cart-total");
    const countEl = $("cart-count");

    list.innerHTML = "";
    let total = 0;

    cart.forEach(i => {
      total += i.price * i.quantity;

      list.innerHTML += `
        <div class="cart-item">
          <img src="${i.image}">
          <div>
            <p>${i.name}</p>
            <p>KSh ${i.price} x ${i.quantity}</p>
          </div>
        </div>
      `;
    });

    totalEl.textContent = total;
    countEl.textContent = cart.reduce((s, i) => s + i.quantity, 0);

    saveState();
  }

  // ---------- NAVIGATION ----------
  $("btn-home").addEventListener("click", () => {
    show($("hero"));
    hide($("products-section"));
    hide($("about-section"));
    hide($("contact-section"));
  });

  $("btn-products").addEventListener("click", () => {
    hide($("hero"));
    show($("products-section"));
    hide($("about-section"));
    hide($("contact-section"));
  });

  $("btn-about").addEventListener("click", () => {
    hide($("hero"));
    hide($("products-section"));
    show($("about-section"));
    hide($("contact-section"));
  });

  $("btn-contact").addEventListener("click", () => {
    hide($("hero"));
    hide($("products-section"));
    hide($("about-section"));
    show($("contact-section"));
  });

  $("shop-now").addEventListener("click", () => {
    hide($("hero"));
    show($("products-section"));
  });

  // ---------- CART BUTTONS ----------
  $("open-cart").addEventListener("click", () => show($("cart-panel")));
  $("close-cart").addEventListener("click", () => hide($("cart-panel")));
  $("clear-cart").addEventListener("click", () => {
    cart = [];
    updateCartUI();
  });

  // ---------- ADMIN MODAL ----------
  $("btn-admin").addEventListener("click", () => show($("admin-modal")));
  $("admin-close").addEventListener("click", () => hide($("admin-modal")));

  $("admin-login").addEventListener("click", () => {
    const pw = $("admin-pw").value.trim();
    if (pw === "peace123") {
      isAdmin = true;
      hide($("admin-login-box"));
      show($("admin-panel-box"));
      openAdminSection("add-product");
      $("admin-pw").value = "";
      alert("Logged in!");
    } else alert("Wrong password");
  });

  $("admin-logout").addEventListener("click", () => {
    isAdmin = false;
    show($("admin-login-box"));
    hide($("admin-panel-box"));
    document.querySelectorAll(".admin-section").forEach(s =>
      s.classList.add("hidden")
    );
  });

  // ---------- ADMIN TABS ----------
  document.querySelectorAll(".admin-tab").forEach(btn => {
    btn.addEventListener("click", () => {
      if (!isAdmin) return alert("Login as admin first.");
      openAdminSection(btn.dataset.section);
    });
  });

  function openAdminSection(id) {
    document
      .querySelectorAll(".admin-section")
      .forEach(s => s.classList.add("hidden"));
    $(id).classList.remove("hidden");

    if (id === "manage-products") renderAdminProductsList();
    if (id === "donations") refreshDonationSelect();
  }

  // ---------- ADD PRODUCT ----------
  $("add-product-btn").addEventListener("click", () => {
    if (!isAdmin) return alert("Admin only.");

    const p = {
      id: Date.now(),
      name: $("p-name").value.trim(),
      category: $("p-category").value.trim(),
      price: Number($("p-price").value),
      qty: Number($("p-qty").value),
      expiry: $("p-expiry").value.trim(),
      image: $("p-image").value.trim(),
      desc: $("p-desc").value.trim()
    };

    if (!p.name || p.price <= 0 || p.qty < 0)
      return alert("Enter valid product details.");

    products.push(p);
    saveState();
    renderProducts();

    // clear inputs
    ["p-name","p-category","p-price","p-qty","p-expiry","p-image","p-desc"]
      .forEach(id => $(id).value = "");

    alert("Product added!");
  });

  // ---------- DONATION / WASTE ----------
  function refreshDonationSelect() {
    const sel = $("don-prod");
    sel.innerHTML = "";
    products.forEach(p => {
      sel.innerHTML += `<option value="${p.id}">${p.name} (qty ${p.qty})</option>`;
    });
  }

  $("record-donation").addEventListener("click", () => {
    if (!isAdmin) return;

    const id = Number($("don-prod").value);
    const qty = Number($("don-qty").value);
    const rec = $("don-recipient").value.trim();

    const prod = products.find(p => p.id === id);
    if (!prod || qty <= 0 || prod.qty < qty) return alert("Invalid data");

    prod.qty -= qty;
    donationHistory.push({ id, qty, rec, date: new Date().toString() });

    saveState();
    renderProducts();
  });

  $("record-waste").addEventListener("click", () => {
    if (!isAdmin) return;

    const id = Number($("don-prod").value);
    const qty = Number($("don-qty").value);
    const reason = $("waste-reason").value.trim();

    const prod = products.find(p => p.id === id);
    if (!prod || qty <= 0 || prod.qty < qty) return alert("Invalid data");

    prod.qty -= qty;
    wasteHistory.push({ id, qty, reason, date: new Date().toString() });

    saveState();
    renderProducts();
  });

  // ---------- MANAGE PRODUCTS ----------
  function renderAdminProductsList() {
    const list = $("admin-products-list");
    list.innerHTML = "";

    products.forEach(p => {
      const div = document.createElement("div");
      div.className = "admin-product-row";

      div.innerHTML = `
        <strong>${p.name}</strong> — KSh ${p.price} — Qty: ${p.qty}
        <button class="edit">Edit Qty</button>
        <button class="del">Delete</button>
      `;

      div.querySelector(".edit").addEventListener("click", () => {
        const newQty = Number(prompt("New quantity:", p.qty));
        if (newQty >= 0) {
          p.qty = newQty;
          saveState();
          renderProducts();
        }
      });

      div.querySelector(".del").addEventListener("click", () => {
        if (confirm("Delete product?")) {
          products = products.filter(x => x.id !== p.id);
          saveState();
          renderProducts();
        }
      });

      list.appendChild(div);
    });
  }

  // ---------- CHECKOUT ----------
  $("checkout-btn").addEventListener("click", () => show($("checkout-modal")));
  $("checkout-close").addEventListener("click", () => hide($("checkout-modal")));

  $("place-order").addEventListener("click", () => {
    if (cart.length === 0) return alert("Cart empty.");

    cart.forEach(i => {
      const prod = products.find(p => p.id === i.id);
      if (prod) prod.qty = Math.max(0, prod.qty - i.quantity);
    });

    alert("Order placed!");
    cart = [];
    saveState();
    renderProducts();
    updateCartUI();
    hide($("checkout-modal"));
  });

  // ---------- INITIALIZE ----------
  loadState();
  renderProducts();
  updateCartUI();

  show($("hero"));
  hide($("products-section"));
  hide($("about-section"));
  hide($("contact-section"));
});

