// TikTok OAuth 2.0 Flow

const TIKTOK_CLIENT_KEY = import.meta.env.VITE_TIKTOK_CLIENT_KEY;
const REDIRECT_URI = import.meta.env.VITE_TIKTOK_REDIRECT_URI;

/**
 * Generate a random state string for CSRF protection
 */
function generateRandomState(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Initiate TikTok OAuth flow
 */
export function initiateTikTokLogin(): void {
  const state = generateRandomState();
  sessionStorage.setItem('tiktok_oauth_state', state);
  
  const authUrl = new URL('https://www.tiktok.com/auth/authorize/');
  authUrl.searchParams.append('client_key', TIKTOK_CLIENT_KEY);
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('scope', 'user.info.basic');
  authUrl.searchParams.append('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.append('state', state);
  
  console.log('🎵 Initiating TikTok OAuth:', authUrl.toString());
  window.location.href = authUrl.toString();
}

/**
 * Handle TikTok OAuth callback
 */
export async function handleTikTokCallback(code: string, state: string): Promise<{ code: string }> {
  console.log('🎵 TikTok callback received');
  console.log('🔍 State Debug:', {
    received: state,
    stored: sessionStorage.getItem('tiktok_oauth_state')
  });
  
  const savedState = sessionStorage.getItem('tiktok_oauth_state');
  
  if (savedState !== state) {
    console.error('⚠️ State mismatch - possible CSRF attack');
    throw new Error('State mismatch - possible CSRF attack');
  }
  
  sessionStorage.removeItem('tiktok_oauth_state');
  console.log('✅ State verified, returning code');
  
  return { code };
}
