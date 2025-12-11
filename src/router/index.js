import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../store/auth";

// Pages
import Login from "../pages/Login.vue";
import Register from "../pages/Register.vue";
import Dashboard from "../pages/Dashboard.vue";
import Products from "../pages/Products.vue";
import LowStock from "../pages/LowStock.vue";
import ReorderList from "../pages/ReorderList.vue";
import History from "../pages/History.vue";
import Profile from "../pages/Profile.vue";
import Upload from "../pages/Upload.vue";

const routes = [
  { path: "/login", name: "login", component: Login, meta: { requiresGuest: true } },
  { path: "/register", name: "register", component: Register, meta: { requiresGuest: true } },
  { path: "/upload", name: "upload", component: Upload, meta: { requiresAuth: true } },
  { path: "/dashboard", name: "dashboard", component: Dashboard, meta: { requiresAuth: true } },
  { path: "/products", name: "products", component: Products, meta: { requiresAuth: true } },
  { path: "/low-stock", name: "lowstock", component: LowStock, meta: { requiresAuth: true } },
  { path: "/reorder", name: "reorder", component: ReorderList, meta: { requiresAuth: true } },
  { path: "/history", name: "history", component: History, meta: { requiresAuth: true } },
  { path: "/profile", name: "profile", component: Profile, meta: { requiresAuth: true } },
  { path: "/", redirect: "/dashboard" },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Route guards
router.beforeEach((to) => {
  const auth = useAuthStore();

  if (to.meta.requiresAuth && !auth.isLoggedIn) return "/login";
  if (to.meta.requiresGuest && auth.isLoggedIn) return "/dashboard";
});

export default router;
