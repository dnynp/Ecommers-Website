// Immediately apply saved theme to avoid flash
(function initTheme() {
  const savedTheme = localStorage.getItem("theme") || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  document.documentElement.setAttribute("data-theme", savedTheme);
})();

// Detect whether we are running through Express or direct file/other port
const API_BASE_URL = window.location.port === "5000" || window.location.origin.includes(":5000")
  ? "/api"
  : "http://localhost:5000/api";

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);

const getCart = () => {
  try {
    return JSON.parse(localStorage.getItem("cart") || "[]");
  } catch (e) {
    return [];
  }
};

const setCart = (cart) => {
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount(true);
};

const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch (e) {
    return null;
  }
};

const setUser = (user) => {
  localStorage.setItem("user", JSON.stringify(user));
  updateAuthLink();
};

const clearUser = () => {
  localStorage.removeItem("user");
  updateAuthLink();
};

const authHeaders = () => {
  const user = getUser();
  return user?.token ? { Authorization: `Bearer ${user.token}` } : {};
};

const request = async (path, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Unable to complete request");
  }

  return data;
};

const toast = (message) => {
  let element = document.getElementById("toast");
  if (!element) {
    element = document.createElement("div");
    element.id = "toast";
    element.className = "toast";
    element.setAttribute("role", "status");
    element.setAttribute("aria-live", "polite");
    document.body.appendChild(element);
  }
  
  element.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20 6 9 17l-5-5"/>
    </svg>
    <span>${message}</span>
  `;
  element.classList.add("show");
  
  if (window._toastTimeout) clearTimeout(window._toastTimeout);
  window._toastTimeout = setTimeout(() => element.classList.remove("show"), 2800);
};

const addToCart = (product, quantity = 1) => {
  const cart = getCart();
  const existing = cart.find((item) => item.product === product._id);

  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({
      product: product._id,
      name: product.name,
      price: product.price,
      image: product.image,
      stock: product.stock,
      category: product.category,
      quantity,
    });
  }

  setCart(cart);
  toast(`${product.name} added to cart`);
};

const updateCartCount = (animate = false) => {
  const count = getCart().reduce((total, item) => total + item.quantity, 0);
  document.querySelectorAll("[data-cart-count]").forEach((element) => {
    element.textContent = count;
    if (animate) {
      element.classList.add("bump");
      setTimeout(() => element.classList.remove("bump"), 250);
    }
  });
};

const updateAuthLink = () => {
  const link = document.querySelector("[data-auth-link]");
  if (!link) return;

  const user = getUser();
  if (!user) {
    link.textContent = "Sign In";
    link.href = "login.html";
    return;
  }

  // FIXED: Navigate to profile.html instead of logging out!
  const firstName = (user.name || "User").split(" ")[0];
  link.textContent = `Account (${firstName})`;
  link.href = "profile.html";
};

const setupThemeToggle = () => {
  const header = document.querySelector(".header-container");
  if (header && !document.querySelector("[data-theme-toggle]")) {
    const button = document.createElement("button");
    button.className = "theme-toggle-btn";
    button.type = "button";
    button.setAttribute("data-theme-toggle", "");
    button.setAttribute("aria-label", "Toggle dark theme");
    button.title = "Toggle dark theme";
    button.innerHTML = `
      <svg class="theme-icon-dark" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
      </svg>
      <svg class="theme-icon-light" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="4"></circle>
        <path d="M12 2v2"></path>
        <path d="M12 20v2"></path>
        <path d="m4.93 4.93 1.41 1.41"></path>
        <path d="m17.66 17.66 1.41 1.41"></path>
        <path d="M2 12h2"></path>
        <path d="M20 12h2"></path>
        <path d="m6.34 17.66-1.41 1.41"></path>
        <path d="m19.07 4.93-1.41 1.41"></path>
      </svg>
    `;
    header.appendChild(button);
  }

  const buttons = document.querySelectorAll("[data-theme-toggle]");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const currentTheme = document.documentElement.getAttribute("data-theme") || "light";
      const nextTheme = currentTheme === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", nextTheme);
      localStorage.setItem("theme", nextTheme);
      toast(`Switched to ${nextTheme} mode`);
    });
  });
};

document.addEventListener("DOMContentLoaded", () => {
  updateCartCount();
  updateAuthLink();
  setupThemeToggle();
});
