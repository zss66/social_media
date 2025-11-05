import { ElMessage } from "element-plus";
import axios from "axios";

const API_BASE_URL = process.env.VUE_APP_API_BASE_URL;
const USER_ID = process.env.VUE_APP_USER_ID;

const state = {
  knowledgeBases: [],
  currentKnowledgeBase: null,
  documents: [],
  providers: {},
  loading: false,
  error: null,
  cached: false,
  lastFetchTime: null,
  documentsCacheMap: new Map(),

  // ✅ 新增：弹窗控制状态
  showKnowledgeDialog: false,
  showKnowledgeDetailDialog: false,
  selectedKnowledgeBaseId: null,
};

const getters = {
  allKnowledgeBases: (state) => state.knowledgeBases,
  currentKnowledgeBase: (state) => state.currentKnowledgeBase,
  documents: (state) => state.documents,
  providers: (state) => state.providers,
  isLoading: (state) => state.loading,
  error: (state) => state.error,
  isCached: (state) => state.cached,
  lastFetchTime: (state) => state.lastFetchTime,

  // ✅ 新增：弹窗状态 getters
  showKnowledgeDialog: (state) => state.showKnowledgeDialog,
  showKnowledgeDetailDialog: (state) => state.showKnowledgeDetailDialog,
  selectedKnowledgeBaseId: (state) => state.selectedKnowledgeBaseId,

  totalKnowledgeBases: (state) => state.knowledgeBases.length,
  totalDocuments: (state) =>
    state.knowledgeBases.reduce((sum, kb) => sum + (kb.document_count || 0), 0),
  totalChunks: (state) =>
    state.knowledgeBases.reduce((sum, kb) => sum + (kb.total_chunks || 0), 0),
  totalEmbeddings: (state) =>
    state.knowledgeBases.reduce(
      (sum, kb) => sum + (kb.embedding_count || 0),
      0
    ),

  knowledgeBaseById: (state) => (id) => {
    return state.knowledgeBases.find((kb) => kb.id === id);
  },

  documentsByKbId: (state) => (kbId) => {
    return state.documentsCacheMap.get(kbId) || null;
  },
};

const mutations = {
  SET_KNOWLEDGE_BASES(state, knowledgeBases) {
    state.knowledgeBases = knowledgeBases;
    state.cached = true;
    state.lastFetchTime = Date.now();
  },

  ADD_KNOWLEDGE_BASE(state, knowledgeBase) {
    state.knowledgeBases.push(knowledgeBase);
  },

  UPDATE_KNOWLEDGE_BASE(state, updatedKB) {
    const index = state.knowledgeBases.findIndex(
      (kb) => kb.id === updatedKB.id
    );
    if (index !== -1) {
      state.knowledgeBases.splice(index, 1, updatedKB);
    }
  },
  // ✅ 新增:更新文档处理状态
  UPDATE_DOCUMENT_STATUS(
    state,
    { documentId, processed, processing_progress }
  ) {
    // 更新 documents 数组中的文档
    const doc = state.documents.find((d) => d.id === documentId);
    if (doc) {
      doc.processed = processed;
      if (processing_progress !== undefined) {
        doc.processing_progress = processing_progress;
      }
    }

    // 同时更新缓存中的文档
    state.documentsCacheMap.forEach((docs, kbId) => {
      const cachedDoc = docs.find((d) => d.id === documentId);
      if (cachedDoc) {
        cachedDoc.processed = processed;
        if (processing_progress !== undefined) {
          cachedDoc.processing_progress = processing_progress;
        }
      }
    });
  },

  REMOVE_KNOWLEDGE_BASE(state, id) {
    state.knowledgeBases = state.knowledgeBases.filter((kb) => kb.id !== id);
    state.documentsCacheMap.delete(id);
  },

  SET_CURRENT_KNOWLEDGE_BASE(state, knowledgeBase) {
    state.currentKnowledgeBase = knowledgeBase;
  },

  SET_DOCUMENTS(state, { kbId, documents }) {
    state.documents = documents;
    if (kbId) {
      state.documentsCacheMap.set(kbId, documents);
    }
  },

  ADD_DOCUMENT(state, { kbId, document }) {
    state.documents.push(document);
    if (kbId && state.documentsCacheMap.has(kbId)) {
      const cached = state.documentsCacheMap.get(kbId);
      state.documentsCacheMap.set(kbId, [...cached, document]);
    }
  },

  REMOVE_DOCUMENT(state, { kbId, docId }) {
    state.documents = state.documents.filter((doc) => doc.id !== docId);
    if (kbId && state.documentsCacheMap.has(kbId)) {
      const cached = state.documentsCacheMap
        .get(kbId)
        .filter((doc) => doc.id !== docId);
      state.documentsCacheMap.set(kbId, cached);
    }
  },

  SET_PROVIDERS(state, providers) {
    state.providers = providers;
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

  CLEAR_CACHE(state) {
    state.knowledgeBases = [];
    state.currentKnowledgeBase = null;
    state.documents = [];
    state.documentsCacheMap.clear();
    state.cached = false;
    state.lastFetchTime = null;
  },

  CLEAR_DOCUMENTS_CACHE(state, kbId) {
    if (kbId) {
      state.documentsCacheMap.delete(kbId);
    } else {
      state.documentsCacheMap.clear();
    }
    state.documents = [];
  },

  // ✅ 新增：弹窗控制 mutations
  SET_SHOW_KNOWLEDGE_DIALOG(state, show) {
    state.showKnowledgeDialog = show;
  },

  SET_SHOW_KNOWLEDGE_DETAIL_DIALOG(state, show) {
    state.showKnowledgeDetailDialog = show;
  },

  SET_SELECTED_KNOWLEDGE_BASE_ID(state, id) {
    state.selectedKnowledgeBaseId = id;
  },
};

const actions = {
  // ✅ 修复：统一请求头配置
  getHeaders() {
    return {
      accept: "application/json",
      "X-User-ID": USER_ID,
      "Content-Type": "application/json",
    };
  },

  // ✅ 新增：弹窗控制 actions
  openKnowledgeDialog({ commit }) {
    commit("SET_SHOW_KNOWLEDGE_DIALOG", true);
  },

  closeKnowledgeDialog({ commit }) {
    commit("SET_SHOW_KNOWLEDGE_DIALOG", false);
  },

  openKnowledgeDetailDialog({ commit }, kbId) {
    commit("SET_SELECTED_KNOWLEDGE_BASE_ID", kbId);
    commit("SET_SHOW_KNOWLEDGE_DETAIL_DIALOG", true);
  },

  closeKnowledgeDetailDialog({ commit }) {
    commit("SET_SHOW_KNOWLEDGE_DETAIL_DIALOG", false);
    commit("SET_SELECTED_KNOWLEDGE_BASE_ID", null);
  },

  async loadKnowledgeBases(
    { commit, dispatch, state },
    { force = false } = {}
  ) {
    if (state.cached && !force) {
      console.log("使用缓存的知识库数据");
      return state.knowledgeBases;
    }

    commit("SET_LOADING", true);
    commit("CLEAR_ERROR");

    try {
      const response = await axios.get(`${API_BASE_URL}/knowledge-bases`, {
        headers: await dispatch("getHeaders"),
      });

      if (response.data.success) {
        commit("SET_KNOWLEDGE_BASES", response.data.knowledge_bases || []);
        return response.data.knowledge_bases;
      } else {
        throw new Error("加载知识库失败");
      }
    } catch (error) {
      console.error("Failed to load knowledge bases:", error);
      commit("SET_ERROR", error.message);
      ElMessage.error("加载知识库列表失败");
      throw error;
    } finally {
      commit("SET_LOADING", false);
    }
  },

  async loadProviders({ commit }) {
    try {
      const response = await axios.get(`${API_BASE_URL}/embedding/providers`, {
        headers: {
          accept: "application/json",
          "X-User-ID": USER_ID,
        },
      });

      if (response.data.success) {
        commit("SET_PROVIDERS", response.data.providers || {});
      }
    } catch (error) {
      console.error("Failed to load providers:", error);
      ElMessage.error("加载嵌入提供商失败");
    }
  },

  async createKnowledgeBase({ commit, dispatch }, kbData) {
    commit("SET_LOADING", true);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/knowledge-bases`,
        kbData,
        {
          headers: await dispatch("getHeaders"),
        }
      );

      if (response.data.success) {
        const newKB = {
          id: response.data.knowledge_base.id,
          name: response.data.knowledge_base.name,
          description: response.data.knowledge_base.description,
          prompt: response.data.knowledge_base.prompt,
          embedding_model: response.data.knowledge_base.embedding_model,
          embedding_provider: response.data.knowledge_base.embedding_provider,
          document_count: 0,
          total_chunks: 0,
          total_size: 0,
          embedding_count: 0,
          last_updated: response.data.knowledge_base.created_at,
        };

        commit("ADD_KNOWLEDGE_BASE", newKB);
        ElMessage.success("知识库创建成功");
        return newKB;
      } else {
        throw new Error("创建知识库失败");
      }
    } catch (error) {
      console.error("Failed to create knowledge base:", error);
      ElMessage.error(`创建知识库失败: ${error.message}`);
      throw error;
    } finally {
      commit("SET_LOADING", false);
    }
  },

  // ✅ 修复并优化：获取知识库详情
  async getKnowledgeBaseDetails({ commit, dispatch }, kbId) {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/knowledge-bases/${kbId}`,
        {
          headers: await dispatch("getHeaders"),
        }
      );

      if (response.data.success) {
        // 合并 knowledge_base 和 stats 数据
        const kbDetails = {
          ...response.data.knowledge_base,
          ...response.data.stats,
        };
        commit("SET_CURRENT_KNOWLEDGE_BASE", kbDetails);
        return kbDetails;
      } else {
        throw new Error("获取知识库详情失败");
      }
    } catch (error) {
      console.error("Failed to get knowledge base details:", error);
      ElMessage.error("获取知识库详情失败");
      throw error;
    }
  },

  async updateKnowledgeBase({ commit, dispatch }, { id, updates }) {
    commit("SET_LOADING", true);

    try {
      const response = await axios.put(
        `${API_BASE_URL}/knowledge-bases/${id}`,
        updates,
        {
          headers: await dispatch("getHeaders"),
        }
      );

      if (response.data.success) {
        await dispatch("loadKnowledgeBases", { force: true });
        ElMessage.success("知识库更新成功");
      } else {
        throw new Error("更新知识库失败");
      }
    } catch (error) {
      console.error("Failed to update knowledge base:", error);
      ElMessage.error(`更新知识库失败: ${error.message}`);
      throw error;
    } finally {
      commit("SET_LOADING", false);
    }
  },

  async deleteKnowledgeBase({ commit, dispatch }, kbId) {
    commit("SET_LOADING", true);

    try {
      const response = await axios.delete(
        `${API_BASE_URL}/knowledge-bases/${kbId}`,
        {
          headers: await dispatch("getHeaders"),
        }
      );

      if (response.data.success) {
        commit("REMOVE_KNOWLEDGE_BASE", kbId);
        ElMessage.success("知识库已删除");
      } else {
        throw new Error("删除知识库失败");
      }
    } catch (error) {
      console.error("Failed to delete knowledge base:", error);
      ElMessage.error(`删除知识库失败: ${error.message}`);
      throw error;
    } finally {
      commit("SET_LOADING", false);
    }
  },

  async loadDocuments({ commit, dispatch, state }, { kbId, force = false }) {
    if (!force && state.documentsCacheMap.has(kbId)) {
      console.log(`使用缓存的文档数据 (知识库ID: ${kbId})`);
      const cachedDocs = state.documentsCacheMap.get(kbId);
      commit("SET_DOCUMENTS", { kbId, documents: cachedDocs });
      return cachedDocs;
    }

    commit("SET_LOADING", true);

    try {
      const response = await axios.get(
        `${API_BASE_URL}/knowledge-bases/${kbId}/documents`,
        {
          headers: await dispatch("getHeaders"),
          params: { page: 1, page_size: 100 },
        }
      );

      if (response.data.success) {
        const documents = response.data.documents || [];
        commit("SET_DOCUMENTS", { kbId, documents });
        return documents;
      } else {
        throw new Error("加载文档失败");
      }
    } catch (error) {
      console.error("Failed to load documents:", error);
      ElMessage.error("加载文档列表失败");
      throw error;
    } finally {
      commit("SET_LOADING", false);
    }
  },

  async uploadDocument({ commit, dispatch }, { kbId, formData }) {
    commit("SET_LOADING", true);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/knowledge-bases/${kbId}/documents`,
        formData,
        {
          headers: {
            "X-User-ID": USER_ID,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        const document = response.data.document;
        commit("ADD_DOCUMENT", { kbId, document });
        ElMessage.success("文档上传成功");
        await dispatch("loadKnowledgeBases", { force: true });
        return document;
      } else {
        throw new Error("上传文档失败");
      }
    } catch (error) {
      console.error("Failed to upload document:", error);
      ElMessage.error(`上传文档失败: ${error.message}`);
      throw error;
    } finally {
      commit("SET_LOADING", false);
    }
  },

  async getDocumentDetails({ dispatch }, docId) {
    try {
      const response = await axios.get(`${API_BASE_URL}/documents/${docId}`, {
        headers: await dispatch("getHeaders"),
      });

      if (response.data.success) {
        return response.data.document;
      }
    } catch (error) {
      console.error("Failed to get document details:", error);
      ElMessage.error("获取文档详情失败");
      throw error;
    }
  },

  async deleteDocument({ commit, dispatch }, { kbId, docId }) {
    commit("SET_LOADING", true);

    try {
      const response = await axios.delete(
        `${API_BASE_URL}/documents/${docId}`,
        {
          headers: await dispatch("getHeaders"),
        }
      );

      if (response.data.success) {
        commit("REMOVE_DOCUMENT", { kbId, docId });
        ElMessage.success("文档已删除");
        await dispatch("loadKnowledgeBases", { force: true });
      } else {
        throw new Error("删除文档失败");
      }
    } catch (error) {
      console.error("Failed to delete document:", error);
      ElMessage.error(`删除文档失败: ${error.message}`);
      throw error;
    } finally {
      commit("SET_LOADING", false);
    }
  },

  async searchKnowledgeBase({ dispatch }, { kbId, searchParams }) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/knowledge-bases/${kbId}/search`,
        searchParams,
        {
          headers: await dispatch("getHeaders"),
        }
      );

      if (response.data.success) {
        return response.data.results || [];
      } else {
        throw new Error("搜索失败");
      }
    } catch (error) {
      console.error("Failed to search knowledge base:", error);
      ElMessage.error("搜索失败");
      throw error;
    }
  },

  async getDocumentProcessingStatus({ dispatch }, docId) {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/documents/${docId}/processing-status`,
        {
          headers: await dispatch("getHeaders"),
        }
      );

      if (response.data.success) {
        return response.data.processing_status;
      }
    } catch (error) {
      console.error("Failed to get processing status:", error);
      throw error;
    }
  },

  clearCache({ commit }) {
    commit("CLEAR_CACHE");
    ElMessage.success("缓存已清除");
  },

  clearDocumentsCache({ commit }, kbId = null) {
    commit("CLEAR_DOCUMENTS_CACHE", kbId);
    if (kbId) {
      console.log(`已清除知识库 ${kbId} 的文档缓存`);
    } else {
      console.log("已清除所有文档缓存");
    }
  },

  clearError({ commit }) {
    commit("CLEAR_ERROR");
  },
  updateDocumentStatus({ commit }, payload) {
    commit("UPDATE_DOCUMENT_STATUS", payload);
  },
};

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions,
};
