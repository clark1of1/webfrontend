<template>
  <Layout>
    <template #default>
      <div class="container mt-5 position-relative">

        <!-- Loading Overlay -->
        <div v-if="loadingOverlay" class="loading-backdrop">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
        </div>

        <!-- Page Header -->
        <div class="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1 class="fw-bold display-6 mb-1">My Profile</h1>
            <p class="text-muted m-0">Manage your account and preferences</p>
          </div>
        </div>

        <div class="row">
          <!-- PROFILE SUMMARY / AVATAR -->
          <div class="col-md-4 mb-4">
            <div class="card shadow-sm p-4 text-center">
              <div class="mb-3 position-relative">
                <img v-if="previewImage" :src="previewImage" class="rounded-circle profile-img mb-2" alt="Preview" />
                <img v-else-if="user.profile_photo_url" :src="`${user.profile_photo_url}?t=${user.updated_at || Date.now()}`" class="rounded-circle profile-img mb-2" alt="Profile" />
                <div v-else class="rounded-circle profile-placeholder mb-2">
                  {{ user.name.charAt(0).toUpperCase() }}
                </div>

                <button v-if="user.profile_photo_url || previewImage" class="btn btn-sm btn-danger position-absolute bottom-0 start-50 translate-middle-x" @click="removeImage">
                  Remove
                </button>
              </div>

              <input type="file" @change="startConfirmation" class="form-control" />
              <h5 class="mt-3">{{ user.name }}</h5>
              <p class="text-muted mb-1">{{ user.email }}</p>
              <p class="text-secondary"><strong>Role:</strong> {{ user.role || "User" }}</p>
            </div>
          </div>

          <!-- PROFILE FORM -->
          <div class="col-md-8 mb-4">
            <div class="card shadow-sm p-4">
              <h4 class="mb-4">Edit Profile</h4>
              <form @submit.prevent="updateProfile">
                <div class="mb-3">
                  <label class="form-label">Full Name</label>
                  <input v-model="user.name" type="text" class="form-control" required />
                </div>

                <div class="mb-3">
                  <label class="form-label">Email</label>
                  <input v-model="user.email" type="email" class="form-control" required />
                </div>

                <button class="btn btn-primary w-100" :disabled="loadingOverlay">
                  <span v-if="loadingOverlay" class="spinner-border spinner-border-sm me-2"></span>
                  Save Changes
                </button>
              </form>
            </div>

            <!-- ACCOUNT DETAILS -->
            <div class="card shadow-sm p-4 mt-4">
              <h5>Account Info</h5>
              <ul class="list-group list-group-flush mt-2">
                <li class="list-group-item">
                  <strong>Registered On:</strong> {{ formatDate(user.created_at) }}
                </li>
              </ul>
            </div>
          </div>
        </div>

        <!-- CONFIRMATION MODAL -->
        <div v-if="showModal" class="modal-backdrop">
          <div class="modal-box">
            <h5>Change Profile Picture?</h5>
            <p class="text-muted">Do you want to use this new image?</p>
            <div class="d-flex justify-content-end gap-2">
              <button class="btn btn-secondary" @click="cancelImage">Cancel</button>
              <button class="btn btn-primary" @click="openCropper">Continue</button>
            </div>
          </div>
        </div>

        <!-- CROPPER MODAL -->
        <div v-if="showCropper" class="modal-backdrop">
          <div class="modal-box">
            <h5>Crop Image</h5>
            <div class="cropper-container">
              <img ref="cropperImage" :src="tempImage" class="img-fluid" />
            </div>
            <div class="d-flex justify-content-end gap-2 mt-3">
              <button class="btn btn-secondary" @click="cancelCropper">Cancel</button>
              <button class="btn btn-success" @click="applyCroppedImage">Apply</button>
            </div>
          </div>
        </div>

        <!-- TOAST QUEUE WITH TRANSITION -->
        <transition-group name="toast-slide" tag="div" class="toast-wrapper">
          <div v-for="(t, index) in toastQueue" :key="t.id" class="toast-box" :class="t.type">
            {{ t.message }}
          </div>
        </transition-group>

      </div>
    </template>
  </Layout>
</template>

<script setup>
import { ref, onMounted } from "vue";
import Layout from "../components/Layout.vue";
import api from "../plugins/axios";
import Cropper from "cropperjs";
import "cropperjs/dist/cropper.css";
import { useAuthStore } from "../store/auth";

const user = ref({ name: "", email: "", role: "", profile_photo_url: null, updated_at: null });
const imageFile = ref(null);
const previewImage = ref(null);
const tempImage = ref(null);
const showModal = ref(false);
const showCropper = ref(false);
const loadingOverlay = ref(false);

const toastQueue = ref([]);
let toastIdCounter = 0;

let cropper = null;
const cropperImage = ref(null);

/* TOAST QUEUE */
const showToast = (type, msg) => {
  const id = toastIdCounter++;
  toastQueue.value.push({ id, type, message: msg });

  setTimeout(() => {
    const index = toastQueue.value.findIndex(t => t.id === id);
    if (index !== -1) toastQueue.value.splice(index, 1);
  }, 2500);
};

/* --- CSRF HELPER --- */
const getCsrf = async () => {
  await api.get("/sanctum/csrf-cookie");
};

/* FETCH PROFILE */
const fetchProfile = async () => {
  loadingOverlay.value = true;
  try {
    const res = await api.get("/user");
    user.value = res.data;
  } catch {
    showToast("error", "Failed to load profile");
  } finally {
    loadingOverlay.value = false;
  }
};

/* IMAGE HANDLING */
const startConfirmation = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  tempImage.value = URL.createObjectURL(file);
  imageFile.value = file;
  showModal.value = true;
};
const cancelImage = () => {
  showModal.value = false;
  tempImage.value = null;
  imageFile.value = null;
};
const openCropper = () => {
  showModal.value = false;
  showCropper.value = true;
  setTimeout(() => {
    cropper = new Cropper(cropperImage.value, { aspectRatio: 1, viewMode: 1, dragMode: "move", autoCropArea: 1 });
  }, 50);
};
const cancelCropper = () => {
  showCropper.value = false;
  tempImage.value = null;
  imageFile.value = null;
  if (cropper) cropper.destroy();
};
const applyCroppedImage = () => {
  const canvas = cropper.getCroppedCanvas({ width: 300, height: 300 });
  canvas.toBlob((blob) => {
    previewImage.value = URL.createObjectURL(blob);
    imageFile.value = new File([blob], "profile.jpg", { type: "image/jpeg" });
  });
  cropper.destroy();
  showCropper.value = false;
};
const removeImage = () => {
  previewImage.value = null;
  imageFile.value = null;
  user.value.profile_photo_url = null;
};

/* UPDATE PROFILE WITH CSRF */
const updateProfile = async () => {
  loadingOverlay.value = true;
  try {
    await getCsrf(); // <-- CSRF request for Laravel Sanctum

    const formData = new FormData();
    formData.append("name", user.value.name);
    formData.append("email", user.value.email);
    if (imageFile.value) formData.append("profile_photo", imageFile.value);
    else if (!user.value.profile_photo_url) formData.append("remove_image", "1");

    const res = await api.post("/profile/update", formData);

    user.value.name = res.data.user.name;
    user.value.email = res.data.user.email;
    user.value.role = res.data.user.role;
    user.value.profile_photo_url = res.data.user.profile_photo_url ? res.data.user.profile_photo_url + "?t=" + Date.now() : null;

    previewImage.value = null;
    imageFile.value = null;

    const auth = useAuthStore();
    auth.user = res.data.user;

    showToast("success", "Profile updated successfully!");
  } catch {
    showToast("error", "Failed to update profile.");
  } finally {
    loadingOverlay.value = false;
  }
};

const formatDate = (date) => (!date ? "N/A" : new Date(date).toLocaleString());

onMounted(fetchProfile);
</script>


<style scoped>
/* Profile */
.profile-img { width: 120px; height: 120px; object-fit: cover; border: 2px solid #a03017ff; }
.profile-placeholder { width: 120px; height: 120px; background: #a03017ff; color: #fff; font-size: 48px; display: flex; justify-content: center; align-items: center; }
.card { border-radius: 10px; }

/* Loading overlay */
.loading-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.3);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1050;
}

/* Modal */
.modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1050; }
.modal-box { background: white; padding: 25px; width: 400px; border-radius: 10px; }
.cropper-container img { max-width: 100%; }

/* Toast */
.toast-wrapper { position: fixed; bottom: 40px; right: 30px; z-index: 9999; display: flex; flex-direction: column; gap: 10px; }
.toast-box { padding: 15px 22px; border-radius: 12px; font-size: 1rem; font-weight: 600; color: white; box-shadow: 0 4px 12px rgba(0,0,0,0.15); backdrop-filter: blur(6px); }

.toast-box.success { background: linear-gradient(45deg, #22c55e, #16a34a); }
.toast-box.error { background: linear-gradient(45deg, #ef4444, #dc2626); }

/* Smooth slide/fade for toast queue */
.toast-slide-enter-from { opacity: 0; transform: translateY(40px); }
.toast-slide-enter-to { opacity: 1; transform: translateY(0); }
.toast-slide-leave-from { opacity: 1; transform: translateY(0); }
.toast-slide-leave-to { opacity: 0; transform: translateY(40px); }
.toast-slide-enter-active, .toast-slide-leave-active { transition: all 0.4s ease; }
</style>
