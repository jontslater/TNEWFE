import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { handleOAuthCallback } from '../utils/twitchOAuth';
import { authAPI } from '../api/client';

/**
 * OAuth callback page - handles the redirect from Twitch after authentication
 */
export default function AuthCallback() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Extract code and state from URL
        const result = handleOAuthCallback();

        if (!result) {
          setError('Invalid callback parameters');
          setTimeout(() => navigate('/'), 3000);
          return;
        }

        // Exchange code for token with backend
        const { user, token } = await authAPI.loginWithTwitch(result.code);

        // Store token and update auth state
        login(token, user);

        // Redirect to home
        navigate('/');
      } catch (err) {
        console.error('Authentication failed:', err);
        setError('Authentication failed. Please try again.');
        setTimeout(() => navigate('/'), 3000);
      }
    };

    processCallback();
  }, [navigate, login]);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-2xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-white mb-4">Authentication Error</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <p className="text-sm text-gray-500">Redirecting to home...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
        <h2 className="text-2xl font-bold text-white mb-4">Authenticating...</h2>
        <p className="text-gray-400">Please wait while we log you in</p>
      </div>
    </div>
  );
}
