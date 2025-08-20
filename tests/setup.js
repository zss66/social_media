// Jest测试环境设置
import 'jest-extended'
import { config } from '@vue/test-utils'

// 全局测试配置
global.console = {
  ...console,
  // 在测试中禁用一些console方法
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}

// Mock Element Plus组件
jest.mock('element-plus', () => ({
  ElMessage: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn()
  },
  ElNotification: jest.fn(),
  ElMessageBox: {
    confirm: jest.fn(() => Promise.resolve()),
    alert: jest.fn(() => Promise.resolve()),
    prompt: jest.fn(() => Promise.resolve())
  },
  ElLoading: {
    service: jest.fn(() => ({
      close: jest.fn()
    }))
  }
}))

// Mock Vue Router
const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  go: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  resolve: jest.fn(),
  currentRoute: { value: { path: '/', params: {}, query: {} } }
}

// Mock Vuex Store
const mockStore = {
  state: {},
  getters: {},
  commit: jest.fn(),
  dispatch: jest.fn(),
  subscribe: jest.fn(),
  subscribeAction: jest.fn()
}

// 全局注册mock
config.global.mocks = {
  $router: mockRouter,
  $route: mockRouter.currentRoute.value,
  $store: mockStore,
  $t: (msg) => msg, // i18n mock
  $tc: (msg) => msg,
  $te: () => true,
  $d: (date) => date,
  $n: (number) => number
}

// Mock window对象的方法
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn()
  }))
})

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
}))

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
}))

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn((cb) => setTimeout(cb, 0))
global.cancelAnimationFrame = jest.fn((id) => clearTimeout(id))

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
}
global.localStorage = localStorageMock

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
}
global.sessionStorage = sessionStorageMock

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    ok: true,
    status: 200,
    statusText: 'OK'
  })
)

// Mock Electron APIs
global.electronAPI = {
  minimize: jest.fn(),
  close: jest.fn(),
  openExternal: jest.fn(),
  showNotification: jest.fn(),
  createContainerSession: jest.fn(),
  testProxy: jest.fn(),
  translateText: jest.fn(),
  takeScreenshot: jest.fn(),
  saveFile: jest.fn(),
  loadFile: jest.fn()
}

global.nodeAPI = {
  versions: {
    node: '18.0.0',
    electron: '25.0.0',
    chrome: '114.0.0'
  }
}

global.platformAPI = {
  platform: 'darwin',
  arch: 'x64',
  isWindows: false,
  isMac: true,
  isLinux: false
}

// Mock performance
global.performance = {
  ...global.performance,
  now: jest.fn(() => Date.now()),
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByType: jest.fn(() => []),
  getEntriesByName: jest.fn(() => [])
}

// Mock URL
global.URL.createObjectURL = jest.fn(() => 'mocked-url')
global.URL.revokeObjectURL = jest.fn()

// 设置默认超时
jest.setTimeout(10000)

// 在每个测试后清理mock
afterEach(() => {
  jest.clearAllMocks()
  // 重置console mocks如果需要看到真实输出
  // console.log.mockRestore()
})

// 全局错误处理
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection in test:', reason)
})

// 自定义匹配器
expect.extend({
  toBeValidId(received) {
    const pass = typeof received === 'string' && received.length > 0
    return {
      message: () => `expected ${received} to be a valid ID`,
      pass
    }
  },
  
  toBeValidUrl(received) {
    const pass = /^https?:\/\//.test(received)
    return {
      message: () => `expected ${received} to be a valid URL`,
      pass
    }
  },
  
  toBeValidEmail(received) {
    const pass = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(received)
    return {
      message: () => `expected ${received} to be a valid email`,
      pass
    }
  }
})