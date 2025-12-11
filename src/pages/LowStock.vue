<template>
  <div class="container mt-4">
    <h2>Low Stock Products</h2>
    <p class="text-muted">Products with 10 units or less.</p>

    <table class="table table-bordered mt-3">
      <thead>
        <tr>
          <th>Name</th>
          <th>Quantity</th>
          <th>Status</th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="p in products" :key="p.id">
          <td>{{ p.name }}</td>
          <td>{{ p.stock }}</td>
          <td>
            <span class="badge bg-danger">Low Stock</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import api from "../plugins/axios";

const products = ref([]);

onMounted(async () => {
  const res = await api.get("/products/low-stock");
  products.value = res.data;
});
</script>
