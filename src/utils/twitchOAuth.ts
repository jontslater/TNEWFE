/**
 * Twitch OAuth utilities
 */

const TWITCH_CLIENT_ID = import.meta.env.VITE_TWITCH_CLIENT_ID;
const REDIRECT_URI = import.meta.env.VITE_TWITCH_REDIRECT_URI || window.location.origin + '/auth/callback';

/**
 * Initiates Twitch OAuth flow by redirecting to Twitch authorization page
 */
export function loginWithTwitch() {
  if (!TWITCH_CLIENT_ID) {
    console.error('VITE_TWITCH_CLIENT_ID is not configured in environment variables');
    alert('Twitch login is not configured. Please set VITE_TWITCH_CLIENT_ID in your .env file.');
    return;
  }

  const scopes = ['user:read:email'];
  const state = generateRandomState();
  
  // Store state in sessionStorage for verification
  sessionStorage.setItem('twitch_oauth_state', state);

  const authUrl = new URL('https://id.twitch.tv/oauth2/authorize');
  authUrl.searchParams.append('client_id', TWITCH_CLIENT_ID);
  authUrl.searchParams.append('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('scope', scopes.join(' '));
  authUrl.searchParams.append('state', state);

  // Redirect to Twitch
  window.location.href = authUrl.toString();
}

/**
 * Generates a random state string for CSRF protection
 */
function generateRandomState(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Handles the OAuth callback from Twitch
 * @returns The authorization code if successful, null otherwise
 */
export function handleOAuthCallback(): { code: string; state: string } | null {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const state = urlParams.get('state');
  const error = urlParams.get('error');

  if (error) {
    console.error('OAuth error:', error);
    return null;
  }

  if (!code || !state) {
    return null;
  }

  // Verify state to prevent CSRF
  const storedState = sessionStorage.getItem('twitch_oauth_state');
  if (state !== storedState) {
    console.error('State mismatch - possible CSRF attack');
    return null;
  }

  // Clean up
  sessionStorage.removeItem('twitch_oauth_state');

  return { code, state };
}
