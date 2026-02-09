export interface WidgetField {
  id: string;
  name: string;
  type: 'string' | 'number' | 'date';
  mappedColumn: string | null;
}

export interface CsvData {
  headers: string[];
  rows: Record<string, any>[];
}

export interface VisiologyData {
  primaryData: {
    items: any[];
  };
}

export interface VisiologyContext {
  general: {
    renderTo: string;
    width: number;
    height: number;
  };
  data: VisiologyData;
  props: Record<string, any>;
}

