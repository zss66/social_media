<template>
  <div class="settings-page">
    <div class="settings-container">
      <div class="settings-header">
        <h1>应用设置</h1>
        <p>管理您的应用偏好设置和配置</p>
      </div>

      <div class="settings-content">
        <GlobalSettings @save="handleSaveSettings" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { useStore } from "vuex";
import { ElMessage } from "element-plus";
import GlobalSettings from "@/components/GlobalSettings.vue";

const store = useStore();

const handleSaveSettings = (settings) => {
  store.dispatch("settings/updateSettings", settings);
  ElMessage.success("设置已保存");
};
</script>

<style scoped>
.settings-page {
  height: 100%;
  overflow-y: auto;
  background: var(--bg-color-page);
}

.settings-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 40px 20px;
}

.settings-header {
  text-align: center;
  margin-bottom: 40px;
}

.settings-header h1 {
  font-size: 32px;
  font-weight: 600;
  color: var(--text-color-primary);
  margin-bottom: 8px;
}

.settings-header p {
  font-size: 16px;
  color: var(--text-color-regular);
}

.settings-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

[data-theme="dark"] .settings-content {
  background: #2c2c2c;
}

@media (max-width: 768px) {
  .settings-container {
    padding: 20px 10px;
  }

  .settings-header h1 {
    font-size: 24px;
  }
}
</style>
