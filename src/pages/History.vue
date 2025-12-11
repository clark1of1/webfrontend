<template>
  <Layout>
    <template #default>
      <div class="container-fluid py-4 position-relative">

        <!-- Full-page Loading Overlay -->
        <transition name="fade-scale">
          <div v-if="initialLoading" class="loading-backdrop">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
          </div>
        </transition>

        <!-- Page Header -->
        <div class="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1 class="fw-bold display-6 mb-1">Stock History & Inventory</h1>
            <p class="text-muted m-0">Track products and stock movements</p>
          </div>
        </div>

        <!-- Inventory Table -->
        <h4 class="mt-4">Current Inventory</h4>
        <div class="table-responsive">
          <table class="table table-striped table-hover">
            <thead>
              <tr>
                <th>Name</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in products" :key="p.id" :class="{'table-danger': p.stock === 0}">
                <td>{{ p.name }}</td>
                <td>₱{{ formatPeso(p.price) }}</td>
                <td>{{ Number(p.stock || 0) }}</td>
                <td>
                  <span v-if="p.stock === 0" class="badge bg-danger">Out of Stock</span>
                  <span v-else-if="p.stock <= 10" class="badge bg-warning text-dark">Low Stock</span>
                  <span v-else class="badge bg-success">In Stock</span>
                </td>
              </tr>
              <tr v-if="products.length === 0">
                <td colspan="4" class="text-center text-muted py-3">No products available</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Filters -->
        <div class="row mb-3 g-3 align-items-end mt-5">
          <div class="col-md-3">
            <label class="form-label">Product</label>
            <select class="form-select" v-model="filterProduct">
              <option value="">All Products</option>
              <option v-for="p in products" :key="p.id" :value="p.id">{{ p.name }}</option>
            </select>
          </div>
          <div class="col-md-3">
            <label class="form-label">Start Date</label>
            <input type="date" class="form-control" v-model="filterStartDate" />
          </div>
          <div class="col-md-3">
            <label class="form-label">End Date</label>
            <input type="date" class="form-control" v-model="filterEndDate" />
          </div>
          <div class="col-md-3 d-flex gap-2">
            <button class="btn btn-primary flex-fill" :disabled="btnLoading" @click="applyFilters">
              <span v-if="btnLoading" class="spinner-border spinner-border-sm me-2"></span>
              Filter
            </button>
            <button class="btn btn-secondary flex-fill" :disabled="btnLoading" @click="resetFilters">
              <span v-if="btnLoading" class="spinner-border spinner-border-sm me-2"></span>
              Reset
            </button>
          </div>
        </div>

        <!-- Stock Movements Header + Buttons -->
        <div class="d-flex justify-content-between align-items-center mt-4">
          <h4 class="m-0">Stock Movements</h4>
          <div class="d-flex gap-2">
            <button class="btn btn-success btn-sm" @click="downloadCSV">Download CSV</button>
            <button class="btn btn-danger btn-sm" @click="downloadPDF">Download PDF</button>
          </div>
        </div>

        <!-- Stock Movement Table with Fade Animation -->
        <transition name="table-fade" mode="out-in">
          <div class="table-responsive mt-3" :key="displayedMovements.length">
            <table class="table table-bordered table-sm table-hover">
              <thead class="table-light">
                <tr>
                  <th>Date</th>
                  <th>Product</th>
                  <th>User</th>
                  <th>Movement Type</th>
                  <th>Stock Changed</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="movement in displayedMovements" :key="movement.id">
                  <td>{{ new Date(movement.created_at).toLocaleString() }}</td>
                  <td>{{ movement.product?.name || "Unknown" }}</td>
                  <td>{{ movement.user?.name || "Unknown" }}</td>
                  <td>{{ movement.movement_type }}</td>
                  <td>{{ movement.quantity_changed }}</td>
                </tr>
                <tr v-if="displayedMovements.length === 0">
                  <td colspan="5" class="text-center text-muted py-3">No movements found</td>
                </tr>
              </tbody>
            </table>
          </div>
        </transition>

        <!-- Toasts Queue -->
        <div class="toast-container">
          <transition-group name="toast-fade" tag="div">
            <div v-for="(t, index) in toasts" :key="t.id" class="toast-box" :class="t.type">
              {{ t.message }}
            </div>
          </transition-group>
        </div>

      </div>
    </template>
  </Layout>
</template>

<script setup>
import { ref, onMounted } from "vue";
import api from "../plugins/axios";
import Layout from "../components/Layout.vue";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const products = ref([]);
const stockMovements = ref([]);
const displayedMovements = ref([]);
const btnLoading = ref(false);
const initialLoading = ref(true);

const filterProduct = ref("");
const filterStartDate = ref("");
const filterEndDate = ref("");

const toasts = ref([]);
let toastId = 0;
const showToast = (type, msg) => {
  const id = toastId++;
  toasts.value.push({ id, type, message: msg });
  setTimeout(() => {
    toasts.value = toasts.value.filter(t => t.id !== id);
  }, 2500);
};

const formatPeso = (value) => {
  const num = Number(value || 0);
  return num.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// CSRF fetch for Sanctum
const fetchCSRF = async () => {
  try {
    await api.get("/sanctum/csrf-cookie");
  } catch {
    showToast("error", "Failed to get CSRF token");
  }
};

const fetchProducts = async () => {
  try {
    const res = await api.get("/products");
    products.value = res.data || [];
  } catch {
    showToast("error", "Failed to fetch products");
  }
};

const fetchStockMovements = async () => {
  try {
    const res = await api.get("/stock-movements");
    stockMovements.value = res.data || [];
    displayedMovements.value = [...stockMovements.value];
  } catch {
    showToast("error", "Failed to fetch stock movements");
  }
};

const applyFilters = async () => {
  btnLoading.value = true;
  await new Promise(resolve => setTimeout(resolve, 800));
  displayedMovements.value = stockMovements.value.filter((m) => {
    const matchesProduct = filterProduct.value ? m.product_id == filterProduct.value : true;
    const created = new Date(m.created_at);
    const matchesStart = filterStartDate.value ? created >= new Date(filterStartDate.value) : true;
    const matchesEnd = filterEndDate.value ? created <= new Date(filterEndDate.value + " 23:59:59") : true;
    return matchesProduct && matchesStart && matchesEnd;
  });
  btnLoading.value = false;
};

const resetFilters = async () => {
  btnLoading.value = true;
  await new Promise(resolve => setTimeout(resolve, 800));
  filterProduct.value = "";
  filterStartDate.value = "";
  filterEndDate.value = "";
  displayedMovements.value = [...stockMovements.value];
  btnLoading.value = false;
};

const downloadCSV = () => {
  if (!displayedMovements.value.length) return showToast("error", "No data to download");
  let csvContent = "Date,Product,User,Movement Type,Stock Changed\n";
  displayedMovements.value.forEach((m) => {
    const row = [
      new Date(m.created_at).toLocaleString().replace(",", ""),
      `"${m.product?.name || "Unknown"}"`,
      `"${m.user?.name || "Unknown"}"`,
      m.movement_type,
      m.quantity_changed,
    ].join(",");
    csvContent += row + "\n";
  });
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "stock_movements.csv";
  link.click();
  URL.revokeObjectURL(url);
  showToast("success", "CSV downloaded");
};

const downloadPDF = () => {
  if (!displayedMovements.value.length) return showToast("error", "No data to download");
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text("Stock Movement Report", 14, 15);
  const tableData = displayedMovements.value.map((m) => [
    new Date(m.created_at).toLocaleString(),
    m.product?.name || "Unknown",
    m.user?.name || "Unknown",
    m.movement_type,
    m.quantity_changed,
  ]);
  autoTable(doc, {
    startY: 25,
    head: [["Date", "Product", "User", "Movement Type", "Stock Changed"]],
    body: tableData,
  });
  doc.save("stock_movements.pdf");
  showToast("success", "PDF downloaded");
};

onMounted(async () => {
  initialLoading.value = true;
  await fetchCSRF(); // fetch CSRF first
  await Promise.all([fetchProducts(), fetchStockMovements()]);
  initialLoading.value = false;
});
</script>

<style scoped>
.table-hover tbody tr:hover { background-color: rgba(0, 123, 255, 0.05); }

.loading-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.3);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.toast-container {
  position: fixed;
  bottom: 40px;
  right: 30px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 1100;
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

.toast-fade-enter-active,
.toast-fade-leave-active { transition: all 0.4s ease; }
.toast-fade-enter-from { opacity: 0; transform: translateY(20px); }
.toast-fade-enter-to { opacity: 1; transform: translateY(0); }
.toast-fade-leave-from { opacity: 1; transform: translateY(0); }
.toast-fade-leave-to { opacity: 0; transform: translateY(20px); }

.table-fade-enter-active,
.table-fade-leave-active {
  transition: opacity 0.2s ease;
}
.table-fade-enter-from,
.table-fade-leave-to {
  opacity: 0;
}
.table-fade-enter-to,
.table-fade-leave-from {
  opacity: 1;
}

button .spinner-border-sm { width: 1rem; height: 1rem; }
</style>
