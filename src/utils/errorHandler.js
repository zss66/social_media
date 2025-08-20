import { ElMessage, ElNotification } from 'element-plus'

/**
 * 错误类型枚举
 */
export const ErrorTypes = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  PERMISSION_ERROR: 'PERMISSION_ERROR',
  CONTAINER_ERROR: 'CONTAINER_ERROR',
  TRANSLATION_ERROR: 'TRANSLATION_ERROR',
  PROXY_ERROR: 'PROXY_ERROR',
  SYSTEM_ERROR: 'SYSTEM_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
}

/**
 * 自定义错误类
 */
export class AppError extends Error {
  constructor(message, type = ErrorTypes.UNKNOWN_ERROR, code = null, details = null) {
    super(message)
    this.name = 'AppError'
    this.type = type
    this.code = code
    this.details = details
    this.timestamp = new Date().toISOString()
    
    // 确保错误堆栈正确
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError)
    }
  }
  
  /**
   * 转换为普通对象
   */
  toObject() {
    return {
      name: this.name,
      message: this.message,
      type: this.type,
      code: this.code,
      details: this.details,
      timestamp: this.timestamp,
      stack: this.stack
    }
  }
  
  /**
   * 转换为JSON字符串
   */
  toJSON() {
    return JSON.stringify(this.toObject(), null, 2)
  }
}

/**
 * 网络错误类
 */
export class NetworkError extends AppError {
  constructor(message, statusCode = null, url = null) {
    super(message, ErrorTypes.NETWORK_ERROR, statusCode, { url })
    this.name = 'NetworkError'
    this.statusCode = statusCode
    this.url = url
  }
}

/**
 * 验证错误类
 */
export class ValidationError extends AppError {
  constructor(message, field = null, value = null) {
    super(message, ErrorTypes.VALIDATION_ERROR, null, { field, value })
    this.name = 'ValidationError'
    this.field = field
    this.value = value
  }
}

/**
 * 容器错误类
 */
export class ContainerError extends AppError {
  constructor(message, containerId = null, action = null) {
    super(message, ErrorTypes.CONTAINER_ERROR, null, { containerId, action })
    this.name = 'ContainerError'
    this.containerId = containerId
    this.action = action
  }
}

/**
 * 错误处理器类
 */
class ErrorHandler {
  
  constructor() {
    this.errorLog = []
    this.maxLogSize = 1000
    this.showNotifications = true
    this.reportErrors = false
    this.reportEndpoint = ''
    
    // 绑定全局错误处理
    this.setupGlobalHandlers()
  }
  
  /**
   * 设置全局错误处理
   */
  setupGlobalHandlers() {
    // 捕获未处理的Promise拒绝
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason)
      this.handleError(new AppError(
        event.reason?.message || 'Unhandled promise rejection',
        ErrorTypes.SYSTEM_ERROR,
        null,
        { reason: event.reason }
      ))
      
      // 阻止默认行为（在控制台显示错误）
      event.preventDefault()
    })
    
    // 捕获全局JavaScript错误
    window.addEventListener('error', (event) => {
      console.error('Global error:', event.error)
      this.handleError(new AppError(
        event.error?.message || event.message || 'Global JavaScript error',
        ErrorTypes.SYSTEM_ERROR,
        null,
        { 
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          error: event.error
        }
      ))
    })
    
    // 捕获资源加载错误
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        this.handleError(new AppError(
          `Failed to load resource: ${event.target.src || event.target.href}`,
          ErrorTypes.NETWORK_ERROR,
          null,
          { 
            tagName: event.target.tagName,
            src: event.target.src,
            href: event.target.href
          }
        ))
      }
    }, true)
  }
  
  /**
   * 处理错误
   * @param {Error|AppError} error - 错误对象
   * @param {boolean} showUser - 是否向用户显示
   * @param {boolean} log - 是否记录日志
   */
  handleError(error, showUser = true, log = true) {
     if (
    error?.message?.includes('ResizeObserver loop completed') ||
    error?.name === 'ResizeObserverLoopError'
  ) {
    return
  }
    // 规范化错误对象
    const normalizedError = this.normalizeError(error)
    
    // 记录错误日志
    if (log) {
      this.logError(normalizedError)
    }
    
    // 向用户显示错误
    if (showUser && this.showNotifications) {
      this.showErrorToUser(normalizedError)
    }
    
    // 上报错误（如果启用）
    if (this.reportErrors) {
      this.reportError(normalizedError)
    }
    
    return normalizedError
  }
  
  /**
   * 规范化错误对象
   * @param {Error|AppError|string} error - 错误
   * @returns {AppError} 规范化的错误对象
   */
  normalizeError(error) {
    if (error instanceof AppError) {
      return error
    }
    
    if (error instanceof Error) {
      return new AppError(error.message, ErrorTypes.UNKNOWN_ERROR, null, {
        originalName: error.name,
        stack: error.stack
      })
    }
    
    if (typeof error === 'string') {
      return new AppError(error, ErrorTypes.UNKNOWN_ERROR)
    }
    
    return new AppError('Unknown error occurred', ErrorTypes.UNKNOWN_ERROR, null, error)
  }
  
  /**
   * 记录错误日志
   * @param {AppError} error - 错误对象
   */
  logError(error) {
    const logEntry = {
      ...error.toObject(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString()
    }
    
    // 添加到错误日志
    this.errorLog.unshift(logEntry)
    
    // 限制日志大小
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(0, this.maxLogSize)
    }
    
    // 保存到本地存储
    try {
      localStorage.setItem('error-log', JSON.stringify(this.errorLog.slice(0, 100)))
    } catch (e) {
      console.warn('Failed to save error log to localStorage:', e)
    }
    
    // 在控制台输出详细错误信息
    console.group(`🚨 ${error.type}: ${error.message}`)
    console.error('Error details:', logEntry)
    if (error.stack) {
      console.error('Stack trace:', error.stack)
    }
    console.groupEnd()
  }
  
  /**
   * 向用户显示错误
   * @param {AppError} error - 错误对象
   */
  showErrorToUser(error) {
    const userMessage = this.getUserFriendlyMessage(error)
    console.error(error)
    // 根据错误严重程度选择不同的显示方式
    if (this.isCriticalError(error)) {
      ElNotification({
        title: '系统错误',
        message: userMessage,
        type: 'error',
        duration: 0, // 不自动关闭
        showClose: true
      })
    } else {
      ElMessage({
        message: userMessage,
        type: 'error',
        duration: 5000,
        showClose: true
      })
    }
  }
  
  /**
   * 获取用户友好的错误消息
   * @param {AppError} error - 错误对象
   * @returns {string} 用户友好的消息
   */
  getUserFriendlyMessage(error) {
    const friendlyMessages = {
      [ErrorTypes.NETWORK_ERROR]: '网络连接失败，请检查网络设置',
      [ErrorTypes.VALIDATION_ERROR]: '输入数据有误，请检查后重试',
      [ErrorTypes.PERMISSION_ERROR]: '权限不足，无法执行此操作',
      [ErrorTypes.CONTAINER_ERROR]: '容器操作失败，请重试',
      [ErrorTypes.TRANSLATION_ERROR]: '翻译服务暂时不可用',
      [ErrorTypes.PROXY_ERROR]: '代理连接失败，请检查代理设置',
      [ErrorTypes.SYSTEM_ERROR]: '系统内部错误，请重启应用'
    }
    
    const friendlyMessage = friendlyMessages[error.type]
    return friendlyMessage || error.message || '发生未知错误'
  }
  
  /**
   * 判断是否为严重错误
   * @param {AppError} error - 错误对象
   * @returns {boolean} 是否为严重错误
   */
  isCriticalError(error) {
    const criticalTypes = [
      ErrorTypes.SYSTEM_ERROR,
      ErrorTypes.PERMISSION_ERROR
    ]
    
    return criticalTypes.includes(error.type) || 
           (error.code && error.code >= 500)
  }
  
  /**
   * 上报错误到服务器
   * @param {AppError} error - 错误对象
   */
  async reportError(error) {
    if (!this.reportEndpoint) return
    
    try {
      const reportData = {
        ...error.toObject(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        appVersion: process.env.VUE_APP_VERSION || '1.0.0',
        timestamp: new Date().toISOString()
      }
      
      await fetch(this.reportEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reportData)
      })
    } catch (reportError) {
      console.warn('Failed to report error:', reportError)
    }
  }
  
  /**
   * 获取错误日志
   * @param {number} limit - 返回数量限制
   * @returns {Array} 错误日志数组
   */
  getErrorLog(limit = 50) {
    return this.errorLog.slice(0, limit)
  }
  
  /**
   * 清空错误日志
   */
  clearErrorLog() {
    this.errorLog = []
    localStorage.removeItem('error-log')
  }
  
  /**
   * 导出错误日志
   * @param {string} format - 导出格式 (json|csv)
   * @returns {string} 导出的数据
   */
  exportErrorLog(format = 'json') {
    if (format === 'csv') {
      const headers = ['timestamp', 'type', 'message', 'code', 'url']
      const rows = this.errorLog.map(error => [
        error.timestamp,
        error.type,
        error.message.replace(/"/g, '""'), // 转义CSV中的引号
        error.code || '',
        error.details?.url || ''
      ])
      
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n')
      
      return csvContent
    } else {
      return JSON.stringify(this.errorLog, null, 2)
    }
  }
  
  /**
   * 配置错误处理器
   * @param {object} options - 配置选项
   */
  configure(options = {}) {
    if (typeof options.showNotifications === 'boolean') {
      this.showNotifications = options.showNotifications
    }
    
    if (typeof options.reportErrors === 'boolean') {
      this.reportErrors = options.reportErrors
    }
    
    if (typeof options.reportEndpoint === 'string') {
      this.reportEndpoint = options.reportEndpoint
    }
    
    if (typeof options.maxLogSize === 'number') {
      this.maxLogSize = options.maxLogSize
    }
  }
}

// 创建全局错误处理器实例
const errorHandler = new ErrorHandler()

/**
 * 设置Vue应用的错误处理
 * @param {object} app - Vue应用实例
 */
export function setupErrorHandler(app) {
  // Vue错误处理
  app.config.errorHandler = (err, instance, info) => {
    console.error('Vue error:', err, info)
    errorHandler.handleError(new AppError(
      err.message || 'Vue component error',
      ErrorTypes.SYSTEM_ERROR,
      null,
      { 
        componentName: instance?.$options.name || 'Unknown',
        errorInfo: info,
        stack: err.stack
      }
    ))
  }
  
  // Vue警告处理
  app.config.warnHandler = (msg, instance, trace) => {
    console.warn('Vue warning:', msg, trace)
  }
}

/**
 * 创建错误边界装饰器
 * @param {Function} handler - 错误处理函数
 */
export function errorBoundary(handler = null) {
  return function (target, propertyKey, descriptor) {
    const originalMethod = descriptor.value
    
    descriptor.value = async function (...args) {
      try {
        const result = await originalMethod.apply(this, args)
        return result
      } catch (error) {
        const handledError = errorHandler.handleError(error)
        
        if (handler) {
          return handler(handledError, this, args)
        }
        
        throw handledError
      }
    }
    
    return descriptor
  }
}

/**
 * 异步函数错误包装器
 * @param {Function} asyncFn - 异步函数
 * @param {Function} errorHandler - 错误处理函数
 * @returns {Function} 包装后的函数
 */
export function wrapAsync(asyncFn, errorHandler = null) {
  return async function (...args) {
    try {
      return await asyncFn.apply(this, args)
    } catch (error) {
      const handledError = errorHandler?.handleError 
        ? errorHandler.handleError(error)
        : errorHandler.handleError(error)
      
      if (errorHandler && typeof errorHandler === 'function') {
        return errorHandler(handledError, this, args)
      }
      
      throw handledError
    }
  }
}

// 导出错误处理器实例和错误类
export default errorHandler
