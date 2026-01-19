/**
 * Environment Configuration
 * 
 * This file centralizes all environment variables into a single config object.
 * All environment variables should be accessed through this config file.
 * 
 * For Vite projects, environment variables must be prefixed with VITE_ to be exposed.
 */

const config = {
  // API Configuration
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'https://shipping-b.vercel.app',
    timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000', 10),
  },

  // Application Configuration
  app: {
    name: import.meta.env.VITE_APP_NAME || 'Shipping',
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
    environment: import.meta.env.MODE || 'development',
  },

  // Feature Flags
  features: {
    enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
    enableDebugMode: import.meta.env.VITE_DEBUG_MODE === 'true',
  },

  // External Services (if needed in future)
  services: {
    // Add other service configurations here as needed
    // example: analyticsId: import.meta.env.VITE_ANALYTICS_ID || '',
  },
};

// Validate required environment variables in production
if (config.app.environment === 'production') {
  const requiredVars = ['VITE_API_BASE_URL'];
  const missingVars = requiredVars.filter(
    (varName) => !import.meta.env[varName]
  );

  if (missingVars.length > 0) {
    console.warn(
      `Missing required environment variables: ${missingVars.join(', ')}`
    );
  }
}

// Export the config object
export default config;

// Export individual config sections for convenience
export const { api, app, features, services } = config;

