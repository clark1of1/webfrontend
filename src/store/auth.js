import { defineStore } from "pinia";
import api from "../plugins/axios";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    token: localStorage.getItem("token") || null,
    user: JSON.parse(localStorage.getItem("user")) || null,
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
    isAdmin: (state) => state.user?.role === "admin",
  },

  actions: {
    async login(credentials) {
      const res = await api.post("/login", credentials);

      this.token = res.data.token;
      this.user = res.data.user;

      localStorage.setItem("token", this.token);
      localStorage.setItem("user", JSON.stringify(this.user));

      api.defaults.headers.common["Authorization"] = `Bearer ${this.token}`;
    },

    async logout() {
      try {
        await api.post("/logout");
      } catch (error) {
        console.warn("Logout error ignored:", error.message);
      }

      this.token = null;
      this.user = null;

      localStorage.removeItem("token");
      localStorage.removeItem("user");

      delete api.defaults.headers.common["Authorization"];
    },

    // 🚀 NEW: Call this whenever profile is updated
    updateUser(data) {
      this.user = { ...this.user, ...data };
      localStorage.setItem("user", JSON.stringify(this.user));
    }
  },
});
