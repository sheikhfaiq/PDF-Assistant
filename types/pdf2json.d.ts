// types/pdf2json.d.ts
declare module 'pdf2json' {
  import { EventEmitter } from 'events';

  interface PdfRun {
    T: string;
  }

  interface PdfTextItem {
    R?: PdfRun[];
    ch?: { str: string }[];
  }

  interface PdfPage {
    Texts?: PdfTextItem[];
  }

  interface PdfData {
    Pages: PdfPage[];
  }

  class PDFParser extends EventEmitter {
    constructor();
    parseBuffer(buffer: Buffer): void;
    on(event: 'pdfParser_dataReady', listener: (pdfData: PdfData) => void): this;
    on(event: 'pdfParser_dataError', listener: (err: Error) => void): this;
  }

  export = PDFParser;
}
