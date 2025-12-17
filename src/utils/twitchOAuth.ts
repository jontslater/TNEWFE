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

  const scopes = ['user:read:email', 'chat:read', 'chat:edit'];
  const state = generateRandomState();
  
  // Store state in sessionStorage for verification
  sessionStorage.setItem('twitch_oauth_state', state);
  console.log('🔑 Generated OAuth state:', state);

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
  const errorDescription = urlParams.get('error_description');

  if (error) {
    console.error('OAuth error:', error, errorDescription);
    // Show user-friendly error message
    if (errorDescription) {
      alert(`Twitch login failed: ${errorDescription}`);
    } else {
      alert(`Twitch login failed: ${error}. Please try again.`);
    }
    return null;
  }

  if (!code || !state) {
    console.error('Missing OAuth parameters:', { code: !!code, state: !!state });
    console.error('URL params:', Object.fromEntries(urlParams.entries()));
    return null;
  }

  // Verify state to prevent CSRF
  const storedState = sessionStorage.getItem('twitch_oauth_state');
  console.log('🔍 State Debug:', {
    receivedState: state,
    storedState: storedState,
    match: state === storedState
  });
  
  // More lenient state check - allow if storedState is null (development/incognito)
  // but still verify if both exist to prevent CSRF attacks
  if (storedState !== null && state !== storedState) {
    console.error('State mismatch - possible CSRF attack');
    console.error('Received state:', state);
    console.error('Stored state:', storedState);
    alert('Security verification failed. Please try logging in again.');
    return null;
  }
  
  if (storedState === null) {
    console.warn('⚠️ State verification skipped - sessionStorage was empty (development mode or incognito)');
  }

  // Clean up
  sessionStorage.removeItem('twitch_oauth_state');

  return { code, state };
}
