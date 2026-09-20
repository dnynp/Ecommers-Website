const grid = document.getElementById("productGrid");
const productCount = document.getElementById("productCount");
const searchInput = document.getElementById("searchInput");
const categorySelect = document.getElementById("categorySelect");
const maxPriceInput = document.getElementById("maxPriceInput");
const sortSelect = document.getElementById("sortSelect");
const pagination = document.getElementById("pagination");
const resetFilterBtn = document.getElementById("resetFiltersBtn");

let currentPage = 1;
let currentProducts = [];

const renderSkeletons = () => {
  grid.innerHTML = Array(8)
    .fill(0)
    .map(
      () => `
      <div class="skeleton-card">
        <div class="skeleton-image"></div>
        <div class="skeleton-body">
          <div class="skeleton-line short"></div>
          <div class="skeleton-line medium"></div>
          <div class="skeleton-line"></div>
          <div class="skeleton-line short"></div>
        </div>
      </div>
    `
    )
    .join("");
};

// Generates stable realistic review counts & ratings based on product id
const getProductMeta = (id = "") => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
  }
  const positiveHash = Math.abs(hash);
  const rating = (4.4 + (positiveHash % 6) * 0.1).toFixed(1);
  const reviews = 38 + (positiveHash % 240);
  return { rating, reviews };
};

const renderProducts = (items) => {
  if (!items.length) {
    grid.innerHTML = `
      <div class="empty-state">
        <h3>No matching items found</h3>
        <p>Try clearing your search query or adjusting your filters to see more products.</p>
        <button id="clearFiltersBtn" class="button secondary" type="button">Reset Filters</button>
      </div>
    `;
    const clearBtn = document.getElementById("clearFiltersBtn");
    if (clearBtn) {
      clearBtn.addEventListener("click", resetAllFilters);
    }
    return;
  }

  grid.innerHTML = items
    .map((product) => {
      const { rating, reviews } = getProductMeta(product._id);
      const isLowStock = product.stock <= 20;

      return `
        <article class="product-card">
          <a class="product-image-wrap" href="product.html?id=${product._id}" aria-label="View ${product.name}">
            <img src="${product.image}" alt="${product.name}" loading="lazy" />
            <span class="product-badge">${product.category}</span>
            <span class="product-stock-tag ${isLowStock ? "low-stock" : ""}">
              ${isLowStock ? `Only ${product.stock} left` : "In Stock"}
            </span>
          </a>
          <div class="product-body">
            <span class="product-category">${product.category}</span>
            <h3 class="product-title">
              <a href="product.html?id=${product._id}">${product.name}</a>
            </h3>
            <p class="product-desc">${product.description}</p>
            
            <div class="product-rating">
              <span class="stars" aria-hidden="true">★★★★★</span>
              <strong>${rating}</strong>
              <span>(${reviews})</span>
            </div>
            
            <div class="product-card-footer">
              <strong class="product-price">${money(product.price)}</strong>
              <div class="product-actions">
                <button class="button primary" type="button" data-add="${product._id}">
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        </article>
      `;
    })
    .join("");

  grid.querySelectorAll("[data-add]").forEach((button) => {
    button.addEventListener("click", () => {
      const product = items.find((item) => item._id === button.dataset.add);
      if (product) addToCart(product);
    });
  });
};

const renderPagination = ({ page, pages }) => {
  pagination.innerHTML = "";
  if (pages <= 1) return;

  for (let index = 1; index <= pages; index += 1) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = index === page ? "page-button active" : "page-button";
    button.textContent = index;
    button.setAttribute("aria-label", `Go to page ${index}`);
    button.addEventListener("click", () => {
      currentPage = index;
      loadProducts();
      window.scrollTo({ top: 400, behavior: "smooth" });
    });
    pagination.appendChild(button);
  }
};

const syncCategories = (categories) => {
  if (!categorySelect) return;
  const selected = categorySelect.value;
  categorySelect.innerHTML = `<option value="">All Categories</option>`;
  categories.sort().forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categorySelect.appendChild(option);
  });
  categorySelect.value = selected;
};

const resetAllFilters = () => {
  if (searchInput) searchInput.value = "";
  if (categorySelect) categorySelect.value = "";
  if (maxPriceInput) maxPriceInput.value = "";
  if (sortSelect) sortSelect.value = "newest";
  currentPage = 1;
  loadProducts();
};

const loadProducts = async () => {
  renderSkeletons();

  const params = new URLSearchParams({
    page: currentPage,
    limit: 8,
  });

  if (searchInput?.value.trim()) params.set("search", searchInput.value.trim());
  if (categorySelect?.value) params.set("category", categorySelect.value);
  if (maxPriceInput?.value) params.set("maxPrice", maxPriceInput.value);

  try {
    const data = await request(`/products?${params.toString()}`);
    currentProducts = [...data.products];

    // Client-side sort if requested
    if (sortSelect?.value === "price-low") {
      currentProducts.sort((a, b) => a.price - b.price);
    } else if (sortSelect?.value === "price-high") {
      currentProducts.sort((a, b) => b.price - a.price);
    }

    renderProducts(currentProducts);
    renderPagination(data);
    syncCategories(data.categories || []);

    if (productCount) {
      productCount.textContent = `Showing ${data.total} item${data.total === 1 ? "" : "s"}`;
    }
  } catch (error) {
    grid.innerHTML = `
      <div class="empty-state">
        <h3>Catalog Unavailable</h3>
        <p>Could not load the catalog. Please ensure the backend server is running.</p>
      </div>
    `;
    toast(error.message);
  }
};

if (resetFilterBtn) {
  resetFilterBtn.addEventListener("click", resetAllFilters);
}

if (sortSelect) {
  sortSelect.addEventListener("change", () => {
    if (sortSelect.value === "price-low") {
      currentProducts.sort((a, b) => a.price - b.price);
    } else if (sortSelect.value === "price-high") {
      currentProducts.sort((a, b) => b.price - a.price);
    }
    renderProducts(currentProducts);
  });
}

[searchInput, categorySelect, maxPriceInput].forEach((control) => {
  if (!control) return;
  let debounceTimeout;
  control.addEventListener("input", () => {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      currentPage = 1;
      loadProducts();
    }, 280);
  });
});

loadProducts();
