import { useState } from 'react';
import { DataPanel } from './components/DataPanel';
import { ConfigPanel } from './components/ConfigPanel';
import { PreviewPanel } from './components/PreviewPanel';
import { EditorPanel } from './components/EditorPanel';
import { CsvData, WidgetField } from './types';
import { DndContext, DragEndEvent } from '@dnd-kit/core';

const DEFAULT_CODE = `(function() {
    var widgetGuid = w.general.renderTo;
    var container = document.getElementById(widgetGuid);
    
    // Clear container
    container.innerHTML = '<h3>Debug Widget</h3>';
    
    if (!w.data || !w.data.primaryData) {
        container.innerHTML += '<p>No data</p>';
        return;
    }
    
    var items = w.data.primaryData.items;
    container.innerHTML += '<p>Rows: ' + items.length + '</p>';
    
    var table = document.createElement('table');
    table.style.border = '1px solid black';
    
    items.forEach(item => {
        var tr = document.createElement('tr');
        Object.keys(item).forEach(key => {
            var td = document.createElement('td');
            td.style.border = '1px solid #ccc';
            td.innerText = item[key];
            tr.appendChild(td);
        });
        table.appendChild(tr);
    });
    
    container.appendChild(table);
})();`;

function App() {
  const [csvData, setCsvData] = useState<CsvData | null>(null);
  const [fields, setFields] = useState<WidgetField[]>([
    { id: 'f1', name: 'Category', type: 'string', mappedColumn: null },
    { id: 'f2', name: 'Value', type: 'number', mappedColumn: null },
  ]);
  const [code, setCode] = useState<string>(DEFAULT_CODE);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.data.current) {
      const columnName = active.data.current.columnName;
      const fieldId = over.id;
      
      setFields(fields.map(f => 
        f.id === fieldId ? { ...f, mappedColumn: columnName } : f
      ));
    }
  };

  const handleAddField = () => {
    const id = `f${fields.length + 1}`;
    setFields([...fields, { id, name: `New Field ${fields.length + 1}`, type: 'string', mappedColumn: null }]);
  };

  const handleRemoveField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
  };

  const handleRemoveMapping = (id: string) => {
    setFields(fields.map(f => f.id === id ? { ...f, mappedColumn: null } : f));
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="h-screen w-full flex flex-col bg-gray-50 overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-4 py-2 flex items-center shadow-sm z-10">
          <h1 className="text-lg font-semibold text-gray-700">Visiology Simulator (Local)</h1>
        </header>
        
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Data & Config */}
          <div className="w-[400px] flex flex-col border-r border-gray-200 bg-white shadow-lg z-10">
            <div className="h-1/2 border-b border-gray-200 overflow-hidden">
              <DataPanel data={csvData} onDataLoad={setCsvData} />
            </div>
            <div className="h-1/2 overflow-hidden bg-gray-50">
              <ConfigPanel 
                fields={fields} 
                onAddField={handleAddField}
                onRemoveField={handleRemoveField}
                onRemoveMapping={handleRemoveMapping}
              />
            </div>
          </div>

          {/* Middle: Code Editor */}
          <div className="flex-1 border-r border-gray-200 bg-[#1e1e1e] flex flex-col min-w-[400px]">
             <EditorPanel code={code} onChange={setCode} />
          </div>

          {/* Right: Preview */}
          <div className="w-[500px] bg-white flex flex-col">
            <PreviewPanel 
              code={code} 
              data={csvData} 
              fields={fields} 
            />
          </div>
        </div>
      </div>
    </DndContext>
  );
}

export default App;
