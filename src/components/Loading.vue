<template>
  <div class="loading-container" :class="{ fullscreen: fullscreen }">
    <div class="loading-content">
      <!-- 加载动画 -->
      <div class="loading-spinner" :class="spinnerType">
        <div v-if="spinnerType === 'default'" class="spinner-default">
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div>
        
        <div v-else-if="spinnerType === 'dots'" class="spinner-dots">
          <div></div>
          <div></div>
          <div></div>
        </div>
        
        <div v-else-if="spinnerType === 'pulse'" class="spinner-pulse">
          <div></div>
        </div>
        
        <div v-else-if="spinnerType === 'wave'" class="spinner-wave">
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div>
        
        <div v-else-if="spinnerType === 'circular'" class="spinner-circular">
          <svg viewBox="25 25 50 50">
            <circle cx="50" cy="50" r="20"></circle>
          </svg>
        </div>
      </div>
      
      <!-- 加载文本 -->
      <div v-if="text" class="loading-text">
        {{ text }}
      </div>
      
      <!-- 进度条 -->
      <div v-if="showProgress" class="loading-progress">
        <div class="progress-bar">
          <div 
            class="progress-fill" 
            :style="{ width: `${progress}%` }"
          ></div>
        </div>
        <div class="progress-text">{{ progress }}%</div>
      </div>
      
      <!-- 详细信息 -->
      <div v-if="details" class="loading-details">
        {{ details }}
      </div>
    </div>
    
    <!-- 背景遮罩 -->
    <div v-if="overlay" class="loading-overlay"></div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

// Props
const props = defineProps({
  // 是否全屏显示
  fullscreen: {
    type: Boolean,
    default: false
  },
  
  // 加载文本
  text: {
    type: String,
    default: '加载中...'
  },
  
  // 详细信息
  details: {
    type: String,
    default: ''
  },
  
  // 加载动画类型
  spinnerType: {
    type: String,
    default: 'default',
    validator: (value) => {
      return ['default', 'dots', 'pulse', 'wave', 'circular'].includes(value)
    }
  },
  
  // 是否显示进度条
  showProgress: {
    type: Boolean,
    default: false
  },
  
  // 进度值 (0-100)
  progress: {
    type: Number,
    default: 0,
    validator: (value) => value >= 0 && value <= 100
  },
  
  // 是否显示背景遮罩
  overlay: {
    type: Boolean,
    default: true
  },
  
  // 加载器大小
  size: {
    type: String,
    default: 'medium',
    validator: (value) => ['small', 'medium', 'large'].includes(value)
  },
  
  // 主题色
  color: {
    type: String,
    default: '#409EFF'
  }
})

// 计算属性
const containerClass = computed(() => ({
  'loading-fullscreen': props.fullscreen,
  [`loading-${props.size}`]: true
}))
</script>

<style scoped>
.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.loading-container.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
}

[data-theme="dark"] .loading-container.fullscreen {
  background: rgba(0, 0, 0, 0.8);
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 20px;
  border-radius: 8px;
  background: white;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

[data-theme="dark"] .loading-content {
  background: #2c2c2c;
  color: #e0e0e0;
}

.loading-spinner {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 默认加载动画 */
.spinner-default {
  display: inline-block;
  position: relative;
  width: 40px;
  height: 40px;
}

.spinner-default div {
  box-sizing: border-box;
  display: block;
  position: absolute;
  width: 32px;
  height: 32px;
  margin: 4px;
  border: 3px solid #409EFF;
  border-radius: 50%;
  animation: spin-default 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
  border-color: #409EFF transparent transparent transparent;
}

.spinner-default div:nth-child(1) { animation-delay: -0.45s; }
.spinner-default div:nth-child(2) { animation-delay: -0.3s; }
.spinner-default div:nth-child(3) { animation-delay: -0.15s; }

@keyframes spin-default {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 点状加载动画 */
.spinner-dots {
  display: inline-block;
  position: relative;
  width: 40px;
  height: 10px;
}

.spinner-dots div {
  position: absolute;
  top: 0;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #409EFF;
  animation: dots-scale 1.4s infinite ease-in-out;
}

.spinner-dots div:nth-child(1) {
  left: 0;
  animation-delay: -0.32s;
}

.spinner-dots div:nth-child(2) {
  left: 16px;
  animation-delay: -0.16s;
}

.spinner-dots div:nth-child(3) {
  left: 32px;
}

@keyframes dots-scale {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

/* 脉冲加载动画 */
.spinner-pulse {
  display: inline-block;
  width: 40px;
  height: 40px;
}

.spinner-pulse div {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background-color: #409EFF;
  opacity: 0.6;
  animation: pulse-scale 1s infinite ease-in-out;
}

@keyframes pulse-scale {
  0% {
    transform: scale(0);
  }
  100% {
    transform: scale(1);
    opacity: 0;
  }
}

/* 波浪加载动画 */
.spinner-wave {
  display: inline-block;
  width: 40px;
  height: 40px;
}

.spinner-wave div {
  background-color: #409EFF;
  height: 100%;
  width: 6px;
  display: inline-block;
  margin-right: 2px;
  animation: wave-stretch 1.2s infinite ease-in-out;
}

.spinner-wave div:nth-child(2) { animation-delay: -1.1s; }
.spinner-wave div:nth-child(3) { animation-delay: -1.0s; }
.spinner-wave div:nth-child(4) { animation-delay: -0.9s; }
.spinner-wave div:nth-child(5) { animation-delay: -0.8s; }

@keyframes wave-stretch {
  0%, 40%, 100% {
    transform: scaleY(0.4);
  }
  20% {
    transform: scaleY(1.0);
  }
}

/* 圆形加载动画 */
.spinner-circular {
  width: 40px;
  height: 40px;
  animation: circular-rotate 2s linear infinite;
}

.spinner-circular svg {
  width: 100%;
  height: 100%;
}

.spinner-circular circle {
  fill: none;
  stroke: #409EFF;
  stroke-width: 3;
  stroke-linecap: round;
  stroke-dasharray: 90, 150;
  stroke-dashoffset: 0;
  animation: circular-dash 1.5s ease-in-out infinite;
}

@keyframes circular-rotate {
  100% {
    transform: rotate(360deg);
  }
}

@keyframes circular-dash {
  0% {
    stroke-dasharray: 1, 150;
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -35;
  }
  100% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -124;
  }
}

/* 加载文本 */
.loading-text {
  font-size: 14px;
  color: #606266;
  margin-top: 8px;
}

[data-theme="dark"] .loading-text {
  color: #a8abb2;
}

/* 进度条 */
.loading-progress {
  width: 200px;
  margin-top: 16px;
}

.progress-bar {
  width: 100%;
  height: 4px;
  background-color: #f0f0f0;
  border-radius: 2px;
  overflow: hidden;
}

[data-theme="dark"] .progress-bar {
  background-color: #404040;
}

.progress-fill {
  height: 100%;
  background-color: #409EFF;
  border-radius: 2px;
  transition: width 0.3s ease;
  background-image: linear-gradient(
    45deg,
    rgba(255, 255, 255, 0.2) 25%,
    transparent 25%,
    transparent 50%,
    rgba(255, 255, 255, 0.2) 50%,
    rgba(255, 255, 255, 0.2) 75%,
    transparent 75%,
    transparent
  );
  background-size: 20px 20px;
  animation: progress-stripes 1s linear infinite;
}

@keyframes progress-stripes {
  0% { background-position: 0 0; }
  100% { background-position: 20px 0; }
}

.progress-text {
  text-align: center;
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
}

/* 详细信息 */
.loading-details {
  font-size: 12px;
  color: #909399;
  text-align: center;
  max-width: 300px;
  line-height: 1.4;
}

/* 背景遮罩 */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
  z-index: -1;
}

[data-theme="dark"] .loading-overlay {
  background: rgba(0, 0, 0, 0.7);
}

/* 尺寸变体 */
.loading-small .loading-spinner {
  transform: scale(0.8);
}

.loading-small .loading-text {
  font-size: 12px;
}

.loading-large .loading-spinner {
  transform: scale(1.2);
}

.loading-large .loading-text {
  font-size: 16px;
}

/* 响应式 */
@media (max-width: 768px) {
  .loading-content {
    padding: 16px;
    margin: 20px;
    max-width: calc(100vw - 40px);
  }
  
  .loading-progress {
    width: 150px;
  }
  
  .loading-details {
    max-width: 250px;
  }
}
</style>