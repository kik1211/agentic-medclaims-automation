import { CptCodeItem } from '../schemas/coding.schema.js';
import { logger } from '../utils/logger.js';

const CPT_DICTIONARY: Record<string, { code: string; description: string; category: string }> = {
  'laparoscopic appendectomy': { code: '44970', description: 'Laparoscopy, surgical, appendectomy', category: 'Surgery / Digestive' },
  appendectomy: { code: '44950', description: 'Appendectomy', category: 'Surgery / Digestive' },
  cholecystectomy: { code: '47562', description: 'Laparoscopy, surgical, cholecystectomy', category: 'Surgery / Digestive' },
  endoscopy: { code: '43239', description: 'Upper gastrointestinal endoscopy with biopsy', category: 'Surgery / Digestive' },
  'chest x-ray': { code: '71045', description: 'Chest X-ray single view', category: 'Radiology' },
  xray: { code: '71045', description: 'Diagnostic radiology examination', category: 'Radiology' },
  ecg: { code: '93000', description: 'Electrocardiogram, routine with 12 leads', category: 'Medicine / Cardiology' },
  ultrasound: { code: '76700', description: 'Ultrasound, abdominal, real time with image documentation', category: 'Radiology' },
  blood: { code: '36430', description: 'Transfusion, blood or blood components', category: 'Surgery / Hemic' },
};

export interface ICptService {
  mapProcedures(procedures?: string[]): CptCodeItem[];
}

export class CptService implements ICptService {
  public mapProcedures(procedures?: string[]): CptCodeItem[] {
    if (!procedures || procedures.length === 0) {
      logger.info('CptService: No procedures provided for CPT mapping');
      return [];
    }

    const cptResults: CptCodeItem[] = [];

    for (const procStr of procedures) {
      const cleanStr = procStr.trim();
      if (!cleanStr) continue;

      logger.info(`CptService: Mapping procedure string to CPT: '${cleanStr}'`);
      const lowerStr = cleanStr.toLowerCase();
      let matched = false;

      for (const [key, item] of Object.entries(CPT_DICTIONARY)) {
        if (lowerStr.includes(key)) {
          cptResults.push({
            code: item.code,
            description: item.description,
            category: item.category,
            confidence: 90,
          });
          matched = true;
          break;
        }
      }

      if (!matched) {
        cptResults.push({
          code: '99214',
          description: `Outpatient/Inpatient clinical procedure (${cleanStr})`,
          category: 'Evaluation and Management',
          confidence: 70,
        });
      }
    }

    return cptResults;
  }
}

export const cptService = new CptService();
