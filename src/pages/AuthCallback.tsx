import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { handleOAuthCallback } from '../utils/twitchOAuth';
import { handleTikTokCallback } from '../services/tiktokOAuth';
import { authAPI, heroAPI } from '../api/client';

/**
 * OAuth callback page - handles the redirect from Twitch or TikTok after authentication
 */
export default function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const processingRef = useRef(false);

  useEffect(() => {
    const processCallback = async () => {
      // Prevent multiple executions
      if (processingRef.current) {
        console.log('Already processing, skipping...');
        return;
      }
      processingRef.current = true;

      try {
        // Check if this is TikTok or Twitch callback
        const isTikTok = location.pathname.includes('/auth/tiktok/callback');
        
        let result;
        let response;
        
        if (isTikTok) {
          // TikTok OAuth flow
          const params = new URLSearchParams(location.search);
          const code = params.get('code');
          const state = params.get('state');
          
          if (!code || !state) {
            setError('Invalid callback parameters');
            setTimeout(() => navigate('/'), 3000);
            return;
          }
          
          result = await handleTikTokCallback(code, state);
          response = await authAPI.loginWithTikTok(result.code);
        } else {
          // Twitch OAuth flow
          result = handleOAuthCallback();
          
          if (!result) {
            setError('Invalid callback parameters');
            setTimeout(() => navigate('/'), 3000);
            return;
          }
          
          response = await authAPI.loginWithTwitch(result.code);
        }

        // Store token and update auth state
        login(response.token, response.user);

        // Check if user has heroes, redirect to create-hero if not
        try {
          const twitchId = response.user?.twitchId || response.user?.id;
          if (twitchId) {
            const heroes = await heroAPI.getHeroesByTwitchId(twitchId);
            if (heroes.length === 0) {
              // No heroes, redirect to create-hero
              navigate('/create-hero');
              return;
            }
          }
        } catch (err) {
          console.error('Error checking heroes:', err);
          // Continue to home even if check fails
        }

        // Redirect to portal (user has heroes)
        navigate('/portal');
      } catch (err) {
        console.error('Authentication failed:', err);
        setError('Authentication failed. Please try again.');
        setTimeout(() => navigate('/'), 3000);
      }
    };

    processCallback();
  }, [navigate, login, location]);

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
