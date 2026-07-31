import { ALL_POLICY_RULES, ValidationContext, IPolicyRule } from './policy.rules.js';
import { ClaimValidationData, ClaimValidationDataSchema, ValidationRuleResult } from '../schemas/validation.schema.js';
import { logger } from '../utils/logger.js';
import { BadRequestError } from '../errors/AppError.js';

export class RulesEngine {
  constructor(private readonly rules: IPolicyRule[] = ALL_POLICY_RULES) {}

  public evaluate(context: ValidationContext): ClaimValidationData {
    logger.info(`RulesEngine: Evaluating ${this.rules.length} policy rules`);

    const ruleResults: ValidationRuleResult[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];
    let approvalRequired = false;

    for (const rule of this.rules) {
      const res = rule.evaluate(context);
      ruleResults.push(res);

      if (!res.passed) {
        if (res.severity === 'ERROR') {
          errors.push(`[${res.rule_id}] ${res.message}`);
        } else if (res.severity === 'WARNING') {
          warnings.push(`[${res.rule_id}] ${res.message}`);
          approvalRequired = true;
        }
      }
    }

    const passedCount = ruleResults.filter((r) => r.passed).length;
    const score = Math.round((passedCount / this.rules.length) * 100);

    let status: ClaimValidationData['validation_status'] = 'PASSED';
    if (errors.length > 0) {
      status = 'FAILED';
      approvalRequired = true;
    } else if (warnings.length > 0) {
      status = 'WARNINGS';
      approvalRequired = true;
    }

    const rawData: ClaimValidationData = {
      validation_status: status,
      validation_score: score,
      validation_errors: errors,
      validation_warnings: warnings,
      approval_required: approvalRequired,
      rules_evaluated: ruleResults,
      evaluated_at: new Date().toISOString(),
    };

    const validationResult = ClaimValidationDataSchema.safeParse(rawData);
    if (!validationResult.success) {
      const formattedErr = JSON.stringify(validationResult.error.format());
      logger.error(`RulesEngine Zod validation error: ${formattedErr}`);
      throw new BadRequestError(`Validation output failed schema validation: ${formattedErr}`);
    }

    logger.info(
      `RulesEngine: Completed evaluation (Status: ${status}, Score: ${score}/100, Errors: ${errors.length}, Warnings: ${warnings.length}, ApprovalRequired: ${approvalRequired})`
    );

    return validationResult.data;
  }
}

export const rulesEngine = new RulesEngine();
