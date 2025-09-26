import { ElMessage } from "element-plus";
import defaultSettings from "@/common/default-settings";
import { i18n } from "@/utils/i18n";

const state = {
  settings: { ...defaultSettings },
  settingsLoaded: false,
  lastSavedSettings: null, // 新增，用来保存上次保存时的配置快照
};

const getters = {
  allSettings: (state) => state.settings,
  settingsLoaded: (state) => state.settingsLoaded,

  // 基本设置
  theme: (state) => state.settings.theme,
  language: (state) => state.settings.language,
  autoStart: (state) => state.settings.autoStart,
  minimizeToTray: (state) => state.settings.minimizeToTray,

  // 代理设置
  defaultProxy: (state) => state.settings.defaultProxy,

  // 翻译设置
  translationSettings: (state) => state.settings.translation,

  // 通知设置
  notificationSettings: (state) => state.settings.notification,

  // 安全设置
  securitySettings: (state) => state.settings.security,

  // 高级设置
  advancedSettings: (state) => state.settings.advanced,

  // 是否启用开发者模式
  isDeveloperMode: (state) => state.settings.advanced.developerMode,

  // 最大容器数量
  maxContainers: (state) => state.settings.advanced.maxContainers,
};

const mutations = {
  SET_SETTINGS(state, settings) {
    state.settings = { ...defaultSettings, ...settings };
  },
  SET_LAST_SAVED_SETTINGS(state, settings) {
    state.lastSavedSettings = JSON.parse(JSON.stringify(settings));
  },
  UPDATE_SETTING(state, { key, value }) {
    // 支持嵌套键，如 'translation.service'
    const keys = key.split(".");
    let target = state.settings;

    for (let i = 0; i < keys.length - 1; i++) {
      if (!target[keys[i]]) {
        target[keys[i]] = {};
      }
      target = target[keys[i]];
    }

    target[keys[keys.length - 1]] = value;
  },

  RESET_SETTINGS(state) {
    Object.assign(state.settings, defaultSettings);
  },

  SET_SETTINGS_LOADED(state, loaded) {
    state.settingsLoaded = loaded;
  },
};

const actions = {
  async loadSettings({ commit }) {
    try {
      console.log("正在加载设置...");
      let settings = null;

      // 优先从 Electron 主进程读取
      if (window.electronAPI?.loadSettings) {
        settings = await window.electronAPI.loadSettings();
      }

      // 如果 Electron 没返回，则尝试 localStorage（兼容浏览器模式）
      if (!settings) {
        const savedSettings = localStorage.getItem("app-settings");
        if (savedSettings) {
          settings = JSON.parse(savedSettings);
        }
      }

      // 如果都没有，就用默认配置
      if (!settings) {
        settings = { ...defaultSettings };
      }
      console.log("加载的设置:", settings);
      // 同步到 state
      commit("SET_SETTINGS", settings);
      commit("SET_LAST_SAVED_SETTINGS", settings);
      commit("SET_SETTINGS_LOADED", true);
    } catch (error) {
      console.error("Failed to load settings:", error);
      commit("SET_SETTINGS", defaultSettings);
      commit("SET_LAST_SAVED_SETTINGS", defaultSettings);
      commit("SET_SETTINGS_LOADED", true);
      ElMessage.error("加载设置失败，已恢复默认设置");
    }
  },

  async saveSettings({ state, dispatch, commit }) {
    try {
      // 1. 对比上次保存快照，找改动项
      const diffKeys = [];
      function findDiffKeys(oldObj, newObj, prefix = "") {
        for (const key in newObj) {
          const fullKey = prefix ? prefix + "." + key : key;
          if (
            typeof newObj[key] === "object" &&
            newObj[key] !== null &&
            oldObj[key]
          ) {
            findDiffKeys(oldObj[key], newObj[key], fullKey);
          } else {
            if (oldObj[key] !== newObj[key]) {
              diffKeys.push(fullKey);
            }
          }
        }
      }
      findDiffKeys(state.lastSavedSettings || {}, state.settings);

      // 2. 针对不同改动，调用对应副作用
      if (
        diffKeys.includes("language") ||
        diffKeys.some((k) => k.startsWith("language."))
      ) {
        await dispatch("applyLanguage", state.settings.language);
      }
      if (
        diffKeys.includes("theme") ||
        diffKeys.some((k) => k.startsWith("theme."))
      ) {
        await dispatch("applyTheme", state.settings.theme);
      }
      // 可以继续扩展其他副作用判断

      // 3. 执行保存逻辑
      if (window.electronAPI?.saveSettings) {
        const success = await window.electronAPI.saveSettings(
          JSON.parse(JSON.stringify(state.settings))
        );
        if (!success) throw new Error("主进程保存失败");
      } else {
        localStorage.setItem("app-settings", JSON.stringify(state.settings));
      }

      // 4. 更新快照
      commit("SET_LAST_SAVED_SETTINGS", state.settings);

      ElMessage.success("设置已保存");
    } catch (error) {
      console.error("Failed to save settings:", error);
      ElMessage.error("保存设置失败");
    }
  },

  async updateSetting({ commit, dispatch }, { key, value }) {
    try {
      commit("UPDATE_SETTING", { key, value });
      await dispatch("saveSettings"); // 只调用统一保存，触发检测和副作用
    } catch (error) {
      console.error("Failed to update setting:", error);
      ElMessage.error("更新设置失败");
    }
  },

  async updateSettings({ commit, dispatch }, settings) {
    try {
      commit("SET_SETTINGS", settings);
      await dispatch("saveSettings");
      ElMessage.success("设置已保存");
    } catch (error) {
      console.error("Failed to update settings:", error);
      ElMessage.error("保存设置失败");
    }
  },

  async resetSettings({ commit, dispatch }) {
    try {
      commit("RESET_SETTINGS");
      await dispatch("saveSettings");
      ElMessage.success("设置已重置为默认值");
    } catch (error) {
      console.error("Failed to reset settings:", error);
      ElMessage.error("重置设置失败");
    }
  },

  async exportSettings({ state }) {
    try {
      const data = {
        settings: state.settings,
        exportTime: new Date().toISOString(),
        version: "1.0.0",
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `settings_export_${
        new Date().toISOString().split("T")[0]
      }.json`;
      a.click();
      URL.revokeObjectURL(url);

      ElMessage.success("设置已导出");
    } catch (error) {
      console.error("Failed to export settings:", error);
      ElMessage.error("导出设置失败");
    }
  },

  async importSettings({ commit, dispatch }, file) {
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!data.settings) {
        throw new Error("无效的设置文件格式");
      }

      // 验证设置数据的完整性
      const importedSettings = { ...defaultSettings, ...data.settings };

      commit("SET_SETTINGS", importedSettings);
      await dispatch("saveSettings");

      ElMessage.success("设置已导入");
    } catch (error) {
      console.error("Failed to import settings:", error);
      ElMessage.error(`导入设置失败: ${error.message}`);
    }
  },

  // 应用主题设置
  async applyTheme({ commit, dispatch }, theme) {
    try {
      // 应用主题到文档
      document.documentElement.setAttribute("data-theme", theme);
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }

      // 通知主进程（如果在Electron环境中）
      if (window.electronAPI && window.electronAPI.setTheme) {
        window.electronAPI.setTheme(theme);
      }
    } catch (error) {
      console.error("Failed to apply theme:", error);
      ElMessage.error("应用主题失败");
    }
  },

  // 应用语言设置
  async applyLanguage({ state }, language) {
    try {
      console.log("设置的语言标识", language);
      i18n.global.locale.value = language;
      // 这里可以集成i18n来切换语言
      // 暂时只是保存设置

      ElMessage.success("语言设置已更新");
    } catch (error) {
      console.error("Failed to apply language:", error);
      ElMessage.error("应用语言设置失败");
    }
  },

  // 测试代理设置
  async testProxy({ state }) {
    try {
      const proxyConfig = state.settings.defaultProxy;

      if (!proxyConfig.enabled) {
        throw new Error("代理未启用");
      }

      if (window.electronAPI && window.electronAPI.testProxy) {
        const result = await window.electronAPI.testProxy(proxyConfig);

        if (result.success) {
          ElMessage.success("代理连接测试成功");
          return true;
        } else {
          throw new Error(result.error || "代理连接测试失败");
        }
      } else {
        // 浏览器环境下的模拟测试
        await new Promise((resolve) => setTimeout(resolve, 2000));
        ElMessage.success("代理连接测试成功（模拟）");
        return true;
      }
    } catch (error) {
      console.error("Proxy test failed:", error);
      ElMessage.error(`代理测试失败: ${error.message}`);
      return false;
    }
  },

  // 应用安全设置
  async applySecurity({ state, dispatch }) {
    try {
      const { appLock, dataEncryption } = state.settings.security;

      // 这里可以实现具体的安全功能
      // 比如设置应用锁、数据加密等

      if (appLock) {
        // 启用应用锁逻辑
      }

      if (dataEncryption) {
        // 启用数据加密逻辑
      }

      await dispatch("saveSettings");
      ElMessage.success("安全设置已应用");
    } catch (error) {
      console.error("Failed to apply security settings:", error);
      ElMessage.error("应用安全设置失败");
    }
  },
};

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions,
};
