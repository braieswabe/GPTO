import { readFileSync } from 'fs';
import { siteConfigSchema } from './packages/schemas/src/site-config';
import { validator } from './packages/schemas/src/validator';

// Read the configuration file
const configPath = process.argv[2] || './mapua-config-corrected.json';
const configContent = readFileSync(configPath, 'utf-8');
const config = JSON.parse(configContent);

// Validate against schema
console.log('Validating configuration...\n');
const isValid = validator.validate(siteConfigSchema, config);

if (isValid) {
  console.log('✅ Configuration is VALID!\n');
  console.log('All required fields are present and correctly formatted.');
} else {
  console.log('❌ Configuration is INVALID!\n');
  const errors = validator.getErrors();
  console.log('Validation errors:');
  errors.forEach((error, index) => {
    console.log(`${index + 1}. ${error}`);
  });
  process.exit(1);
}
