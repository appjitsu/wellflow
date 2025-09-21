import { readFileSync } from 'fs';

/**
 * HTTPS Configuration for Production
 *
 * For oil & gas critical infrastructure, HTTPS is mandatory per:
 * - NIST Cybersecurity Framework
 * - IEC 62443 Industrial Cybersecurity Standards
 * - API 1164 Pipeline SCADA Security Guidelines
 */
export interface HttpsOptions {
  key: Buffer;
  cert: Buffer;
  ca?: Buffer;
}

/**
 * Get HTTPS options for production deployment
 *
 * Environment variables required for production:
 * - SSL_KEY_PATH: Path to SSL private key file
 * - SSL_CERT_PATH: Path to SSL certificate file
 * - SSL_CA_PATH: Path to SSL CA certificate file (optional)
 */
export function getHttpsOptions(): HttpsOptions | null {
  // Only enable HTTPS in production or when explicitly configured
  // eslint-disable-next-line no-process-env -- Configuration utility requires direct env access
  if (process.env.NODE_ENV !== 'production' && !process.env.FORCE_HTTPS) {
    return null;
  }

  // eslint-disable-next-line no-process-env -- Configuration utility requires direct env access
  const keyPath = process.env.SSL_KEY_PATH;
  // eslint-disable-next-line no-process-env -- Configuration utility requires direct env access
  const certPath = process.env.SSL_CERT_PATH;
  // eslint-disable-next-line no-process-env -- Configuration utility requires direct env access
  const caPath = process.env.SSL_CA_PATH;

  if (!keyPath || !certPath) {
    console.warn('⚠️ HTTPS Configuration Warning:');
    console.warn(
      '   SSL_KEY_PATH and SSL_CERT_PATH environment variables are required for HTTPS',
    );
    console.warn('   Running in HTTP mode - NOT SUITABLE FOR PRODUCTION');
    console.warn(
      '   For oil & gas critical infrastructure, HTTPS is mandatory',
    );
    return null;
  }

  try {
    const httpsOptions: HttpsOptions = {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- SSL certificate paths from environment
      key: readFileSync(keyPath),
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- SSL certificate paths from environment
      cert: readFileSync(certPath),
    };

    // Add CA certificate if provided
    if (caPath) {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- SSL certificate paths from environment
      httpsOptions.ca = readFileSync(caPath);
    }

    console.log('✅ HTTPS Configuration loaded successfully');
    console.log(`   Key: ${keyPath}`);
    console.log(`   Cert: ${certPath}`);
    if (caPath) {
      console.log(`   CA: ${caPath}`);
    }

    return httpsOptions;
  } catch (error) {
    console.error(
      '❌ Failed to load HTTPS certificates:',
      error instanceof Error ? error.message : 'Unknown error',
    );
    console.error('   Falling back to HTTP mode - NOT SUITABLE FOR PRODUCTION');
    return null;
  }
}

/**
 * Get the appropriate port for the application
 * - HTTPS: 443 (standard) or PORT environment variable
 * - HTTP: 3001 (development) or PORT environment variable
 */
export function getPort(): number {
  // eslint-disable-next-line no-process-env -- Configuration utility requires direct env access
  const envPort = process.env.PORT;

  if (envPort) {
    return parseInt(envPort, 10);
  }

  // Use standard ports based on protocol
  // eslint-disable-next-line no-process-env -- Configuration utility requires direct env access
  if (process.env.NODE_ENV === 'production' || process.env.FORCE_HTTPS) {
    return 443; // Standard HTTPS port
  }

  return 3001; // Development HTTP port
}

/**
 * Get the protocol scheme for the application
 */
export function getProtocol(): 'http' | 'https' {
  const httpsOptions = getHttpsOptions();
  return httpsOptions ? 'https' : 'http';
}

/**
 * Get the full base URL for the application
 */
export function getBaseUrl(): string {
  const protocol = getProtocol();
  const port = getPort();
  // eslint-disable-next-line no-process-env -- Configuration utility requires direct env access
  const host = process.env.HOST || 'localhost';

  // Don't include port for standard ports
  if (
    (protocol === 'https' && port === 443) ||
    (protocol === 'http' && port === 80)
  ) {
    return `${protocol}://${host}`;
  }

  return `${protocol}://${host}:${port}`;
}
