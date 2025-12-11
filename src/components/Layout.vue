<template>
  <div class="layout">
    <!-- HEADER -->
    <header class="header d-flex justify-content-between align-items-center px-3">
      <!-- LEFT: Logo + Title -->
      <router-link to="/dashboard" class="d-flex align-items-center text-decoration-none">
        <img src="/src/assets/logo.png" alt="MediTrack Logo" class="logo" />
        <span class="title ms-2">MediTrack</span>
      </router-link>

      <!-- RIGHT: Avatar + Name Dropdown -->
      <div class="dropdown d-flex align-items-center">
        <!-- Avatar -->
        <div class="header-avatar me-2">
          <img
            v-if="user.profile_photo_url"
            :src="`${user.profile_photo_url}?v=${avatarVersion}`"
            :key="avatarVersion"
            alt="User Avatar"
          />
          <div v-else class="avatar-placeholder">
            {{ user.name?.charAt(0).toUpperCase() }}
          </div>
        </div>

        <!-- Name Dropdown -->
        <button
          class="dropdown-toggle header-name"
          id="userDropdown"
          data-bs-toggle="dropdown"
          aria-expanded="false"
        >
          {{ user?.name || 'User' }}
        </button>

        <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="userDropdown">
          <li><router-link class="dropdown-item" to="/profile">Profile</router-link></li>
          <li>
            <a class="dropdown-item text-danger" href="#" @click.prevent="showLogoutModal = true">
              Logout
            </a>
          </li>
        </ul>
      </div>
    </header>

    <div class="d-flex flex-grow-1">
      <!-- SIDEBAR -->
      <aside :class="['sidebar', { 'sidebar-collapsed': collapsed }]">
        <button class="btn collapse-btn mb-4" @click="toggleCollapse">
          <i class="bi bi-list"></i>
        </button>

        <ul class="nav flex-column mt-3">
          <li class="nav-item mb-2">
            <router-link class="nav-link d-flex align-items-center gap-3" to="/dashboard">
              <i class="bi bi-speedometer2 nav-icon"></i>
              <transition name="fade-slide"><span v-if="!collapsed">Dashboard</span></transition>
            </router-link>
          </li>

          <li class="nav-item mb-2">
            <router-link class="nav-link d-flex align-items-center gap-3" to="/products">
              <i class="bi bi-box-seam nav-icon"></i>
              <transition name="fade-slide"><span v-if="!collapsed">Products</span></transition>
            </router-link>
          </li>

          <li class="nav-item mb-2">
            <router-link class="nav-link d-flex align-items-center gap-3" to="/history">
              <i class="bi bi-clock-history nav-icon"></i>
              <transition name="fade-slide"><span v-if="!collapsed">History</span></transition>
            </router-link>
          </li>

          <li class="nav-item mb-2">
            <router-link class="nav-link d-flex align-items-center gap-3" to="/profile">
              <i class="bi bi-person-circle nav-icon"></i>
              <transition name="fade-slide"><span v-if="!collapsed">Profile</span></transition>
            </router-link>
          </li>
        </ul>
      </aside>

      <!-- MAIN CONTENT -->
      <main class="main-content flex-fill p-4">
        <slot></slot>
      </main>
    </div>

    <!-- FOOTER -->
    <footer class="footer d-flex justify-content-center align-items-center">
      <span class="footer-text">
        2025 © MediTrack | BSIT3B Group2 - <i>{{ currentMember }}</i>
        <span class="underline"></span>
      </span>
    </footer>

    <!-- LOGOUT CONFIRM MODAL -->
    <div v-if="showLogoutModal" class="modal-backdrop">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content modal-light p-4">
          <h5 class="mb-2">Confirm Logout</h5>
          <p class="mb-3">Are you sure you want to logout?</p>
          <div class="d-flex justify-content-end gap-2">
            <button class="btn btn-secondary btn-sm" @click="showLogoutModal = false">
              Cancel
            </button>
            <button class="btn btn-danger btn-sm" @click="logout" :disabled="loggingOut">
              <span v-if="loggingOut" class="spinner-border spinner-border-sm me-1"></span>
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- TOAST -->
    <div v-if="showToast" class="toast-success">
      Logged out successfully!
    </div>
  </div>
</template>

<script>
import { useAuthStore } from "../store/auth";

export default {
  name: "Layout",
  data() {
    return {
      collapsed: JSON.parse(localStorage.getItem("sidebarCollapsed")) || false,
      showLogoutModal: false,
      loggingOut: false,
      showToast: false,
      members: [
        "Alfonso, King Clark",
        "Barin, Paulo",
        "Garcia, Giana Isabel",
        "Mandac, John Michael",
        "Pagala, Sofia"
      ],
      currentIndex: 0,
      currentMember: "Alfonso, King Clark"
    };
  },
  computed: {
    user() {
      return useAuthStore().user || {};
    },

    // 🔥 NEW — avatar updates instantly when store updates it
    avatarVersion() {
      return useAuthStore().user.updated_at || Date.now();
    }
  },
  methods: {
    async logout() {
      this.loggingOut = true;
      const auth = useAuthStore();
      await auth.logout();
      this.showToast = true;
      setTimeout(() => (this.showToast = false), 2000);
      this.loggingOut = false;
      this.showLogoutModal = false;
      this.$router.replace("/login");
    },
    toggleCollapse() {
      this.collapsed = !this.collapsed;
      localStorage.setItem("sidebarCollapsed", JSON.stringify(this.collapsed));
    },
    rotateMembers() {
      this.currentIndex = (this.currentIndex + 1) % this.members.length;
      this.currentMember = this.members[this.currentIndex];
    }
  },
  mounted() {
    this.rotationInterval = setInterval(this.rotateMembers, 3000);
  },
  beforeUnmount() {
    clearInterval(this.rotationInterval);
  }
};
</script>

<style scoped>
/* Times New Roman font for all layout elements */
.header, .sidebar, .footer, .modal-light, .dropdown-menu {
  font-family: 'Times New Roman', Times, serif;
}
.layout { display: flex; flex-direction: column; min-height: 100vh; }
.header { height: 50px; background: #a03017ff; position: sticky; top: 0; z-index: 1000; color: white; }
.logo { height: 48px; }
.title { font-size: 24px; color: white; }
.header-avatar { width: 38px; height: 38px; border-radius: 50%; overflow: hidden; display: flex; justify-content: center; align-items: center; background: #a74a38; font-weight: bold; color: white; font-size: 17px; transition: 0.2s ease-in-out; border: 2px solid transparent; }
.header-avatar:hover { border-color: white; transform: scale(1.05); }
.header-avatar img { width: 100%; height: 100%; object-fit: cover; }
.header-name { background: transparent !important; border: none !important; color: white !important; font-size: 18px; padding: 5px 8px; }
.sidebar { width: 160px; background: #364150; padding: 15px; transition: width 0.3s ease; }
.sidebar-collapsed { width: 45px; padding: 5px 0; }
.collapse-btn { width: 100%; border: 1px solid #28303B; color: #ccc; }
.nav-link { color: #ccc; padding: 10px 12px; border-radius: 6px; display: flex; align-items: center; gap: 12px; transition: 0.25s ease; }
.nav-icon { font-size: 20px; width: 24px; text-align: center; opacity: 0.85; transition: 0.25s ease; }
.nav-link:hover { background: #28303B; color: white; transform: translateX(4px); }
.nav-link:hover .nav-icon { opacity: 1; transform: scale(1.15); }
.main-content { overflow-y: auto; flex: 1; }
/* Footer */
.footer { height: 30px; background: linear-gradient(to right, #F2C165, #d14931ff, #8d200dff 50%, #d14931ff, #F2C165); color: #e7e7e7ff; display: flex; justify-content: center; align-items: center; position: sticky; bottom: 0; width: 100%; box-shadow: inset 0 1px 0 rgba(255,255,255,0.1); }
.footer-text { font-weight: 500; position: relative; cursor: default; }
.footer-text .underline { content: ""; position: absolute; left: 0; bottom: -2px; height: 2px; width: 0; background-color: #fff; transition: width 0.3s ease; }
.footer-text:hover .underline { width: 100%; }
/* Modals & Toast */
.modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; justify-content: center; align-items: center; }
.modal-light { background: #fff; border-radius: 10px; box-shadow: 0 10px 25px rgba(0,0,0,0.3); color: #333; min-width: 280px; }
.toast-success { position: fixed; bottom: 20px; right: 20px; background: #3cb371; color: white; padding: 12px 20px; border-radius: 10px; font-weight: bold; animation: fadeSlide 0.3s ease-out; z-index: 2000; }
@keyframes fadeSlide { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
</style>
