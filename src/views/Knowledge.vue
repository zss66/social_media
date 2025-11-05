<template>
  <div class="knowledge-page">
    <div class="knowledge-container">
      <!-- 页面头部 -->
      <div class="page-header">
        <div class="header-left">
          <h1>知识库管理</h1>
          <p class="subtitle">管理您的知识库和文档</p>
        </div>
        <div class="header-right">
          <el-button
            :icon="Refresh"
            @click="refreshKnowledgeBases"
            :loading="loading"
            title="刷新知识库列表"
          >
            刷新
          </el-button>
          <el-button :icon="Delete" @click="clearCache" title="清除本地缓存">
            清除缓存
          </el-button>
          <el-button
            type="primary"
            :icon="Plus"
            @click="showCreateDialog = true"
          >
            创建知识库
          </el-button>
        </div>
      </div>

      <!-- 缓存状态提示 -->
      <div v-if="isCached" class="cache-info">
        <el-alert type="info" :closable="false" show-icon>
          <template #title>
            <span style="font-size: 13px">
              当前显示缓存数据,最后更新时间: {{ formatDate(lastFetchTime) }}
            </span>
          </template>
        </el-alert>
      </div>

      <!-- 统计卡片 -->
      <div class="stats-cards">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #e6f4ff">
              <el-icon :size="24" color="#1890ff"><Folder /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ totalKnowledgeBases }}</div>
              <div class="stat-label">知识库总数</div>
            </div>
          </div>
        </el-card>

        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #f0f9ff">
              <el-icon :size="24" color="#0ea5e9"><Document /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ totalDocuments }}</div>
              <div class="stat-label">文档总数</div>
            </div>
          </div>
        </el-card>

        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #f0fdf4">
              <el-icon :size="24" color="#10b981"><DataAnalysis /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ totalChunks }}</div>
              <div class="stat-label">总分块数</div>
            </div>
          </div>
        </el-card>

        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #fef3c7">
              <el-icon :size="24" color="#f59e0b"><MagicStick /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ totalEmbeddings }}</div>
              <div class="stat-label">嵌入向量数</div>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 知识库列表 -->
      <div class="knowledge-list">
        <div v-if="loading" class="loading-container">
          <el-skeleton :rows="3" animated />
        </div>

        <div v-else-if="knowledgeBases.length === 0" class="empty-container">
          <el-empty description="暂无知识库">
            <el-button type="primary" @click="showCreateDialog = true">
              创建第一个知识库
            </el-button>
          </el-empty>
        </div>

        <div v-else class="knowledge-grid">
          <el-card
            v-for="kb in knowledgeBases"
            :key="kb.id"
            shadow="hover"
            class="knowledge-card"
          >
            <template #header>
              <div class="card-header">
                <div class="card-title">
                  <el-icon color="#409EFF"><Folder /></el-icon>
                  <span>{{ kb.name }}</span>
                </div>
                <el-dropdown
                  trigger="click"
                  @command="(cmd) => handleCommand(cmd, kb)"
                >
                  <el-icon class="more-icon"><MoreFilled /></el-icon>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="detail">
                        <el-icon><InfoFilled /></el-icon>查看详情
                      </el-dropdown-item>
                      <el-dropdown-item command="view">
                        <el-icon><View /></el-icon>查看文档
                      </el-dropdown-item>
                      <el-dropdown-item command="edit">
                        <el-icon><Edit /></el-icon>编辑
                      </el-dropdown-item>
                      <el-dropdown-item command="test">
                        <el-icon><Search /></el-icon>测试搜索
                      </el-dropdown-item>
                      <el-dropdown-item command="delete" divided>
                        <el-icon><Delete /></el-icon>删除
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </template>

            <div class="card-content">
              <div class="kb-stats">
                <div class="stat-item">
                  <el-icon><Document /></el-icon>
                  <span>{{ kb.document_count }} 文档</span>
                </div>
                <div class="stat-item">
                  <el-icon><Grid /></el-icon>
                  <span>{{ kb.total_chunks }} 分块</span>
                </div>
                <div class="stat-item">
                  <el-icon><Coin /></el-icon>
                  <span>{{ formatSize(kb.total_size) }}</span>
                </div>
              </div>

              <div class="kb-info">
                <div class="info-row">
                  <span class="label">嵌入厂商:</span>
                  <el-tag size="small" type="info">{{
                    kb.embedding_provider || "N/A"
                  }}</el-tag>
                </div>
                <div class="info-row">
                  <span class="label">嵌入模型:</span>
                  <el-tag size="small" type="info">{{
                    kb.embedding_model || "N/A"
                  }}</el-tag>
                </div>
                <div class="info-row">
                  <span class="label">最后更新:</span>
                  <span class="value">{{
                    formatDateUTC(kb.last_updated)
                  }}</span>
                </div>
              </div>

              <div class="card-actions">
                <el-button size="small" @click="viewKnowledgeBaseDetail(kb)">
                  查看详情
                </el-button>
                <el-button
                  size="small"
                  type="primary"
                  plain
                  @click="uploadDocument(kb)"
                >
                  上传文档
                </el-button>
              </div>
            </div>
          </el-card>
        </div>
      </div>
    </div>

    <!-- ✅ 新增：知识库详情弹窗 -->
    <el-dialog
      v-model="showDetailDialog"
      :title="`知识库详情 - ${currentKB?.name || ''}`"
      width="900px"
      :close-on-click-modal="false"
    >
      <KnowledgeBaseDetail
        v-if="showDetailDialog && currentKB"
        :kb-id="currentKB.id"
        @close="showDetailDialog = false"
        @edit="handleEditFromDetail"
        @delete="handleDeleteFromDetail"
      />
    </el-dialog>

    <!-- 创建/编辑知识库对话框 -->
    <el-dialog
      v-model="showCreateDialog"
      :title="editingKB ? '编辑知识库' : '创建知识库'"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        :model="kbForm"
        :rules="kbRules"
        ref="kbFormRef"
        label-width="120px"
      >
        <el-form-item label="知识库名称" prop="name">
          <el-input v-model="kbForm.name" placeholder="请输入知识库名称" />
        </el-form-item>

        <el-form-item label="描述" prop="description">
          <el-input
            v-model="kbForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入知识库描述"
          />
        </el-form-item>

        <el-form-item label="系统指令" prop="prompt">
          <el-input
            v-model="kbForm.prompt"
            type="textarea"
            :rows="3"
            placeholder="请输入当前知识库指令"
          />
        </el-form-item>

        <el-form-item label="嵌入提供商" prop="embedding_provider">
          <el-select
            v-model="kbForm.embedding_provider"
            placeholder="选择嵌入提供商"
            @change="handleProviderChange"
          >
            <el-option
              v-for="(provider, key) in providers"
              :key="key"
              :label="provider.name"
              :value="key"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="嵌入模型" prop="embedding_model">
          <el-select
            v-model="kbForm.embedding_model"
            placeholder="选择嵌入模型"
          >
            <el-option
              v-for="model in currentProviderModels"
              :key="model"
              :label="model"
              :value="model"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="API Key" prop="embedding_api_key">
          <el-input
            v-model="kbForm.embedding_api_key"
            type="password"
            placeholder="请输入API Key"
            show-password
          />
        </el-form-item>

        <el-form-item label="分块大小" prop="chunk_size">
          <el-input-number
            v-model="kbForm.chunk_size"
            :min="100"
            :max="5000"
            :step="100"
          />
        </el-form-item>

        <el-form-item label="分块重叠" prop="chunk_overlap">
          <el-input-number
            v-model="kbForm.chunk_overlap"
            :min="0"
            :max="500"
            :step="50"
          />
        </el-form-item>

        <el-form-item label="分块策略" prop="chunk_strategy">
          <el-select v-model="kbForm.chunk_strategy" placeholder="选择分块策略">
            <el-option label="固定大小" value="fixed_size" />
            <el-option label="语义分块" value="semantic" />
            <el-option label="段落分块" value="paragraph" />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button
          type="primary"
          @click="handleCreateOrUpdate"
          :loading="submitting"
        >
          {{ editingKB ? "更新" : "创建" }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 文档管理对话框 -->
    <el-dialog
      v-model="showDocumentDialog"
      :title="`${currentKB?.name} - 文档管理`"
      width="900px"
      :close-on-click-modal="false"
    >
      <div class="document-manager">
        <div class="document-header">
          <div class="header-info">
            <span class="info-text">共 {{ documents.length }} 个文档</span>
            <el-button
              text
              :icon="Refresh"
              @click="refreshDocuments"
              :loading="loadingDocuments"
              size="small"
            >
              刷新
            </el-button>
          </div>
          <el-button type="primary" :icon="Upload" @click="handleUploadClick">
            上传文档
          </el-button>
          <input
            ref="fileInput"
            type="file"
            style="display: none"
            @change="handleFileSelect"
            accept=".txt,.md,.pdf,.docx,.doc,.html,.json,.csv,.xml"
          />
        </div>

        <el-table
          :data="documents"
          v-loading="loadingDocuments"
          style="margin-top: 16px"
        >
          <el-table-column prop="title" label="标题" min-width="200" />
          <el-table-column prop="document_type" label="类型" width="100">
            <template #default="{ row }">
              <el-tag size="small">{{ row.document_type }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="chunk_count" label="分块数" width="100" />
          <el-table-column prop="processed" label="状态" width="150">
            <template #default="{ row }">
              <div>
                <el-tag
                  :type="row.processed ? 'success' : 'warning'"
                  size="small"
                >
                  {{ row.processed ? "已处理" : "处理中" }}
                </el-tag>
                <el-progress
                  v-if="!row.processed && row.processing_progress !== undefined"
                  :percentage="Math.round(row.processing_progress * 100)"
                  :stroke-width="4"
                  style="margin-top: 4px"
                />
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="created_at" label="创建时间" width="180">
            <template #default="{ row }">
              {{ formatDate(row.created_at) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="{ row }">
              <el-button
                link
                type="primary"
                size="small"
                @click="viewDocument(row)"
              >
                查看
              </el-button>
              <el-button
                link
                type="danger"
                size="small"
                @click="deleteDocument(row)"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>

    <!-- 文档详情对话框 -->
    <el-dialog
      v-model="showDocumentDetailDialog"
      :title="currentDocument?.title || '文档详情'"
      width="800px"
      :close-on-click-modal="false"
      class="document_detail"
    >
      <div v-if="currentDocument" class="document-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="标题">
            {{ currentDocument.title }}
          </el-descriptions-item>
          <el-descriptions-item label="类型">
            <el-tag size="small">{{ currentDocument.document_type }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="分块数">
            {{ currentDocument.chunk_count || 0 }}
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag
              :type="currentDocument.processed ? 'success' : 'warning'"
              size="small"
            >
              {{ currentDocument.processed ? "已处理" : "处理中" }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间" :span="2">
            {{ formatDate(currentDocument.created_at) }}
          </el-descriptions-item>

          <el-descriptions-item
            v-if="currentDocument.source_url"
            label="来源URL"
            :span="2"
          >
            <el-link
              :href="currentDocument.source_url"
              target="_blank"
              type="primary"
            >
              {{ currentDocument.source_url }}
            </el-link>
          </el-descriptions-item>
          <el-descriptions-item label="文档描述" :span="2">
            {{ currentDocument.description || "未知" }}
          </el-descriptions-item>
        </el-descriptions>

        <div class="document-content-section">
          <h4>文档内容</h4>
          <div class="document-content-box">
            <el-scrollbar
              style="max-height: 300px; padding: 16px; overflow-y: scroll"
            >
              <div class="content-text">
                {{ currentDocument.content || "暂无内容" }}
              </div>
            </el-scrollbar>
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="showDocumentDetailDialog = false">关闭</el-button>
        <el-button type="danger" @click="handleDeleteFromDetail">
          删除文档
        </el-button>
      </template>
    </el-dialog>

    <!-- 搜索测试对话框 -->
    <el-dialog v-model="showSearchDialog" title="知识库搜索测试" width="700px">
      <div class="search-test">
        <el-input v-model="searchQuery" placeholder="输入搜索查询" clearable>
          <template #append>
            <el-button
              :icon="Search"
              @click="handleSearch"
              :loading="searching"
            >
              搜索
            </el-button>
          </template>
        </el-input>

        <div class="search-options">
          <el-form :inline="true" size="small">
            <el-form-item label="返回数量">
              <el-input-number
                v-model="searchOptions.top_k"
                :min="1"
                :max="10"
              />
            </el-form-item>
            <el-form-item label="相似度阈值">
              <el-input-number
                v-model="searchOptions.similarity_threshold"
                :min="0"
                :max="1"
                :step="0.1"
                :precision="1"
              />
            </el-form-item>
          </el-form>
        </div>

        <div v-if="searchResults.length > 0" class="search-results">
          <h4>搜索结果 ({{ searchResults.length }})</h4>
          <el-card
            v-for="(result, index) in searchResults"
            :key="result.chunk_id"
            shadow="hover"
            class="result-card"
          >
            <div class="result-header">
              <span class="result-index">#{{ index + 1 }}</span>
              <el-tag size="small" type="success">
                相似度: {{ (result.similarity_score * 100).toFixed(2) }}%
              </el-tag>
            </div>
            <div class="result-content">
              {{ result.content }}
            </div>
            <div class="result-meta">
              <span>文档: {{ result.document_title }}</span>
            </div>
          </el-card>
        </div>

        <el-empty v-else-if="hasSearched" description="未找到相关结果" />
      </div>
    </el-dialog>

    <!-- 上传文档配置对话框 -->
    <el-dialog
      v-model="showUploadDialog"
      title="上传文档"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        :model="uploadForm"
        :rules="uploadRules"
        ref="uploadFormRef"
        label-width="100px"
      >
        <el-form-item label="文件">
          <div class="file-info">
            <el-icon><Document /></el-icon>
            <span>{{ selectedFile?.name }}</span>
            <el-tag size="small" type="info">
              {{ formatSize(selectedFile?.size) }}
            </el-tag>
          </div>
        </el-form-item>

        <el-form-item label="文档标题" prop="title">
          <el-input
            v-model="uploadForm.title"
            placeholder="请输入文档标题"
            clearable
          />
        </el-form-item>

        <el-form-item label="文档类型" prop="document_type">
          <el-select
            v-model="uploadForm.document_type"
            placeholder="选择文档类型"
            style="width: 100%"
          >
            <el-option label="Word文档" value="word" />
            <el-option label="Markdown" value="markdown" />
            <el-option label="PDF文档" value="pdf" />
            <el-option label="纯文本" value="text" />
            <el-option label="HTML" value="html" />
            <el-option label="JSON" value="json" />
            <el-option label="CSV" value="csv" />
            <el-option label="XML" value="xml" />
          </el-select>
        </el-form-item>

        <el-form-item label="内容描述" prop="content">
          <el-input
            v-model="uploadForm.description"
            type="textarea"
            :rows="4"
            placeholder="请输入文档内容描述或摘要"
          />
        </el-form-item>

        <el-form-item label="来源URL">
          <el-input
            v-model="uploadForm.source_url"
            placeholder="文档来源链接(可选)"
            clearable
          />
        </el-form-item>

        <el-form-item label="自动处理">
          <el-switch v-model="uploadForm.auto_process" />
          <span class="form-tip">开启后将自动分块和向量化</span>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="cancelUpload">取消</el-button>
        <el-button type="primary" @click="confirmUpload" :loading="uploading">
          确认上传
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Plus,
  Folder,
  Document,
  DataAnalysis,
  MagicStick,
  MoreFilled,
  View,
  Edit,
  Search,
  Delete,
  Upload,
  Grid,
  Coin,
  Refresh,
} from "@element-plus/icons-vue";
import { useStore } from "vuex";
import KnowledgeBaseDetail from "@/components/KnowledgeBaseDetail.vue";
// ✅ 使用 Vuex Store
const store = useStore();

// 响应式数据
const loading = ref(false);
const loadingDocuments = ref(false);
const submitting = ref(false);
const searching = ref(false);
const uploading = ref(false);
const hasSearched = ref(false);
const processingDocuments = ref(new Set());

// ✅ 从 Vuex 获取数据
const showDetailDialog = ref(false);
const knowledgeBases = computed(
  () => store.getters["knowledge/allKnowledgeBases"]
);
const providers = computed(() => store.getters["knowledge/providers"]);
const documents = computed(() => store.getters["knowledge/documents"]);
const isCached = computed(() => store.getters["knowledge/isCached"]);
const lastFetchTime = computed(() => store.getters["knowledge/lastFetchTime"]);

const searchResults = ref([]);
const currentDocument = ref(null);

const showCreateDialog = ref(false);
const showDocumentDialog = ref(false);
const showSearchDialog = ref(false);
const showUploadDialog = ref(false);
const showDocumentDetailDialog = ref(false);

const editingKB = ref(null);
const currentKB = ref(null);
const fileInput = ref(null);
const uploadFormRef = ref(null);
const selectedFile = ref(null);

const searchQuery = ref("");
const searchOptions = reactive({
  top_k: 3,
  similarity_threshold: 0.1,
});

const uploadForm = reactive({
  title: "",
  content: "文档内容识别失败",
  description: "",
  document_type: "word",
  source_url: "",
  auto_process: true,
});

defineOptions({
  name: "Knowledge",
});

const kbForm = reactive({
  name: "",
  description: "",
  prompt: "",
  embedding_provider: "siliconflow",
  embedding_model: "BAAI/bge-m3",
  embedding_api_key: "",
  chunk_size: 1000,
  chunk_overlap: 200,
  chunk_strategy: "fixed_size",
});

const kbFormRef = ref(null);

const kbRules = {
  name: [{ required: true, message: "请输入知识库名称", trigger: "blur" }],
  embedding_provider: [
    { required: true, message: "请选择嵌入提供商", trigger: "change" },
  ],
  embedding_model: [
    { required: true, message: "请选择嵌入模型", trigger: "change" },
  ],
};

const uploadRules = {
  title: [{ required: true, message: "请输入文档标题", trigger: "blur" }],
  document_type: [
    { required: true, message: "请选择文档类型", trigger: "change" },
  ],
};

// 计算属性
const totalKnowledgeBases = computed(
  () => store.getters["knowledge/totalKnowledgeBases"]
);
const totalDocuments = computed(
  () => store.getters["knowledge/totalDocuments"]
);
const totalChunks = computed(() => store.getters["knowledge/totalChunks"]);
const totalEmbeddings = computed(
  () => store.getters["knowledge/totalEmbeddings"]
);

const currentProviderModels = computed(() => {
  const provider = providers.value[kbForm.embedding_provider];
  return provider ? provider.models : [];
});

// ✅ 修改：加载知识库
const loadKnowledgeBases = async (force = false) => {
  loading.value = true;
  try {
    await store.dispatch("knowledge/loadKnowledgeBases", { force });
  } catch (error) {
    console.error("加载知识库失败:", error);
  } finally {
    loading.value = false;
  }
};

// ✅ 新增：手动刷新知识库
const refreshKnowledgeBases = async () => {
  ElMessage.info("正在刷新知识库列表...");
  await loadKnowledgeBases(true);
  ElMessage.success("知识库列表已刷新");
};

// ✅ 新增：清除缓存
const clearCache = async () => {
  try {
    await ElMessageBox.confirm(
      "清除缓存后将重新从服务器获取数据,确定要继续吗?",
      "确认清除缓存",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }
    );

    store.dispatch("knowledge/clearCache");
    ElMessage.success("缓存已清除");
  } catch (error) {
    if (error === "cancel") return;
  }
};

// ✅ 新增：刷新文档列表
const refreshDocuments = async () => {
  if (!currentKB.value) return;

  ElMessage.info("正在刷新文档列表...");
  loadingDocuments.value = true;
  try {
    await store.dispatch("knowledge/loadDocuments", {
      kbId: currentKB.value.id,
      force: true,
    });
    ElMessage.success("文档列表已刷新");
  } catch (error) {
    console.error("刷新文档列表失败:", error);
  } finally {
    loadingDocuments.value = false;
  }
};

// ✅ 新增：查看知识库详情
const viewKnowledgeBaseDetail = (kb) => {
  currentKB.value = kb;
  showDetailDialog.value = true;
};

// ✅ 新增：从详情弹窗触发的操作
const handleEditFromDetail = (kb) => {
  showDetailDialog.value = false;
  editKnowledgeBase(kb);
};

const handleProviderChange = () => {
  const provider = providers.value[kbForm.embedding_provider];
  if (provider && provider.default_model) {
    kbForm.embedding_model = provider.default_model;
  }
};

const handleCreateOrUpdate = async () => {
  if (!kbFormRef.value) return;

  await kbFormRef.value.validate(async (valid) => {
    if (!valid) return;

    submitting.value = true;
    try {
      if (editingKB.value) {
        await store.dispatch("knowledge/updateKnowledgeBase", {
          id: editingKB.value.id,
          updates: {
            name: kbForm.name,
            description: kbForm.description,
          },
        });
        ElMessage.success("知识库更新成功");
      } else {
        await store.dispatch("knowledge/createKnowledgeBase", kbForm);
        ElMessage.success("知识库创建成功");
      }
      showCreateDialog.value = false;
      resetForm();
    } catch (error) {
      console.error("操作失败:", error);
      ElMessage.error(editingKB.value ? "更新失败" : "创建失败");
    } finally {
      submitting.value = false;
    }
  });
};

const handleCommand = (command, kb) => {
  switch (command) {
    case "detail": // ✅ 新增：详情命令
      viewKnowledgeBaseDetail(kb);
      break;
    case "view":
      viewKnowledgeBase(kb);
      break;
    case "edit":
      editKnowledgeBase(kb);
      break;
    case "test":
      testKnowledgeBase(kb);
      break;
    case "delete":
      deleteKnowledgeBase(kb);
      break;
  }
};

const viewKnowledgeBase = async (kb) => {
  currentKB.value = kb;
  showDocumentDialog.value = true;
  loadingDocuments.value = true;
  try {
    await store.dispatch("knowledge/loadDocuments", { kbId: kb.id });
  } finally {
    loadingDocuments.value = false;
  }
};

const editKnowledgeBase = (kb) => {
  editingKB.value = kb;
  kbForm.name = kb.name;
  kbForm.description = kb.description || "";
  showCreateDialog.value = true;
};

const testKnowledgeBase = (kb) => {
  currentKB.value = kb;
  searchQuery.value = "";
  searchResults.value = [];
  hasSearched.value = false;
  showSearchDialog.value = true;
};

const deleteKnowledgeBase = async (kb) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除知识库"${kb.name}"吗?此操作不可恢复。`,
      "确认删除",
      {
        confirmButtonText: "删除",
        cancelButtonText: "取消",
        type: "warning",
      }
    );

    await store.dispatch("knowledge/deleteKnowledgeBase", kb.id);
    ElMessage.success("知识库已删除");
  } catch (error) {
    if (error === "cancel") return;
    console.error("删除失败:", error);
    ElMessage.error("删除知识库失败");
  }
};

const uploadDocument = (kb) => {
  currentKB.value = kb;
  showDocumentDialog.value = true;
  loadingDocuments.value = true;
  store.dispatch("knowledge/loadDocuments", { kbId: kb.id }).finally(() => {
    loadingDocuments.value = false;
  });
};

const handleUploadClick = () => {
  fileInput.value?.click();
};

const handleFileSelect = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  selectedFile.value = file;

  const fileName = file.name.toLowerCase();
  if (fileName.endsWith(".docx") || fileName.endsWith(".doc")) {
    uploadForm.document_type = "word";
  } else if (fileName.endsWith(".md")) {
    uploadForm.document_type = "markdown";
  } else if (fileName.endsWith(".pdf")) {
    uploadForm.document_type = "pdf";
  } else if (fileName.endsWith(".txt")) {
    uploadForm.document_type = "text";
  } else if (fileName.endsWith(".html")) {
    uploadForm.document_type = "html";
  } else if (fileName.endsWith(".json")) {
    uploadForm.document_type = "json";
  } else if (fileName.endsWith(".csv")) {
    uploadForm.document_type = "csv";
  } else if (fileName.endsWith(".xml")) {
    uploadForm.document_type = "xml";
  }

  uploadForm.title = file.name.replace(/\.[^/.]+$/, "");
  showUploadDialog.value = true;
  event.target.value = "";
};

const checkDocumentProcessingStatus = async (documentId, kbId) => {
  const maxAttempts = 60;
  let attempts = 0;

  const checkStatus = async () => {
    try {
      const status = await store.dispatch(
        "knowledge/getDocumentProcessingStatus",
        documentId
      );

      // ✅ 使用 Vuex action 更新状态,而不是直接修改
      store.dispatch("knowledge/updateDocumentStatus", {
        documentId,
        processed: status.status === "completed",
        processing_progress: status.progress,
      });

      if (status.status === "completed") {
        processingDocuments.value.delete(documentId);
        ElMessage.success("文档处理完成");
        // 重新加载数据以获取最新状态
        await store.dispatch("knowledge/loadDocuments", { kbId, force: true });
        await store.dispatch("knowledge/loadKnowledgeBases", { force: true });
        return;
      } else if (status.status === "failed") {
        processingDocuments.value.delete(documentId);
        ElMessage.error(`文档处理失败: ${status.error_message || "未知错误"}`);
        return;
      }

      attempts++;
      if (attempts < maxAttempts && processingDocuments.value.has(documentId)) {
        setTimeout(checkStatus, 500);
      } else if (attempts >= maxAttempts) {
        processingDocuments.value.delete(documentId);
        ElMessage.warning("文档处理超时,请刷新页面查看状态");
      }
    } catch (error) {
      console.error("检查处理状态失败:", error);
      processingDocuments.value.delete(documentId);
    }
  };

  checkStatus();
};

const confirmUpload = async () => {
  if (!uploadFormRef.value) return;

  await uploadFormRef.value.validate(async (valid) => {
    if (!valid) return;

    uploading.value = true;
    try {
      const formData = new FormData();
      formData.append("file", selectedFile.value);
      formData.append("title", uploadForm.title);
      formData.append("content", uploadForm.content);
      formData.append("description", uploadForm.description);
      formData.append("document_type", uploadForm.document_type);
      formData.append("auto_process", uploadForm.auto_process.toString());

      if (uploadForm.source_url) {
        formData.append("source_url", uploadForm.source_url);
      }

      const document = await store.dispatch("knowledge/uploadDocument", {
        kbId: currentKB.value.id,
        formData,
      });

      ElMessage.success("文档上传成功");
      const documentId = document?.id || document.document_id;

      processingDocuments.value.add(documentId);
      checkDocumentProcessingStatus(documentId, currentKB.value.id);

      showUploadDialog.value = false;
      resetUploadForm();
    } catch (error) {
      console.error("上传失败:", error);
      ElMessage.error("文档上传失败");
    } finally {
      uploading.value = false;
    }
  });
};

const cancelUpload = () => {
  showUploadDialog.value = false;
  resetUploadForm();
};

const resetUploadForm = () => {
  selectedFile.value = null;
  Object.assign(uploadForm, {
    title: "",
    content: "",
    document_type: "word",
    source_url: "",
    auto_process: true,
  });
  uploadFormRef.value?.clearValidate();
};

const viewDocument = async (doc) => {
  currentDocument.value = doc;
  showDocumentDetailDialog.value = true;
};

const handleDeleteFromDetail = async () => {
  if (currentDocument.value) {
    showDocumentDetailDialog.value = false;
    await deleteDocument(currentDocument.value);
  }
};

const deleteDocument = async (doc) => {
  try {
    await ElMessageBox.confirm(`确定要删除文档"${doc.title}"吗?`, "确认删除", {
      type: "warning",
      confirmButtonText: "删除",
      cancelButtonText: "取消",
    });

    await store.dispatch("knowledge/deleteDocument", {
      kbId: currentKB.value.id,
      docId: doc.id,
    });

    ElMessage.success("文档已删除");
  } catch (error) {
    if (error === "cancel") return;
    console.error("删除失败:", error);
    ElMessage.error("删除文档失败");
  }
};

const handleSearch = async () => {
  if (!searchQuery.value.trim()) {
    ElMessage.warning("请输入搜索内容");
    return;
  }

  searching.value = true;
  hasSearched.value = true;
  try {
    const results = await store.dispatch("knowledge/searchKnowledgeBase", {
      kbId: currentKB.value.id,
      searchParams: {
        query: searchQuery.value,
        knowledge_base_id: currentKB.value.id,
        ...searchOptions,
      },
    });

    searchResults.value = results || [];
    if (searchResults.value.length === 0) {
      ElMessage.info("未找到相关结果");
    }
  } catch (error) {
    console.error("搜索失败:", error);
    ElMessage.error("搜索失败");
  } finally {
    searching.value = false;
  }
};

const resetForm = () => {
  editingKB.value = null;
  Object.assign(kbForm, {
    name: "",
    description: "",
    embedding_provider: "siliconflow",
    embedding_model: "BAAI/bge-m3",
    embedding_api_key: "",
    chunk_size: 1000,
    chunk_overlap: 200,
    chunk_strategy: "fixed_size",
  });
  kbFormRef.value?.clearValidate();
};

const formatSize = (bytes) => {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleString("zh-CN");
};
const formatDateUTC = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toISOString().replace("T", " ").replace("Z", "");
};

onMounted(async () => {
  await loadKnowledgeBases(false);

  if (Object.keys(providers.value).length === 0) {
    await store.dispatch("knowledge/loadProviders");
  }
});
</script>

<style scoped>
.knowledge-page {
  padding: 24px;
  background: transparent;
  min-height: 100%;
}

[data-theme="dark"] .knowledge-page {
  background: transparent;
}

.knowledge-container {
  max-width: 1400px;
  margin: 0 auto;
}

.document_detail {
  margin-top: 0;
}

/* 缓存状态提示 */
.cache-info {
  margin-bottom: 16px;
}

.cache-info :deep(.el-alert) {
  border-radius: 8px;
}

/* 页面头部 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.page-header h1 {
  margin: 0 0 8px 0;
  font-size: 28px;
  font-weight: 600;
  color: #303133;
}

[data-theme="dark"] .page-header h1 {
  color: #e0e0e0;
}

.subtitle {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.header-right {
  display: flex;
  gap: 8px;
}

/* 统计卡片 */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  border-radius: 12px;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

[data-theme="dark"] .stat-value {
  color: #e0e0e0;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

/* 知识库网格 */
.knowledge-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.knowledge-card {
  border-radius: 12px;
  transition: all 0.3s ease;
}

.knowledge-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 16px;
  color: #303133;
}

[data-theme="dark"] .card-title {
  color: #e0e0e0;
}

.more-icon {
  cursor: pointer;
  font-size: 20px;
  color: #909399;
  transition: color 0.3s;
}

.more-icon:hover {
  color: #409eff;
}

.card-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.kb-stats {
  display: flex;
  gap: 16px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

[data-theme="dark"] .kb-stats {
  background: #2c2c2c;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #606266;
}

.kb-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.info-row .label {
  color: #909399;
}

.info-row .value {
  color: #606266;
}

.card-actions {
  display: flex;
  gap: 8px;
}

/* 文档管理 */
.document-manager {
  min-height: 400px;
}

.document-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 16px;
}

[data-theme="dark"] .document-header {
  background: #2c2c2c;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.info-text {
  font-size: 14px;
  color: #606266;
}

[data-theme="dark"] .info-text {
  color: #909399;
}

/* 上传配置对话框 */
.file-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  width: 100%;
}

[data-theme="dark"] .file-info {
  background: #2c2c2c;
}

.file-info span {
  flex: 1;
  font-size: 14px;
  color: #303133;
  word-break: break-all;
}

[data-theme="dark"] .file-info span {
  color: #e0e0e0;
}

.form-tip {
  margin-left: 12px;
  font-size: 12px;
  color: #909399;
}

/* 搜索测试 */
.search-test {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.search-options {
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

[data-theme="dark"] .search-options {
  background: #2c2c2c;
}

.search-results {
  max-height: 500px;
  overflow-y: auto;
}

.search-results h4 {
  margin: 0 0 12px 0;
  color: #303133;
}

[data-theme="dark"] .search-results h4 {
  color: #e0e0e0;
}

.result-card {
  margin-bottom: 12px;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.result-index {
  font-weight: 600;
  color: #409eff;
}

.result-content {
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
  line-height: 1.6;
  color: #303133;
  margin-bottom: 8px;
}

[data-theme="dark"] .result-content {
  background: #2c2c2c;
  color: #e0e0e0;
}

.result-meta {
  font-size: 12px;
  color: #909399;
}

/* 加载和空状态 */
.loading-container,
.empty-container {
  padding: 40px;
  text-align: center;
}

/* 文档详情 */
.document-detail {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.document-content-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.document-content-section h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

[data-theme="dark"] .document-content-section h4 {
  color: #e0e0e0;
}

.document-content-box {
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  padding: 16px;
  background: #f8f9fa;
}

[data-theme="dark"] .document-content-box {
  border-color: #4c4d4f;
  background: #2c2c2c;
}

.content-text {
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.8;
  font-size: 14px;
  color: #303133;
}

[data-theme="dark"] .content-text {
  color: #e0e0e0;
}

/* 响应式 */
@media (max-width: 768px) {
  .knowledge-page {
    padding: 10px;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .stats-cards {
    grid-template-columns: 1fr;
  }

  .knowledge-grid {
    grid-template-columns: 1fr;
  }
}
</style>
