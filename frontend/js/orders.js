const ordersList = document.getElementById("ordersList");

const renderOrders = (orders) => {
  if (!orders.length) {
    ordersList.innerHTML = `
      <div class="empty-state">
        <h3>No past orders found</h3>
        <p>Once you place an order, you can track its delivery status and review past receipts here.</p>
        <a class="button primary" href="index.html">Explore Catalog</a>
      </div>
    `;
    return;
  }

  ordersList.innerHTML = orders
    .map((order) => {
      const formattedDate = new Date(order.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      const statusLower = (order.status || "processing").toLowerCase();
      const orderRef = order._id.slice(-8).toUpperCase();

      return `
        <article class="order-card">
          <div class="order-topline">
            <div>
              <span class="order-meta-id">Order Reference #${orderRef}</span>
              <div class="order-total-amount">${money(order.totalAmount)}</div>
              <p style="font-size: 0.85rem; color: var(--ink-secondary); margin-top: 4px;">Placed on ${formattedDate}</p>
            </div>
            <span class="status-tag ${statusLower}">
              ${order.status || "Processing"}
            </span>
          </div>
          
          <div class="order-products">
            ${order.products
              .map(
                (item) => `
                  <div class="order-product-row">
                    <div class="order-product-info">
                      <img src="${item.image}" alt="${item.name}" />
                      <div>
                        <strong style="color: var(--ink-primary);">${item.name}</strong>
                        <p style="font-size: 0.82rem; color: var(--ink-secondary);">Quantity: ${item.quantity}</p>
                      </div>
                    </div>
                  </div>
                `
              )
              .join("")}
          </div>
        </article>
      `;
    })
    .join("");
};

const loadOrders = async () => {
  const user = getUser();
  if (!user) {
    ordersList.innerHTML = `
      <div class="empty-state">
        <h3>Sign In to View Orders</h3>
        <p>Your order history and live delivery tracking are linked to your account.</p>
        <a class="button primary" href="login.html">Sign In</a>
      </div>
    `;
    return;
  }

  ordersList.innerHTML = `
    <div class="skeleton-card" style="padding: 24px;">
      <div class="skeleton-line short" style="margin-bottom: 12px;"></div>
      <div class="skeleton-line medium" style="margin-bottom: 24px;"></div>
      <div class="skeleton-line"></div>
    </div>
  `;

  try {
    const orders = await request("/orders", {
      headers: authHeaders(),
    });
    renderOrders(orders);
  } catch (error) {
    ordersList.innerHTML = `
      <div class="empty-state">
        <h3>Unable to load orders</h3>
        <p>${error.message}</p>
      </div>
    `;
  }
};

loadOrders();
