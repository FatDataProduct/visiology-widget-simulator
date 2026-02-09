import React, { useState, useRef } from 'react'
import { X, Download, Upload, Copy, Check, FileJson, AlertCircle } from 'lucide-react'

function ImportExportModal({ onClose, onExport, onImport }) {
  const [activeTab, setActiveTab] = useState('export')
  const [importText, setImportText] = useState('')
  const [exportText, setExportText] = useState('')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)

  const handleGenerateExport = () => {
    const data = onExport()
    setExportText(JSON.stringify(data, null, 2))
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(exportText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const data = onExport()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${data.Name || 'widget'}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleImportFromText = () => {
    try {
      setError(null)
      const data = JSON.parse(importText)
      validateImportData(data)
      onImport(data)
    } catch (e) {
      setError(e.message)
    }
  }

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          setError(null)
          const text = e.target?.result
          const data = JSON.parse(text)
          validateImportData(data)
          setImportText(text)
          onImport(data)
        } catch (err) {
          setError(err.message)
        }
      }
      reader.readAsText(file)
    }
  }

  const validateImportData = (data) => {
    if (!data || typeof data !== 'object') {
      throw new Error('Некорректный формат JSON')
    }
    if (!data.Code && !data.Name) {
      throw new Error('JSON должен содержать поле Code или Name')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-visio-panel rounded-2xl border border-visio-border w-full max-w-2xl max-h-[80vh] overflow-hidden animate-fade-in shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-visio-border">
          <div className="flex items-center gap-3">
            <FileJson className="w-5 h-5 text-visio-accent" />
            <h2 className="text-lg font-semibold text-visio-text">Импорт / Экспорт виджета</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-visio-text-muted hover:text-visio-text hover:bg-visio-bg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-visio-border">
          <button
            onClick={() => setActiveTab('export')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'export' 
                ? 'text-visio-accent border-b-2 border-visio-accent bg-visio-accent/5' 
                : 'text-visio-text-muted hover:text-visio-text'
            }`}
          >
            <Download className="w-4 h-4" />
            Экспорт
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'import' 
                ? 'text-visio-accent border-b-2 border-visio-accent bg-visio-accent/5' 
                : 'text-visio-text-muted hover:text-visio-text'
            }`}
          >
            <Upload className="w-4 h-4" />
            Импорт
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-auto max-h-[calc(80vh-140px)]">
          {activeTab === 'export' ? (
            <div className="space-y-4">
              <p className="text-sm text-visio-text-muted">
                Экспортируйте виджет в формате JSON, совместимом с Visiology
              </p>
              
              <div className="flex gap-2">
                <button
                  onClick={handleGenerateExport}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-visio-bg border border-visio-border text-visio-text hover:border-visio-accent transition-colors text-sm"
                >
                  Сгенерировать JSON
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-visio-accent hover:bg-visio-accent-hover text-white transition-colors text-sm font-medium"
                >
                  <Download className="w-4 h-4" />
                  Скачать .json
                </button>
              </div>

              {exportText && (
                <div className="relative">
                  <textarea
                    value={exportText}
                    readOnly
                    className="w-full h-80 px-4 py-3 rounded-lg bg-visio-bg border border-visio-border text-visio-text text-xs font-mono resize-none focus:outline-none"
                  />
                  <button
                    onClick={handleCopy}
                    className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-1 rounded bg-visio-panel/80 text-visio-text-muted hover:text-visio-text text-xs transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-visio-success" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Скопировано' : 'Копировать'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-visio-text-muted">
                Импортируйте виджет из JSON файла Visiology
              </p>

              {/* File upload */}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-8 rounded-lg border-2 border-dashed border-visio-border hover:border-visio-accent hover:bg-visio-accent/5 transition-all text-visio-text-muted hover:text-visio-accent"
                >
                  <Upload className="w-6 h-6" />
                  <div className="text-center">
                    <div className="font-medium">Загрузить .json файл</div>
                    <div className="text-xs mt-1">или перетащите файл сюда</div>
                  </div>
                </button>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-visio-border" />
                <span className="text-xs text-visio-text-muted">или вставьте JSON</span>
                <div className="flex-1 h-px bg-visio-border" />
              </div>

              <textarea
                value={importText}
                onChange={(e) => {
                  setImportText(e.target.value)
                  setError(null)
                }}
                placeholder='{"Name": "...", "Code": "...", ...}'
                className="w-full h-48 px-4 py-3 rounded-lg bg-visio-bg border border-visio-border text-visio-text text-xs font-mono resize-none focus:outline-none focus:border-visio-accent"
              />

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-visio-error/10 border border-visio-error/30 text-visio-error text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <button
                onClick={handleImportFromText}
                disabled={!importText.trim()}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-visio-accent hover:bg-visio-accent-hover disabled:bg-visio-accent/50 disabled:cursor-not-allowed text-white transition-colors text-sm font-medium"
              >
                <Upload className="w-4 h-4" />
                Импортировать
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ImportExportModal

