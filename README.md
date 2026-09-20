# Simple E-commerce Store

A basic e-commerce project built from the provided brief with:

- Plain HTML, CSS, and JavaScript frontend
- Express.js backend
- MongoDB models for users, products, and orders
- Local JSON fallback database when MongoDB is not running
- JWT authentication with bcrypt password hashing
- Product listing, product details, search, filters, localStorage cart, checkout, and order history

## Project Structure

```text
backend/
  config/db.js
  controllers/
  data/seedProducts.js
  middleware/authMiddleware.js
  models/
  routes/
  server.js
frontend/
  index.html
  product.html
  cart.html
  login.html
  register.html
  orders.html
  css/style.css
  js/
```

## Run the Backend

MongoDB is supported, but it is not required for a quick local demo. If MongoDB is not running, the backend automatically uses `backend/data/store.json`.

If you do want MongoDB, start it locally first. The default connection string is:

```text
mongodb://127.0.0.1:27017/simple_ecommerce_store
```

```bash
cd backend
npm install
copy .env.example .env
npm run seed
npm run dev
```

The API runs at:

```text
http://localhost:5000
```

## Open the Frontend

Open `frontend/index.html` in a browser after the backend is running.

If MongoDB is not running, this message is expected:

```text
MongoDB unavailable (...). Using local JSON database.
```

That means the app is running in local demo mode.

## API Endpoints

```text
POST /api/auth/register
POST /api/auth/login

GET    /api/products
GET    /api/products/:id
POST   /api/products
PUT    /api/products/:id
DELETE /api/products/:id

POST /api/orders
GET  /api/orders
GET  /api/orders/:id
```
