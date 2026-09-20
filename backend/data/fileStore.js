const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
const sampleProducts = require("./sampleProducts");

const storePath = path.join(__dirname, "store.json");

const now = () => new Date().toISOString();
const id = () => crypto.randomUUID();

const emptyStore = () => ({
  users: [],
  products: [],
  orders: [],
});

const withIds = (items) =>
  items.map((item) => ({
    _id: id(),
    ...item,
    createdAt: now(),
    updatedAt: now(),
  }));

const readStore = async () => {
  try {
    const data = await fs.readFile(storePath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    const store = emptyStore();
    store.products = withIds(sampleProducts);
    await writeStore(store);
    return store;
  }
};

const writeStore = async (store) => {
  await fs.writeFile(storePath, JSON.stringify(store, null, 2));
};

const seedProducts = async () => {
  const store = await readStore();
  store.products = withIds(sampleProducts);
  store.orders = [];
  await writeStore(store);
  return store.products;
};

module.exports = {
  readStore,
  writeStore,
  seedProducts,
  id,
  now,
};
