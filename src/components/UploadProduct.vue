<template>
  <transition name="fade-scale">
    <div class="upload-card card p-4 shadow-sm">
      <!-- HEADER WITH CLOSE TOGGLE -->
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h5 class="m-0 upload-title">{{ isEdit ? 'Edit Product' : 'Add Product' }}</h5>
        <button type="button" class="btn-close" @click="$emit('close')"></button>
      </div>

      <form @submit.prevent="submit" class="d-flex flex-column gap-3">

        <!-- IMAGE PREVIEW -->
        <div v-if="previewImage" class="image-preview mb-2">
          <img :src="previewImage" alt="Preview" />
        </div>

        <!-- NAME -->
        <input 
          type="text" 
          v-model="form.name" 
          placeholder="Product Name" 
          class="form-control"
          required
        />

        <!-- PRICE -->
        <input 
          type="number" 
          v-model="form.price" 
          placeholder="Price (₱)" 
          class="form-control"
          min="0"
          step="0.01"
          required
        />

        <!-- STOCK -->
        <input 
          type="number" 
          v-model="form.stock" 
          placeholder="Stock" 
          class="form-control"
          min="0"
          required
        />

        <!-- DESCRIPTION -->
        <textarea 
          v-model="form.description" 
          placeholder="Description" 
          class="form-control"
          rows="3"
        ></textarea>

        <!-- IMAGE UPLOAD -->
        <input 
          type="file" 
          @change="handleFile" 
          accept="image/*" 
          class="form-control"
        />

        <!-- BUTTONS -->
        <div class="d-flex gap-2 justify-content-end mt-2">
          <button type="submit" class="btn btn-primary">
            {{ isEdit ? 'Update' : 'Submit' }}
          </button>
          <button type="button" class="btn btn-secondary" @click="$emit('close')">
            Cancel
          </button>
        </div>

      </form>
    </div>
  </transition>
</template>

<script setup>
import { ref, watch } from "vue";
import api from "../plugins/axios";

const emit = defineEmits(["added", "close", "toast"]);
const props = defineProps({ product: Object });

const isEdit = ref(!!props.product);

const form = ref({
  name: props?.product?.name || "",
  price: props?.product?.price || "",
  stock: props?.product?.stock || "",
  description: props?.product?.description || "",
  image: null,
});

const previewImage = ref(props?.product?.image_url || null);

watch(() => props.product, (newVal) => {
  if (newVal) {
    isEdit.value = true;
    form.value = {
      name: newVal.name,
      price: newVal.price,
      stock: newVal.stock,
      description: newVal.description,
      image: null
    };
    previewImage.value = newVal.image_url || null;
  } else {
    isEdit.value = false;
    form.value = { name: "", price: "", stock: "", description: "", image: null };
    previewImage.value = null;
  }
});

const handleFile = (e) => {
  const file = e.target.files[0];
  if (file && file.type.startsWith("image/")) {
    form.value.image = file;
    previewImage.value = URL.createObjectURL(file);
  } else {
    form.value.image = null;
    previewImage.value = null;
    alert("Please select a valid image file");
  }
};

/* --- CSRF Helper --- */
const getCsrf = async () => {
  await api.get("/sanctum/csrf-cookie");
};

const submit = async () => {
  try {
    await getCsrf(); // <-- CSRF request for Laravel Sanctum

    const formData = new FormData();
    formData.append("name", form.value.name);
    formData.append("price", form.value.price);
    formData.append("stock", form.value.stock);
    formData.append("description", form.value.description);
    if (form.value.image) formData.append("image", form.value.image);

    let response;
    if (isEdit.value && props.product?.id) {
      formData.append("_method", "PUT");
      response = await api.post(`/products/${props.product.id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
    } else {
      response = await api.post("/products", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
    }

    // Show toast in parent
    emit("toast", {
      type: "success",
      message: `Product ${isEdit.value ? "updated" : "added"} successfully!`
    });

    emit("added");
    emit("close");

  } catch (err) {
    if (err.response?.data?.errors) {
      const messages = Object.values(err.response.data.errors).flat().join("\n");
      alert(messages);
    } else {
      alert(err.response?.data?.message || "Failed to save product");
    }
  }
};
</script>


<style scoped>
.upload-card {
  max-width: 450px;
  margin: auto;
  padding: 2rem;
  border-radius: 12px;
  background-color: #fff;
  box-shadow: 0 6px 18px rgba(0,0,0,0.12);
}

/* HEADER */
.upload-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #701D0B;
}

/* IMAGE PREVIEW */
.image-preview {
  width: 100%;
  display: flex;
  justify-content: center;
}

.image-preview img {
  width: 140px;
  height: 140px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #ccc;
  transition: transform 0.2s ease-in-out;
}

.image-preview img:hover {
  transform: scale(1.05);
}

/* Fade + scale for popout */
.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: all 0.3s ease;
}
.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
.fade-scale-enter-to,
.fade-scale-leave-from {
  opacity: 1;
  transform: scale(1);
}
</style>
