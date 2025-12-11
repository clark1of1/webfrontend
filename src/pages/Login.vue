<template>
  <div class="container-fluid vh-100 p-0">
    <div class="row g-0 h-100">

      <!-- Left background -->
      <div class="col-md-6 d-none d-md-flex align-items-center justify-content-center position-relative"
        style="background: url('/src/assets/campus-background.jpg') center/cover no-repeat;">
        <div class="position-absolute top-0 start-0 w-100 h-100" style="background: rgba(0,0,0,0.45);"></div>

        <img src="/src/assets/logo.png" alt="Meditrack Logo"
          class="img-fluid position-relative" style="max-height: 70%; z-index: 2;" />
      </div>

      <!-- Right side login -->
      <div class="col-md-6 d-flex align-items-center justify-content-center bg-white">
        <div class="w-75">

          <h2 class="text-center mb-4 fw-bold">LOGIN ACCOUNT</h2>

          <form @submit.prevent="loginUser">

            <!-- Email -->
            <div class="mb-3 position-relative">
              <input v-model="email" type="email" class="form-control py-3 ps-5" placeholder="Email" required />
              <i class="bi bi-envelope-fill position-absolute top-50 translate-middle-y" style="left: 15px;"></i>
            </div>

            <!-- Password -->
            <div class="mb-3 position-relative">
              <input
                :type="showPassword ? 'text' : 'password'"
                v-model="password"
                class="form-control py-3 ps-5"
                placeholder="Password"
                required
              />
              <i class="bi bi-lock-fill position-absolute top-50 translate-middle-y" style="left: 15px;"></i>

              <i
                :class="showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"
                class="position-absolute top-50 translate-middle-y"
                style="right: 15px; cursor: pointer;"
                @click="showPassword = !showPassword"
              ></i>
            </div>

            <!-- Submit -->
            <button type="submit" class="btn btn-danger w-100 py-3 fw-bold" :disabled="loading">
              <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
              LOGIN
            </button>

            <p v-if="errorMessage" class="text-danger mt-2 text-center">
              {{ errorMessage }}
            </p>
          </form>

          <p class="text-center mt-3">
            Don't have an account?
            <router-link to="/register" class="text-danger fw-bold">SIGN UP</router-link>
          </p>

        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../store/auth"; // <- use Pinia store
import api from "../plugins/axios";

const email = ref("");
const password = ref("");
const showPassword = ref(false);
const errorMessage = ref("");
const loading = ref(false);

const router = useRouter();
const auth = useAuthStore(); // <- initialize Pinia store

// Fetch CSRF cookie before login
const getCSRF = async () => {
  try {
    await api.get("/sanctum/csrf-cookie");
  } catch (err) {
    console.error("CSRF fetch failed", err);
  }
};

const loginUser = async () => {
  errorMessage.value = "";
  loading.value = true;

  try {
    await getCSRF();

    // Use Pinia login action
    await auth.login({ email: email.value, password: password.value });

    // Redirect immediately
    router.push("/dashboard");
  } catch (err) {
    errorMessage.value = err.response?.data?.message || "Invalid email or password.";
  } finally {
    loading.value = false;
  }
};
</script>
