// PBH.js — upgraded with full LocalStorage persistence

document.addEventListener("DOMContentLoaded", () => {
  // --- GLOBAL STATE ---
  let isAdmin = false;
  let cart = [];
  let products = [];
  let donationHistory = [];
  let wasteHistory = [];

  // --- HELPERS ---
  const $ = (id) => document.getElementById(id);
  const hide = (el) => el && el.classList.add("hidden");
  const show = (el) => el && el.classList.remove("hidden");

  // -------------------------------
  //   LOCAL STORAGE SAVE & LOAD
  // -------------------------------
  function saveState() {
    localStorage.setItem("products", JSON.stringify(products));
    localStorage.setItem("cart", JSON.stringify(cart));
    localStorage.setItem("donations", JSON.stringify(donationHistory));
    localStorage.setItem("waste", JSON.stringify(wasteHistory));
  }

  function loadState() {
    products = JSON.parse(localStorage.getItem("products")) || [];
    cart = JSON.parse(localStorage.getItem("cart")) || [];
    donationHistory = JSON.parse(localStorage.getItem("donations")) || [];
    wasteHistory = JSON.parse(localStorage.getItem("waste")) || [];

    // If FIRST TIME → Load sample products
    if (products.length === 0) {
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
          desc: "Moist and delicious."
        }
      ];
    }
  }

  // -------------------------------
  //   RENDER PRODUCTS TO GRID
  // -------------------------------
  function renderProducts() {
    const grid = $("products-grid");
    if (!grid) return;

    grid.innerHTML = "";
    products.forEach((p) => {
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <img src="${p.image || "images/default.jpg"}" alt="${p.name}">
        <h4>${p.name}</h4>
        <p class="small">${p.desc}</p>
        <p><strong>KSh ${p.price}</strong></p>
        <p class="small">Stock: ${p.qty} • ${p.expiry ? "Exp: " + p.expiry : ""}</p>
        <button class="add-to-cart"${p.qty <= 0 ? " disabled" : ""}>
          ${p.qty > 0 ? "Add to Cart" : "Out of Stock"}
        </button>
      `;

      card.querySelector(".add-to-cart").addEventListener("click", () => {
        addToCart({
          id: p.id,
          name: p.name,
          price: p.price,
          image: p.image
        });
      });

      grid.appendChild(card);
    });

    refreshDonationSelect();
    renderAdminProductsList();
    saveState();
  }

  // -------------------------------
  //            CART
  // -------------------------------
  function updateCartUI() {
    const list = $("cart-items");
    const totalEl = $("cart-total");
    const countEl = $("cart-count");

    if (!list) return;

    list.innerHTML = "";
    let total = 0;

    cart.forEach(item => {
      total += item.quantity * item.price;
      list.innerHTML += `
        <div class="cart-item">
          <img src="${item.image}">
          <div>
            <p>${item.name}</p>
            <p>KSh ${item.price} x ${item.quantity}</p>
          </div>
        </div>
      `;
    });

    countEl.textContent = cart.reduce((s, i) => s + i.quantity, 0);
    totalEl.textContent = total;
    saveState();
  }

  function addToCart(product) {
    const prodStock = products.find(p => p.id === product.id);
    const inCart = cart.find(i => i.id === product.id);

    if (prodStock.qty === 0) return alert("Out of stock.");
    if (inCart && inCart.quantity >= prodStock.qty)
      return alert("No more stock available.");

    if (inCart) inCart.quantity++;
    else cart.push({ ...product, quantity: 1 });

    updateCartUI();
  }

  // -------------------------------
  //      ADMIN: ADD PRODUCT
  // -------------------------------
  $("add-product-btn")?.addEventListener("click", () => {
    if (!isAdmin) return alert("Admin only.");

    const name = $("p-name").value.trim();
    const category = $("p-category").value.trim();
    const price = Number($("p-price").value);
    const qty = Number($("p-qty").value);
    const expiry = $("p-expiry").value.trim();
    const desc = $("p-desc").value.trim();

    // SUPPORTS IMAGE UPLOAD OR URL
    const imgInput = $("p-image");
    let imageURL = "";

    if (imgInput.files && imgInput.files.length > 0) {
      const file = imgInput.files[0];
      imageURL = URL.createObjectURL(file); // preview + save
    } else {
      imageURL = imgInput.value; // URL typed manually
    }

    if (!name || !price || qty < 0) {
      alert("Enter valid product details.");
      return;
    }

    const newProduct = {
      id: Date.now(),
      name,
      category,
      price,
      qty,
      expiry,
      desc,
      image: imageURL || "images/default.jpg"
    };

    products.push(newProduct);
    renderProducts();
    saveState();

    ["p-name","p-category","p-price","p-qty","p-expiry","p-desc","p-image"]
      .forEach(id => $(id).value = "");

    alert("Product saved permanently!");
  });

  // -------------------------------
  //      ADMIN: MANAGE PRODUCTS
  // -------------------------------
  function renderAdminProductsList() {
    const container = $("admin-products-list");
    if (!container) return;

    container.innerHTML = "";

    products.forEach(p => {
      const row = document.createElement("div");
      row.className = "admin-row";
      row.innerHTML = `
        <strong>${p.name}</strong> — ${p.qty} pcs — KSh ${p.price}
        <button class="edit">Edit</button>
        <button class="danger delete">Delete</button>
      `;

      // EDIT QTY
      row.querySelector(".edit").addEventListener("click", () => {
        const newQty = Number(prompt("New quantity:", p.qty));
        if (isNaN(newQty) || newQty < 0) return;
        p.qty = newQty;
        renderProducts();
        saveState();
      });

      // DELETE PRODUCT
      row.querySelector(".delete").addEventListener("click", () => {
        if (!confirm("Delete product?")) return;
        products = products.filter(x => x.id !== p.id);
        renderProducts();
        saveState();
      });

      container.appendChild(row);
    });
  }

  // -------------------------------
  //      DONATIONS & WASTE
  // -------------------------------
  function refreshDonationSelect() {
    const select = $("don-prod");
    if (!select) return;

    select.innerHTML = "";
    products.forEach(p => {
      select.innerHTML += `<option value="${p.id}">${p.name} (${p.qty})</option>`;
    });
  }

  // Donation
  $("record-donation")?.addEventListener("click", () => {
    if (!isAdmin) return;

    const id = Number($("don-prod").value);
    const qty = Number($("don-qty").value);
    const recipient = $("don-recipient").value.trim();

    const prod = products.find(p => p.id === id);
    if (!prod) return alert("Product not found");
    if (qty > prod.qty) return alert("Not enough stock");

    prod.qty -= qty;
    donationHistory.push({ id, qty, product: prod.name, recipient, date: new Date().toLocaleString() });

    renderProducts();
    saveState();
  });

  // Waste
  $("record-waste")?.addEventListener("click", () => {
    if (!isAdmin) return;

    const id = Number($("don-prod").value);
    const qty = Number($("don-qty").value);
    const reason = $("waste-reason").value.trim();

    const prod = products.find(p => p.id === id);
    if (!prod || qty > prod.qty) return alert("Invalid");

    prod.qty -= qty;
    wasteHistory.push({ id, qty, product: prod.name, reason, date: new Date().toLocaleString() });

    renderProducts();
    saveState();
  });

  // -------------------------------
  //      ADMIN LOGIN
  // -------------------------------
  $("admin-login-btn")?.addEventListener("click", () => {
    const pw = prompt("Enter admin password:");
    if (pw === "peace123") {
      isAdmin = true;
      show($("admin-panel"));
    } else alert("Wrong password");
  });

  $("admin-logout-btn")?.addEventListener("click", () => {
    isAdmin = false;
    hide($("admin-panel"));
  });

  // -------------------------------
  //   INITIAL LOAD
  // -------------------------------
  loadState();
  renderProducts();
  updateCartUI();
});

