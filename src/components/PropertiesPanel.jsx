import React, { useState } from 'react'
import { Settings, ChevronDown, ChevronUp, Plus, Trash2, Type, Hash, ToggleLeft, Palette } from 'lucide-react'

const PROPERTY_TYPES = {
  0: { name: 'Строка', icon: Type },
  1: { name: 'Число', icon: Hash },
  2: { name: 'Булево', icon: ToggleLeft },
  3: { name: 'Цвет', icon: Palette },
}

function PropertiesPanel({ properties, onChange, onAdd, onRemove }) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newProp, setNewProp] = useState({
    DisplayName: '',
    PropertyName: '',
    Value: '',
    Type: 0
  })

  const handleAddSubmit = () => {
    if (!newProp.DisplayName || !newProp.PropertyName) return
    
    let defaultValue = newProp.Value
    if (newProp.Type === 1) defaultValue = parseFloat(defaultValue) || 0
    if (newProp.Type === 2) defaultValue = defaultValue === 'true' || defaultValue === true
    
    onAdd({
      ...newProp,
      Value: defaultValue
    })
    setNewProp({ DisplayName: '', PropertyName: '', Value: '', Type: 0 })
    setShowAddForm(false)
  }

  const renderInput = (prop) => {
    const type = prop.Type

    if (type === 2) {
      // Boolean
      return (
        <button
          onClick={() => onChange(prop.PropertyName, !prop.Value)}
          className={`w-full px-3 py-2 rounded-lg text-sm text-left transition-colors ${
            prop.Value 
              ? 'bg-visio-success/20 text-visio-success border border-visio-success/30' 
              : 'bg-visio-bg text-visio-text-muted border border-visio-border'
          }`}
        >
          {prop.Value ? 'Включено' : 'Выключено'}
        </button>
      )
    }

    if (type === 3) {
      // Color
      return (
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={prop.Value || '#000000'}
            onChange={(e) => onChange(prop.PropertyName, e.target.value)}
            className="w-10 h-10 rounded cursor-pointer border border-visio-border"
          />
          <input
            type="text"
            value={prop.Value || ''}
            onChange={(e) => onChange(prop.PropertyName, e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg bg-visio-bg border border-visio-border text-visio-text text-sm focus:outline-none focus:border-visio-accent font-mono"
            placeholder="#000000"
          />
        </div>
      )
    }

    if (type === 1) {
      // Number
      return (
        <input
          type="number"
          value={prop.Value ?? ''}
          onChange={(e) => onChange(prop.PropertyName, parseFloat(e.target.value) || 0)}
          className="w-full px-3 py-2 rounded-lg bg-visio-bg border border-visio-border text-visio-text text-sm focus:outline-none focus:border-visio-accent"
        />
      )
    }

    // String (default)
    return (
      <input
        type="text"
        value={prop.Value ?? ''}
        onChange={(e) => onChange(prop.PropertyName, e.target.value)}
        className="w-full px-3 py-2 rounded-lg bg-visio-bg border border-visio-border text-visio-text text-sm focus:outline-none focus:border-visio-accent"
      />
    )
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Header */}
      <div 
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-visio-bg/50 transition-colors border-b border-visio-border"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-visio-accent" />
          <span className="font-medium text-visio-text">Свойства</span>
          <span className="text-xs px-1.5 py-0.5 rounded bg-visio-bg text-visio-text-muted">
            {properties.length}
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-visio-text-muted" />
        ) : (
          <ChevronDown className="w-4 h-4 text-visio-text-muted" />
        )}
      </div>

      {isExpanded && (
        <div className="flex-1 overflow-auto px-4 py-3 animate-fade-in">
          <p className="text-xs text-visio-text-muted mb-3">
            Доступ через <code className="px-1 py-0.5 rounded bg-visio-bg text-visio-accent">w.props.propertyName</code>
          </p>

          <div className="space-y-3">
            {properties.map((prop, idx) => {
              const TypeIcon = PROPERTY_TYPES[prop.Type]?.icon || Type
              return (
                <div key={prop.PropertyName} className="group">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-visio-text-muted flex items-center gap-1.5">
                      <TypeIcon className="w-3 h-3" />
                      {prop.DisplayName}
                    </label>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <code className="text-[10px] text-visio-text-muted/50 font-mono">
                        {prop.PropertyName}
                      </code>
                      <button
                        onClick={() => onRemove(prop.PropertyName)}
                        className="p-1 text-visio-text-muted hover:text-visio-error transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  {renderInput(prop)}
                </div>
              )
            })}
          </div>

          {/* Add property form */}
          {showAddForm ? (
            <div className="mt-4 p-3 rounded-lg border border-visio-accent/30 bg-visio-accent/5 space-y-2">
              <input
                type="text"
                value={newProp.DisplayName}
                onChange={(e) => setNewProp(prev => ({ ...prev, DisplayName: e.target.value }))}
                placeholder="Отображаемое имя"
                className="w-full px-3 py-2 rounded-lg bg-visio-bg border border-visio-border text-visio-text text-sm focus:outline-none focus:border-visio-accent"
              />
              <input
                type="text"
                value={newProp.PropertyName}
                onChange={(e) => setNewProp(prev => ({ 
                  ...prev, 
                  PropertyName: e.target.value.replace(/[^a-zA-Z0-9_]/g, '') 
                }))}
                placeholder="propertyName (camelCase)"
                className="w-full px-3 py-2 rounded-lg bg-visio-bg border border-visio-border text-visio-text text-sm focus:outline-none focus:border-visio-accent font-mono"
              />
              <select
                value={newProp.Type}
                onChange={(e) => setNewProp(prev => ({ ...prev, Type: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 rounded-lg bg-visio-bg border border-visio-border text-visio-text text-sm focus:outline-none focus:border-visio-accent appearance-none cursor-pointer"
              >
                {Object.entries(PROPERTY_TYPES).map(([key, val]) => (
                  <option key={key} value={key}>{val.name}</option>
                ))}
              </select>
              <input
                type="text"
                value={newProp.Value}
                onChange={(e) => setNewProp(prev => ({ ...prev, Value: e.target.value }))}
                placeholder="Значение по умолчанию"
                className="w-full px-3 py-2 rounded-lg bg-visio-bg border border-visio-border text-visio-text text-sm focus:outline-none focus:border-visio-accent"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 px-3 py-2 rounded-lg border border-visio-border text-visio-text-muted hover:text-visio-text hover:bg-visio-bg transition-colors text-sm"
                >
                  Отмена
                </button>
                <button
                  onClick={handleAddSubmit}
                  className="flex-1 px-3 py-2 rounded-lg bg-visio-accent hover:bg-visio-accent-hover text-white transition-colors text-sm font-medium"
                >
                  Добавить
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-4 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-dashed border-visio-border hover:border-visio-accent hover:bg-visio-accent/5 transition-all text-sm text-visio-text-muted hover:text-visio-accent"
            >
              <Plus className="w-4 h-4" />
              Добавить свойство
            </button>
          )}

          {/* Props preview */}
          <div className="mt-4 p-3 rounded-lg bg-visio-bg/50 border border-visio-border/50">
            <div className="text-xs text-visio-text-muted mb-2">Объект w.props:</div>
            <pre className="text-[10px] text-visio-accent font-mono overflow-auto max-h-32">
{JSON.stringify(
  properties.reduce((acc, p) => ({ ...acc, [p.PropertyName]: p.Value }), {}),
  null, 2
)}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}

export default PropertiesPanel

