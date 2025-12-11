<template>
  <div class="container-fluid vh-100 p-0">
    <div class="row g-0 h-100">

      <!-- Left Side: Logo / Background -->
      <div 
        class="col-md-6 d-none d-md-flex align-items-center justify-content-center position-relative"
        style="background: url('/src/assets/campus-background.jpg') center/cover no-repeat;"
      >
        <!-- Dark overlay -->
        <div class="position-absolute top-0 start-0 w-100 h-100" style="background: rgba(0,0,0,0.45);"></div>

        <!-- Logo -->
        <img src="/src/assets/logo.png" alt="Meditrack Logo"
          class="img-fluid position-relative"
          style="max-height: 70%; z-index: 2;"
        />
      </div>

      <!-- Right Side: Form -->
      <div class="col-md-6 d-flex align-items-center justify-content-center">
        <div class="w-75">

          <h2 class="text-center mb-4 fw-bold">SIGN UP ACCOUNT</h2>

          <form @submit.prevent="registerUser">

            <!-- Name -->
            <div class="mb-3 position-relative">
              <input type="text" class="form-control py-3 ps-5" placeholder="Full Name" v-model="name" required />
              <i class="bi bi-person-fill position-absolute top-50 translate-middle-y" style="left: 15px;"></i>
              <small class="text-danger">{{ errors.name }}</small>
            </div>

            <!-- Email -->
            <div class="mb-3 position-relative">
              <input type="email" class="form-control py-3 ps-5" placeholder="Email" v-model="email" required />
              <i class="bi bi-envelope-fill position-absolute top-50 translate-middle-y" style="left: 15px;"></i>
              <small class="text-danger">{{ errors.email }}</small>
            </div>

            <!-- Password -->
            <div class="mb-3 position-relative">
              <input :type="showPassword ? 'text' : 'password'" class="form-control py-3 ps-5" placeholder="Password" v-model="password" required />
              <i class="bi bi-lock-fill position-absolute top-50 translate-middle-y" style="left: 15px;"></i>
              <i :class="showPassword ? 'bi-eye-slash' : 'bi-eye'" class="position-absolute top-50 translate-middle-y" style="right: 15px; cursor: pointer;" @click="showPassword = !showPassword"></i>
              <small class="text-danger">{{ errors.password }}</small>
            </div>

            <!-- Confirm Password -->
            <div class="mb-3 position-relative">
              <input :type="showConfirm ? 'text' : 'password'" class="form-control py-3 ps-5" placeholder="Confirm Password" v-model="confirmPassword" required />
              <i class="bi bi-lock-fill position-absolute top-50 translate-middle-y" style="left: 15px;"></i>
              <i :class="showConfirm ? 'bi-eye-slash' : 'bi-eye'" class="position-absolute top-50 translate-middle-y" style="right: 15px; cursor: pointer;" @click="showConfirm = !showConfirm"></i>
              <small class="text-danger">{{ errors.password_confirmation }}</small>
            </div>

            <!-- Role -->
            <div class="mb-3">
              <select class="form-select py-3" v-model="role">
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
              <small class="text-danger">{{ errors.role }}</small>
            </div>

            <!-- Submit -->
            <button type="submit" class="btn btn-danger w-100 py-3 fw-bold">SIGN UP</button>

            <!-- Links -->
            <p class="text-center mt-3">
              Already have an account?
              <router-link to="/login" class="text-danger fw-bold">LOG IN</router-link>
            </p>

          </form>

        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from "vue";
import { useRouter } from "vue-router";
import api from "../plugins/axios";

const router = useRouter();

const name = ref("");
const email = ref("");
const password = ref("");
const confirmPassword = ref("");
const role = ref("user");

const showPassword = ref(false);
const showConfirm = ref(false);

const errors = reactive({
  name: "",
  email: "",
  password: "",
  password_confirmation: "",
  role: "",
});

// Fetch CSRF cookie
const getCSRF = async () => {
  try {
    await api.get("/sanctum/csrf-cookie");
  } catch (err) {
    console.error("CSRF fetch failed", err);
  }
};

const registerUser = async () => {
  Object.keys(errors).forEach(key => errors[key] = "");

  if (password.value !== confirmPassword.value) {
    errors.password_confirmation = "Passwords do not match";
    return;
  }

  try {
    await getCSRF();

    await api.post("/register", {
      name: name.value,
      email: email.value,
      password: password.value,
      password_confirmation: confirmPassword.value,
      role: role.value,
    });

    router.push("/login");
  } catch (err) {
    if (err.response?.status === 422) {
      const responseErrors = err.response.data.errors;
      Object.keys(responseErrors).forEach(key => {
        if (errors[key] !== undefined) errors[key] = responseErrors[key][0];
      });
    } else {
      alert(err.response?.data?.message || "Registration failed");
    }
  }
};
</script>


<style scoped>
/* Optional: make the container full height */
body, html, #app {
  height: 100%;
}
</style>
