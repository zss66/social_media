<template>
  <div class="proxy-diagnostic-tool">
    <el-card header="代理诊断工具">
      <!-- 当前容器信息 -->
      <div class="container-info">
        <h4>当前容器信息</h4>
        <el-descriptions :column="2" size="small">
          <el-descriptions-item label="容器ID">{{ container?.id || 'N/A' }}</el-descriptions-item>
          <el-descriptions-item label="平台">{{ container?.platformId || 'N/A' }}</el-descriptions-item>
          <el-descriptions-item label="代理启用">
            <el-tag :type="container?.config?.proxy?.enabled ? 'success' : 'danger'">
              {{ container?.config?.proxy?.enabled ? '是' : '否' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="代理类型">{{ container?.config?.proxy?.type || 'N/A' }}</el-descriptions-item>
        </el-descriptions>
      </div>

      <!-- 代理状态检查 -->
      <div class="proxy-status-section">
        <h4>代理状态检查</h4>
        <el-space direction="vertical" style="width: 100%;">
          <el-button 
            @click="checkProxyStatus" 
            type="primary" 
            :loading="checking"
            icon="Search"
          >
            检查代理状态
          </el-button>
          
          <el-button 
            @click="resetProxy" 
            type="warning" 
            :loading="resetting"
            icon="RefreshRight"
          >
            重置代理配置
          </el-button>
          
          <el-button 
            @click="testRealIP" 
            type="info" 
            :loading="testingIP"
            icon="Globe"
          >
            测试真实IP
          </el-button>
        </el-space>
      </div>

      <!-- 检查结果 -->
      <div v-if="checkResults.length > 0" class="results-section">
        <h4>检查结果</h4>
        <el-timeline>
          <el-timeline-item 
            v-for="(result, index) in checkResults" 
            :key="index"
            :type="result.success ? 'success' : 'danger'"
            :timestamp="result.timestamp"
          >
            <el-card class="result-card">
              <template #header>
                <span>{{ result.title }}</span>
                <el-tag 
                  :type="result.success ? 'success' : 'danger'" 
                  style="float: right;"
                >
                  {{ result.success ? '成功' : '失败' }}
                </el-tag>
              </template>
              
              <div class="result-content">
                <p><strong>描述:</strong> {{ result.description }}</p>
                
                <div v-if="result.details">
                  <p><strong>详细信息:</strong></p>
                  <el-tag 
                    v-for="(detail, key) in result.details" 
                    :key="key"
                    style="margin-right: 8px; margin-bottom: 4px;"
                  >
                    {{ key }}: {{ detail }}
                  </el-tag>
                </div>
                
                <div v-if="result.proxyResults">
                  <p><strong>代理解析结果:</strong></p>
                  <el-table :data="result.proxyResults" size="small" style="width: 100%;">
                    <el-table-column prop="url" label="测试URL" />
                    <el-table-column prop="resolved" label="代理解析" />
                    <el-table-column prop="isProxy" label="使用代理">
                      <template #default="scope">
                        <el-tag :type="scope.row.isProxy ? 'success' : 'danger'">
                          {{ scope.row.isProxy ? '是' : '否' }}
                        </el-tag>
                      </template>
                    </el-table-column>
                  </el-table>
                </div>
                
                <div v-if="result.ipInfo" class="ip-info">
                  <p><strong>IP信息:</strong></p>
                  <el-descriptions :column="1" size="small">
                    <el-descriptions-item label="检测到的IP">{{ result.ipInfo.ip }}</el-descriptions-item>
                    <el-descriptions-item label="地理位置">{{ result.ipInfo.location }}</el-descriptions-item>
                    <el-descriptions-item label="ISP">{{ result.ipInfo.isp }}</el-descriptions-item>
                  </el-descriptions>
                </div>
                
                <div v-if="result.error" class="error-info">
                  <el-alert 
                    :title="result.error" 
                    type="error" 
                    show-icon 
                    :closable="false"
                  />
                </div>
              </div>
            </el-card>
          </el-timeline-item>
        </el-timeline>
      </div>

      <!-- 手动测试区域 -->
      <div class="manual-test-section">
        <h4>手动测试</h4>
        <el-space direction="vertical" style="width: 100%;">
          <el-input 
            v-model="testUrl" 
            placeholder="输入要测试的URL (例如: https://httpbin.org/ip)"
          />
          <el-button @click="testCustomUrl" type="primary" :loading="customTesting">
            测试自定义URL
          </el-button>
        </el-space>
      </div>

      <!-- 建议和解决方案 -->
      <div v-if="suggestions.length > 0" class="suggestions-section">
        <h4>建议和解决方案</h4>
        <el-alert 
          v-for="(suggestion, index) in suggestions"
          :key="index"
          :title="suggestion.title"
          :description="suggestion.description"
          :type="suggestion.type"
          show-icon
          style="margin-bottom: 8px;"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';

const props = defineProps({
  container: {
    type: Object,
    required: true
  }
});

// 响应式数据
const checking = ref(false);
const resetting = ref(false);
const testingIP = ref(false);
const customTesting = ref(false);
const checkResults = ref([]);
const testUrl = ref('https://httpbin.org/ip');
const suggestions = ref([]);
const container= JSON.parse(JSON.stringify(props.container));
// 检查代理状态
const checkProxyStatus = async () => {
  checking.value = true;
  const timestamp = new Date().toLocaleString();
  
  try {
    if (!window.electronAPI?.checkProxyStatus) {
      throw new Error('checkProxyStatus API 不可用');
    }
    
    const result = await window.electronAPI.checkProxyStatus(props.container.id);
    
    checkResults.value.unshift({
      title: '代理状态检查',
      timestamp,
      success: result.success,
      description: result.success ? '代理状态检查完成' : '代理状态检查失败',
      proxyResults: result.results,
      error: result.error
    });
    
    // 生成建议
    generateSuggestions(result);
    
    if (result.success) {
      ElMessage.success('代理状态检查完成');
    } else {
      ElMessage.error(`代理状态检查失败: ${result.error}`);
    }
    
  } catch (error) {
    checkResults.value.unshift({
      title: '代理状态检查',
      timestamp,
      success: false,
      description: '检查过程中发生错误',
      error: error.message
    });
    
    ElMessage.error(`检查失败: ${error.message}`);
  } finally {
    checking.value = false;
  }
};

// 重置代理配置
const resetProxy = async () => {
  resetting.value = true;
  const timestamp = new Date().toLocaleString();
  
  try {
    if (!window.electronAPI?.resetContainerProxy) {
      throw new Error('resetContainerProxy API 不可用');
    }
    
    const result = await window.electronAPI.resetContainerProxy(
      container.id, 
      container.config
    );
    ElMessage.success(`代理已重置: ${result.message}`);
    
    checkResults.value.unshift({
      title: '代理重置',
      timestamp,
      success: result.success,
      description: result.message || (result.success ? '代理重置成功' : '代理重置失败'),
      error: result.error
    });
    
    if (result.success) {
      ElMessage.success('代理重置成功');
      // 重置后自动检查状态
      setTimeout(() => {
        checkProxyStatus();
      }, 2000);
    } else {
      ElMessage.error(`代理重置失败: ${result.error}`);
    }
    
  } catch (error) {
    checkResults.value.unshift({
      title: '代理重置',
      timestamp,
      success: false,
      description: '重置过程中发生错误',
      error: error.message
    });
    
    ElMessage.error(`重置失败: ${error.message}`);
  } finally {
    resetting.value = false;
  }
};

// 测试真实IP
const testRealIP = async () => {
  testingIP.value = true;
  const timestamp = new Date().toLocaleString();
  
  try {
    // 通过webview执行JavaScript来获取IP信息
    const webview = document.querySelector(`#webview_${props.container.id}`);
    if (!webview) {
      throw new Error('无法找到容器的webview');
    }
    
    const ipScript = `
      (async () => {
        try {
          const response = await fetch('https://httpbin.org/ip');
          const data = await response.json();
          return { success: true, ip: data.origin };
        } catch (error) {
          return { success: false, error: error.message };
        }
      })()
    `;
    
    const ipResult = await webview.executeJavaScript(ipScript);
    
    let ipInfo = null;
    if (ipResult.success) {
      // 尝试获取更详细的IP信息
      try {
        const infoScript = `
          (async () => {
            try {
              const response = await fetch('https://ipapi.co/json/');
              const data = await response.json();
              return { 
                success: true, 
                ip: data.ip,
                location: data.city + ', ' + data.country_name,
                isp: data.org
              };
            } catch (error) {
              return { success: false, error: error.message };
            }
          })()
        `;
        
        const infoResult = await webview.executeJavaScript(infoScript);
        if (infoResult.success) {
          ipInfo = infoResult;
        }
      } catch (error) {
        console.warn('获取详细IP信息失败:', error);
      }
    }
    
    checkResults.value.unshift({
      title: '真实IP测试',
      timestamp,
      success: ipResult.success,
      description: ipResult.success ? '成功获取IP信息' : 'IP测试失败',
      ipInfo: ipInfo || { ip: ipResult.ip || 'N/A', location: 'N/A', isp: 'N/A' },
      error: ipResult.error
    });
    
    if (ipResult.success) {
      ElMessage.success('IP测试完成');
    } else {
      ElMessage.error(`IP测试失败: ${ipResult.error}`);
    }
    
  } catch (error) {
    checkResults.value.unshift({
      title: '真实IP测试',
      timestamp,
      success: false,
      description: '测试过程中发生错误',
      error: error.message
    });
    
    ElMessage.error(`测试失败: ${error.message}`);
  } finally {
    testingIP.value = false;
  }
};

// 测试自定义URL
const testCustomUrl = async () => {
  if (!testUrl.value.trim()) {
    ElMessage.warning('请输入要测试的URL');
    return;
  }
  
  customTesting.value = true;
  const timestamp = new Date().toLocaleString();
  
  try {
    const webview = document.querySelector(`#webview_${props.container.id}`);
    if (!webview) {
      throw new Error('无法找到容器的webview');
    }
    
    const testScript = `
      (async () => {
        try {
          const response = await fetch('${testUrl.value}');
          const text = await response.text();
          return { 
            success: true, 
            status: response.status,
            statusText: response.statusText,
            content: text.substring(0, 500) // 只取前500字符
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      })()
    `;
    
    const result = await webview.executeJavaScript(testScript);
    
    checkResults.value.unshift({
      title: `自定义URL测试: ${testUrl.value}`,
      timestamp,
      success: result.success,
      description: result.success ? `请求成功 (${result.status} ${result.statusText})` : '请求失败',
      details: result.success ? {
        '状态码': result.status,
        '状态文本': result.statusText,
        '响应内容': result.content
      } : null,
      error: result.error
    });
    
    if (result.success) {
      ElMessage.success('自定义URL测试完成');
    } else {
      ElMessage.error(`测试失败: ${result.error}`);
    }
    
  } catch (error) {
    checkResults.value.unshift({
      title: `自定义URL测试: ${testUrl.value}`,
      timestamp,
      success: false,
      description: '测试过程中发生错误',
      error: error.message
    });
    
    ElMessage.error(`测试失败: ${error.message}`);
  } finally {
    customTesting.value = false;
  }
};

// 生成建议
const generateSuggestions = (proxyCheckResult) => {
  suggestions.value = [];
  
  if (!proxyCheckResult.success) {
    suggestions.value.push({
      title: '代理检查失败',
      description: '建议检查代理服务器配置是否正确，或尝试重置代理配置',
      type: 'error'
    });
    return;
  }
  
  const proxyResults = proxyCheckResult.results || [];
  const workingProxies = proxyResults.filter(r => r.isProxy);
  const failedProxies = proxyResults.filter(r => !r.isProxy && !r.error);
  const errorResults = proxyResults.filter(r => r.error);
  
  if (workingProxies.length === 0) {
    suggestions.value.push({
      title: '代理未生效',
      description: '所有测试URL都显示未使用代理。建议：1) 检查代理服务器是否正常运行 2) 验证代理配置参数 3) 尝试重置代理配置',
      type: 'error'
    });
  } else if (failedProxies.length > 0) {
    suggestions.value.push({
      title: '部分代理失效',
      description: '某些URL未通过代理，可能存在DNS泄漏或绕过规则',
      type: 'warning'
    });
  } else {
    suggestions.value.push({
      title: '代理工作正常',
      description: '所有测试URL都正确使用了代理',
      type: 'success'
    });
  }
  
  if (errorResults.length > 0) {
    suggestions.value.push({
      title: '网络连接问题',
      description: '某些测试URL无法访问，可能是网络连接或代理服务器问题',
      type: 'warning'
    });
  }
  
  // 根据容器配置给出特定建议
  if (props.container?.config?.proxy?.enabled) {
    if (props.container.config.proxy.type === 'socks5') {
      suggestions.value.push({
        title: 'SOCKS5代理提示',
        description: 'SOCKS5代理通常比HTTP代理有更好的兼容性，但确保防火墙允许连接',
        type: 'info'
      });
    }
    
    if (props.container.config.proxy.username && props.container.config.proxy.password) {
      suggestions.value.push({
        title: '认证代理提示',
        description: '使用认证代理时，确保用户名和密码正确，某些特殊字符可能需要URL编码',
        type: 'info'
      });
    }
  }
};

// 组件挂载时自动检查
onMounted(() => {
  if (props.container?.config?.proxy?.enabled) {
    // 延迟一下让webview完全加载
    setTimeout(() => {
      checkProxyStatus();
    }, 3000);
  }
});
</script>

<style scoped>
.proxy-diagnostic-tool {
  padding: 20px;
}

.container-info,
.proxy-status-section,
.results-section,
.manual-test-section,
.suggestions-section {
  margin-bottom: 24px;
}

.container-info h4,
.proxy-status-section h4,
.results-section h4,
.manual-test-section h4,
.suggestions-section h4 {
  margin-bottom: 16px;
  color: #303133;
  font-weight: 600;
}

.result-card {
  margin-bottom: 12px;
}

.result-content {
  font-size: 14px;
}

.result-content p {
  margin-bottom: 8px;
}

.ip-info {
  background: #f4f4f5;
  padding: 12px;
  border-radius: 4px;
  margin-top: 8px;
}

.error-info {
  margin-top: 8px;
}
</style>
