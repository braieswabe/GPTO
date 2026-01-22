import Ajv, { ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';

/**
 * Centralized schema validator using AJV
 */
export class SchemaValidator {
  private ajv: Ajv;

  constructor() {
    this.ajv = new Ajv({ allErrors: true, strict: false });
    addFormats(this.ajv);
  }

  /**
   * Compile a schema and return a validation function
   */
  compile<T = unknown>(schema: object): ValidateFunction<T> {
    return this.ajv.compile<T>(schema);
  }

  /**
   * Validate data against a schema
   */
  validate<T = unknown>(schema: object, data: unknown): data is T {
    const validateFn = this.compile<T>(schema);
    const isValid = validateFn(data);
    // Store errors from the validation function
    this.lastErrors = validateFn.errors || null;
    return isValid;
  }

  private lastErrors: any[] | null = null;

  /**
   * Get validation errors from the last validation
   */
  getErrors(): string[] {
    const errors = this.lastErrors || this.ajv.errors;
    return errors?.map((err) => {
      const path = err.instancePath || err.schemaPath || 'root';
      return `${path}: ${err.message || 'validation failed'}`;
    }) || [];
  }
}

// Singleton instance
export const validator = new SchemaValidator();
