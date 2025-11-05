import { createStore } from "vuex";
import containers from "./modules/containers";
import settings from "./modules/settings";
import platforms from "./modules/platforms";
import notifications from "./modules/notifications";
import knowledge from "./modules/knowledge";

const store = createStore({
  state: {
    // 全局状态
    appReady: false,
    loading: false,
    error: null,
    theme: "light",
    language: "zh-CN",
  },

  getters: {
    isAppReady: (state) => state.appReady,
    isLoading: (state) => state.loading,
    currentError: (state) => state.error,
    currentTheme: (state) => state.theme,
    currentLanguage: (state) => state.language,
  },

  mutations: {
    SET_APP_READY(state, ready) {
      state.appReady = ready;
    },

    SET_LOADING(state, loading) {
      state.loading = loading;
    },

    SET_ERROR(state, error) {
      state.error = error;
    },

    CLEAR_ERROR(state) {
      state.error = null;
    },

    SET_THEME(state, theme) {
      state.theme = theme;
      // 应用主题到HTML元素
      document.documentElement.setAttribute("data-theme", theme);
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    },
    SET_LINE_URL(state, url) {
      const linePlatform = state.platforms.find((p) => p.id === "line");
      if (linePlatform) {
        linePlatform.url = url;
      }
    },

    SET_LANGUAGE(state, language) {
      state.language = language;
    },
  },

  actions: {
    async initializeApp({ commit, dispatch }) {
      try {
        commit("SET_LOADING", true);

        // 初始化各个模块
        await dispatch("settings/loadSettings");
        await dispatch("containers/loadContainers");
        await dispatch("platforms/loadPlatforms");
        await dispatch("knowledge/loadProviders");
        
        // 应用保存的主题设置
        const savedTheme = localStorage.getItem("app-theme") || "light";
        commit("SET_THEME", savedTheme);

        // 应用保存的语言设置
        const savedLanguage = localStorage.getItem("app-language") || "zh-CN";
        commit("SET_LANGUAGE", savedLanguage);

        commit("SET_APP_READY", true);
      } catch (error) {
        console.error("Failed to initialize app:", error);
        commit("SET_ERROR", error.message || "应用初始化失败");
      } finally {
        commit("SET_LOADING", false);
      }
    },

    setTheme({ commit }, theme) {
      commit("SET_THEME", theme);
      localStorage.setItem("app-theme", theme);
    },

    setLanguage({ commit }, language) {
      commit("SET_LANGUAGE", language);
      localStorage.setItem("app-language", language);
    },

    showError({ commit }, error) {
      commit("SET_ERROR", error);
    },

    clearError({ commit }) {
      commit("CLEAR_ERROR");
    },
  },

  modules: {
    containers,
    settings,
    platforms,
    notifications,
    knowledge,
  },

  // 开发工具
  strict: process.env.NODE_ENV !== "production",
});

export default store;