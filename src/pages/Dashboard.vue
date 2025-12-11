<template>
  <Layout>
    <template #default>
      <div class="dashboard-page container-fluid py-4 position-relative">

        <!-- Loading Overlay -->
        <div v-if="loading" class="loading-backdrop">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
        </div>

        <!-- Page Header -->
        <div class="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1 class="fw-bold display-6 mb-1">Dashboard Overview</h1>
            <p class="text-muted m-0">Real-time insights of the inventory</p>
          </div>
        </div>

        <!-- Stats Grid -->
        <div class="row g-3 mb-4">
          <div class="col-sm-6 col-md-3" v-for="card in cardData" :key="card.title">
            <div class="stat-card shadow-sm p-3 rounded d-flex align-items-center gap-3">
              <div class="stat-icon rounded-circle d-flex justify-content-center align-items-center" :class="card.iconClass">
                <i :class="card.icon" class="fs-4"></i>
              </div>
              <div>
                <p class="text-muted mb-1 small">{{ card.title }}</p>
                <h4 class="fw-bold m-0">{{ card.value }}</h4>
              </div>
            </div>
          </div>
        </div>

        <!-- Stock Chart -->
        <div class="card shadow-sm rounded p-4 mb-4">
          <h5 class="fw-semibold mb-3">Stock Levels per Product</h5>
          <canvas v-if="!loading && products.length" ref="stockChart"></canvas>
          <p v-else class="text-muted text-center py-5">Loading chart…</p>
        </div>
      </div>
    </template>
  </Layout>
</template>

<script setup>
import { ref, onMounted, computed, nextTick, onBeforeUnmount } from "vue";
import api from "../plugins/axios";
import Layout from "../components/Layout.vue";
import Chart from "chart.js/auto";

const products = ref([]);
const users = ref([]);
const user = ref({});
const loading = ref(true);
const stockChart = ref(null);
let chartInstance = null;

// Fetch CSRF cookie before any request (required by Sanctum)
const fetchCSRF = async () => {
  try {
    await api.get("/sanctum/csrf-cookie");
  } catch (err) {
    console.error("Failed to fetch CSRF cookie", err);
  }
};

// Fetch current logged-in user
const fetchUser = async () => {
  try {
    const res = await api.get("/user");
    user.value = res.data;
  } catch (err) {
    console.error("Failed to fetch user", err);
  }
};

// Fetch products
const fetchProducts = async () => {
  try {
    const res = await api.get("/products");
    products.value = res.data;
  } catch (err) {
    console.error("Failed to fetch products", err);
  }
};

// Fetch users (only for admin)
const fetchUsers = async () => {
  if (user.value.role === "admin") {
    try {
      const res = await api.get("/users");
      users.value = res.data;
    } catch (err) {
      console.error("Failed to fetch users", err);
    }
  }
};

// Stats cards
const cardData = computed(() => {
  const lowStock = products.value.filter(p => p.stock > 0 && p.stock <= 10).length;
  const outOfStock = products.value.filter(p => p.stock === 0).length;

  const cards = [
    { title: "Total Products", value: products.value.length, icon: "bi bi-box-seam", iconClass: "bg-primary text-white" },
    { title: "Low Stock", value: lowStock, icon: "bi bi-exclamation-triangle", iconClass: "bg-warning text-dark" },
    { title: "Out of Stock", value: outOfStock, icon: "bi bi-slash-circle", iconClass: "bg-danger text-white" },
  ];

  if (user.value.role === "admin") {
    cards.push({ title: "Total Users", value: users.value.length, icon: "bi bi-people", iconClass: "bg-success text-white" });
  }

  return cards;
});

// Draw chart
const drawChart = () => {
  if (!stockChart.value || !products.value.length) return;

  const ctx = stockChart.value.getContext("2d");
  if (chartInstance) chartInstance.destroy();

  chartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: products.value.map(p => p.name),
      datasets: [
        {
          label: "Stock Quantity",
          data: products.value.map(p => p.stock),
          backgroundColor: products.value.map(p => {
            if (p.stock === 0) return "#dc3545";
            if (p.stock <= 10) return "#ffc107";
            return "#4CAF50";
          }),
        },
      ],
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
      scales: { y: { beginAtZero: true } }
    },
  });
};

onMounted(async () => {
  // Fetch CSRF first
  await fetchCSRF();

  await fetchUser();
  await fetchProducts();
  await fetchUsers();

  loading.value = false;

  await nextTick();
  drawChart();
});

onBeforeUnmount(() => {
  chartInstance?.destroy();
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

/* Stats cards */
.stat-card {
  transition: all 0.2s ease;
}
.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(0,0,0,0.05);
}
.stat-icon {
  width: 50px;
  height: 50px;
  font-size: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
