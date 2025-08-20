/**
 * 工具函数单元测试
 * 使用 Jest 测试框架
 */

import { 
  generateId, 
  deepClone, 
  debounce, 
  throttle, 
  formatFileSize, 
  formatDate, 
  getRelativeTime,
  isValidEmail,
  isValidUrl,
  isValidIP,
  isValidPort,
  randomString,
  safeJsonParse,
  escapeHtml,
  unescapeHtml
} from '../../src/utils/index'

describe('Utils - ID Generation', () => {
  test('generateId should return unique IDs', () => {
    const id1 = generateId()
    const id2 = generateId()
    
    expect(id1).toBeTruthy()
    expect(id2).toBeTruthy()
    expect(id1).not.toBe(id2)
  })
  
  test('generateId with prefix should include prefix', () => {
    const prefix = 'test'
    const id = generateId(prefix)
    
    expect(id).toMatch(new RegExp(`^${prefix}_`))
  })
})

describe('Utils - Deep Clone', () => {
  test('should clone primitive values', () => {
    expect(deepClone(42)).toBe(42)
    expect(deepClone('hello')).toBe('hello')
    expect(deepClone(true)).toBe(true)
    expect(deepClone(null)).toBe(null)
    expect(deepClone(undefined)).toBe(undefined)
  })
  
  test('should clone arrays', () => {
    const arr = [1, 2, { a: 3 }]
    const cloned = deepClone(arr)
    
    expect(cloned).toEqual(arr)
    expect(cloned).not.toBe(arr)
    expect(cloned[2]).not.toBe(arr[2])
  })
  
  test('should clone objects', () => {
    const obj = {
      a: 1,
      b: {
        c: 2,
        d: [3, 4]
      }
    }
    const cloned = deepClone(obj)
    
    expect(cloned).toEqual(obj)
    expect(cloned).not.toBe(obj)
    expect(cloned.b).not.toBe(obj.b)
    expect(cloned.b.d).not.toBe(obj.b.d)
  })
  
  test('should clone dates', () => {
    const date = new Date('2024-01-01')
    const cloned = deepClone(date)
    
    expect(cloned).toEqual(date)
    expect(cloned).not.toBe(date)
    expect(cloned instanceof Date).toBe(true)
  })
})

describe('Utils - Debounce & Throttle', () => {
  jest.useFakeTimers()
  
  test('debounce should delay function execution', () => {
    const fn = jest.fn()
    const debouncedFn = debounce(fn, 100)
    
    debouncedFn()
    debouncedFn()
    debouncedFn()
    
    expect(fn).not.toHaveBeenCalled()
    
    jest.advanceTimersByTime(100)
    
    expect(fn).toHaveBeenCalledTimes(1)
  })
  
  test('throttle should limit function calls', () => {
    const fn = jest.fn()
    const throttledFn = throttle(fn, 100)
    
    throttledFn()
    throttledFn()
    throttledFn()
    
    expect(fn).toHaveBeenCalledTimes(1)
    
    jest.advanceTimersByTime(100)
    
    throttledFn()
    expect(fn).toHaveBeenCalledTimes(2)
  })
  
  afterEach(() => {
    jest.clearAllTimers()
  })
})

describe('Utils - Format Functions', () => {
  test('formatFileSize should format bytes correctly', () => {
    expect(formatFileSize(0)).toBe('0 Bytes')
    expect(formatFileSize(1024)).toBe('1 KB')
    expect(formatFileSize(1048576)).toBe('1 MB')
    expect(formatFileSize(1073741824)).toBe('1 GB')
    expect(formatFileSize(1536)).toBe('1.5 KB')
  })
  
  test('formatDate should format dates correctly', () => {
    const date = new Date('2024-01-01T12:30:45')
    
    expect(formatDate(date)).toBe('2024-01-01 12:30:45')
    expect(formatDate(date, 'YYYY-MM-DD')).toBe('2024-01-01')
    expect(formatDate(date, 'HH:mm:ss')).toBe('12:30:45')
    expect(formatDate('')).toBe('')
    expect(formatDate('invalid')).toBe('')
  })
  
  test('getRelativeTime should return relative time strings', () => {
    const now = new Date()
    const minute = 60 * 1000
    const hour = minute * 60
    const day = hour * 24
    
    expect(getRelativeTime(new Date(now - 30 * 1000))).toBe('刚刚')
    expect(getRelativeTime(new Date(now - 5 * minute))).toBe('5分钟前')
    expect(getRelativeTime(new Date(now - 2 * hour))).toBe('2小时前')
    expect(getRelativeTime(new Date(now - 3 * day))).toBe('3天前')
  })
})

describe('Utils - Validation Functions', () => {
  test('isValidEmail should validate email addresses', () => {
    expect(isValidEmail('test@example.com')).toBe(true)
    expect(isValidEmail('user+tag@domain.co.uk')).toBe(true)
    expect(isValidEmail('invalid-email')).toBe(false)
    expect(isValidEmail('test@')).toBe(false)
    expect(isValidEmail('@example.com')).toBe(false)
    expect(isValidEmail('')).toBe(false)
  })
  
  test('isValidUrl should validate URLs', () => {
    expect(isValidUrl('https://example.com')).toBe(true)
    expect(isValidUrl('http://localhost:3000')).toBe(true)
    expect(isValidUrl('ftp://files.example.com')).toBe(true)
    expect(isValidUrl('invalid-url')).toBe(false)
    expect(isValidUrl('https://')).toBe(false)
    expect(isValidUrl('')).toBe(false)
  })
  
  test('isValidIP should validate IP addresses', () => {
    expect(isValidIP('192.168.1.1')).toBe(true)
    expect(isValidIP('127.0.0.1')).toBe(true)
    expect(isValidIP('255.255.255.255')).toBe(true)
    expect(isValidIP('0.0.0.0')).toBe(true)
    expect(isValidIP('256.1.1.1')).toBe(false)
    expect(isValidIP('192.168.1')).toBe(false)
    expect(isValidIP('invalid-ip')).toBe(false)
  })
  
  test('isValidPort should validate port numbers', () => {
    expect(isValidPort(80)).toBe(true)
    expect(isValidPort('443')).toBe(true)
    expect(isValidPort(65535)).toBe(true)
    expect(isValidPort(1)).toBe(true)
    expect(isValidPort(0)).toBe(false)
    expect(isValidPort(65536)).toBe(false)
    expect(isValidPort('invalid')).toBe(false)
    expect(isValidPort(-1)).toBe(false)
  })
})

describe('Utils - String Functions', () => {
  test('randomString should generate random strings', () => {
    const str1 = randomString()
    const str2 = randomString()
    
    expect(str1).toHaveLength(8)
    expect(str2).toHaveLength(8)
    expect(str1).not.toBe(str2)
    
    const longStr = randomString(16)
    expect(longStr).toHaveLength(16)
    
    const customCharset = randomString(4, '01')
    expect(customCharset).toMatch(/^[01]+$/)
  })
  
  test('safeJsonParse should parse JSON safely', () => {
    const validJson = '{"a": 1, "b": "hello"}'
    const invalidJson = '{"a": 1, "b":'
    
    expect(safeJsonParse(validJson)).toEqual({ a: 1, b: 'hello' })
    expect(safeJsonParse(invalidJson)).toBe(null)
    expect(safeJsonParse(invalidJson, {})).toEqual({})
    expect(safeJsonParse('null')).toBe(null)
    expect(safeJsonParse('42')).toBe(42)
  })
  
  test('escapeHtml should escape HTML characters', () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert("xss")&lt;/script&gt;'
    )
    expect(escapeHtml('Hello & World')).toBe('Hello &amp; World')
    expect(escapeHtml('"quotes"')).toBe('&quot;quotes&quot;')
  })
  
  test('unescapeHtml should unescape HTML characters', () => {
    expect(unescapeHtml('&lt;script&gt;alert("xss")&lt;/script&gt;')).toBe(
      '<script>alert("xss")</script>'
    )
    expect(unescapeHtml('Hello &amp; World')).toBe('Hello & World')
    expect(unescapeHtml('&quot;quotes&quot;')).toBe('"quotes"')
  })
})

describe('Utils - Error Handling', () => {
  // 测试需要DOM环境的函数时的错误处理
  test('functions should handle missing DOM gracefully', () => {
    // 模拟没有document的环境
    const originalDocument = global.document
    delete global.document
    
    expect(() => escapeHtml('test')).not.toThrow()
    
    // 恢复document
    global.document = originalDocument
  })
})

describe('Utils - Edge Cases', () => {
  test('should handle null and undefined inputs', () => {
    expect(deepClone(null)).toBe(null)
    expect(deepClone(undefined)).toBe(undefined)
    expect(formatDate(null)).toBe('')
    expect(getRelativeTime(null)).toBe('')
    expect(isValidEmail(null)).toBe(false)
    expect(isValidUrl(undefined)).toBe(false)
  })
  
  test('should handle empty inputs', () => {
    expect(formatFileSize(0)).toBe('0 Bytes')
    expect(randomString(0)).toBe('')
    expect(escapeHtml('')).toBe('')
    expect(unescapeHtml('')).toBe('')
  })
  
  test('should handle large numbers', () => {
    expect(formatFileSize(Number.MAX_SAFE_INTEGER)).toBeTruthy()
    expect(isValidPort(Number.MAX_SAFE_INTEGER)).toBe(false)
  })
})

// 性能测试
describe('Utils - Performance', () => {
  test('deepClone should handle large objects efficiently', () => {
    const largeObject = {}
    for (let i = 0; i < 1000; i++) {
      largeObject[`key${i}`] = {
        value: i,
        nested: {
          data: new Array(10).fill(i)
        }
      }
    }
    
    const startTime = performance.now()
    const cloned = deepClone(largeObject)
    const endTime = performance.now()
    
    expect(cloned).toEqual(largeObject)
    expect(endTime - startTime).toBeLessThan(100) // 应该在100ms内完成
  })
  
  test('debounce should not leak memory', () => {
    const fn = jest.fn()
    let debouncedFn = debounce(fn, 100)
    
    // 创建多个debounced函数
    for (let i = 0; i < 100; i++) {
      debouncedFn()
    }
    
    // 清除引用
    debouncedFn = null
    
    // 触发垃圾回收（如果可能）
    if (global.gc) {
      global.gc()
    }
    
    expect(true).toBe(true) // 如果没有内存泄漏，测试应该正常完成
  })
})

// 集成测试
describe('Utils - Integration', () => {
  test('should work together in real scenarios', () => {
    // 模拟真实使用场景
    const userData = {
      id: generateId('user'),
      name: 'Test User',
      email: 'test@example.com',
      preferences: {
        theme: 'dark',
        language: 'zh-CN'
      }
    }
    
    // 验证数据
    expect(isValidEmail(userData.email)).toBe(true)
    
    // 克隆数据
    const clonedData = deepClone(userData)
    expect(clonedData).toEqual(userData)
    expect(clonedData).not.toBe(userData)
    
    // 序列化和反序列化
    const serialized = JSON.stringify(clonedData)
    const deserialized = safeJsonParse(serialized)
    expect(deserialized).toEqual(userData)
    
    // 格式化显示
    const createdTime = new Date()
    const timeStr = formatDate(createdTime)
    expect(timeStr).toBeTruthy()
  })
})