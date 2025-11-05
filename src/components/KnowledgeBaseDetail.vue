<template>
  <div class="kb-detail-container">
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="5" animated />
    </div>

    <div v-else-if="kbDetails" class="detail-content">
      <!-- 基础信息卡片 -->
      <el-card shadow="hover" class="info-card">
        <template #header>
          <div class="card-header">
            <span class="card-title">基础信息</span>
            <el-button size="small" @click="handleEdit">
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
          </div>
        </template>

        <el-descriptions :column="2" border>
          <el-descriptions-item label="知识库名称">
            {{ kbDetails.name }}
          </el-descriptions-item>
          <el-descriptions-item label="知识库ID">
            <el-text size="small" type="info">{{ kbDetails.id }}</el-text>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间" :span="2">
            {{ formatDate(kbDetails.created_at) }}
          </el-descriptions-item>
          <el-descriptions-item label="最后更新" :span="2">
            {{ formatDate(kbDetails.updated_at) }}
          </el-descriptions-item>
          <el-descriptions-item label="描述" :span="2">
            {{ kbDetails.description || "暂无描述" }}
          </el-descriptions-item>
          <el-descriptions-item label="系统指令" :span="2">
            <div class="prompt-content">
              {{ kbDetails.prompt || "暂无系统指令" }}
            </div>
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 统计信息卡片 -->
      <el-card shadow="hover" class="info-card">
        <template #header>
          <span class="card-title">统计信息</span>
        </template>

        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-icon" style="background: #e6f4ff">
              <el-icon :size="24" color="#1890ff"><Document /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ kbDetails.document_count || 0 }}</div>
              <div class="stat-label">文档总数</div>
            </div>
          </div>

          <div class="stat-item">
            <div class="stat-icon" style="background: #f0f9ff">
              <el-icon :size="24" color="#0ea5e9"><Grid /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ kbDetails.total_chunks || 0 }}</div>
              <div class="stat-label">总分块数</div>
            </div>
          </div>

          <div class="stat-item">
            <div class="stat-icon" style="background: #f0fdf4">
              <el-icon :size="24" color="#10b981"><Coin /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">
                {{ formatSize(kbDetails.total_size) }}
              </div>
              <div class="stat-label">总大小</div>
            </div>
          </div>

          <div class="stat-item">
            <div class="stat-icon" style="background: #fef3c7">
              <el-icon :size="24" color="#f59e0b"><MagicStick /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ kbDetails.embedding_count || 0 }}</div>
              <div class="stat-label">嵌入向量数</div>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 配置信息卡片 -->
      <el-card shadow="hover" class="info-card">
        <template #header>
          <span class="card-title">配置信息</span>
        </template>

        <el-descriptions :column="2" border>
          <el-descriptions-item label="嵌入提供商">
            <el-tag type="info">{{
              kbDetails.embedding_provider || "N/A"
            }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="嵌入模型">
            <el-tag type="info">{{
              kbDetails.embedding_model || "N/A"
            }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="分块大小">
            {{ kbDetails.chunk_size || "N/A" }}
          </el-descriptions-item>
          <el-descriptions-item label="分块重叠">
            {{ kbDetails.chunk_overlap || "N/A" }}
          </el-descriptions-item>
          <el-descriptions-item label="分块策略" :span="2">
            <el-tag>{{
              getChunkStrategyLabel(kbDetails.chunk_strategy)
            }}</el-tag>
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <el-button type="danger" @click="handleDelete" :icon="Delete">
          删除知识库
        </el-button>
      </div>
    </div>

    <el-empty v-else description="未找到知识库信息" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { useStore } from "vuex";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Edit,
  Document,
  Grid,
  Coin,
  MagicStick,
  FolderOpened,
  Upload,
  Search,
  Delete,
} from "@element-plus/icons-vue";

const props = defineProps({
  kbId: {
    type: String,
    required: true,
  },
});

const emit = defineEmits([
  "close",
  "edit",
  "viewDocuments",
  "uploadDocument",
  "testSearch",
  "delete",
]);

const store = useStore();
const loading = ref(false);
const kbDetails = ref(null);

// 计算属性
const knowledgeBaseById = computed(() =>
  store.getters["knowledge/knowledgeBaseById"](props.kbId)
);

// 方法
const loadKnowledgeBaseDetails = async () => {
  loading.value = true;
  try {
    const details = await store.dispatch(
      "knowledge/getKnowledgeBaseDetails",
      props.kbId
    );
    kbDetails.value = details;
  } catch (error) {
    console.error("加载知识库详情失败:", error);
    ElMessage.error("加载知识库详情失败");
  } finally {
    loading.value = false;
  }
};

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleString("zh-CN");
};

const formatSize = (bytes) => {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

const getChunkStrategyLabel = (strategy) => {
  const strategyMap = {
    fixed_size: "固定大小",
    semantic: "语义分块",
    paragraph: "段落分块",
  };
  return strategyMap[strategy] || strategy;
};

const handleEdit = () => {
  emit("edit", kbDetails.value);
};

const handleViewDocuments = () => {
  emit("viewDocuments", kbDetails.value);
};

const handleUploadDocument = () => {
  emit("uploadDocument", kbDetails.value);
};

const handleTestSearch = () => {
  emit("testSearch", kbDetails.value);
};

const handleDelete = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要删除知识库"${kbDetails.value.name}"吗?此操作不可恢复。`,
      "确认删除",
      {
        confirmButtonText: "删除",
        cancelButtonText: "取消",
        type: "warning",
      }
    );

    emit("delete", kbDetails.value);
  } catch (error) {
    if (error !== "cancel") {
      console.error("删除知识库失败:", error);
    }
  }
};

// 监听 kbId 变化

onMounted(() => {
  if (props.kbId) {
    loadKnowledgeBaseDetails();
  }
});
</script>

<style scoped>
.kb-detail-container {
  padding: 20px;
  max-height: calc(100vh - 200px);
  overflow-y: auto;
}

.loading-container {
  padding: 40px;
}

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.info-card {
  border-radius: 12px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

[data-theme="dark"] .card-title {
  color: #e0e0e0;
}

.prompt-content {
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.6;
  color: #606266;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 4px;
}

[data-theme="dark"] .prompt-content {
  background: #2c2c2c;
  color: #e0e0e0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
}

[data-theme="dark"] .stat-item {
  background: #2c2c2c;
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 24px;
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

.action-buttons {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding-top: 10px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .kb-detail-container {
    padding: 12px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .action-buttons {
    flex-wrap: wrap;
    justify-content: center;
  }

  :deep(.el-descriptions) {
    font-size: 13px;
  }
}

/* 滚动条样式 */
.kb-detail-container::-webkit-scrollbar {
  width: 6px;
}

.kb-detail-container::-webkit-scrollbar-track {
  background: #f5f5f5;
}

.kb-detail-container::-webkit-scrollbar-thumb {
  background: #d0d0d0;
  border-radius: 3px;
}

.kb-detail-container::-webkit-scrollbar-thumb:hover {
  background: #b0b0b0;
}
</style>
