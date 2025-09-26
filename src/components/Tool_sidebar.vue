<template>
  <div class="function-sidebar">
    <div class="sidebar-container" :class="{ expanded: isExpanded }">
      <!-- 左侧详细配置 -->
      <div class="sidebar-panel" v-show="isExpanded">
        <!-- 顶部标题栏 -->
        <div class="sidebar-header">
          <span class="header-title">{{
            getFunctionTitle(activeFunction)
          }}</span>
        </div>

        <!-- 功能内容区域 -->
        <div class="sidebar-content">
          <!-- 翻译配置 -->
          <div v-if="activeFunction === 'translation'" class="function-content">
            <div class="config-group">
              <div class="config-item">
                <span class="config-label">独立翻译配置</span>
                <el-switch
                  v-model="translationSettings.independentConfig"
                  size="small"
                />
              </div>
              <div class="config-item">
                <span class="config-label">接收自动翻译</span>
                <el-switch
                  v-model="translationSettings.autoTranslateReceive"
                  size="small"
                />
              </div>
              <div class="config-item">
                <span class="config-label">发送自动翻译</span>
                <el-switch
                  v-model="translationSettings.autoTranslateSend"
                  size="small"
                />
              </div>
            </div>
            <div class="config-group">
              <div class="config-title">按钮个性化</div>
              <div class="config-item">
                <el-input
                  v-model="translationSettings.buttonText"
                  size="small"
                  placeholder="翻译按钮文本"
                  style="width: 100%"
                />
              </div>
              <div class="config-item"></div>
              <el-input
                v-model="translationSettings.loadingText"
                size="small"
                placeholder="翻译加载文本"
                style="width: 100%"
              />
            </div>

            <div class="config-group">
              <div class="config-title">翻译通道</div>
              <el-select
                v-model="translationSettings.channel"
                size="small"
                style="width: 100%"
              >
                <el-option label="谷歌" value="google" />
                <el-option label="百度" value="baidu" />
                <el-option label="腾讯" value="tencent" />
              </el-select>
            </div>

            <div class="config-group">
              <div class="config-title">目标语言</div>
              <el-select
                v-model="translationSettings.targetLanguage"
                size="small"
                style="width: 100%"
              >
                <el-option label="英语" value="en" />
                <el-option label="中文" value="zh" />
                <el-option label="日语" value="ja" />
              </el-select>
            </div>

            <div class="config-group">
              <div class="config-title">自翻语种</div>
              <el-select
                v-model="translationSettings.sourceLanguage"
                size="small"
                style="width: 100%"
              >
                <el-option label="简体中文" value="zh-CN" />
                <el-option label="English" value="en" />
              </el-select>
            </div>

            <div class="config-group">
              <div
                class="config-item"
                v-if="translationSettings.autoTranslateSend"
              >
                <span class="config-label">翻译预览</span>
                <el-switch v-model="translationSettings.preview" size="small" />
              </div>
              <div class="config-item">
                <span class="config-label">接收语音自动翻译</span>
                <el-switch
                  v-model="translationSettings.autoVoice"
                  size="small"
                />
              </div>
            </div>

            <!-- 原文输入区域 -->
            <div
              v-if="!translationSettings.autoTranslateSend"
              class="config-group"
            >
              <div class="config-title">原文输入</div>
              <textarea
                v-model="translationSettings.originalText"
                :rows="3"
                class="auto-resize-textarea"
                placeholder="请输入原文..."
              ></textarea>

              <div class="action-buttons">
                <el-button size="small" @click="polishText">润色</el-button>
                <el-button
                  size="small"
                  @click="copyText(translationSettings.originalText)"
                  >复制</el-button
                >
                <el-button size="small" type="primary" @click="translateText"
                  >翻译</el-button
                >
              </div>
            </div>

            <!-- 翻译预览区域 -->
            <div
              v-if="
                !translationSettings.autoTranslateSend &&
                translationSettings.translatedText
              "
              class="config-group"
            >
              <div class="config-title">翻译预览</div>
              <textarea
                v-model="translationSettings.translatedText"
                :rows="3"
                class="auto-resize-textarea"
                placeholder="翻译结果将显示在这里..."
              >
              </textarea>

              <div class="action-buttons">
                <el-button size="small" @click="retranslateText"
                  >重新翻译</el-button
                >
                <el-button
                  size="small"
                  @click="copyText(translationSettings.translatedText)"
                  >复制</el-button
                >
                <el-button
                  size="small"
                  type="primary"
                  @click="sendTranslatedText"
                  >发送</el-button
                >
              </div>
            </div>

            <!-- 使用说明 -->
            <div class="usage-note">
              <div class="note-title">翻译预览说明：</div>
              <div class="note-item">1. 第一次点击或点击发送，只翻译不发送</div>
              <div class="note-item">2. 第二次点击或点击发送，发送翻译内容</div>
            </div>
          </div>

          <!-- 代理设置 -->
          <div v-else-if="activeFunction === 'proxy'" class="function-content">
            <div class="config-group">
              <div class="config-item">
                <span class="config-label">启用代理</span>
                <el-switch v-model="proxySettings.enabled" size="small" />
              </div>
            </div>

            <template v-if="proxySettings.enabled">
              <div class="config-group">
                <div class="config-title">代理类型</div>
                <el-select
                  v-model="proxySettings.type"
                  size="small"
                  style="width: 100%"
                >
                  <el-option label="HTTP" value="http" />
                  <el-option label="SOCKS5" value="socks5" />
                </el-select>
              </div>

              <div class="config-group">
                <div class="config-title">代理地址</div>
                <el-input
                  v-model="proxySettings.host"
                  size="small"
                  placeholder="127.0.0.1"
                />
              </div>

              <div class="config-group">
                <div class="config-title">端口</div>
                <el-input-number
                  v-model="proxySettings.port"
                  size="small"
                  style="width: 100%"
                  :min="1"
                  :max="65535"
                />
              </div>
            </template>
          </div>

          <!-- 群发设置 -->
          <div
            v-else-if="activeFunction === 'broadcast'"
            class="function-content"
          >
            <div class="config-group">
              <div class="config-item">
                <span class="config-label">启用群发</span>
                <el-switch v-model="broadcastSettings.enabled" size="small" />
              </div>
            </div>
            <div class="config-group">
              <div class="config-title">发送间隔（秒）</div>
              <el-input-number
                v-model="broadcastSettings.interval"
                size="small"
                style="width: 100%"
                :min="1"
                :max="300"
              />
            </div>
            <div class="config-group">
              <div class="config-title">群发内容</div>
              <textarea
                v-model="broadcastSettings.content"
                class="auto-resize-textarea"
                :rows="3"
                placeholder="请输入群发内容..."
              >
              </textarea>
            </div>
          </div>

          <!-- 快速回复 -->
          <div
            v-else-if="activeFunction === 'quickReply'"
            class="function-content"
          >
            <!-- 分类管理 -->
            <div>
              <div class="config-group">
                <div class="config-title">
                  <span>回复分类</span>
                  <el-button text size="small" @click="addCategory">
                    <el-icon><Plus /></el-icon>
                    添加分类
                  </el-button>
                </div>
                <div class="category-list">
                  <div
                    v-for="(category, index) in quickReplySettings.categories"
                    :key="index"
                    class="category-item"
                    :class="{ active: selectedCategory === index }"
                    @click="selectedCategory = index"
                  >
                    <span
                      class="category-name"
                      v-if="!category.editing"
                      @dblclick="editCategory(index)"
                    >
                      {{ category.name }}
                    </span>
                    <el-input
                      v-else
                      v-model="category.name"
                      size="small"
                      @blur="saveCategory(index)"
                      @keyup.enter="saveCategory(index)"
                    />
                    <el-button text size="small" @click="deleteCategory(index)">
                      <el-icon><Delete /></el-icon>
                    </el-button>
                  </div>
                </div>
              </div>

              <!-- 快捷回复列表 -->
              <div class="config-group" v-if="selectedCategory !== -1">
                <div class="config-title">
                  <span>快捷回复</span>
                  <el-button text size="small" @click="addQuickReply">
                    <el-icon><Plus /></el-icon>
                    添加回复
                  </el-button>
                </div>
                <div class="quick-reply-list">
                  <div
                    v-for="(reply, index) in currentCategoryReplies"
                    :key="index"
                    class="quick-reply-item"
                  >
                    <div class="reply-content">
                      <textarea
                        v-model="reply.text"
                        rows="2"
                        class="auto-resize-textarea"
                        placeholder="请输入快捷回复内容..."
                      >
请输入快捷回复内容...</textarea
                      >
                    </div>
                    <div class="reply-actions">
                      <el-button
                        size="small"
                        type="primary"
                        @click="sendQuickReply(reply, false)"
                      >
                        直接发送
                      </el-button>
                      <el-button
                        size="small"
                        @click="sendQuickReply(reply, true)"
                      >
                        翻译发送
                      </el-button>
                      <el-button
                        text
                        size="small"
                        @click="deleteQuickReply(index)"
                      >
                        <el-icon><Delete /></el-icon>
                      </el-button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 个人画像设置 -->
          <div
            v-else-if="activeFunction === 'profile'"
            class="function-content"
          >
            <el-form
              :model="profileSettings"
              :rules="profileRules"
              ref="profileForm"
              label-position="left"
              label-width="80px"
              @submit.prevent
            >
              <!-- 基础信息 -->
              <div class="config-group">
                <div class="config-title">基础信息</div>
                <el-form-item label="姓名" prop="basic_info.name">
                  <el-input
                    v-model="profileSettings.basic_info.name"
                    size="small"
                    style="width: 120px"
                  />
                </el-form-item>
                <el-form-item label="性别" prop="basic_info.gender">
                  <el-select
                    v-model="profileSettings.basic_info.gender"
                    size="small"
                    style="width: 120px"
                  >
                    <el-option label="男" value="male" />
                    <el-option label="女" value="female" />
                    <el-option label="未设置" value="" />
                  </el-select>
                </el-form-item>
                <el-form-item label="生日" prop="basic_info.birthday">
                  <el-date-picker
                    v-model="profileSettings.basic_info.birthday"
                    type="date"
                    size="small"
                    style="width: 120px"
                    value-format="YYYY-MM-DD"
                  />
                </el-form-item>
                <el-form-item label="年龄" prop="basic_info.age">
                  <el-input-number
                    v-model="profileSettings.basic_info.age"
                    size="small"
                    style="width: 120px"
                    :min="0"
                    :max="150"
                  />
                </el-form-item>
                <el-form-item label="城市" prop="basic_info.city">
                  <el-input
                    v-model="profileSettings.basic_info.city"
                    size="small"
                    style="width: 120px"
                  />
                </el-form-item>
                <el-form-item label="语言" prop="basic_info.language">
                  <el-select
                    v-model="profileSettings.basic_info.language"
                    size="small"
                    style="width: 120px"
                  >
                    <el-option label="中文" value="zh" />
                    <el-option label="English" value="en" />
                    <el-option label="日本語" value="ja" />
                  </el-select>
                </el-form-item>
                <el-form-item label="邮箱" prop="basic_info.email">
                  <el-input
                    v-model="profileSettings.basic_info.email"
                    size="small"
                    placeholder="example@email.com"
                  />
                </el-form-item>
                <el-form-item label="联系方式" prop="basic_info.contact_info">
                  <el-input
                    v-model="profileSettings.basic_info.contact_info"
                    size="small"
                    placeholder="手机/微信等"
                  />
                </el-form-item>
              </div>

              <!-- 兴趣爱好 -->
              <div class="config-group">
                <div class="config-title">
                  <span>兴趣爱好</span>
                  <el-button text size="small" @click="addInterest">
                    <el-icon><Plus /></el-icon>
                    添加
                  </el-button>
                </div>
                <el-form-item>
                  <div class="tag-list">
                    <el-tag
                      v-for="(interest, index) in profileSettings.interests"
                      :key="index"
                      closable
                      @close="removeInterest(index)"
                      style="margin-right: 8px; margin-bottom: 4px"
                    >
                      {{ interest }}
                    </el-tag>
                  </div>
                  <el-input
                    v-if="showInterestInput"
                    ref="interestInput"
                    v-model="newInterest"
                    size="small"
                    style="width: 100px; margin-top: 4px"
                    @blur="confirmInterest"
                    @keyup.enter="confirmInterest"
                  />
                </el-form-item>
              </div>

              <!-- 行为特征 -->
              <div class="config-group">
                <div class="config-title">行为特征</div>
                <el-form-item label="对话风格" prop="behavior.dialogue_style">
                  <el-select
                    v-model="profileSettings.behavior.dialogue_style"
                    size="small"
                    style="width: 140px"
                  >
                    <el-option label="正式" value="formal" />
                    <el-option label="随和" value="casual" />
                    <el-option label="幽默" value="humorous" />
                    <el-option label="简洁" value="concise" />
                  </el-select>
                </el-form-item>
                <el-form-item label="常用词汇" prop="behavior.frequent_words">
                  <el-input
                    v-model="frequentWordsInput"
                    size="small"
                    placeholder="用逗号分隔"
                    @blur="updateFrequentWords"
                  />
                </el-form-item>
                <el-form-item label="活跃时间" prop="behavior.active_hours">
                  <el-select
                    v-model="profileSettings.behavior.active_hours"
                    multiple
                    size="small"
                    style="width: 140px"
                  >
                    <el-option label="早晨" value="morning" />
                    <el-option label="上午" value="forenoon" />
                    <el-option label="下午" value="afternoon" />
                    <el-option label="晚上" value="evening" />
                    <el-option label="深夜" value="night" />
                  </el-select>
                </el-form-item>
              </div>

              <!-- 需求和痛点 -->
              <div class="config-group">
                <div class="config-title">
                  <span>需求和痛点</span>
                  <el-button text size="small" @click="addNeedsPainpoint">
                    <el-icon><Plus /></el-icon>
                    添加
                  </el-button>
                </div>
                <el-form-item
                  v-for="(item, index) in profileSettings.needs_and_painpoints"
                  :key="index"
                  :prop="'needs_and_painpoints.' + index"
                  :rules="needsRules"
                >
                  <div class="need-item">
                    <el-input
                      v-model="profileSettings.needs_and_painpoints[index]"
                      size="small"
                    />
                    <el-button
                      text
                      size="small"
                      @click="removeNeedsPainpoint(index)"
                    >
                      <el-icon><Delete /></el-icon>
                    </el-button>
                  </div>
                </el-form-item>
              </div>

              <!-- 动态标签 -->
              <div class="config-group">
                <div class="config-title">
                  <span>动态标签</span>
                  <el-button text size="small" @click="showTagDialog = true">
                    <el-icon><Plus /></el-icon>
                    添加标签
                  </el-button>
                </div>
                <el-form-item>
                  <div class="tag-list">
                    <el-tag
                      v-for="(tag, index) in profileSettings.dynamic_tags"
                      :key="index"
                      :type="getTagType(tag.category)"
                      closable
                      @close="removeTag(index)"
                      style="margin-right: 8px; margin-bottom: 4px"
                    >
                      {{ tag.tag }} ({{ (tag.confidence * 100).toFixed(0) }}%)
                    </el-tag>
                  </div>
                </el-form-item>
              </div>
            </el-form>
          </div>

          <!-- 数据统计 -->
          <div
            v-else-if="activeFunction === 'analytics'"
            class="function-content"
          >
            <div class="config-group">
              <div class="stat-item">
                <span class="stat-label">今日消息数</span>
                <span class="stat-value">1,234</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">翻译次数</span>
                <span class="stat-value">856</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">在线时长</span>
                <span class="stat-value">8.5小时</span>
              </div>
            </div>
          </div>

          <!-- 系统设置 -->
          <div
            v-else-if="activeFunction === 'settings'"
            class="function-content"
          >
            <div class="config-group">
              <div class="config-item">
                <span class="config-label">开机自启</span>
                <el-switch v-model="systemSettings.autoStart" size="small" />
              </div>
              <div class="config-item">
                <span class="config-label">最小化到托盘</span>
                <el-switch
                  v-model="systemSettings.minimizeToTray"
                  size="small"
                />
              </div>
              <div class="config-item">
                <span class="config-label">消息通知</span>
                <el-switch v-model="systemSettings.notification" size="small" />
              </div>
            </div>

            <div class="config-group">
              <div class="config-title">主题设置</div>
              <el-select
                v-model="systemSettings.theme"
                size="small"
                style="width: 100%"
              >
                <el-option label="跟随系统" value="auto" />
                <el-option label="浅色模式" value="light" />
                <el-option label="深色模式" value="dark" />
              </el-select>
            </div>
          </div>
        </div>

        <!-- 底部应用按钮 -->
        <div class="sidebar-footer">
          <el-button
            type="primary"
            size="small"
            style="width: 100%"
            @click="applySettings"
          >
            应用
          </el-button>
        </div>
      </div>

      <!-- 右侧工具栏 - 始终显示 -->
      <div class="sidebar-toolbar">
        <div class="toolbar-icons">
          <!-- 翻译功能图标 -->
          <div
            class="function-icon"
            :class="{ active: activeFunction === 'translation' }"
            @click="setActiveFunction('translation')"
          >
            <el-icon :size="20">
              <ChatDotRound />
            </el-icon>
            <el-text class="icon-text">翻译设置</el-text>
          </div>

          <!-- 代理功能图标 -->
          <div
            class="function-icon"
            :class="{ active: activeFunction === 'proxy' }"
            @click="setActiveFunction('proxy')"
          >
            <el-icon :size="20">
              <Connection />
            </el-icon>
            <el-text class="icon-text">代理设置</el-text>
          </div>

          <!-- 群发功能图标 -->
          <div
            class="function-icon"
            :class="{ active: activeFunction === 'broadcast' }"
            @click="setActiveFunction('broadcast')"
          >
            <el-icon :size="20">
              <Promotion />
            </el-icon>
            <el-text class="icon-text">群发设置</el-text>
          </div>

          <!-- 快速回复图标 -->
          <div
            class="function-icon"
            :class="{ active: activeFunction === 'quickReply' }"
            @click="setActiveFunction('quickReply')"
          >
            <el-icon :size="20">
              <ChatLineRound />
            </el-icon>
            <el-text class="icon-text">快速回复</el-text>
          </div>

          <!-- 个人画像图标 -->
          <div
            class="function-icon"
            :class="{ active: activeFunction === 'profile' }"
            @click="setActiveFunction('profile')"
          >
            <el-icon :size="20">
              <User />
            </el-icon>
            <el-text class="icon-text">个人画像</el-text>
          </div>

          <!-- 数据统计图标 -->
          <div
            class="function-icon"
            :class="{ active: activeFunction === 'analytics' }"
            @click="setActiveFunction('analytics')"
          >
            <el-icon :size="20">
              <DataAnalysis />
            </el-icon>
            <el-text class="icon-text">数据统计</el-text>
          </div>

          <!-- 设置功能图标 -->
          <div
            class="function-icon"
            :class="{ active: activeFunction === 'settings' }"
            @click="setActiveFunction('settings')"
          >
            <el-icon :size="20">
              <Setting />
            </el-icon>
            <el-text class="icon-text">系统设置</el-text>
          </div>
        </div>

        <!-- 展开/收起按钮 -->
        <div class="toggle-trigger" @click="toggleSidebar">
          <el-icon :size="14">
            <DArrowLeft v-if="!isExpanded" />
            <DArrowRight v-else />
          </el-icon>
        </div>
      </div>
    </div>

    <!-- 标签添加对话框 -->
    <el-dialog v-model="showTagDialog" title="添加动态标签" width="400px">
      <el-form :model="newTag" label-width="80px">
        <el-form-item label="标签内容">
          <el-input v-model="newTag.tag" placeholder="请输入标签内容" />
        </el-form-item>
        <el-form-item label="标签分类">
          <el-select v-model="newTag.category" style="width: 100%">
            <el-option label="情感" value="emotion" />
            <el-option label="兴趣" value="interest" />
            <el-option label="行为" value="behavior" />
            <el-option label="个性" value="personality" />
            <el-option label="需求" value="need" />
            <el-option label="技能" value="skill" />
          </el-select>
        </el-form-item>
        <el-form-item label="置信度">
          <el-slider
            v-model="newTagConfidence"
            :min="0"
            :max="100"
            show-input
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showTagDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmTag">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, nextTick, onMounted, watch } from "vue";
import { ElMessage } from "element-plus";
import {
  ChatDotRound,
  Connection,
  Promotion,
  DataAnalysis,
  Setting,
  DArrowLeft,
  DArrowRight,
  ChatLineRound,
  User,
  Plus,
  Delete,
} from "@element-plus/icons-vue";

// 响应式数据
const isExpanded = ref(false);
const activeFunction = ref("translation");
const oldactiveFunction = ref("translation");

const props = defineProps({
  visible: { type: Boolean, default: true },
  defaultSettings: { type: Object, default: () => ({}) }, // 接收 pluginConfig
});

const emit = defineEmits(["save","sendtext", "close"]);
// 各功能设置
const translationSettings = reactive({
  independentConfig: true,
  buttonText: "🌐点击翻译",
  loadingText: "翻译中...",
  autoTranslateReceive: true,
  autoTranslateSend: true,
  channel: "google",
  targetLanguage: "en",
  sourceLanguage: "zh-CN",
  preview: false,
  autoVoice: false,
  originalText: "",
  translatedText: "",
});

const proxySettings = reactive({
  enabled: false,
  type: "http",
  host: "127.0.0.1",
  port: 8080,
});

const broadcastSettings = reactive({
  enabled: false,
  interval: 5,
  content: "",
});

const systemSettings = reactive({
  autoStart: false,
  minimizeToTray: true,
  notification: true,
  theme: "auto",
});

// 快速回复设置
const quickReplySettings = reactive({
  categories: [
    {
      name: "常用问候",
      editing: false,
      replies: [
        { text: "你好！很高兴认识你！" },
        { text: "早上好！祝你有美好的一天！" },
      ],
    },
    {
      name: "工作相关",
      editing: false,
      replies: [
        { text: "好的，我马上处理这个事情" },
        { text: "我需要一些时间来完成这个任务" },
      ],
    },
  ],
});

const selectedCategory = ref(0);

// 个人画像设置 - 完整参数
const profileSettings = reactive({
  basic_info: {
    name: "",
    gender: "",
    birthday: "",
    contact_info: "",
    email: "",
    age: null,
    city: "",
    language: "zh",
  },
  interests: ["编程", "阅读", "音乐"],
  behavior: {
    dialogue_style: "casual",
    frequent_words: [],
    active_hours: ["morning", "evening"],
  },
  needs_and_painpoints: ["提高工作效率", "学习新技术"],
  dynamic_tags: [
    { tag: "技术爱好者", category: "interest", confidence: 0.9 },
    { tag: "友善", category: "personality", confidence: 0.8 },
  ],
});

// 表单验证规则
const profileRules = reactive({
  "basic_info.name": [
    { required: true, message: "请输入姓名", trigger: "blur" },
  ],
  "basic_info.email": [
    {
      type: "email",
      message: "请输入有效的邮箱地址",
      trigger: ["blur", "change"],
    },
  ],
  "basic_info.age": [
    { type: "number", message: "年龄必须为数字", trigger: ["blur", "change"] },
  ],
  "behavior.dialogue_style": [
    { required: true, message: "请选择对话风格", trigger: "change" },
  ],
  "behavior.active_hours": [
    {
      type: "array",
      required: true,
      message: "请至少选择一个活跃时间",
      trigger: "change",
    },
  ],
});

const needsRules = [
  { required: true, message: "请输入需求或痛点", trigger: "blur" },
];

// 辅助变量
const frequentWordsInput = ref("");
const showTagDialog = ref(false);
const newTag = reactive({
  tag: "",
  category: "interest",
});
const newTagConfidence = ref(80);
const showInterestInput = ref(false);
const newInterest = ref("");
const interestInput = ref(null);
const profileForm = ref(null);

// 计算属性
const currentCategoryReplies = computed(() => {
  if (
    selectedCategory.value === -1 ||
    !quickReplySettings.categories[selectedCategory.value]
  ) {
    return [];
  }
  return quickReplySettings.categories[selectedCategory.value].replies;
});

// 方法
const toggleSidebar = () => {
  isExpanded.value = !isExpanded.value;
};

const setActiveFunction = (func) => {
  oldactiveFunction.value = activeFunction.value;
  activeFunction.value = func;
  if (!isExpanded.value) {
    isExpanded.value = true;
  } else if (oldactiveFunction.value === func) {
    isExpanded.value = false;
  }
};

const getFunctionTitle = (func) => {
  const titleMap = {
    translation: "翻译配置",
    proxy: "代理设置",
    broadcast: "群发设置",
    quickReply: "快速回复",
    profile: "个人画像",
    analytics: "数据统计",
    settings: "系统设置",
  };
  return titleMap[func] || "功能设置";
};

// 翻译相关方法
const polishText = () => {
  if (!translationSettings.originalText) {
    ElMessage.warning("请输入原文");
    return;
  }
  ElMessage.success("文本已润色（模拟）");
  translationSettings.originalText = `润色后的文本: ${translationSettings.originalText}`;
};

const copyText = (text) => {
  if (!text) {
    ElMessage.warning("没有可复制的内容");
    return;
  }
  navigator.clipboard.writeText(text).then(() => {
    ElMessage.success("已复制到剪贴板");
  });
};

const translateText = async () => {
  if (!translationSettings.originalText) {
    ElMessage.warning("请输入原文");
    return;
  }
  if (window.electronAPI?.translateText) {
    const translated = await window.electronAPI.translateText(
      translationSettings.originalText,
      translationSettings.channel,
      translationSettings.targetLanguage
    );
    console.log(translated);
    translationSettings.translatedText = translated.translatedText;
    ElMessage.success("翻译完成");
  } else {
    ElMessage.warning("翻译服务出现异常");
  }
};

const retranslateText = () => {
  translateText();
};

const sendTranslatedText = () => {
  if (!translationSettings.translatedText) {
    ElMessage.warning("没有翻译内容可发送");
    return;
  }
  emit("sendtext", translationSettings.translatedText);
  ElMessage.success(`发送翻译内容: ${translationSettings.translatedText}`);
  
};

// 快速回复相关方法
const addCategory = () => {
  quickReplySettings.categories.push({
    name: "新分类",
    editing: true,
    replies: [],
  });
  selectedCategory.value = quickReplySettings.categories.length - 1;
};

const editCategory = (index) => {
  quickReplySettings.categories[index].editing = true;
};

const saveCategory = (index) => {
  quickReplySettings.categories[index].editing = false;
};

const deleteCategory = (index) => {
  quickReplySettings.categories.splice(index, 1);
  if (selectedCategory.value >= quickReplySettings.categories.length) {
    selectedCategory.value = Math.max(
      0,
      quickReplySettings.categories.length - 1
    );
  }
};

const addQuickReply = () => {
  if (
    selectedCategory.value !== -1 &&
    quickReplySettings.categories[selectedCategory.value]
  ) {
    quickReplySettings.categories[selectedCategory.value].replies.push({
      text: "",
    });
  }
};

const deleteQuickReply = (index) => {
  if (
    selectedCategory.value !== -1 &&
    quickReplySettings.categories[selectedCategory.value]
  ) {
    quickReplySettings.categories[selectedCategory.value].replies.splice(
      index,
      1
    );
  }
};

const sendQuickReply = (reply, translate) => {
  if (translate) {
    if(window.electronAPI?.translateText){
      window.electronAPI.translateText(
        reply.text,
        translationSettings.channel,
        translationSettings.targetLanguage
      ).then((translated) => {
        emit("sendtext", translated.translatedText);
        ElMessage.success(`翻译发送: ${translated.translatedText}`);
      });
    }
  } else {
    emit("sendtext", reply.text);
    ElMessage.success(`直接发送: ${reply.text}`);
  }
};

// 个人画像相关方法
const addInterest = () => {
  showInterestInput.value = true;
  nextTick(() => {
    interestInput.value?.focus();
  });
};

const confirmInterest = () => {
  if (
    newInterest.value &&
    !profileSettings.interests.includes(newInterest.value)
  ) {
    profileSettings.interests.push(newInterest.value);
  }
  showInterestInput.value = false;
  newInterest.value = "";
};

const removeInterest = (index) => {
  profileSettings.interests.splice(index, 1);
};

const updateFrequentWords = () => {
  if (frequentWordsInput.value) {
    profileSettings.behavior.frequent_words = frequentWordsInput.value
      .split(",")
      .map((word) => word.trim())
      .filter((word) => word);
  }
};

const addNeedsPainpoint = () => {
  profileSettings.needs_and_painpoints.push("");
};

const removeNeedsPainpoint = (index) => {
  profileSettings.needs_and_painpoints.splice(index, 1);
};

const confirmTag = () => {
  if (newTag.tag && newTag.category) {
    profileSettings.dynamic_tags.push({
      tag: newTag.tag,
      category: newTag.category,
      confidence: newTagConfidence.value / 100,
    });
    newTag.tag = "";
    newTag.category = "interest";
    newTagConfidence.value = 80;
    showTagDialog.value = false;
  }
};

const removeTag = (index) => {
  profileSettings.dynamic_tags.splice(index, 1);
};

const getTagType = (category) => {
  const typeMap = {
    emotion: "warning",
    interest: "success",
    behavior: "info",
    personality: "primary",
    need: "danger",
    skill: "",
  };
  return typeMap[category] || "";
};

const applySettings = () => {
  const currentFunc = activeFunction.value;
  let valid = true;
  let currentSettings = {};

  // 根据当前激活功能获取对应设置并处理
  switch (currentFunc) {
    case "translation":
      currentSettings = { ...translationSettings };

      break;
    case "proxy":
      currentSettings = { ...proxySettings };

      break;
    case "broadcast":
      currentSettings = { ...broadcastSettings };

      break;
    case "quickReply":
      currentSettings = { ...quickReplySettings };

      break;
    case "profile":
      currentSettings = { ...profileSettings };
      // 更新频繁词汇
      updateFrequentWords();
      profileForm.value?.validate((isValid) => {
        valid = isValid;
        if (valid) {
        } else {
          ElMessage.error("请检查表单输入");
        }
      });
      return; // 由于异步验证，直接返回，不执行后续
    case "analytics":
      // 数据统计是只读的，无需应用
      ElMessage.info("数据统计无需应用设置");
      return;
    case "settings":
      currentSettings = { ...systemSettings };

      break;
    default:
      ElMessage.warning("未知功能设置");
      return;
  }
  if (valid) {
    emit("save", {
      activeFunction: currentFunc,
      [currentFunc]: currentSettings,
    });
  }
};
onMounted(() => {
  // 合并默认设置到各 reactive 对象
  if (props.defaultSettings.translation) {
    Object.assign(translationSettings, props.defaultSettings.translation);
  }
  if (props.defaultSettings.proxy) {
    Object.assign(proxySettings, props.defaultSettings.proxy);
  }
  if (props.defaultSettings.broadcast) {
    Object.assign(broadcastSettings, props.defaultSettings.broadcast);
  }
  if (props.defaultSettings.quickReply) {
    Object.assign(quickReplySettings, props.defaultSettings.quickReply);
  }
  if (props.defaultSettings.profile) {
    Object.assign(profileSettings, props.defaultSettings.profile);
  }
  if (props.defaultSettings.settings) {
    Object.assign(systemSettings, props.defaultSettings.settings);
  }

  // 监听 visible 变化，emit close 如果隐藏
  watch(
    () => props.visible,
    (val) => {
      if (!val) emit("close");
    }
  );
});
</script>

<style scoped>
.function-sidebar {
  height: 100%;
  overflow: hidden;
}

.sidebar-container {
  display: flex;
  height: 100%;
  justify-content: flex-end;
  overflow: hidden;
}

.sidebar-container:not(.expanded) {
  width: 60px;
}

.sidebar-container.expanded {
  width: 320px;
}

/* 左侧工具栏 - 始终显示 */
.sidebar-toolbar {
  width: 60px;
  background: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-right: none;
  border-radius: 8px 0 0 8px;
  display: flex;
  flex-direction: column;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

.toolbar-icons {
  padding: 12px 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.function-icon {
  display: flex;
  align-items: center;
  flex-direction: column;
  justify-content: center;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s;
  color: #666;
  padding: 3px;
  margin: 0 6px;
}

.icon-text {
  font-size: 10px;
  margin-top: 4px;
}
.active > .icon-text {
  color: white;
}
.function-icon:hover {
  background: #e8f4fd;
  color: #409eff;
}

.function-icon.active {
  background: #409eff;
  color: white;
}

.toggle-trigger {
  width: 36px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #666;
  margin: 8px auto;
  transition: all 0.2s;
  border-radius: 4px;
}

.toggle-trigger:hover {
  background: #f0f0f0;
}

/* 右侧功能面板 */
.sidebar-panel {
  width: 260px;
  background: white;
  border: 1px solid #e0e0e0;
  border-left: none;
  border-radius: 0 8px 8px 0;
  box-shadow: inset 0 0 8px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.sidebar-header {
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  background: #fafafa;
  font-size: 14px;
  font-weight: 500;
}

.header-title {
  color: #333;
}

.sidebar-content {
  flex: 1;
  padding: 12px;
  overflow-y: auto;
  height: auto;
  min-height: 0;
}

.function-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 0;
}

.config-title {
  font-size: 13px;
  color: #666;
  margin-bottom: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.config-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
}

.config-label {
  font-size: 13px;
  color: #333;
}

.action-buttons {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  justify-content: flex-end;
}

.auto-resize-textarea {
  min-height: 60px;
  width: 100%;
  font-size: 13px;
  color: #333;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 6px;
  margin-bottom: 6px;
}

.stat-label {
  font-size: 13px;
  color: #666;
}

.stat-value {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.usage-note {
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 6px;
  padding: 10px;
  margin-top: 6px;
}

.note-title {
  font-size: 13px;
  font-weight: 500;
  color: #0369a1;
  margin-bottom: 6px;
}

.note-item {
  font-size: 12px;
  color: #0369a1;
  margin-bottom: 4px;
  line-height: 1.4;
}

/* 快速回复样式 */
.category-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.category-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.category-item:hover {
  background: #e9ecef;
}

.category-item.active {
  background: #e8f4fd;
  border: 1px solid #409eff;
}

.category-name {
  font-size: 13px;
  color: #333;
}

.quick-reply-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 100%;
  overflow-y: auto;
}

.quick-reply-item {
  padding: 10px;
  background: #fefefe;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}

.reply-content {
  margin-bottom: 6px;
}

.reply-actions {
  display: flex;
  gap: 6px;
  align-items: center;
}

/* 个人画像样式 */
.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 6px;
}

.needs-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.need-item {
  display: flex;
  align-items: center;
}

.sidebar-footer {
  padding: 10px 12px;
  border-top: 1px solid #f0f0f0;
  background: #fafafa;
}

/* 滚动条样式 */
.sidebar-content::-webkit-scrollbar {
  width: 4px;
}

.sidebar-content::-webkit-scrollbar-track {
  background: #f5f5f5;
}

.sidebar-content::-webkit-scrollbar-thumb {
  background: #d0d0d0;
  border-radius: 2px;
}

.sidebar-content::-webkit-scrollbar-thumb:hover {
  background: #b0b0b0;
}

/* Element Plus 组件样式调整 */
:deep(.el-form-item) {
  margin-bottom: 8px;
}

:deep(.el-form-item__label) {
  font-size: 13px;
  color: #333;
}

:deep(.el-switch) {
  --el-switch-on-color: #409eff;
}

:deep(.el-button--text) {
  color: #666;
  padding: 4px 8px;
}

:deep(.el-button--text:hover) {
  color: #409eff;
  background: transparent;
}

:deep(.el-select .el-input__wrapper) {
  border-radius: 4px;
}

:deep(.el-input__wrapper) {
  border-radius: 4px;
}

:deep(.el-textarea__inner) {
  border-radius: 4px;
  resize: vertical;
  min-height: 60px;
  max-height: 200px;
}
</style>
