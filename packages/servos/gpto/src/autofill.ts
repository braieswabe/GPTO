/**
 * AutoFill Engine
 * Links telemetry + CFP data to actionable web actions for form pre-population
 */

import { SiteConfig } from '@gpto/schemas/src/site-config';

export interface AutoFillData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  location?: string;
  preferences?: Record<string, unknown>;
}

export interface AutoFillForm {
  selector: string;
  map: Record<string, string>;
}

export interface AutoFillResult {
  success: boolean;
  fieldsFilled: number;
  fieldsTotal: number;
  errors?: string[];
}

/**
 * Extract AutoFill data from cognitive fingerprint and telemetry
 */
export function extractAutoFillData(
  cfp: {
    focus?: number;
    risk?: number;
    novelty?: number;
    verbosity?: number;
  },
  telemetry?: Record<string, unknown>
): AutoFillData {
  const data: AutoFillData = {};

  // Extract from telemetry context if available
  if (telemetry) {
    if (telemetry.name) {
      const nameParts = String(telemetry.name).split(' ');
      data.firstName = nameParts[0];
      data.lastName = nameParts.slice(1).join(' ');
    }
    if (telemetry.email) data.email = String(telemetry.email);
    if (telemetry.phone) data.phone = String(telemetry.phone);
    if (telemetry.location) data.location = String(telemetry.location);
  }

  // Use CFP to infer preferences
  data.preferences = {
    focus: cfp.focus || 0.5,
    risk: cfp.risk || 0.5,
    novelty: cfp.novelty || 0.5,
    verbosity: cfp.verbosity || 0.5,
  };

  return data;
}

/**
 * Apply AutoFill to a form element
 */
export function applyAutoFill(
  formSelector: string,
  fieldMap: Record<string, string>,
  data: AutoFillData
): AutoFillResult {
  if (typeof window === 'undefined') {
    return { success: false, fieldsFilled: 0, fieldsTotal: 0, errors: ['Not in browser environment'] };
  }

  const form = document.querySelector(formSelector);
  if (!form) {
    return { success: false, fieldsFilled: 0, fieldsTotal: 0, errors: [`Form not found: ${formSelector}`] };
  }

  const errors: string[] = [];
  let fieldsFilled = 0;
  const fieldsTotal = Object.keys(fieldMap).length;

  for (const [fieldName, selector] of Object.entries(fieldMap)) {
    try {
      const field = form.querySelector(selector) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
      if (!field) {
        errors.push(`Field not found: ${selector}`);
        continue;
      }

      // Map field name to data value
      const value = getFieldValue(fieldName, data);
      if (value !== undefined && value !== null) {
        if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) {
          field.value = String(value);
          // Trigger input event for form validation libraries
          field.dispatchEvent(new Event('input', { bubbles: true }));
        } else if (field instanceof HTMLSelectElement) {
          field.value = String(value);
          field.dispatchEvent(new Event('change', { bubbles: true }));
        }
        fieldsFilled++;
      }
    } catch (error) {
      errors.push(`Error filling field ${fieldName}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return {
    success: fieldsFilled > 0,
    fieldsFilled,
    fieldsTotal,
    errors: errors.length > 0 ? errors : undefined,
  };
}

/**
 * Get field value from AutoFill data
 */
function getFieldValue(fieldName: string, data: AutoFillData): string | undefined {
  // Support common field name patterns
  const lowerName = fieldName.toLowerCase();
  
  if (lowerName.includes('first') || lowerName.includes('fname')) {
    return data.firstName;
  }
  if (lowerName.includes('last') || lowerName.includes('lname') || lowerName.includes('surname')) {
    return data.lastName;
  }
  if (lowerName.includes('email') || lowerName.includes('e-mail')) {
    return data.email;
  }
  if (lowerName.includes('phone') || lowerName.includes('tel')) {
    return data.phone;
  }
  if (lowerName.includes('location') || lowerName.includes('city') || lowerName.includes('address')) {
    return data.location;
  }
  
  // Check preferences
  if (data.preferences && lowerName in data.preferences) {
    return String(data.preferences[lowerName]);
  }

  return undefined;
}

/**
 * Initialize AutoFill for a site configuration
 */
export function initializeAutoFill(config: SiteConfig): void {
  if (typeof window === 'undefined') return;
  
  const autofillConfig = config.panthera_blackbox.autofill;
  if (!autofillConfig?.enabled || !autofillConfig.forms) {
    return;
  }

  // Store config for later use
  (window as unknown as { pantheraAutoFill?: typeof autofillConfig }).pantheraAutoFill = autofillConfig;
  
  // Listen for form focus events to trigger AutoFill
  autofillConfig.forms.forEach((form) => {
    const formElement = document.querySelector(form.selector);
    if (formElement) {
      formElement.addEventListener('focusin', (e) => {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
          // Trigger AutoFill on first field focus
          // In production, this would fetch CFP data from API
          const cfpData = {
            focus: 0.7,
            risk: 0.5,
            novelty: 0.6,
            verbosity: 0.8,
          };
          const telemetryData = {}; // Would come from stored telemetry
          const autofillData = extractAutoFillData(cfpData, telemetryData);
          applyAutoFill(form.selector, form.map, autofillData);
        }
      }, { once: true });
    }
  });
}
