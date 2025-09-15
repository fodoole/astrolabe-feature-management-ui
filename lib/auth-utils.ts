export interface JWTPayload {
  email: string;
  name?: string;
  role?: string;
  iat: number;
  exp: number;
}

export function isTokenExpired(token: string): boolean {
  try {
    const payload = parseJWTPayload(token);
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp < currentTime;
  } catch {
    return true;
  }
}

export function parseJWTPayload(token: string): JWTPayload {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWT token format');
  }
  
  const payload = parts[1];
  const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
  return JSON.parse(decoded);
}

export function getTokenExpirationTime(token: string): Date | null {
  try {
    const payload = parseJWTPayload(token);
    return new Date(payload.exp * 1000);
  } catch {
    return null;
  }
}

export function shouldLogoutUser(token: string | null): boolean {
  if (!token) return true;
  return isTokenExpired(token);
}

export function handleTokenExpiration(onLogout: () => void) {
  const token = localStorage.getItem('jwt_token');
  if (shouldLogoutUser(token)) {
    localStorage.removeItem('jwt_token');
    onLogout();
  }
}

export function setupTokenExpirationCheck(onLogout: () => void, intervalMs: number = 60000) {
  const checkInterval = setInterval(() => {
    handleTokenExpiration(onLogout);
  }, intervalMs);
  
  return () => clearInterval(checkInterval);
}
