/**
 * Panthera Black Box Runtime
 * 
 * A minimal, safe runtime that reads JSON configuration and sends telemetry.
 * Designed to be <10KB gzipped when compiled.
 * 
 * Safety: No eval(), no Function(), no arbitrary code execution.
 * All operations are declarative JSON transformations only.
 */

interface BlackBoxConfig {
  panthera_blackbox: {
    version: string;
    site: {
      domain: string;
      brand: string;
      verticals: string[];
      geo: string[];
    };
    telemetry: {
      emit: boolean;
      keys: string[];
    };
    [key: string]: unknown;
  };
}

interface TelemetryEvent {
  schema: string;
  tenant: string;
  timestamp: string;
  source: 'blackbox';
  context?: Record<string, unknown>;
  metrics: Record<string, number>;
}

class PantheraBlackBox {
  private config: BlackBoxConfig | null = null;
  private configUrl: string;
  private telemetryUrl: string;
  private siteId: string;
  private initialized = false;

  constructor(options: { configUrl: string; telemetryUrl: string; siteId: string }) {
    this.configUrl = options.configUrl;
    this.telemetryUrl = options.telemetryUrl;
    this.siteId = options.siteId;
  }

  /**
   * Initialize the Black Box by loading configuration
   */
  async init(): Promise<void> {
    if (this.initialized) return;

    try {
      const response = await fetch(this.configUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        cache: 'no-cache',
      });

      if (!response.ok) {
        throw new Error(`Failed to load config: ${response.status}`);
      }

      const data = await response.json();
      
      // Basic validation - ensure it has the expected structure
      if (!data.panthera_blackbox || !data.panthera_blackbox.site) {
        throw new Error('Invalid config structure');
      }

      this.config = data as BlackBoxConfig;
      this.initialized = true;

      // Apply configuration if needed
      this.applyConfig();

      // Start telemetry if enabled
      if (this.config.panthera_blackbox.telemetry?.emit) {
        this.startTelemetry();
      }
    } catch (error) {
      console.error('[Panthera Black Box] Initialization failed:', error);
      // Fail silently in production, but log for debugging
    }
  }

  /**
   * Apply configuration to the page (declarative transformations only)
   */
  private applyConfig(): void {
    if (!this.config) return;

    const config = this.config.panthera_blackbox;
    
    // Inject JSON-LD schema if configured
    this.injectSchema(config);
    
    // Initialize AutoFill if enabled
    if (config.autofill?.enabled && config.autofill.forms) {
      this.initializeAutoFill(config);
    }
    
    // Initialize ad slots if configured
    if (config.ads?.slots) {
      this.initializeAdSlots(config);
    }
  }

  /**
   * Inject JSON-LD schema
   */
  private injectSchema(config: BlackBoxConfig['panthera_blackbox']): void {
    if (typeof document === 'undefined') return;
    
    // Remove existing Panthera schema if present
    const existing = document.querySelector('script[type="application/ld+json"][data-panthera]');
    if (existing) {
      existing.remove();
    }
    
    // Create new schema script
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-panthera', 'true');
    
    // Basic schema structure (would be enhanced with actual config data)
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: config.site.brand,
      url: `https://${config.site.domain}`,
    };
    
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
  }

  /**
   * Initialize AutoFill for forms
   */
  private initializeAutoFill(config: BlackBoxConfig['panthera_blackbox']): void {
    if (typeof window === 'undefined' || !config.autofill?.forms) return;
    
    config.autofill.forms.forEach((form) => {
      const formElement = document.querySelector(form.selector);
      if (formElement) {
        // Store form config for later use
        (formElement as HTMLElement & { pantheraAutoFill?: typeof form }).pantheraAutoFill = form;
        
        // Listen for first field focus to trigger AutoFill
        formElement.addEventListener('focusin', (e) => {
          const target = e.target as HTMLElement;
          if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
            this.triggerAutoFill(form);
          }
        }, { once: true });
      }
    });
  }

  /**
   * Trigger AutoFill for a form
   */
  private async triggerAutoFill(form: { selector: string; map: Record<string, string> }): Promise<void> {
    // In production, this would fetch CFP data from API
    // For now, use placeholder data
    const autofillData: Record<string, string> = {};
    
    // Apply AutoFill to form fields
    const formElement = document.querySelector(form.selector);
    if (!formElement) return;
    
    for (const [fieldName, selector] of Object.entries(form.map)) {
      const field = formElement.querySelector(selector) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
      if (field && autofillData[fieldName]) {
        field.value = autofillData[fieldName];
        field.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
  }

  /**
   * Initialize ad slots
   */
  private initializeAdSlots(config: BlackBoxConfig['panthera_blackbox']): void {
    if (typeof window === 'undefined' || !config.ads?.slots) return;
    
    config.ads.slots.forEach((slot) => {
      const slotElement = document.querySelector(`[data-ad-slot="${slot.id}"]`);
      if (slotElement) {
        // Store slot config
        (slotElement as HTMLElement & { pantheraAdSlot?: typeof slot }).pantheraAdSlot = slot;
        
        // In production, this would load ad creative and track impressions
        this.loadAdCreative(slot);
      }
    });
  }

  /**
   * Load ad creative for a slot
   */
  private async loadAdCreative(slot: { id: string; contexts: string[] }): Promise<void> {
    // In production, this would:
    // 1. Fetch creative from API based on slot contexts
    // 2. Calculate CPM
    // 3. Render ad
    // 4. Track impression
    
    // Placeholder: just log the slot
    console.debug('[Panthera Black Box] Ad slot initialized:', slot.id);
  }

  /**
   * Start telemetry collection
   */
  private startTelemetry(): void {
    if (!this.config?.panthera_blackbox.telemetry?.emit) return;

    // Collect initial telemetry
    this.sendTelemetry('page_view', {
      url: window.location.href,
      referrer: document.referrer,
    });

    // Listen for user interactions (if configured)
    if (typeof window !== 'undefined') {
      // Throttled event listeners for performance
      let interactionTimeout: number | null = null;
      
      const sendInteraction = () => {
        if (interactionTimeout) return;
        interactionTimeout = window.setTimeout(() => {
          this.sendTelemetry('interaction', {
            timestamp: new Date().toISOString(),
          });
          interactionTimeout = null;
        }, 1000);
      };

      // Only track if explicitly configured
      document.addEventListener('click', sendInteraction, { passive: true });
      document.addEventListener('scroll', sendInteraction, { passive: true });
    }
  }

  /**
   * Send telemetry event
   */
  private async sendTelemetry(eventType: string, data: Record<string, unknown>): Promise<void> {
    if (!this.config?.panthera_blackbox.telemetry?.emit) return;

    const event: TelemetryEvent = {
      schema: 'panthera.blackbox.v1',
      tenant: this.config.panthera_blackbox.site.domain,
      timestamp: new Date().toISOString(),
      source: 'blackbox',
      context: {
        event_type: eventType,
        ...data,
      },
      metrics: this.collectMetrics(),
    };

    try {
      // Use sendBeacon for reliability (doesn't block page unload)
      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          this.telemetryUrl,
          JSON.stringify(event)
        );
      } else {
        // Fallback to fetch
        await fetch(this.telemetryUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(event),
          keepalive: true,
        });
      }
    } catch (error) {
      // Fail silently - telemetry should never break the site
      console.debug('[Panthera Black Box] Telemetry failed:', error);
    }
  }

  /**
   * Collect metrics based on configured keys
   */
  private collectMetrics(): Record<string, number> {
    const metrics: Record<string, number> = {};
    const keys = this.config?.panthera_blackbox.telemetry?.keys || [];

    // Collect basic metrics if keys are configured
    // This is safe - we're only reading properties, not executing code
    keys.forEach((key) => {
      // Map telemetry keys to actual metrics
      // For now, return placeholder values
      // In production, these would be calculated from actual page state
      metrics[key] = 0;
    });

    return metrics;
  }

  /**
   * Get current configuration (read-only)
   */
  getConfig(): BlackBoxConfig | null {
    return this.config;
  }

  /**
   * Reload configuration
   */
  async reload(): Promise<void> {
    this.initialized = false;
    await this.init();
  }
}

// Auto-initialize if script tag has data attributes
(function () {
  if (typeof window === 'undefined') return;

  const script = document.currentScript as HTMLScriptElement | null;
  if (!script) return;

  const configUrl = script.getAttribute('data-config-url');
  const telemetryUrl = script.getAttribute('data-telemetry-url');
  const siteId = script.getAttribute('data-site-id');

  if (!configUrl || !telemetryUrl || !siteId) {
    console.warn('[Panthera Black Box] Missing required data attributes');
    return;
  }

  const blackBox = new PantheraBlackBox({
    configUrl,
    telemetryUrl,
    siteId,
  });

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => blackBox.init());
  } else {
    blackBox.init();
  }

  // Expose globally for manual control (optional)
  (window as unknown as { PantheraBlackBox: typeof PantheraBlackBox }).PantheraBlackBox = PantheraBlackBox;
  (window as unknown as { panthera: PantheraBlackBox }).panthera = blackBox;
})();

export default PantheraBlackBox;
