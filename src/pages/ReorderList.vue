<template>
  <div class="container mt-4">
    <h2>Reorder Report</h2>
    <p class="text-muted">Products that need to be reordered soon.</p>

    <table class="table table-striped mt-3">
      <thead>
        <tr>
          <th>Name</th>
          <th>Quantity</th>
          <th>Reorder Needed</th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="p in products" :key="p.id">
          <td>{{ p.name }}</td>
          <td>{{ p.quantity }}</td>
          <td>
            <span class="badge bg-warning">Reorder</span>
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
  const res = await api.get("/products/reorder");
  products.value = res.data;
});
</script>
