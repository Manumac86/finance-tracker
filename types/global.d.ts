// Global type declarations for test environment

declare global {
  // Jest globals
  namespace globalThis {
    var resizeWindow: (width: number, height: number) => void;
  }
  
  // Window object extensions for testing
  interface Window {
    resizeWindow: (width: number, height: number) => void;
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
  
  // Speech Recognition API types
  interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
    onend: ((this: SpeechRecognition, ev: Event) => any) | null;
    onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
    onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
    start(): void;
    stop(): void;
  }

  interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
  }

  interface SpeechRecognitionResultList {
    readonly length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
  }

  interface SpeechRecognitionResult {
    readonly length: number;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
  }

  interface SpeechRecognitionAlternative {
    readonly transcript: string;
    readonly confidence: number;
  }

  interface SpeechRecognitionErrorEvent extends Event {
    readonly error: string;
    readonly message: string;
  }
}

// jsPDF autoTable plugin type declarations
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: {
      startY?: number;
      head?: any[][];
      body?: any[][];
      theme?: 'striped' | 'grid' | 'plain';
      styles?: {
        fontSize?: number;
        cellPadding?: number;
        overflow?: 'linebreak' | 'ellipsize' | 'visible' | 'hidden';
        halign?: 'left' | 'center' | 'right';
        valign?: 'top' | 'middle' | 'bottom';
      };
      headStyles?: {
        fillColor?: number[] | string;
        textColor?: number[] | string;
        fontSize?: number;
        halign?: 'left' | 'center' | 'right';
      };
      columnStyles?: {
        [key: number]: {
          cellWidth?: number | 'auto' | 'wrap';
          halign?: 'left' | 'center' | 'right';
          valign?: 'top' | 'middle' | 'bottom';
        };
      };
      margin?: {
        top?: number;
        right?: number;
        bottom?: number;
        left?: number;
      };
      showHead?: 'everyPage' | 'firstPage' | 'never';
      showFoot?: 'everyPage' | 'lastPage' | 'never';
      pageBreak?: 'auto' | 'avoid' | 'always';
      rowPageBreak?: 'auto' | 'avoid';
      tableWidth?: number | 'auto' | 'wrap';
    }) => jsPDF;
  }
}

export {};