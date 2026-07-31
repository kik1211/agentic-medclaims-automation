import { IcdCodeItem } from '../schemas/coding.schema.js';
import { logger } from '../utils/logger.js';

const ICD10_DICTIONARY: Record<string, { code: string; description: string }> = {
  appendicitis: { code: 'K35.80', description: 'Unspecified acute appendicitis' },
  'acute appendicitis': { code: 'K35.80', description: 'Unspecified acute appendicitis' },
  diabetes: { code: 'E11.9', description: 'Type 2 diabetes mellitus without complications' },
  hypertension: { code: 'I10', description: 'Essential (primary) hypertension' },
  dengue: { code: 'A97.9', description: 'Dengue fever, unspecified' },
  pneumonia: { code: 'J18.9', description: 'Pneumonia, unspecified organism' },
  cholecystitis: { code: 'K81.9', description: 'Cholecystitis, unspecified' },
  cholelithiasis: { code: 'K80.20', description: 'Calculus of gallbladder without cholecystitis' },
  fever: { code: 'R50.9', description: 'Fever, unspecified' },
  gastroenteritis: { code: 'A09', description: 'Infectious gastroenteritis and colitis, unspecified' },
};

export interface IIcdService {
  mapDiagnosis(diagnosisText?: string | null): {
    primary: IcdCodeItem | null;
    secondary: IcdCodeItem[];
  };
}

export class IcdService implements IIcdService {
  public mapDiagnosis(diagnosisText?: string | null): {
    primary: IcdCodeItem | null;
    secondary: IcdCodeItem[];
  } {
    if (!diagnosisText || diagnosisText.trim().length === 0) {
      logger.info('IcdService: No diagnosis text provided for ICD-10 mapping');
      return { primary: null, secondary: [] };
    }

    const cleanText = diagnosisText.trim();
    logger.info(`IcdService: Mapping diagnosis text to ICD-10: '${cleanText}'`);

    // Check if ICD-10 code is already directly formatted in diagnosis string (e.g., K35.80)
    const directCodeMatch = cleanText.match(/\b([A-Z]\d{2}(?:\.\d{1,2})?)\b/);
    if (directCodeMatch) {
      const code = directCodeMatch[1];
      logger.info(`IcdService: Direct ICD-10 code detected in text: ${code}`);
      return {
        primary: {
          code,
          description: cleanText,
          confidence: 95,
        },
        secondary: [],
      };
    }

    const lowerText = cleanText.toLowerCase();
    for (const [key, item] of Object.entries(ICD10_DICTIONARY)) {
      if (lowerText.includes(key)) {
        logger.info(`IcdService: Matched ICD-10 dictionary term '${key}' -> ${item.code}`);
        return {
          primary: {
            code: item.code,
            description: item.description,
            confidence: 88,
          },
          secondary: [],
        };
      }
    }

    // Default fallback mapping for unlisted clinical diagnoses
    return {
      primary: {
        code: 'R69',
        description: `Unspecified illness/diagnosis (${cleanText})`,
        confidence: 70,
      },
      secondary: [],
    };
  }
}

export const icdService = new IcdService();
