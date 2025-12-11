<template>
  <Layout>
    <template #default>
      <div class="products-page container-fluid py-4 position-relative">

        <!-- Loading Overlay -->
        <transition name="fade-scale">
          <div v-if="loading" class="loading-backdrop">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
          </div>
        </transition>

        <!-- Page Header -->
        <div class="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1 class="fw-bold display-6 mb-1">Products</h1>
            <p class="text-muted m-0">Medicines on stock</p>
          </div>

          <button
            v-if="user?.role === 'admin'"
            class="btn btn-primary btn-lg"
            @click="openAddProduct"
          >
            + Add Product
          </button>
        </div>

        <!-- UPLOAD MODAL -->
        <upload-product
          v-if="showUpload"
          :product="selectedProduct"
          @close="closeUpload"
          @added="fetchProducts"
          @toast="showToast($event.type, $event.message)"
        />

        <!-- SEARCH -->
<div class="mb-3 mt-4">
  <input
    type="text"
    class="form-control form-control-lg search-bar"
    placeholder="Search product..."
    v-model="searchQuery"
  />
</div>


        <!-- PRODUCTS TABLE -->
        <div class="table-responsive shadow-sm rounded border bg-ultralight">
          <table class="table align-middle mb-0">
            <thead class="table-light">
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Price</th>
                <th>Description</th>
                <th>Stock</th>
                <th width="180px">Actions</th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="product in filteredProducts" :key="product.id">
                <td>
                  <img
                    v-if="product.image_url"
                    :src="product.image_url"
                    alt="product"
                    class="product-img"
                  />
                  <span v-else class="text-muted">No Image</span>
                </td>

                <td>{{ product.name }}</td>
                <td>₱{{ product.price }}</td>
                <td>{{ product.description }}</td>

                <td>
                  <span
                    v-if="product.stock <= 10"
                    class="badge low-stock"
                    :title="'Low stock: only ' + product.stock + ' left!'"
                  >
                    {{ product.stock }} ⚠️
                  </span>
                  <span v-else class="badge bg-primary">
                    {{ product.stock }}
                  </span>
                </td>

                <td>
                  <div class="mb-2">
                    <input
                      type="number"
                      min="1"
                      :max="product.stock"
                      v-model.number="deductAmounts[product.id]"
                      placeholder="Qty"
                      class="form-control form-control-sm mb-1"
                    />
                    <button
                      class="btn btn-warning btn-sm w-100"
                      @click="deductStock(product)"
                      :disabled="!deductAmounts[product.id]"
                    >
                      Deduct
                    </button>
                  </div>

                  <div v-if="user?.role === 'admin'" class="d-flex flex-column gap-1">
                    <button
                      class="btn btn-primary btn-sm"
                      @click="editProduct(product)"
                    >
                      Edit
                    </button>

                    <button
                      class="btn btn-danger btn-sm"
                      @click="confirmDelete(product.id)"
                    >
                      Delete
                    </button>

                    <button
                      class="btn btn-success btn-sm"
                      @click="openAddStock(product)"
                    >
                      Add Stock
                    </button>
                  </div>
                </td>
              </tr>

              <tr v-if="filteredProducts.length === 0">
                <td colspan="6" class="text-center py-3">
                  No products found
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- ADD STOCK MODAL -->
        <transition name="fade-scale">
          <div v-if="showAddStock" class="modal d-block">
            <div class="modal-dialog">
              <div class="modal-content rounded-3">
                <div class="modal-header">
                  <h5 class="modal-title text-center w-100">Add Stock — {{ selectedProduct.name }}</h5>
                  <button type="button" class="btn-close" @click="closeAddStock"></button>
                </div>

                <div class="modal-body">
                  <input
                    type="number"
                    min="1"
                    class="form-control"
                    v-model.number="addStockQty"
                    placeholder="Stock"
                  />
                </div>

                <div class="modal-footer">
                  <button class="btn btn-secondary" @click="closeAddStock">
                    Close
                  </button>
                  <button class="btn btn-success" @click="addStock">
                    Add Stock
                  </button>
                </div>
              </div>
            </div>
          </div>
        </transition>

        <!-- TOAST QUEUE -->
        <div class="toast-container">
          <transition-group name="toast-fade" tag="div">
            <div v-for="t in toasts" :key="t.id" class="toast-box" :class="t.type">
              {{ t.message }}
            </div>
          </transition-group>
        </div>

        <!-- CONFIRM DELETE CENTER MODAL -->
        <transition name="fade-scale">
          <div v-if="confirmVisible" class="confirm-backdrop">
            <div class="confirm-center text-center">
              <p class="mb-3">Delete this product?</p>
              <div class="d-flex gap-2 justify-content-center">
                <button class="btn btn-secondary btn-sm" @click="confirmVisible = false">Cancel</button>
                <button class="btn btn-danger btn-sm" @click="deleteConfirmed">Delete</button>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </template>
  </Layout>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import api from "../plugins/axios";
import UploadProduct from "../components/UploadProduct.vue";
import Layout from "../components/Layout.vue";

/* DATA */
const products = ref([]);
const user = ref(null);
const searchQuery = ref("");
const deductAmounts = ref({});
const selectedProduct = ref(null);
const showUpload = ref(false);
const showAddStock = ref(false);
const addStockQty = ref(0);
const loading = ref(false);

/* TOAST QUEUE */
const toasts = ref([]);
let toastId = 0;
const showToast = (type, msg) => {
  const id = toastId++;
  toasts.value.push({ id, type, message: msg });
  setTimeout(() => {
    toasts.value = toasts.value.filter(t => t.id !== id);
  }, 2500);
};

/* CONFIRM DELETE */
const confirmVisible = ref(false);
let deleteId = null;

/* --- CSRF HELPER --- */
const getCsrf = async () => {
  await api.get("/sanctum/csrf-cookie");
};

/* FETCH PRODUCTS */
const fetchProducts = async () => {
  loading.value = true;
  try {
    const res = await api.get("/products");
    products.value = res.data;
  } catch {
    showToast("error", "Failed to load products");
  } finally {
    loading.value = false;
  }
};

const fetchUser = async () => {
  try {
    const res = await api.get("/user");
    user.value = res.data;
  } catch {}
};

/* FILTERED LIST */
const filteredProducts = computed(() => {
  if (!searchQuery.value) return products.value;
  return products.value.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

/* MODALS & ACTIONS */
const openAddProduct = () => {
  selectedProduct.value = null;
  showUpload.value = true;
};
const closeUpload = () => (showUpload.value = false);
const editProduct = (product) => {
  selectedProduct.value = product;
  showUpload.value = true;
};

/* CONFIRM DELETE */
const confirmDelete = (id) => {
  deleteId = id;
  confirmVisible.value = true;
};
const deleteConfirmed = async () => {
  try {
    await getCsrf();
    await api.delete(`/products/${deleteId}`);
    products.value = products.value.filter((p) => p.id !== deleteId);
    showToast("success", "Product deleted");
  } catch {
    showToast("error", "Failed to delete product");
  } finally {
    confirmVisible.value = false;
    deleteId = null;
  }
};

/* DEDUCT STOCK */
const deductStock = async (product) => {
  const qty = deductAmounts.value[product.id];
  if (!qty || qty <= 0) return;

  try {
    await getCsrf();
    const res = await api.post(`/products/${product.id}/deduct`, { quantity: qty });
    product.stock = res.data.product.stock;
    deductAmounts.value[product.id] = null;
    showToast("success", "Stock deducted successfully!");
  } catch (err) {
    showToast("error", err.response?.data.message || "Not enough stock!");
  }
};

/* ADD STOCK */
const openAddStock = (product) => {
  selectedProduct.value = product;
  addStockQty.value = 0;
  showAddStock.value = true;
};
const closeAddStock = () => {
  addStockQty.value = 0;
  showAddStock.value = false;
};
const addStock = async () => {
  if (!addStockQty.value || addStockQty.value <= 0) return;

  try {
    await getCsrf();
    const res = await api.post("/products/add-stock", {
      product_id: selectedProduct.value.id,
      quantity: addStockQty.value,
    });
    const product = products.value.find((p) => p.id === selectedProduct.value.id);
    product.stock = res.data.product.stock;
    closeAddStock();
    showToast("success", "Stock added successfully!");
  } catch {
    showToast("error", "Failed to add stock");
  }
};

onMounted(() => {
  fetchProducts();
  fetchUser();
});
</script>


<style scoped>
/* Loading overlay */
.loading-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.3);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
}

/* Toast queue */
.toast-container {
  position: fixed;
  bottom: 40px;
  right: 30px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 11000;
}

.toast-box {
  padding: 15px 22px;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  color: white;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  backdrop-filter: blur(6px);
}

.toast-box.success { background: linear-gradient(45deg, #22c55e, #16a34a); }
.toast-box.error { background: linear-gradient(45deg, #ef4444, #dc2626); }

/* Toast fade + slide */
.toast-fade-enter-active,
.toast-fade-leave-active { transition: all 0.4s ease; }
.toast-fade-enter-from { opacity: 0; transform: translateY(20px); }
.toast-fade-enter-to { opacity: 1; transform: translateY(0); }
.toast-fade-leave-from { opacity: 1; transform: translateY(0); }
.toast-fade-leave-to { opacity: 0; transform: translateY(20px); }

/* Confirm modal centered */
.confirm-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  z-index: 10000;
  display: flex;
  justify-content: center;
  align-items: center;
}

.confirm-center {
  background: white;
  padding: 25px 30px;
  border-radius: 12px;
  width: 300px;
  text-align: center;
  box-shadow: 0 8px 25px rgba(0,0,0,0.2);
}


/* Other styling */
.bg-ultralight { background-color: #F9F9FC !important; }
.product-img { width: 90px; height: 90px; object-fit: cover; border-radius: 12px; border: 1px solid #ccc; }
.low-stock { background-color: #FF3B30 !important; color: #fff; font-weight: 600; animation: blink 1s infinite; }
@keyframes blink { 0%,100%{opacity:1;} 50%{opacity:0.4;} }
.search-bar { border-radius: 12px; }
</style>
