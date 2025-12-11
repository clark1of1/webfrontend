<template>
  <div class="container">
    <Layout />

    <div v-if="!auth.isAdmin" class="alert alert-danger text-center mt-4">
      You do not have permission to access this page.
    </div>

    <div v-else class="card mx-auto mt-4 p-4" style="max-width: 500px;">
      <h4 class="mb-3">Upload Medicine Image</h4>

      <input type="file" class="form-control mb-3" @change="selectFile" />
      <img v-if="preview" :src="preview" class="img-fluid mb-3" />

      <button class="btn btn-primary w-100" @click="uploadFile">Upload</button>

      <p v-if="message" class="mt-3 text-success">{{ message }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import Layout from "../components/Layout.vue";
import api from "../plugins/axios";
import { useAuthStore } from "../store/auth";

const auth = useAuthStore();
const file = ref(null);
const preview = ref(null);
const message = ref("");

const selectFile = (e) => {
  file.value = e.target.files[0];
  preview.value = URL.createObjectURL(file.value);
};

const uploadFile = async () => {
  if (!file.value) return alert("Select a file first");

  const form = new FormData();
  form.append("file", file.value);

  try {
    const res = await api.post("/upload", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    message.value = res.data.message;
    file.value = null;
    preview.value = null;
  } catch (e) {
    console.error(e);
    message.value = "Upload failed.";
  }
};
</script>
