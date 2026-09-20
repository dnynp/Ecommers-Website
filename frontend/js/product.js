const details = document.getElementById("productDetails");

const loadProduct = async () => {
  const id = new URLSearchParams(window.location.search).get("id");

  if (!id) {
    details.innerHTML = `
      <div class="empty-state">
        <h3>Product Not Found</h3>
        <p>No product identifier was provided.</p>
        <a class="button primary" href="index.html">Return to Catalog</a>
      </div>
    `;
    return;
  }

  details.innerHTML = `
    <div class="skeleton-card" style="grid-column: 1 / -1; min-height: 400px;">
      <div class="skeleton-image" style="aspect-ratio: 16 / 9;"></div>
    </div>
  `;

  try {
    const product = await request(`/products/${id}`);
    
    // Stable rating for detail view
    const rating = 4.8;
    const reviews = 124;
    const skuCode = `SN-${product._id.slice(-6).toUpperCase()}`;

    details.innerHTML = `
      <div class="details-gallery">
        <div class="details-main-img">
          <img src="${product.image}" alt="${product.name}" />
        </div>
      </div>

      <div class="details-copy">
        <nav class="breadcrumb" aria-label="Breadcrumb">
          <a href="index.html">Home</a>
          <span>/</span>
          <a href="index.html?category=${encodeURIComponent(product.category)}">${product.category}</a>
          <span>/</span>
          <span>${product.name}</span>
        </nav>

        <span class="category-tag">${product.category}</span>
        <h1>${product.name}</h1>

        <div class="details-rating-bar">
          <span class="stars" aria-hidden="true">★★★★★</span>
          <strong>${rating} rating</strong>
          <span>•</span>
          <span>${reviews} verified customer reviews</span>
        </div>

        <div class="details-price-row">
          <span class="details-price">${money(product.price)}</span>
          <span class="tax-note">Inclusive of all taxes & free shipping</span>
        </div>

        <p class="details-description">${product.description}</p>

        <div class="details-stock-status">
          <span class="stock-dot"></span>
          <span>${product.stock > 0 ? `In Stock (${product.stock} units available)` : "Currently Out of Stock"}</span>
        </div>

        <div class="details-order-controls">
          <div class="quantity-stepper" aria-label="Product quantity">
            <button type="button" id="decBtn" aria-label="Decrease quantity">−</button>
            <input id="quantityInput" type="number" value="1" min="1" max="${product.stock}" readonly />
            <button type="button" id="incBtn" aria-label="Increase quantity">+</button>
          </div>
          <button id="addButton" class="button primary" type="button" ${product.stock <= 0 ? "disabled" : ""}>
            Add to Cart
          </button>
        </div>

        <div class="details-specs">
          <h4>Product Specifications</h4>
          <div class="specs-grid">
            <span class="spec-label">SKU Code</span>
            <span class="spec-value">${skuCode}</span>
            <span class="spec-label">Category</span>
            <span class="spec-value">${product.category}</span>
            <span class="spec-label">Dispatch</span>
            <span class="spec-value">Leaves warehouse in 24 hours</span>
            <span class="spec-label">Warranty</span>
            <span class="spec-value">1-year manufacturer warranty</span>
            <span class="spec-label">Returns</span>
            <span class="spec-value">30-day hassle-free return policy</span>
          </div>
        </div>
      </div>
    `;

    const qtyInput = document.getElementById("quantityInput");
    const decBtn = document.getElementById("decBtn");
    const incBtn = document.getElementById("incBtn");
    const addBtn = document.getElementById("addButton");

    decBtn.addEventListener("click", () => {
      const val = parseInt(qtyInput.value, 10) || 1;
      if (val > 1) qtyInput.value = val - 1;
    });

    incBtn.addEventListener("click", () => {
      const val = parseInt(qtyInput.value, 10) || 1;
      if (val < product.stock) qtyInput.value = val + 1;
    });

    addBtn.addEventListener("click", () => {
      const quantity = Math.max(parseInt(qtyInput.value, 10) || 1, 1);
      addToCart(product, quantity);
    });
  } catch (error) {
    details.innerHTML = `
      <div class="empty-state">
        <h3>Could not load product</h3>
        <p>${error.message}</p>
        <a class="button primary" href="index.html">Back to Store</a>
      </div>
    `;
  }
};

loadProduct();
