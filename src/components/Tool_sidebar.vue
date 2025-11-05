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
          <!-- 翻译配置完整模板部分 -->
          <div v-if="activeFunction === 'translation'" class="function-content">
            <!-- 基础功能开关 -->
            <div class="config-group">
              <div class="config-item">
                <span class="config-label">独立翻译配置</span>
                <el-switch
                  v-model="translationSettings.independentConfig"
                  size="small"
                />
              </div>

              <!-- 提示信息 -->
              <el-alert
                v-if="!translationSettings.independentConfig"
                type="info"
                :closable="false"
                style="margin-top: 8px"
              >
                <template #title>
                  <span style="font-size: 12px"
                    >当前使用全局配置，参数不可编辑</span
                  >
                </template>
              </el-alert>

              <div class="config-item">
                <span class="config-label">接收自动翻译</span>
                <el-switch
                  :model-value="displayTranslationSettings.autoTranslateReceive"
                  @update:model-value="
                    updateTranslationSetting('autoTranslateReceive', $event)
                  "
                  :disabled="!translationSettings.independentConfig"
                  size="small"
                />
              </div>
              <div class="config-item">
                <span class="config-label">发送自动翻译</span>
                <el-switch
                  :model-value="displayTranslationSettings.autoTranslateSend"
                  @update:model-value="
                    updateTranslationSetting('autoTranslateSend', $event)
                  "
                  :disabled="!translationSettings.independentConfig"
                  size="small"
                />
              </div>
            </div>

            <!-- 按钮个性化 -->
            <div class="config-group">
              <div class="config-title">按钮个性化</div>
              <div class="config-item">
                <el-input
                  :model-value="displayTranslationSettings.buttonText"
                  @update:model-value="
                    updateTranslationSetting('buttonText', $event)
                  "
                  :disabled="!translationSettings.independentConfig"
                  size="small"
                  placeholder="翻译按钮文本"
                  style="width: 100%"
                />
              </div>
              <div class="config-item">
                <el-input
                  :model-value="displayTranslationSettings.loadingText"
                  @update:model-value="
                    updateTranslationSetting('loadingText', $event)
                  "
                  :disabled="!translationSettings.independentConfig"
                  size="small"
                  placeholder="翻译加载文本"
                  style="width: 100%"
                />
              </div>
            </div>

            <!-- 翻译通道 -->
            <div class="config-group">
              <div class="config-title">翻译通道</div>
              <el-select
                :model-value="displayTranslationSettings.channel"
                @update:model-value="
                  updateTranslationSetting('channel', $event)
                "
                :disabled="!translationSettings.independentConfig"
                size="small"
                style="width: 100%"
              >
                <el-option label="谷歌" value="google" />
                <el-option label="百度" value="baidu" />
                <el-option label="腾讯" value="tencent" />
              </el-select>
            </div>

            <!-- 目标语言 -->
            <div class="config-group">
              <div class="config-title">目标语言</div>
              <el-select
                :model-value="displayTranslationSettings.targetLanguage"
                @update:model-value="
                  updateTranslationSetting('targetLanguage', $event)
                "
                :disabled="!translationSettings.independentConfig"
                size="small"
                style="width: 100%"
              >
                <el-option label="英语" value="en" />
                <el-option label="中文" value="zh" />
                <el-option label="日语" value="ja" />
                <el-option label="韩语" value="ko" />
                <el-option label="法语" value="fr" />
                <el-option label="西班牙语" value="es" />
              </el-select>
            </div>

            <!-- 源语种 -->
            <div class="config-group">
              <div class="config-title">源语种</div>
              <el-select
                :model-value="displayTranslationSettings.sourceLanguage"
                @update:model-value="
                  updateTranslationSetting('sourceLanguage', $event)
                "
                :disabled="!translationSettings.independentConfig"
                size="small"
                style="width: 100%"
              >
                <el-option label="简体中文" value="zh-CN" />
                <el-option label="English" value="en" />
              </el-select>
            </div>

            <!-- 缓存管理 -->
            <div class="config-group">
              <div class="config-title">缓存管理</div>
              <div class="config-item">
                <span class="config-label">最大缓存条数</span>
                <el-input-number
                  :model-value="displayTranslationSettings.maxCacheSize"
                  @update:model-value="
                    updateTranslationSetting('maxCacheSize', $event)
                  "
                  :disabled="!translationSettings.independentConfig"
                  :min="100"
                  :max="5000"
                  size="small"
                  style="width: 100%"
                />
              </div>
              <div class="config-item">
                <span class="config-label">缓存有效期</span>
                <el-select
                  :model-value="displayTranslationSettings.cacheExpireMs"
                  @update:model-value="
                    updateTranslationSetting('cacheExpireMs', $event)
                  "
                  :disabled="!translationSettings.independentConfig"
                  size="small"
                  style="width: 100%"
                >
                  <el-option label="7天" :value="7 * 24 * 60 * 60 * 1000" />
                  <el-option label="30天" :value="30 * 24 * 60 * 60 * 1000" />
                  <el-option label="90天" :value="90 * 24 * 60 * 60 * 1000" />
                  <el-option label="180天" :value="180 * 24 * 60 * 60 * 1000" />
                  <el-option label="永久" :value="0" />
                </el-select>
              </div>
              <div class="config-item">
                <span class="config-label">翻译后隐藏按钮</span>
                <el-switch
                  :model-value="
                    displayTranslationSettings.hideButtonAfterTranslate
                  "
                  @update:model-value="
                    updateTranslationSetting('hideButtonAfterTranslate', $event)
                  "
                  :disabled="!translationSettings.independentConfig"
                  size="small"
                />
              </div>
              <div class="config-item">
                <span class="config-label">清除缓存</span>
                <el-switch
                  :model-value="displayTranslationSettings.deleteCache"
                  @update:model-value="
                    updateTranslationSetting('deleteCache', $event)
                  "
                  :disabled="!translationSettings.independentConfig"
                  size="small"
                />
              </div>
            </div>

            <!-- 高级功能 -->
            <div class="config-group">
              <div
                class="config-item"
                v-if="displayTranslationSettings.autoTranslateSend"
              >
                <span class="config-label">翻译预览</span>
                <el-switch
                  :model-value="displayTranslationSettings.preview"
                  @update:model-value="
                    updateTranslationSetting('preview', $event)
                  "
                  :disabled="!translationSettings.independentConfig"
                  size="small"
                />
              </div>
              <div class="config-item">
                <span class="config-label">接收语音自动翻译</span>
                <el-switch
                  :model-value="displayTranslationSettings.autoVoice"
                  @update:model-value="
                    updateTranslationSetting('autoVoice', $event)
                  "
                  :disabled="!translationSettings.independentConfig"
                  size="small"
                />
              </div>
            </div>

            <!-- 原文输入区域 - 这部分始终可用 -->
            <div
              v-if="!displayTranslationSettings.autoTranslateSend"
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

            <!-- 翻译预览区域 - 这部分始终可用 -->
            <div
              v-if="
                !displayTranslationSettings.autoTranslateSend &&
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
              ></textarea>

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
          <!-- 知识库配置 - 新增 -->
          <div
            v-else-if="activeFunction === 'knowledge'"
            class="function-content"
          >
            <!-- 知识库选择 -->
            <div class="config-group">
              <div class="config-title">
                <span>选择知识库</span>
                <el-button text size="small" @click="refreshKnowledgeBases">
                  <el-icon><Refresh /></el-icon>
                  刷新
                </el-button>
              </div>

              <el-select
                v-model="knowledgeSettings.selectedKnowledgeBase"
                placeholder="请选择知识库"
                size="small"
                style="width: 100%"
                @change="handleKnowledgeBaseChange"
                clearable
              >
                <el-option
                  v-for="kb in knowledgeBases"
                  :key="kb.id"
                  :label="kb.name"
                  :value="kb.id"
                >
                  <div class="kb-option">
                    <span>{{ kb.name }}</span>
                    <el-tag size="small" type="info">
                      {{ kb.document_count || 0 }} 文档
                    </el-tag>
                  </div>
                </el-option>
              </el-select>

              <!-- 知识库状态提示 -->
              <el-alert
                v-if="knowledgeSettings.selectedKnowledgeBase"
                type="success"
                :closable="false"
                style="margin-top: 8px"
              >
                <template #title>
                  <span style="font-size: 12px">
                    当前会话已启用知识库增强
                  </span>
                </template>
              </el-alert>
              <el-alert
                v-else
                type="info"
                :closable="false"
                style="margin-top: 8px"
              >
                <template #title>
                  <span style="font-size: 12px">
                    未选择知识库，使用默认对话模式
                  </span>
                </template>
              </el-alert>
            </div>

            <!-- 知识库详情 -->
            <div v-if="currentKnowledgeBaseDetails" class="config-group">
              <div class="config-title">知识库详情</div>
              <div class="kb-details">
                <div class="detail-item">
                  <span class="detail-label">名称：</span>
                  <span class="detail-value">{{
                    currentKnowledgeBaseDetails.name
                  }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">文档数：</span>
                  <span class="detail-value">{{
                    currentKnowledgeBaseDetails.document_count || 0
                  }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">分块数：</span>
                  <span class="detail-value">{{
                    currentKnowledgeBaseDetails.total_chunks || 0
                  }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">嵌入模型：</span>
                  <el-tag size="small" type="info">
                    {{ currentKnowledgeBaseDetails.embedding_model || "N/A" }}
                  </el-tag>
                </div>
                <div
                  class="detail-item"
                  v-if="currentKnowledgeBaseDetails.description"
                >
                  <span class="detail-label">描述：</span>
                  <span class="detail-value">{{
                    currentKnowledgeBaseDetails.description
                  }}</span>
                </div>
              </div>
            </div>

            <!-- 检索配置 -->
            <div class="config-group">
              <div class="config-title">检索配置</div>

              <div class="config-item">
                <span class="config-label">启用检索</span>
                <el-switch
                  v-model="knowledgeSettings.enableRetrieval"
                  size="small"
                  :disabled="!knowledgeSettings.selectedKnowledgeBase"
                />
              </div>

              <div class="config-item">
                <span class="config-label">返回结果数</span>
                <el-input-number
                  v-model="knowledgeSettings.topK"
                  :min="1"
                  :max="10"
                  size="small"
                  :disabled="!knowledgeSettings.enableRetrieval"
                />
              </div>

              <div class="config-item">
                <div class="config-label">相似度阈值</div>
                <el-slider
                  v-model="knowledgeSettings.similarityThreshold"
                  :min="0"
                  :max="1"
                  :step="0.1"
                  :disabled="!knowledgeSettings.enableRetrieval"
                  show-input
                  :show-input-controls="false"
                  style="margin-top: 8px; flex: 1; margin-left: 20px"
                />
              </div>
            </div>

            <!-- 快捷搜索测试 -->
            <div class="config-group">
              <div class="config-title">快捷搜索测试</div>
              <el-input
                v-model="knowledgeSettings.searchQuery"
                placeholder="输入搜索内容测试知识库"
                size="small"
                clearable
              >
                <template #append>
                  <el-button
                    :icon="Search"
                    @click="testKnowledgeSearch"
                    :loading="searching"
                    :disabled="!knowledgeSettings.selectedKnowledgeBase"
                  />
                </template>
              </el-input>

              <!-- 搜索结果预览 -->
              <div
                v-if="searchResults.length > 0"
                class="search-results-preview"
              >
                <div class="results-header">
                  <span>找到 {{ searchResults.length }} 条结果</span>
                  <el-button text size="small" @click="clearSearchResults">
                    清除
                  </el-button>
                </div>
                <div class="results-list">
                  <div
                    v-for="(result, index) in searchResults.slice(0, 3)"
                    :key="index"
                    class="result-item"
                  >
                    <div class="result-header">
                      <el-tag size="small" type="success">
                        {{ (result.similarity_score * 100).toFixed(1) }}%
                      </el-tag>
                    </div>
                    <div class="result-content">
                      {{ result.content.substring(0, 100) }}...
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 快捷操作 -->
            <div class="config-group">
              <div class="config-title">快捷操作</div>
              <div class="quick-actions">
                <el-button
                  size="small"
                  @click="openKnowledgeManager"
                  :icon="FolderOpened"
                >
                  管理知识库
                </el-button>
              </div>
            </div>

            <!-- 使用说明 -->
            <div class="usage-note">
              <div class="note-title">💡 使用提示：</div>
              <div class="note-item">
                • 选择知识库后，对话将自动检索相关内容
              </div>
              <div class="note-item">• 可调整检索参数以获得最佳效果</div>
              <div class="note-item">• 使用快捷搜索测试知识库内容</div>
            </div>
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
          <el-tooltip
            :content="applyButtonTooltip"
            placement="top"
            :disabled="!isApplyButtonDisabled"
          >
            <el-button
              type="primary"
              size="small"
              style="width: 100%"
              @click="applySettings"
              :disabled="isApplyButtonDisabled"
            >
              应用
            </el-button>
          </el-tooltip>
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
          <!-- 知识库功能图标 - 新增 -->
          <div
            class="function-icon"
            :class="{ active: activeFunction === 'knowledge' }"
            @click="setActiveFunction('knowledge')"
          >
            <el-icon :size="20">
              <Reading />
            </el-icon>
            <el-text class="icon-text">知识库</el-text>
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
import axios from "axios";
import { useStore } from "vuex"; // ✅ 引入 Vuex
import {
  ChatDotRound,
  Promotion,
  DataAnalysis,
  Setting,
  DArrowLeft,
  DArrowRight,
  ChatLineRound,
  User,
  Plus,
  Delete,
  Reading,
  Refresh,
  Search,
  FolderOpened,
  Document,
  Upload,
} from "@element-plus/icons-vue";
// API配置
const API_BASE_URL = process.env.VUE_APP_API_BASE_URL;
const USER_ID = process.env.VUE_APP_USER_ID;
// ✅ 使用 Vuex Store
const store = useStore();

// Props 定义 - 移除 globalSettings
const props = defineProps({
  visible: { type: Boolean, default: true },
  defaultSettings: { type: Object, default: () => ({}) },
});

const emit = defineEmits(["save", "sendtext", "close"]);

// 响应式数据
const isExpanded = ref(false);
const activeFunction = ref("translation");
const oldactiveFunction = ref("translation");
const searching = ref(false);

// 知识库相关数据
const knowledgeBases = computed(
  () => store.getters["knowledge/allKnowledgeBases"]
);
const searchResults = ref([]);
const currentKnowledgeBaseDetails = ref(null);

// 知识库设置
const knowledgeSettings = reactive({
  user_id: process.env.VUE_APP_USER_ID,
  selectedKnowledgeBase: null,
  enableRetrieval: true,
  topK: 3,
  similarityThreshold: 0.3,
  searchQuery: "",
});

// 翻译设置
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
  maxCacheSize: 500,
  cacheExpireMs: 30 * 24 * 60 * 60 * 1000,
  hideButtonAfterTranslate: true,
  deleteCache: false,
});

// ✅ 从 Vuex 获取全局设置
const globalSettings = computed(
  () => store.state.settings || store.getters.getSettings
);
// ✅ 计算属性：是否应该禁用应用按钮
const isApplyButtonDisabled = computed(() => {
  if (activeFunction.value === "translation") {
    // 翻译功能：未启用独立配置时禁用应用按钮
    return !translationSettings.independentConfig;
  }
  // 其他功能始终可应用
  return false;
});

// ✅ 计算属性：应用按钮的提示文本
const applyButtonTooltip = computed(() => {
  if (
    activeFunction.value === "translation" &&
    !translationSettings.independentConfig
  ) {
    return "当前使用全局配置，如需自定义请先开启独立配置";
  }
  return "应用当前设置";
});

// ✅ 监听独立配置开关变化，自动保存状态

watch(
  () => translationSettings.independentConfig,
  async (newValue, oldValue) => {
    if (newValue !== oldValue) {
      if (newValue) {
        // ✅ 切换到独立配置：复制全局配置到本地（保持不变）
        const globalTranslation = globalSettings.value?.translation || {};
        const localFields = {
          originalText: translationSettings.originalText,
          translatedText: translationSettings.translatedText,
          deleteCache: translationSettings.deleteCache,
          independentConfig: true,
        };

        Object.keys(globalTranslation).forEach((key) => {
          if (
            translationSettings.hasOwnProperty(key) &&
            key !== "independentConfig"
          ) {
            translationSettings[key] = globalTranslation[key];
          }
        });

        Object.assign(translationSettings, localFields);
        ElMessage.success("已启用独立翻译配置，当前值已从全局配置复制");

        // ✅ 保存完整的独立配置
        emit("save", {
          activeFunction: "translation",
          translation: { ...translationSettings },
        });
      } else {
        // ✅ 修复：切换到全局配置时，保存完整配置 + 状态标识
        ElMessage.info("已切换到全局配置，参数将同步全局设置");

        // 保存完整的 translationSettings 对象 + 独立配置状态
        emit("save", {
          activeFunction: "translation",
          translation: {
            ...displayTranslationSettings.value, // ✅ 保存所有字段
            independentConfig: false, // 只修改状态标识
          },
        });
      }
    }
  }
);
// ✅ 计算属性：根据是否独立配置决定显示哪个设置
const displayTranslationSettings = computed(() => {
  if (translationSettings.independentConfig) {
    // 使用独立配置
    return translationSettings;
  } else {
    // 使用全局配置
    const globalTranslation = globalSettings.value?.settings?.translation || {};
    console.log("全局翻译参数", globalTranslation);
    console.log("全局配置参数", globalSettings.value);
    return {
      independentConfig: translationSettings.independentConfig,
      // 本地特有字段始终使用本地值
      originalText: translationSettings.originalText,
      translatedText: translationSettings.translatedText,
      deleteCache: translationSettings.deleteCache,
      // 其他字段使用全局配置
      autoTranslateReceive: globalTranslation.autoTranslateReceive ?? true,
      autoTranslateSend: globalTranslation.autoTranslateSend ?? true,
      buttonText: globalTranslation.buttonText || "🌐点击翻译",
      loadingText: globalTranslation.loadingText || "翻译中...",
      channel: globalTranslation.channel || "google",
      targetLanguage: globalTranslation.targetLanguage || "en",
      sourceLanguage: globalTranslation.sourceLanguage || "zh-CN",
      preview: globalTranslation.preview ?? false,
      autoVoice: globalTranslation.autoVoice ?? false,
      maxCacheSize: globalTranslation.maxCacheSize || 500,
      cacheExpireMs:
        globalTranslation.cacheExpireMs || 30 * 24 * 60 * 60 * 1000,
      hideButtonAfterTranslate:
        globalTranslation.hideButtonAfterTranslate ?? true,
      apiKey: globalTranslation.apiKey || "",
      autoDetect: globalTranslation.autoDetect ?? true,
    };
  }
});

// ✅ 更新翻译设置的方法
const updateTranslationSetting = (key, value) => {
  if (translationSettings.independentConfig) {
    translationSettings[key] = value;
  } else {
    ElMessage.warning("请先开启独立翻译配置");
  }
};

// 其他设置保持不变
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
    knowledge: "知识库配置",
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

  // 使用当前显示的配置进行翻译
  const config = displayTranslationSettings.value;

  if (window.electronAPI?.translateText) {
    const translated = await window.electronAPI.translateText(
      translationSettings.originalText,
      config.channel,
      config.targetLanguage
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

// 知识库相关方法
const loadKnowledgeBases = async (force = false) => {
  try {
    await store.dispatch("knowledge/loadKnowledgeBases", { force });
  } catch (error) {
    console.error("加载知识库失败:", error);
    ElMessage.error("加载知识库列表失败");
  }
};

const refreshKnowledgeBases = async () => {
  ElMessage.info("正在刷新知识库列表...");
  await loadKnowledgeBases(true); // 强制刷新
  ElMessage.success("知识库列表已刷新");
};

const handleKnowledgeBaseChange = async (kbId) => {
  if (!kbId) {
    currentKnowledgeBaseDetails.value = null;
    return;
  }

  try {
    const details = await store.dispatch(
      "knowledge/getKnowledgeBaseDetails",
      kbId
    );
    currentKnowledgeBaseDetails.value = details;
    ElMessage.success("知识库已切换");
  } catch (error) {
    console.error("获取知识库详情失败:", error);
    ElMessage.error("获取知识库详情失败");
  }
};

const testKnowledgeSearch = async () => {
  if (!knowledgeSettings.searchQuery.trim()) {
    ElMessage.warning("请输入搜索内容");
    return;
  }

  searching.value = true;
  try {
    const results = await store.dispatch("knowledge/searchKnowledgeBase", {
      kbId: knowledgeSettings.selectedKnowledgeBase,
      searchParams: {
        query: knowledgeSettings.searchQuery,
        knowledge_base_id: knowledgeSettings.selectedKnowledgeBase,
        top_k: knowledgeSettings.topK,
        similarity_threshold: knowledgeSettings.similarityThreshold,
      },
    });

    searchResults.value = results || [];
    if (searchResults.value.length === 0) {
      ElMessage.info("未找到相关结果");
    } else {
      ElMessage.success(`找到 ${searchResults.value.length} 条结果`);
    }
  } catch (error) {
    console.error("搜索失败:", error);
    ElMessage.error("搜索失败");
  } finally {
    searching.value = false;
  }
};

const clearSearchResults = () => {
  searchResults.value = [];
  knowledgeSettings.searchQuery = "";
};

// ✅ 修改：打开知识库管理器
const openKnowledgeManager = () => {
  // 使用 Vuex action 打开知识库弹窗
  store.dispatch("knowledge/openKnowledgeDialog");
  ElMessage.info("正在打开知识库管理页面");
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
  const config = displayTranslationSettings.value;

  if (translate) {
    if (window.electronAPI?.translateText) {
      window.electronAPI
        .translateText(reply.text, config.channel, config.targetLanguage)
        .then((translated) => {
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

// ✅ 修改 applySettings 方法
const applySettings = () => {
  const currentFunc = activeFunction.value;
  let valid = true;
  let currentSettings = {};

  switch (currentFunc) {
    case "translation":
      // ⚠️ 关键修复：检查是否使用全局配置
      if (!translationSettings.independentConfig) {
        ElMessage.warning(
          "当前使用全局配置，无需应用。如需自定义，请开启独立配置开关。"
        );
        return;
      }
      // 使用独立配置时，保存完整配置
      currentSettings = { ...translationSettings };
      break;
    case "knowledge":
      currentSettings = { ...knowledgeSettings };
      break;

    case "broadcast":
      currentSettings = { ...broadcastSettings };
      break;

    case "quickReply":
      currentSettings = { ...quickReplySettings };
      break;

    case "profile":
      currentSettings = { ...profileSettings };
      updateFrequentWords();
      profileForm.value?.validate((isValid) => {
        valid = isValid;
        if (!valid) {
          ElMessage.error("请检查表单输入");
        }
      });
      return;

    case "analytics":
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
    ElMessage.success("设置已保存");
  }
};

// ✅ 监听全局设置变化（Vuex 的响应式会自动触发计算属性更新）
watch(
  () => globalSettings.value,
  (newGlobalSettings) => {
    if (
      !translationSettings.independentConfig &&
      newGlobalSettings?.settings?.translation
    ) {
      console.log("全局设置已更新，显示值将自动同步");
    }
  },
  { deep: true }
);

// ✅ 修改 onMounted
onMounted(async () => {
  // 加载保存的设置
  if (props.defaultSettings.translation) {
    Object.assign(translationSettings, props.defaultSettings.translation);
  }
  if (props.defaultSettings.knowledge) {
    console.log("加载知识库默认设置:", props.defaultSettings.knowledge);
    Object.assign(knowledgeSettings, props.defaultSettings.knowledge);
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

  // ✅ 从 Vuex 加载知识库列表（默认使用缓存）
  if (knowledgeBases.value.length === 0) {
    await loadKnowledgeBases(false); // 不强制刷新，优先使用缓存
  }

  // 监听 visible 变化
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
/* ✅ 添加禁用按钮样式 */
.sidebar-footer .el-button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
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
/* 知识库选项样式 */
.kb-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

/* 知识库详情样式 */
.kb-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.detail-label {
  color: #909399;
  min-width: 70px;
}

.detail-value {
  color: #606266;
  flex: 1;
}

/* 搜索结果预览样式 */
.search-results-preview {
  margin-top: 12px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 10px;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 12px;
  color: #666;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 200px;
  overflow-y: auto;
}

.result-item {
  background: #f8f9fa;
  padding: 8px;
  border-radius: 4px;
  font-size: 12px;
}

.result-header {
  margin-bottom: 4px;
}

.result-content {
  color: #606266;
  line-height: 1.5;
}

/* 快捷操作样式 */
.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.quick-actions .el-button {
  width: 100%;
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
