const cartItems = document.getElementById("cartItems");
const summaryItems = document.getElementById("summaryItems");
const summarySubtotal = document.getElementById("summarySubtotal");
const summaryShipping = document.getElementById("summaryShipping");
const summaryTotal = document.getElementById("summaryTotal");
const checkoutButton = document.getElementById("checkoutButton");
const shippingNotice = document.getElementById("shippingNotice");
const addressInput = document.getElementById("addressInput");

const FREE_SHIPPING_THRESHOLD = 999;
const STANDARD_SHIPPING_FEE = 99;

const renderCart = () => {
  const cart = getCart();
  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  
  const isFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD || cart.length === 0;
  const shippingCost = isFreeShipping ? 0 : STANDARD_SHIPPING_FEE;
  const finalTotal = subtotal + shippingCost;

  if (summaryItems) summaryItems.textContent = `${totalQuantity} item${totalQuantity === 1 ? "" : "s"}`;
  if (summarySubtotal) summarySubtotal.textContent = money(subtotal);
  if (summaryShipping) summaryShipping.textContent = isFreeShipping ? "FREE" : money(shippingCost);
  if (summaryTotal) summaryTotal.textContent = money(finalTotal);
  if (checkoutButton) checkoutButton.disabled = cart.length === 0;

  if (shippingNotice) {
    if (cart.length === 0) {
      shippingNotice.textContent = "Add items to calculate shipping";
      shippingNotice.className = "free-shipping-badge";
    } else if (subtotal >= FREE_SHIPPING_THRESHOLD) {
      shippingNotice.textContent = "You have unlocked complimentary standard shipping!";
      shippingNotice.className = "free-shipping-badge";
    } else {
      const remaining = FREE_SHIPPING_THRESHOLD - subtotal;
      shippingNotice.textContent = `Add ${money(remaining)} more to unlock FREE shipping`;
      shippingNotice.className = "free-shipping-badge";
    }
  }

  if (!cart.length) {
    cartItems.innerHTML = `
      <div class="empty-state">
        <h3>Your shopping cart is empty</h3>
        <p>Explore our catalog to find premium audio, apparel, home essentials, and more.</p>
        <a class="button primary" href="index.html">Start Shopping</a>
      </div>
    `;
    return;
  }

  cartItems.innerHTML = cart
    .map(
      (item) => `
        <article class="cart-item">
          <a class="cart-item-img" href="product.html?id=${item.product}">
            <img src="${item.image}" alt="${item.name}" />
          </a>
          <div class="cart-item-info">
            <h3><a href="product.html?id=${item.product}">${item.name}</a></h3>
            <p>${money(item.price)} each</p>
            <strong class="cart-item-price">${money(item.price * item.quantity)}</strong>
          </div>
          <div class="stepper" aria-label="Quantity adjustment">
            <button type="button" data-dec="${item.product}" aria-label="Decrease quantity">−</button>
            <span>${item.quantity}</span>
            <button type="button" data-inc="${item.product}" aria-label="Increase quantity">+</button>
          </div>
          <button class="remove-btn" type="button" data-remove="${item.product}" aria-label="Remove ${item.name} from cart">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 6h18"/>
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
            </svg>
          </button>
        </article>
      `
    )
    .join("");

  cartItems.querySelectorAll("[data-inc]").forEach((button) => {
    button.addEventListener("click", () => changeQuantity(button.dataset.inc, 1));
  });
  cartItems.querySelectorAll("[data-dec]").forEach((button) => {
    button.addEventListener("click", () => changeQuantity(button.dataset.dec, -1));
  });
  cartItems.querySelectorAll("[data-remove]").forEach((button) => {
    button.addEventListener("click", () => removeItem(button.dataset.remove));
  });
};

const changeQuantity = (productId, delta) => {
  const cart = getCart()
    .map((item) => {
      if (item.product === productId) {
        return { ...item, quantity: item.quantity + delta };
      }
      return item;
    })
    .filter((item) => item.quantity > 0);

  setCart(cart);
  renderCart();
};

const removeItem = (productId) => {
  const cart = getCart().filter((item) => item.product !== productId);
  setCart(cart);
  renderCart();
  toast("Item removed from cart");
};

if (checkoutButton) {
  checkoutButton.addEventListener("click", async () => {
    const user = getUser();
    if (!user) {
      toast("Please sign in to proceed with checkout");
      window.setTimeout(() => {
        window.location.href = "login.html";
      }, 900);
      return;
    }

    const cart = getCart();
    if (!cart.length) return;

    checkoutButton.disabled = true;
    checkoutButton.textContent = "Processing Order...";

    const products = cart.map((item) => ({
      product: item.product,
      quantity: item.quantity,
    }));

    try {
      const order = await request("/orders", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ products }),
      });
      setCart([]);
      toast(`Order confirmed! Total: ${money(order.totalAmount)}`);
      window.setTimeout(() => {
        window.location.href = "orders.html";
      }, 900);
    } catch (error) {
      toast(error.message);
      checkoutButton.disabled = false;
      checkoutButton.textContent = "Place Order";
    }
  });
}

renderCart();
