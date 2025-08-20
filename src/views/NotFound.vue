<template>
  <div class="not-found-page">
    <div class="not-found-container">
      <!-- 404动画 -->
      <div class="error-animation">
        <div class="error-number">
          <span class="four">4</span>
          <span class="zero">
            <div class="zero-inner">
              <div class="eye left-eye">
                <div class="pupil"></div>
              </div>
              <div class="eye right-eye">
                <div class="pupil"></div>
              </div>
              <div class="mouth"></div>
            </div>
          </span>
          <span class="four">4</span>
        </div>
      </div>
      
      <!-- 错误信息 -->
      <div class="error-content">
        <h1 class="error-title">页面未找到</h1>
        <p class="error-description">
          抱歉，您访问的页面不存在或已被移除。
          请检查URL是否正确，或返回主页继续浏览。
        </p>
        
        <!-- 建议操作 */
        <div class="suggested-actions">
          <h3>您可以尝试：</h3>
          <ul class="action-list">
            <li>
              <el-icon><Home /></el-icon>
              <span>返回主页</span>
            </li>
            <li>
              <el-icon><Back /></el-icon>
              <span>返回上一页</span>
            </li>
            <li>
              <el-icon><Search /></el-icon>
              <span>搜索相关内容</span>
            </li>
            <li>
              <el-icon><Setting /></el-icon>
              <span>检查应用设置</span>
            </li>
          </ul>
        </div>
        
        <!-- 操作按钮 -->
        <div class="action-buttons">
          <el-button type="primary" @click="goHome" :icon="House">
            返回主页
          </el-button>
          <el-button @click="goBack" :icon="Back">
            返回上一页
          </el-button>
          <el-button @click="reportIssue" :icon="Warning">
            报告问题
          </el-button>
        </div>
        
        <!-- 快捷导航 */
        <div class="quick-navigation">
          <h3>快捷导航</h3>
          <div class="nav-cards">
            <div class="nav-card" @click="navigateTo('/')">
              <el-icon><Monitor /></el-icon>
              <span>容器管理</span>
            </div>
            <div class="nav-card" @click="navigateTo('/settings')">
              <el-icon><Setting /></el-icon>
              <span>应用设置</span>
            </div>
            <div class="nav-card" @click="navigateTo('/about')">
              <el-icon><InfoFilled /></el-icon>
              <span>关于应用</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 装饰元素 -->
      <div class="decoration-elements">
        <div class="floating-shape shape-1"></div>
        <div class="floating-shape shape-2"></div>
        <div class="floating-shape shape-3"></div>
        <div class="floating-shape shape-4"></div>
      </div>
    </div>
  </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { 
  House , 
  Back, 
  Search, 
  Setting, 
  Warning, 
  Monitor, 
  InfoFilled 
} from '@element-plus/icons-vue'

const router = useRouter()

// 眼睛跟随鼠标效果
let mouseX = ref(0)
let mouseY = ref(0)

const handleMouseMove = (event) => {
  mouseX.value = event.clientX
  mouseY.value = event.clientY
  updateEyePosition()
}

const updateEyePosition = () => {
  const eyes = document.querySelectorAll('.pupil')
  eyes.forEach(eye => {
    const eyeRect = eye.getBoundingClientRect()
    const eyeCenterX = eyeRect.left + eyeRect.width / 2
    const eyeCenterY = eyeRect.top + eyeRect.height / 2
    
    const angle = Math.atan2(mouseY.value - eyeCenterY, mouseX.value - eyeCenterX)
    const distance = Math.min(8, Math.sqrt(
      Math.pow(mouseX.value - eyeCenterX, 2) + Math.pow(mouseY.value - eyeCenterY, 2)
    ) / 10)
    
    const x = Math.cos(angle) * distance
    const y = Math.sin(angle) * distance
    
    eye.style.transform = `translate(${x}px, ${y}px)`
  })
}

// 页面导航方法
const goHome = () => {
  router.push('/')
  ElMessage.success('已返回主页')
}

const goBack = () => {
  if (window.history.length > 1) {
    router.go(-1)
  } else {
    goHome()
  }
}

const navigateTo = (path) => {
  router.push(path)
}

const reportIssue = () => {
  ElMessage.info('正在打开问题反馈页面...')
  // 这里可以打开问题反馈页面或邮件客户端
  if (window.electronAPI && window.electronAPI.openExternal) {
    window.electronAPI.openExternal('https://github.com/project/issues')
  } else {
    window.open('https://github.com/project/issues', '_blank')
  }
}

// 生命周期钩子
onMounted(() => {
  document.addEventListener('mousemove', handleMouseMove)
  
  // 设置页面标题
  document.title = '页面未找到 - Multi Social Platform'
})

onUnmounted(() => {
  document.removeEventListener('mousemove', handleMouseMove)
})
</script>

<style scoped>
.not-found-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  position: relative;
  overflow: hidden;
}

[data-theme="dark"] .not-found-page {
  background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
}

.not-found-container {
  max-width: 800px;
  width: 100%;
  text-align: center;
  position: relative;
  z-index: 2;
}

/* 404动画 */
.error-animation {
  margin-bottom: 40px;
}

.error-number {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  font-size: 120px;
  font-weight: bold;
  color: white;
  text-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.four {
  animation: bounce 2s infinite;
}

.four:nth-child(3) {
  animation-delay: 0.2s;
}

.zero {
  position: relative;
  width: 120px;
  height: 120px;
  border: 8px solid white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  animation: float 3s ease-in-out infinite;
}

.zero-inner {
  position: relative;
  width: 80px;
  height: 80px;
}

.eye {
  position: absolute;
  width: 16px;
  height: 16px;
  background: white;
  border-radius: 50%;
  top: 20px;
}

.left-eye {
  left: 20px;
}

.right-eye {
  right: 20px;
}

.pupil {
  position: absolute;
  width: 8px;
  height: 8px;
  background: #333;
  border-radius: 50%;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  transition: transform 0.1s ease;
}

.mouth {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  width: 30px;
  height: 15px;
  border: 3px solid white;
  border-top: none;
  border-radius: 0 0 30px 30px;
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-20px);
  }
  60% {
    transform: translateY(-10px);
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-20px);
  }
}

/* 错误内容 */
.error-content {
  color: white;
}

.error-title {
  font-size: 32px;
  font-weight: 600;
  margin: 0 0 16px 0;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.error-description {
  font-size: 16px;
  line-height: 1.6;
  margin: 0 0 32px 0;
  opacity: 0.9;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
}

/* 建议操作 */
.suggested-actions {
  margin: 32px 0;
  padding: 24px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  backdrop-filter: blur(10px);
  text-align: left;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
}

.suggested-actions h3 {
  margin: 0 0 16px 0;
  font-size: 18px;
  text-align: center;
}

.action-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.action-list li {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.action-list li:last-child {
  border-bottom: none;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin: 32px 0;
  flex-wrap: wrap;
}

.action-buttons .el-button {
  padding: 12px 24px;
  font-size: 14px;
  border-radius: 8px;
}

/* 快捷导航 */
.quick-navigation {
  margin-top: 40px;
}

.quick-navigation h3 {
  margin: 0 0 20px 0;
  font-size: 20px;
}

.nav-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  max-width: 500px;
  margin: 0 auto;
}

.nav-card {
  padding: 20px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  backdrop-filter: blur(10px);
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.nav-card:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

.nav-card .el-icon {
  font-size: 24px;
}

.nav-card span {
  font-size: 14px;
  font-weight: 500;
}

/* 装饰元素 */
.decoration-elements {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 1;
}

.floating-shape {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  animation: float-shape 6s infinite ease-in-out;
}

.shape-1 {
  width: 60px;
  height: 60px;
  top: 20%;
  left: 10%;
  animation-delay: 0s;
}

.shape-2 {
  width: 40px;
  height: 40px;
  top: 60%;
  right: 15%;
  animation-delay: 1s;
}

.shape-3 {
  width: 80px;
  height: 80px;
  bottom: 20%;
  left: 20%;
  animation-delay: 2s;
}

.shape-4 {
  width: 30px;
  height: 30px;
  top: 30%;
  right: 30%;
  animation-delay: 3s;
}

@keyframes float-shape {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
  }
  33% {
    transform: translateY(-20px) rotate(120deg);
  }
  66% {
    transform: translateY(10px) rotate(240deg);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .error-number {
    font-size: 80px;
    gap: 10px;
  }
  
  .zero {
    width: 80px;
    height: 80px;
  }
  
  .zero-inner {
    width: 60px;
    height: 60px;
  }
  
  .error-title {
    font-size: 24px;
  }
  
  .error-description {
    font-size: 14px;
  }
  
  .action-buttons {
    flex-direction: column;
    align-items: center;
  }
  
  .action-buttons .el-button {
    width: 200px;
  }
  
  .nav-cards {
    grid-template-columns: 1fr;
  }
  
  .suggested-actions {
    margin: 20px 10px;
    padding: 16px;
  }
}

@media (max-width: 480px) {
  .not-found-page {
    padding: 10px;
  }
  
  .error-number {
    font-size: 60px;
    gap: 5px;
  }
  
  .zero {
    width: 60px;
    height: 60px;
  }
  
  .zero-inner {
    width: 40px;
    height: 40px;
  }
  
  .eye {
    width: 8px;
    height: 8px;
    top: 12px;
  }
  
  .left-eye {
    left: 10px;
  }
  
  .right-eye {
    right: 10px;
  }
  
  .pupil {
    width: 4px;
    height: 4px;
  }
  
  .mouth {
    bottom: 10px;
    width: 20px;
    height: 10px;
  }
}

/* 高对比度模式支持 */
@media (prefers-contrast: high) {
  .not-found-page {
    background: #000;
    color: #fff;
  }
  
  .nav-card,
  .suggested-actions {
    background: rgba(255, 255, 255, 0.3);
    border: 2px solid #fff;
  }
}

/* 减少动画（用户偏好） */
@media (prefers-reduced-motion: reduce) {
  .four,
  .zero,
  .floating-shape {
    animation: none;
  }
  
  .nav-card {
    transition: none;
  }
  
  .pupil {
    transition: none;
  }
}
</style>