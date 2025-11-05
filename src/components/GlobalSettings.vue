<template>
  <div class="global-settings">
    <el-form ref="formRef" :model="settings" label-width="140px">
      <!-- 基本设置 -->
      <el-card class="settings-section" shadow="never">
        <template #header>
          <div class="section-header">
            <el-icon><Setting /></el-icon>
            {{ $t("settings.basicSettings") }}
          </div>
        </template>

        <el-form-item :label="$t('settings.theme')">
          <el-radio-group v-model="settings.theme">
            <el-radio label="light">{{ $t("settings.lightTheme") }}</el-radio>
            <el-radio label="dark">{{ $t("settings.darkTheme") }}</el-radio>
            <el-radio label="auto">{{ $t("settings.autoTheme") }}</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item :label="$t('settings.language')">
          <el-select v-model="settings.language" placeholder="">
            <el-option :label="$t('translation.languages.zh')" value="zh-CN" />
            <el-option :label="$t('translation.languages.en')" value="en-US" />
            <el-option :label="$t('translation.languages.ja')" value="ja-JP" />
            <el-option :label="$t('translation.languages.ko')" value="ko-KR" />
          </el-select>
        </el-form-item>

        <el-form-item :label="$t('settings.autoStart')">
          <el-switch v-model="settings.autoStart" />
          <div class="form-item-description">
            {{ $t("settings.autoStartDesc") || "应用将在系统启动时自动运行" }}
          </div>
        </el-form-item>

        <el-form-item :label="$t('settings.minimizeToTray')">
          <el-switch v-model="settings.minimizeToTray" />
          <div class="form-item-description">
            {{
              $t("settings.minimizeToTrayDesc") ||
              "关闭窗口时最小化到系统托盘而不是退出"
            }}
          </div>
        </el-form-item>
      </el-card>

      <!-- 默认代理设置 -->
      <el-card class="settings-section" shadow="never">
        <template #header>
          <div class="section-header">
            <el-icon><Link /></el-icon>
            {{ $t("settings.defaultProxy") }}
          </div>
        </template>

        <el-form-item :label="$t('config.enableProxy')">
          <el-switch v-model="settings.defaultProxy.enabled" />
          <div class="form-item-description">
            {{
              $t("settings.defaultProxyDesc") ||
              "新创建的容器将默认使用此代理配置"
            }}
          </div>
        </el-form-item>

        <template v-if="settings.defaultProxy.enabled">
          <el-form-item :label="$t('config.proxyType')">
            <el-select v-model="settings.defaultProxy.type">
              <el-option label="HTTP" value="http" />
              <el-option label="HTTPS" value="https" />
              <el-option label="SOCKS4" value="socks4" />
              <el-option label="SOCKS5" value="socks5" />
            </el-select>
          </el-form-item>

          <el-row :gutter="20">
            <el-col :span="14">
              <el-form-item :label="$t('config.proxyAddress')">
                <el-input
                  v-model="settings.defaultProxy.host"
                  placeholder="127.0.0.1"
                />
              </el-form-item>
            </el-col>
            <el-col :span="10">
              <el-form-item :label="$t('config.proxyPort')">
                <el-input-number
                  v-model="settings.defaultProxy.port"
                  :min="1"
                  :max="65535"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item :label="$t('config.username')">
                <el-input v-model="settings.defaultProxy.username" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item :label="$t('config.password')" label-width="80px">
                <el-input
                  v-model="settings.defaultProxy.password"
                  type="password"
                  show-password
                />
              </el-form-item>
            </el-col>
          </el-row>
        </template>
      </el-card>

      <!-- ✅ 更新：翻译设置 - 使用工具栏参数结构 -->
      <el-card class="settings-section" shadow="never">
        <template #header>
          <div class="section-header">
            <el-icon><ChatDotRound /></el-icon>
            {{ $t("settings.translationSettings") }}
          </div>
        </template>

        <el-alert type="info" :closable="false" style="margin-bottom: 16px">
          <template #title>
            <span style="font-size: 12px">
              全局翻译设置将应用于所有未开启独立配置的工具栏
            </span>
          </template>
        </el-alert>

        <!-- 基础开关 -->
        <el-form-item label="接收自动翻译">
          <el-switch v-model="settings.translation.autoTranslateReceive" />
          <div class="form-item-description">接收到的消息是否自动翻译</div>
        </el-form-item>

        <el-form-item label="发送自动翻译">
          <el-switch v-model="settings.translation.autoTranslateSend" />
          <div class="form-item-description">发送消息时是否自动翻译</div>
        </el-form-item>

        <!-- 按钮个性化 -->
        <el-divider content-position="left">按钮个性化</el-divider>

        <el-form-item label="翻译按钮文本">
          <el-input
            v-model="settings.translation.buttonText"
            placeholder="🌐点击翻译"
          />
        </el-form-item>

        <el-form-item label="加载提示文本">
          <el-input
            v-model="settings.translation.loadingText"
            placeholder="翻译中..."
          />
        </el-form-item>

        <!-- 翻译服务配置 -->
        <el-divider content-position="left">翻译服务</el-divider>

        <el-form-item label="翻译通道">
          <el-select
            v-model="settings.translation.channel"
            style="width: 200px"
          >
            <el-option label="谷歌翻译" value="google" />
            <el-option label="百度翻译" value="baidu" />
            <el-option label="腾讯翻译" value="tencent" />
            <el-option label="有道翻译" value="youdao" />
          </el-select>
        </el-form-item>

        <el-form-item label="目标语言">
          <el-select
            v-model="settings.translation.targetLanguage"
            style="width: 200px"
          >
            <el-option label="中文" value="zh" />
            <el-option label="英语" value="en" />
            <el-option label="日语" value="ja" />
            <el-option label="韩语" value="ko" />
            <el-option label="法语" value="fr" />
            <el-option label="西班牙语" value="es" />
            <el-option label="德语" value="de" />
            <el-option label="俄语" value="ru" />
          </el-select>
        </el-form-item>

        <el-form-item label="源语种">
          <el-select
            v-model="settings.translation.sourceLanguage"
            style="width: 200px"
          >
            <el-option label="简体中文" value="zh-CN" />
            <el-option label="繁体中文" value="zh-TW" />
            <el-option label="English" value="en" />
            <el-option label="日本語" value="ja" />
            <el-option label="한국어" value="ko" />
          </el-select>
        </el-form-item>

        <el-form-item label="API密钥">
          <el-input
            v-model="settings.translation.apiKey"
            type="password"
            placeholder="某些翻译服务需要API密钥"
            show-password
          />
          <div class="form-item-description">
            用于调用翻译API，请确保密钥有效（部分服务不需要）
          </div>
        </el-form-item>

        <el-form-item label="自动检测语言">
          <el-switch v-model="settings.translation.autoDetect" />
          <div class="form-item-description">自动识别源语言，无需手动指定</div>
        </el-form-item>

        <!-- 高级功能 -->
        <el-divider content-position="left">高级功能</el-divider>

        <el-form-item label="翻译预览">
          <el-switch v-model="settings.translation.preview" />
          <div class="form-item-description">发送前预览翻译结果</div>
        </el-form-item>

        <el-form-item label="语音自动翻译">
          <el-switch v-model="settings.translation.autoVoice" />
          <div class="form-item-description">接收到语音消息时自动翻译</div>
        </el-form-item>

        <!-- 缓存管理 -->
        <el-divider content-position="left">缓存管理</el-divider>

        <el-form-item label="最大缓存条数">
          <el-input-number
            v-model="settings.translation.maxCacheSize"
            :min="100"
            :max="10000"
            :step="100"
          />
          <div class="form-item-description">翻译结果缓存数量上限</div>
        </el-form-item>

        <el-form-item label="缓存有效期">
          <el-select
            v-model="settings.translation.cacheExpireMs"
            style="width: 200px"
          >
            <el-option label="7天" :value="7 * 24 * 60 * 60 * 1000" />
            <el-option label="30天" :value="30 * 24 * 60 * 60 * 1000" />
            <el-option label="90天" :value="90 * 24 * 60 * 60 * 1000" />
            <el-option label="180天" :value="180 * 24 * 60 * 60 * 1000" />
            <el-option label="永久" :value="0" />
          </el-select>
        </el-form-item>

        <el-form-item label="翻译后隐藏按钮">
          <el-switch v-model="settings.translation.hideButtonAfterTranslate" />
          <div class="form-item-description">翻译完成后自动隐藏翻译按钮</div>
        </el-form-item>
      </el-card>

      <!-- 通知设置 -->
      <el-card class="settings-section" shadow="never">
        <template #header>
          <div class="section-header">
            <el-icon><Bell /></el-icon>
            {{ $t("settings.notificationSettings") }}
          </div>
        </template>

        <el-form-item :label="$t('settings.enableDesktopNotification')">
          <el-switch v-model="settings.notification.enabled" />
        </el-form-item>

        <template v-if="settings.notification.enabled">
          <el-form-item :label="$t('settings.notificationSound')">
            <el-switch v-model="settings.notification.sound" />
          </el-form-item>

          <el-form-item :label="$t('settings.showMessagePreview')">
            <el-switch v-model="settings.notification.showPreview" />
            <div class="form-item-description">
              {{
                $t("settings.showMessagePreviewDesc") ||
                "在通知中显示消息内容预览"
              }}
            </div>
          </el-form-item>

          <el-form-item :label="$t('settings.quietHours')">
            <el-time-picker
              v-model="settings.notification.quietHours"
              is-range
              range-separator="至"
              start-placeholder=""
              end-placeholder=""
              format="HH:mm"
            />
          </el-form-item>
        </template>
      </el-card>

      <!-- 安全设置 -->
      <el-card class="settings-section" shadow="never">
        <template #header>
          <div class="section-header">
            <el-icon><Lock /></el-icon>
            {{ $t("settings.securitySettings") }}
          </div>
        </template>

        <el-form-item :label="$t('settings.appLock')">
          <el-switch v-model="settings.security.appLock" />
          <div class="form-item-description">
            {{ $t("settings.appLockDesc") || "应用启动时需要输入密码" }}
          </div>
        </el-form-item>

        <template v-if="settings.security.appLock">
          <el-form-item :label="$t('settings.appPassword')">
            <el-input
              v-model="settings.security.password"
              type="password"
              placeholder=""
              show-password
            />
          </el-form-item>

          <el-form-item :label="$t('settings.autoLockTime')">
            <el-select v-model="settings.security.autoLockTime">
              <el-option label="1分钟" :value="1" />
              <el-option label="5分钟" :value="5" />
              <el-option label="10分钟" :value="10" />
              <el-option label="30分钟" :value="30" />
              <el-option label="1小时" :value="60" />
              <el-option label="永不" :value="0" />
            </el-select>
          </el-form-item>
        </template>

        <el-form-item :label="$t('settings.dataEncryption')">
          <el-switch v-model="settings.security.dataEncryption" />
          <div class="form-item-description">
            {{
              $t("settings.dataEncryptionDesc") || "加密保存的配置和数据文件"
            }}
          </div>
        </el-form-item>

        <el-form-item :label="$t('settings.clearBrowserData')">
          <el-button @click="clearBrowserData" type="warning" plain>
            {{ $t("settings.clearBrowserData") }}
          </el-button>
          <div class="form-item-description">
            {{
              $t("settings.clearBrowserDataDesc") ||
              "清理所有容器的Cookie、缓存等数据"
            }}
          </div>
        </el-form-item>
      </el-card>

      <!-- 高级设置 -->
      <el-card class="settings-section" shadow="never">
        <template #header>
          <div class="section-header">
            <el-icon><Tools /></el-icon>
            {{ $t("settings.advancedSettings") }}
          </div>
        </template>

        <el-form-item :label="$t('settings.developerMode')">
          <el-switch v-model="settings.advanced.developerMode" />
          <div class="form-item-description">
            {{ $t("settings.developerModeDesc") || "启用调试功能和开发者工具" }}
          </div>
        </el-form-item>

        <el-form-item :label="$t('settings.hardwareAcceleration')">
          <el-switch v-model="settings.advanced.hardwareAcceleration" />
          <div class="form-item-description">
            {{
              $t("settings.hardwareAccelerationDesc") ||
              "使用GPU加速渲染（重启后生效）"
            }}
          </div>
        </el-form-item>

        <el-form-item :label="$t('settings.maxContainers')">
          <el-input-number
            v-model="settings.advanced.maxContainers"
            :min="1"
            :max="50"
          />
          <div class="form-item-description">
            {{ $t("settings.maxContainersDesc") || "同时运行的容器数量限制" }}
          </div>
        </el-form-item>

        <el-form-item :label="$t('settings.logLevel')">
          <el-select v-model="settings.advanced.logLevel">
            <el-option :label="$t('common.error')" value="error" />
            <el-option :label="$t('common.warning')" value="warn" />
            <el-option :label="$t('common.info')" value="info" />
            <el-option :label="$t('common.debug')" value="debug" />
          </el-select>
        </el-form-item>

        <el-form-item :label="$t('settings.autoUpdate')">
          <el-switch v-model="settings.advanced.autoUpdate" />
          <div class="form-item-description">
            {{ $t("settings.autoUpdateDesc") || "自动检查并下载应用更新" }}
          </div>
        </el-form-item>
      </el-card>
    </el-form>

    <div class="settings-actions">
      <el-button @click="resetToDefault" type="info">
        {{ $t("settings.restoreDefaults") }}
      </el-button>
      <el-button @click="exportSettings" type="success">
        {{ $t("settings.exportSettings") }}
      </el-button>
      <el-button @click="importSettings" type="warning">
        {{ $t("settings.importSettings") }}
      </el-button>
      <el-button @click="saveSettings" type="primary">
        {{ $t("common.save") }}
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from "vue";
import cloneDeep from "lodash/cloneDeep";
import { ElMessage, ElMessageBox } from "element-plus";
import { useI18n } from "vue-i18n";
import {
  Setting,
  Link,
  ChatDotRound,
  Bell,
  Lock,
  Tools,
} from "@element-plus/icons-vue";

const { t } = useI18n();

const props = defineProps({
  showGlobalSettings: {
    type: Boolean,
  },
});

const emit = defineEmits(["save"]);

const formRef = ref();

// ✅ 更新：翻译设置使用工具栏的参数结构
const settings = reactive({
  theme: "light",
  language: "zh-CN",
  autoStart: false,
  minimizeToTray: true,

  defaultProxy: {
    enabled: false,
    type: "http",
    host: "",
    port: 8080,
    username: "",
    password: "",
  },

  // ✅ 新的翻译设置结构，与工具栏一致
  translation: {
    // 基础开关
    autoTranslateReceive: true,
    autoTranslateSend: true,

    // 按钮个性化
    buttonText: "🌐点击翻译",
    loadingText: "翻译中...",

    // 翻译服务
    channel: "google",
    targetLanguage: "zh",
    sourceLanguage: "zh-CN",
    apiKey: "",
    autoDetect: true,

    // 高级功能
    preview: false,
    autoVoice: false,

    // 缓存管理
    maxCacheSize: 500,
    cacheExpireMs: 30 * 24 * 60 * 60 * 1000,
    hideButtonAfterTranslate: true,
  },

  notification: {
    enabled: true,
    sound: true,
    showPreview: true,
    quietHours: [],
  },

  security: {
    appLock: false,
    password: "",
    autoLockTime: 30,
    dataEncryption: false,
  },

  advanced: {
    developerMode: false,
    hardwareAcceleration: true,
    maxContainers: 20,
    logLevel: "info",
    autoUpdate: true,
  },
});

// ✅ 更新：默认设置
const defaultSettings = {
  theme: "light",
  language: "zh-CN",
  autoStart: false,
  minimizeToTray: true,

  defaultProxy: {
    enabled: false,
    type: "http",
    host: "",
    port: 8080,
    username: "",
    password: "",
  },

  translation: {
    autoTranslateReceive: true,
    autoTranslateSend: true,
    buttonText: "🌐点击翻译",
    loadingText: "翻译中...",
    channel: "google",
    targetLanguage: "zh",
    sourceLanguage: "zh-CN",
    apiKey: "",
    autoDetect: true,
    preview: false,
    autoVoice: false,
    maxCacheSize: 500,
    cacheExpireMs: 30 * 24 * 60 * 60 * 1000,
    hideButtonAfterTranslate: true,
  },

  notification: {
    enabled: true,
    sound: true,
    showPreview: true,
    quietHours: [],
  },

  security: {
    appLock: false,
    password: "",
    autoLockTime: 30,
    dataEncryption: false,
  },

  advanced: {
    developerMode: false,
    hardwareAcceleration: true,
    maxContainers: 20,
    logLevel: "info",
    autoUpdate: true,
  },
};

// 方法
const saveSettings = () => {
  emit("save", cloneDeep(settings));
};

const resetToDefault = async () => {
  try {
    await ElMessageBox.confirm(
      "确定要恢复默认设置吗？当前设置将会丢失。",
      "确认重置",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }
    );

    Object.assign(settings, cloneDeep(defaultSettings));
    ElMessage.success("设置已恢复为默认值");
  } catch {
    // 用户取消了操作
  }
};

const exportSettings = async () => {
  try {
    const data = JSON.stringify(settings, null, 2);

    if (window.electronAPI) {
      const result = await window.electronAPI.saveFile(
        data,
        `settings_${new Date().toISOString().split("T")[0]}.json`
      );

      if (result.success) {
        ElMessage.success("设置已导出");
      } else {
        ElMessage.error("导出失败");
      }
    } else {
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `settings_${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      ElMessage.success("设置已导出");
    }
  } catch (error) {
    ElMessage.error("导出失败");
  }
};

const importSettings = async () => {
  try {
    if (window.electronAPI) {
      const result = await window.electronAPI.loadFile();

      if (result.success) {
        const importedSettings = JSON.parse(result.data);
        Object.assign(settings, cloneDeep(importedSettings));
        ElMessage.success("设置已导入");
      }
    } else {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".json";
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            try {
              const importedSettings = JSON.parse(e.target.result);
              Object.assign(settings, cloneDeep(importedSettings));
              ElMessage.success("设置已导入");
            } catch (error) {
              ElMessage.error("设置文件格式错误");
            }
          };
          reader.readAsText(file);
        }
      };
      input.click();
    }
  } catch (error) {
    ElMessage.error("导入失败");
  }
};

const clearBrowserData = async () => {
  try {
    await ElMessageBox.confirm(
      "确定要清理所有浏览数据吗？这将清除所有容器的登录状态、Cookie和缓存数据。",
      "确认清理",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }
    );

    ElMessage.success("浏览数据已清理");
  } catch {
    // 用户取消了操作
  }
};

onMounted(async () => {
  if (window.electronAPI && window.electronAPI.loadSettings) {
    try {
      const diskSettings = await window.electronAPI.loadSettings();
      Object.assign(settings, cloneDeep(diskSettings));
    } catch (error) {
      console.error("Failed to load settings from disk:", error);
    }
  } else {
    const savedSettings = localStorage.getItem("app-settings");
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        Object.assign(settings, cloneDeep(parsed));
      } catch (error) {
        console.error("Failed to load settings from localStorage:", error);
      }
    }
  }
});

watch(
  () => props.showGlobalSettings,
  async (newshow) => {
    if (newshow) {
      if (window.electronAPI && window.electronAPI.loadSettings) {
        try {
          const diskSettings = await window.electronAPI.loadSettings();
          Object.assign(settings, cloneDeep(diskSettings));
        } catch (error) {
          console.error("Failed to load settings from disk:", error);
        }
      } else {
        const savedSettings = localStorage.getItem("app-settings");
        if (savedSettings) {
          try {
            const parsed = JSON.parse(savedSettings);
            Object.assign(settings, cloneDeep(parsed));
          } catch (error) {
            console.error("Failed to load settings from localStorage:", error);
          }
        }
      }
    }
  }
);
</script>

<style scoped>
.global-settings {
  max-height: 70vh;
  overflow-y: auto;
  padding: 0 10px;
}

.settings-section {
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
}

.form-item-description {
  font-size: 12px;
  color: #666;
  margin-top: 5px;
  line-height: 1.4;
}

.settings-actions {
  padding: 20px 0;
  text-align: right;
  border-top: 1px solid #eee;
  margin-top: 20px;
  position: sticky;
  bottom: 0;
  background: white;
}

.settings-actions .el-button {
  margin-left: 10px;
}

.global-settings::-webkit-scrollbar {
  width: 6px;
}

.global-settings::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.global-settings::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.global-settings::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
