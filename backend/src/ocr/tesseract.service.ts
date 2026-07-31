import fs from 'fs';
import { createWorker } from 'tesseract.js';
import { PDFParse } from 'pdf-parse';
import { logger } from '../utils/logger.js';

export interface OcrResult {
  text: string;
  confidence: number;
  durationMs: number;
}

export interface ITesseractService {
  extractText(filePath: string, mimeType: string): Promise<OcrResult>;
}

export class TesseractService implements ITesseractService {
  public async extractText(filePath: string, mimeType: string): Promise<OcrResult> {
    const startTime = Date.now();
    logger.info(`OCR started for file: ${filePath} (${mimeType})`);

    try {
      if (mimeType === 'application/pdf') {
        try {
          const dataBuffer = await fs.promises.readFile(filePath);
          const parser = new PDFParse(new Uint8Array(dataBuffer));
          const pdfData = await parser.getText();

          if (pdfData && pdfData.text && pdfData.text.replace(/-- \d+ of \d+ --/g, '').trim().length > 0) {
            const durationMs = Date.now() - startTime;
            const cleanText = pdfData.text.trim();
            logger.info(`OCR completed for PDF via text stream: ${filePath} (Duration: ${durationMs}ms, length: ${cleanText.length} chars)`);
            return {
              text: cleanText,
              confidence: 95,
              durationMs,
            };
          }
        } catch (pdfErr) {
          const pdfErrMsg = pdfErr instanceof Error ? pdfErr.message : 'PDF stream extraction unavailable';
          logger.warn(`PDF direct stream parse failed for ${filePath}: ${pdfErrMsg}. Falling back to Tesseract OCR worker.`);
        }
      }

      // Tesseract.js OCR engine (for images, scanned PDFs, or PDF stream fallbacks)
      const worker = await createWorker('eng');
      const ret = await worker.recognize(filePath);
      await worker.terminate();

      const durationMs = Date.now() - startTime;
      const extractedText = ret.data.text ? ret.data.text.trim() : '';
      const confidence = ret.data.confidence || 0;

      logger.info(`OCR completed via Tesseract engine: ${filePath} (Duration: ${durationMs}ms, confidence: ${confidence}%)`);
      return {
        text: extractedText,
        confidence,
        durationMs,
      };
    } catch (err) {
      const durationMs = Date.now() - startTime;
      const errorMsg = err instanceof Error ? err.message : 'Unknown OCR extraction failure';
      logger.error(`OCR failed for file: ${filePath} (Duration: ${durationMs}ms): ${errorMsg}`);
      throw new Error(`OCR extraction failed: ${errorMsg}`);
    }
  }
}

export const tesseractService = new TesseractService();
