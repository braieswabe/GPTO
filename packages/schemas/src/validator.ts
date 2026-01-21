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
    const validate = this.compile<T>(schema);
    return validate(data);
  }

  /**
   * Get validation errors
   */
  getErrors(): string[] {
    return this.ajv.errors?.map((err) => {
      const path = err.instancePath || err.schemaPath;
      return `${path}: ${err.message}`;
    }) || [];
  }
}

// Singleton instance
export const validator = new SchemaValidator();
