import React, { useState, useRef, useCallback } from 'react'
import { Code, Copy, Check, RotateCcw, FileCode, FileJson, AlertCircle } from 'lucide-react'

// Функция для извлечения кода из JSON виджета Visiology
function extractCodeFromJson(text) {
  try {
    // Проверяем, похоже ли это на JSON
    const trimmed = text.trim()
    if (trimmed.startsWith('{') && trimmed.includes('"Code"')) {
      const parsed = JSON.parse(trimmed)
      if (parsed.Code) {
        return {
          code: parsed.Code,
          name: parsed.Name || null,
          dataRoles: parsed.DataRoles || null,
          properties: parsed.Properties || null,
          isJson: true
        }
      }
    }
  } catch (e) {
    // Не JSON или невалидный JSON
  }
  return { code: text, isJson: false }
}

function CodeEditor({ code, onChange, onImportJson }) {
  const [copied, setCopied] = useState(false)
  const [jsonDetected, setJsonDetected] = useState(false)
  const textareaRef = useRef(null)
  const lineNumbersRef = useRef(null)

  const lines = code.split('\n')
  const lineCount = lines.length

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleReset = () => {
    if (confirm('Сбросить код к исходному состоянию?')) {
      onChange(`// Пример кода виджета Visiology
// Объект w содержит: w.general, w.data, w.props

(function() {
  const container = w.general.renderTo;
  const data = w.data;
  
  // Ваш код здесь...
  
})();`)
    }
  }

  const handleScroll = (e) => {
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = e.target.scrollTop
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const start = e.target.selectionStart
      const end = e.target.selectionEnd
      const newCode = code.substring(0, start) + '  ' + code.substring(end)
      onChange(newCode)
      setTimeout(() => {
        e.target.selectionStart = e.target.selectionEnd = start + 2
      }, 0)
    }
  }

  const handleChange = useCallback((e) => {
    const newText = e.target.value
    const result = extractCodeFromJson(newText)
    
    if (result.isJson) {
      // JSON виджета обнаружен - извлекаем код
      setJsonDetected(true)
      setTimeout(() => setJsonDetected(false), 3000)
      
      // Если есть callback для импорта полного JSON
      if (onImportJson && (result.dataRoles || result.properties)) {
        onImportJson({
          Name: result.name,
          Code: result.code,
          DataRoles: result.dataRoles,
          Properties: result.properties
        })
      } else {
        onChange(result.code)
      }
    } else {
      onChange(newText)
    }
  }, [onChange, onImportJson])

  const handlePaste = useCallback((e) => {
    const pastedText = e.clipboardData.getData('text')
    const result = extractCodeFromJson(pastedText)
    
    if (result.isJson) {
      e.preventDefault()
      setJsonDetected(true)
      setTimeout(() => setJsonDetected(false), 3000)
      
      if (onImportJson && (result.dataRoles || result.properties)) {
        onImportJson({
          Name: result.name,
          Code: result.code,
          DataRoles: result.dataRoles,
          Properties: result.properties
        })
      } else {
        onChange(result.code)
      }
    }
  }, [onChange, onImportJson])

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-visio-panel border-b border-visio-border">
        <div className="flex items-center gap-2">
          <Code className="w-4 h-4 text-visio-accent" />
          <span className="font-medium text-visio-text">JavaScript код</span>
          <span className="text-xs px-2 py-0.5 rounded bg-visio-bg text-visio-text-muted">
            {lineCount} строк
          </span>
          {jsonDetected && (
            <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-visio-success/20 text-visio-success animate-pulse">
              <FileJson className="w-3 h-3" />
              JSON импортирован!
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-visio-text-muted hover:text-visio-text hover:bg-visio-bg transition-colors text-xs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-visio-success" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Скопировано' : 'Копировать'}
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-visio-text-muted hover:text-visio-text hover:bg-visio-bg transition-colors text-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Сброс
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 flex overflow-hidden bg-[#0d1117]">
        {/* Line numbers */}
        <div 
          ref={lineNumbersRef}
          className="flex-shrink-0 overflow-hidden select-none bg-visio-bg/50 border-r border-visio-border"
        >
          <div className="px-3 py-3 font-mono text-sm leading-6">
            {Array.from({ length: lineCount }, (_, i) => (
              <div 
                key={i} 
                className="text-right text-visio-text-muted/50 h-6"
              >
                {i + 1}
              </div>
            ))}
          </div>
        </div>

        {/* Code textarea */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={code}
            onChange={handleChange}
            onPaste={handlePaste}
            onScroll={handleScroll}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            className="absolute inset-0 w-full h-full px-4 py-3 bg-transparent text-visio-text font-mono text-sm leading-6 resize-none focus:outline-none overflow-auto"
            style={{
              caretColor: '#00b4d8',
              tabSize: 2,
            }}
            placeholder="Вставьте код виджета или JSON файл..."
          />
        </div>
      </div>

      {/* Footer with hints */}
      <div className="flex items-center justify-between px-4 py-2 bg-visio-panel border-t border-visio-border text-xs text-visio-text-muted">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <FileCode className="w-3.5 h-3.5" />
            JavaScript
          </span>
          <span>Tab = 2 пробела</span>
          <span className="text-visio-accent">💡 Можно вставлять JSON виджета</span>
        </div>
        <div className="flex items-center gap-4">
          <span>w.general.renderTo</span>
          <span>w.data</span>
          <span>w.props</span>
        </div>
      </div>
    </div>
  )
}

export default CodeEditor
