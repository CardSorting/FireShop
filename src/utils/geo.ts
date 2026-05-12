import { logger } from './logger';

export async function getGeoLocation(ip: string): Promise<string> {
  // Production Hardening: Strict IP Validation (Prevent SSRF/Injection)
  const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$|^([a-fA-F0-9:]+)$/;
  if (!ip || !ipPattern.test(ip) || ip === '0.0.0.0' || ip === '127.0.0.1' || ip === '::1') {
    return 'Local/Internal';
  }

  try {
    const response = await fetch(`https://ipapi.co/${ip}/json/`);
    if (!response.ok) throw new Error('Geo API failed');
    const data = await response.json();
    
    if (data.error) return 'Unknown Location';
    
    return `${data.city}, ${data.region}, ${data.country_name}`;
  } catch (error) {
    logger.warn('Failed to fetch geo location', { ip, error });
    return 'Unknown Location';
  }
}
