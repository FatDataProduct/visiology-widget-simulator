import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// API Plugin для симулятора
function simulatorApiPlugin() {
  // Храним команды и результаты
  let pendingCommand = null
  let lastResult = { errors: [], logs: [] }
  let commandId = 0
  let commandAcknowledged = true // Флаг подтверждения

  return {
    name: 'simulator-api',
    configureServer(server) {
      // Папка для виджетов
      const widgetsDir = path.resolve(process.cwd(), 'widgets')
      if (!fs.existsSync(widgetsDir)) {
        fs.mkdirSync(widgetsDir, { recursive: true })
      }

      // GET /api/status - статус симулятора
      server.middlewares.use('/api/status', (req, res) => {
        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.end(JSON.stringify({ 
          status: 'ready', 
          version: '1.0.0',
          widgetsDir: widgetsDir,
          hasPendingCommand: !!pendingCommand
        }))
      })

      // GET /api/command - получить pending команду (для polling из браузера)
      server.middlewares.use('/api/command', (req, res) => {
        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Access-Control-Allow-Origin', '*')
        
        if (pendingCommand && !commandAcknowledged) {
          console.log(`📤 Sending command #${pendingCommand.id} to browser`)
          res.end(JSON.stringify(pendingCommand))
        } else {
          res.end(JSON.stringify(null))
        }
      })

      // POST /api/ack - браузер подтверждает получение команды
      server.middlewares.use('/api/ack', (req, res) => {
        if (req.method === 'OPTIONS') {
          res.setHeader('Access-Control-Allow-Origin', '*')
          res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
          res.end()
          return
        }
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end('Method not allowed')
          return
        }

        let body = ''
        req.on('data', chunk => body += chunk)
        req.on('end', () => {
          try {
            const { commandId: ackId } = JSON.parse(body)
            if (pendingCommand && pendingCommand.id === ackId) {
              console.log(`✅ Command #${ackId} acknowledged by browser`)
              commandAcknowledged = true
              pendingCommand = null
            }
            res.setHeader('Content-Type', 'application/json')
            res.setHeader('Access-Control-Allow-Origin', '*')
            res.end(JSON.stringify({ success: true }))
          } catch (e) {
            res.statusCode = 400
            res.end(JSON.stringify({ error: e.message }))
          }
        })
      })

      // POST /api/result - браузер отправляет результат выполнения
      server.middlewares.use('/api/result', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end('Method not allowed')
          return
        }

        let body = ''
        req.on('data', chunk => body += chunk)
        req.on('end', () => {
          try {
            lastResult = JSON.parse(body)
            res.setHeader('Content-Type', 'application/json')
            res.setHeader('Access-Control-Allow-Origin', '*')
            res.end(JSON.stringify({ success: true }))
          } catch (e) {
            res.statusCode = 400
            res.end(JSON.stringify({ error: e.message }))
          }
        })
      })

      // GET /api/errors - получить ошибки
      server.middlewares.use('/api/errors', (req, res) => {
        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.end(JSON.stringify(lastResult.errors || []))
      })

      // GET /api/logs - получить логи
      server.middlewares.use('/api/logs', (req, res) => {
        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.end(JSON.stringify(lastResult.logs || []))
      })

      // GET /api/load?name=widget-name - загрузить виджет из папки widgets/
      server.middlewares.use('/api/load', (req, res) => {
        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Access-Control-Allow-Origin', '*')

        const url = new URL(req.url, 'http://localhost')
        const widgetName = url.searchParams.get('name')

        if (!widgetName) {
          res.statusCode = 400
          res.end(JSON.stringify({ error: 'Missing "name" parameter' }))
          return
        }

        const widgetDir = path.join(widgetsDir, widgetName)
        const widgetFile = path.join(widgetDir, 'widget.json')
        const codeFile = path.join(widgetDir, 'code.js')
        const dataFile = path.join(widgetDir, 'data.csv')
        const bindingsFile = path.join(widgetDir, 'bindings.json')

        try {
          // Читаем widget.json
          if (!fs.existsSync(widgetFile)) {
            res.statusCode = 404
            res.end(JSON.stringify({ error: `Widget file not found: ${widgetFile}` }))
            return
          }
          const widget = JSON.parse(fs.readFileSync(widgetFile, 'utf-8'))
          
          // Если есть code.js — читаем код оттуда (приоритет над Code в widget.json)
          if (fs.existsSync(codeFile)) {
            widget.Code = fs.readFileSync(codeFile, 'utf-8')
            console.log(`📄 Loaded code from code.js (${widget.Code.length} chars)`)
          }

          // Читаем data.csv (опционально)
          let csv = null
          if (fs.existsSync(dataFile)) {
            csv = fs.readFileSync(dataFile, 'utf-8')
          }

          // Читаем bindings.json (опционально)
          let bindings = null
          if (fs.existsSync(bindingsFile)) {
            bindings = JSON.parse(fs.readFileSync(bindingsFile, 'utf-8'))
          }

          // Создаём команду для браузера
          commandId++
          commandAcknowledged = false
          pendingCommand = {
            id: commandId,
            type: 'loadAll',
            data: { widget, csv, bindings }
          }
          console.log(`📥 Created command #${commandId} for widget "${widgetName}"`)

          res.end(JSON.stringify({ 
            success: true, 
            commandId,
            message: `Widget "${widgetName}" queued for loading. Browser will pick it up.`,
            files: {
              widget: widgetFile,
              code: fs.existsSync(codeFile) ? codeFile : null,
              csv: csv ? dataFile : null,
              bindings: bindings ? bindingsFile : null
            }
          }))

        } catch (e) {
          res.statusCode = 500
          res.end(JSON.stringify({ error: e.message }))
        }
      })

      // POST /api/load-direct - загрузить виджет напрямую (JSON в body)
      server.middlewares.use('/api/load-direct', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end('Method not allowed')
          return
        }

        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Access-Control-Allow-Origin', '*')

        let body = ''
        req.on('data', chunk => body += chunk)
        req.on('end', () => {
          try {
            const data = JSON.parse(body)
            
            commandId++
            commandAcknowledged = false
            pendingCommand = {
              id: commandId,
              type: 'loadAll',
              data: data
            }
            console.log(`📥 Created command #${commandId} (direct load)`)

            res.end(JSON.stringify({ 
              success: true, 
              commandId,
              message: 'Data queued for loading'
            }))
          } catch (e) {
            res.statusCode = 400
            res.end(JSON.stringify({ error: e.message }))
          }
        })
      })

      // GET /api/widgets - список виджетов
      server.middlewares.use('/api/widgets', (req, res) => {
        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Access-Control-Allow-Origin', '*')

        try {
          const widgets = fs.readdirSync(widgetsDir)
            .filter(name => {
              const widgetPath = path.join(widgetsDir, name, 'widget.json')
              return fs.existsSync(widgetPath)
            })
            .map(name => ({
              name,
              path: path.join(widgetsDir, name),
              hasData: fs.existsSync(path.join(widgetsDir, name, 'data.csv')),
              hasBindings: fs.existsSync(path.join(widgetsDir, name, 'bindings.json'))
            }))

          res.end(JSON.stringify(widgets))
        } catch (e) {
          res.end(JSON.stringify([]))
        }
      })

      console.log('\n📡 Simulator API ready:')
      console.log('   GET  /api/status     - Check simulator status')
      console.log('   GET  /api/load?name= - Load widget from widgets/ folder')
      console.log('   POST /api/load-direct - Load widget from JSON body')
      console.log('   GET  /api/errors     - Get execution errors')
      console.log('   GET  /api/logs       - Get execution logs')
      console.log('   GET  /api/widgets    - List available widgets')
      console.log('')
    }
  }
}

export default defineConfig({
  plugins: [react(), simulatorApiPlugin()],
  server: {
    port: 3000,
    open: true
  }
})
