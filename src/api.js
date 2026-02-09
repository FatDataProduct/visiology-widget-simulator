// API для интеграции с Cursor IDE
// Хранит состояние для обмена данными

class SimulatorAPI {
  constructor() {
    this.listeners = new Set()
    this.errorLog = []
    this.maxLogSize = 100
    
    // Перехватываем console.error
    const originalError = console.error
    console.error = (...args) => {
      this.logError('console', args.map(a => String(a)).join(' '))
      originalError.apply(console, args)
    }
    
    // Перехватываем ошибки окна
    window.addEventListener('error', (event) => {
      this.logError('runtime', event.message, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      })
    })
    
    window.addEventListener('unhandledrejection', (event) => {
      this.logError('promise', String(event.reason))
    })
  }
  
  logError(type, message, details = {}) {
    const entry = {
      type,
      message,
      details,
      timestamp: new Date().toISOString()
    }
    this.errorLog.push(entry)
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog.shift()
    }
    this.notify({ type: 'error', data: entry })
  }
  
  logSuccess(message) {
    this.notify({ type: 'success', data: { message, timestamp: new Date().toISOString() } })
  }
  
  subscribe(callback) {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }
  
  notify(event) {
    this.listeners.forEach(cb => cb(event))
  }
  
  getErrors() {
    return [...this.errorLog]
  }
  
  clearErrors() {
    this.errorLog = []
  }
  
  // Экспортируем текущее состояние для Cursor
  getState() {
    return {
      errors: this.getErrors(),
      timestamp: new Date().toISOString()
    }
  }
}

export const simulatorAPI = new SimulatorAPI()

// Глобальный доступ для Cursor browser tools
window.VISIO_SIMULATOR = {
  // Загрузить виджет (JSON)
  loadWidget: null, // будет установлено из App.jsx
  
  // Загрузить данные (CSV string)
  loadData: null,
  
  // Получить ошибки
  getErrors: () => simulatorAPI.getErrors(),
  
  // Очистить ошибки
  clearErrors: () => simulatorAPI.clearErrors(),
  
  // Получить текущее состояние
  getState: () => simulatorAPI.getState(),
  
  // Подписаться на события
  subscribe: (cb) => simulatorAPI.subscribe(cb),
  
  // Принудительно обновить виджет
  refresh: null,
  
  // Экспортировать текущий виджет
  exportWidget: null,
  
  // Версия API
  version: '1.0.0'
}

export default simulatorAPI

