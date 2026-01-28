#!/usr/bin/env tsx
/**
 * Verify Black Box Setup
 * 
 * This script helps diagnose why audit scores aren't improving.
 * It checks:
 * 1. If Black Box script is installed on the website
 * 2. If configuration is accessible
 * 3. If schemas are being injected
 */


const SITE_ID = process.argv[2];
const DOMAIN = process.argv[3];
const DASHBOARD_URL = process.env.DASHBOARD_URL || 'https://conversion-gpto.vercel.app';

if (!SITE_ID || !DOMAIN) {
  console.error('Usage: tsx verify-black-box-setup.ts <siteId> <domain>');
  console.error('Example: tsx verify-black-box-setup.ts abc-123 example.com');
  process.exit(1);
}

async function checkConfigEndpoint() {
  console.log('\n1. Checking configuration endpoint...');
  try {
    const url = `${DASHBOARD_URL}/api/sites/${SITE_ID}/config`;
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`❌ Config endpoint returned ${response.status}`);
      console.error(`   URL: ${url}`);
      return false;
    }
    
    const config = (await response.json()) as {
      panthera_blackbox?: {
        site?: { brand?: string; domain?: string };
        telemetry?: { emit?: boolean };
        authority_grove?: {
          node?: {
            sameAs?: string[];
          };
        };
      };
    };
    
    if (!config.panthera_blackbox) {
      console.error('❌ Config missing panthera_blackbox structure');
      return false;
    }
    
    console.log('✅ Configuration endpoint is accessible');
    console.log(`   Brand: ${config.panthera_blackbox.site?.brand}`);
    console.log(`   Domain: ${config.panthera_blackbox.site?.domain}`);
    console.log(`   Telemetry enabled: ${config.panthera_blackbox.telemetry?.emit}`);
    
    // Check for required schema elements
    const hasAuthorityGrove = !!config.panthera_blackbox.authority_grove;
    const hasNode = !!config.panthera_blackbox.authority_grove?.node;
    const hasSameAs = Array.isArray(config.panthera_blackbox.authority_grove?.node?.sameAs) && 
                      config.panthera_blackbox.authority_grove.node.sameAs.length > 0;
    
    console.log(`   Authority Grove: ${hasAuthorityGrove ? '✅' : '❌'}`);
    console.log(`   Authority Node: ${hasNode ? '✅' : '❌'}`);
    console.log(`   SameAs links: ${hasSameAs ? '✅' : '❌'} (${config.panthera_blackbox.authority_grove?.node?.sameAs?.length || 0} links)`);
    
    return true;
  } catch (error) {
    console.error('❌ Failed to fetch configuration:', error);
    return false;
  }
}

async function checkWebsiteHTML() {
  console.log('\n2. Checking website HTML...');
  try {
    const url = `https://${DOMAIN}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; GPTOBot/1.0)',
      },
    });
    
    if (!response.ok) {
      console.error(`❌ Website returned ${response.status}`);
      return false;
    }
    
    const html = await response.text();
    
    // Check for Black Box script
    const hasBlackBoxScript = html.includes('black-box.js') || 
                              html.includes('PantheraBlackBox') ||
                              html.includes('panthera-blackbox');
    
    // Check for JSON-LD schemas
    const jsonLdMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>/gi);
    const hasJsonLd = !!jsonLdMatches && jsonLdMatches.length > 0;
    
    // Check for Panthera schemas
    const pantheraSchemas = html.match(/data-panthera=["']true["']/gi);
    const hasPantheraSchemas = !!pantheraSchemas;
    
    console.log(`   Black Box script installed: ${hasBlackBoxScript ? '✅' : '❌'}`);
    console.log(`   JSON-LD schemas in HTML: ${hasJsonLd ? '✅' : '❌'} (${jsonLdMatches?.length || 0} found)`);
    console.log(`   Panthera schemas in HTML: ${hasPantheraSchemas ? '✅' : '❌'}`);
    
    if (!hasBlackBoxScript) {
      console.error('\n⚠️  Black Box script not found in HTML!');
      console.error('   The script needs to be installed on your website.');
      console.error(`   Add this to your HTML: <script src="${DASHBOARD_URL}/black-box.js"></script>`);
    }
    
    if (!hasPantheraSchemas && hasBlackBoxScript) {
      console.warn('\n⚠️  Black Box script is installed but schemas are not in initial HTML.');
      console.warn('   This is expected - schemas are injected client-side.');
      console.warn('   The audit tool may not see them unless it executes JavaScript.');
    }
    
    return hasBlackBoxScript;
  } catch (error) {
    console.error('❌ Failed to fetch website:', error);
    return false;
  }
}

function generateInstallationCode() {
  console.log('\n3. Installation code:');
  console.log('\nAdd this to your website HTML (before </body>):');
  console.log('─'.repeat(60));
  console.log(`<script src="${DASHBOARD_URL}/black-box.js"></script>`);
  console.log('<script>');
  console.log('  PantheraBlackBox.init({');
  console.log(`    configUrl: '${DASHBOARD_URL}/api/sites/${SITE_ID}/config',`);
  console.log(`    telemetryUrl: '${DASHBOARD_URL}/api/telemetry/events',`);
  console.log(`    siteId: '${SITE_ID}'`);
  console.log('  });');
  console.log('</script>');
  console.log('─'.repeat(60));
}

async function main() {
  console.log('Black Box Setup Verification');
  console.log('='.repeat(60));
  console.log(`Site ID: ${SITE_ID}`);
  console.log(`Domain: ${DOMAIN}`);
  console.log(`Dashboard: ${DASHBOARD_URL}`);
  
  const configOk = await checkConfigEndpoint();
  const htmlOk = await checkWebsiteHTML();
  
  if (!configOk) {
    console.error('\n❌ Configuration endpoint is not accessible.');
    console.error('   Make sure:');
    console.error('   1. Site ID is correct');
    console.error('   2. Configuration is saved and active');
    console.error('   3. API endpoint is working');
    process.exit(1);
  }
  
  if (!htmlOk) {
    console.error('\n❌ Black Box script is not installed on your website.');
    generateInstallationCode();
    process.exit(1);
  }
  
  console.log('\n✅ Basic setup looks good!');
  console.log('\n⚠️  Important Note:');
  console.log('   The audit tool fetches raw HTML without executing JavaScript.');
  console.log('   If schemas are injected client-side, the audit may not see them.');
  console.log('   To improve audit scores:');
  console.log('   1. Ensure Black Box is installed and working');
  console.log('   2. Test in browser DevTools to verify schemas are injected');
  console.log('   3. Consider server-side rendering schemas for immediate visibility');
}

main().catch(console.error);
