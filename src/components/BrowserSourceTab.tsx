import { useState, useEffect } from 'react';
import { generateBrowserSourceUrl } from '../utils/browserSource';
import { useAuth } from '../hooks/useAuth';

interface BrowserSourceTabProps {
  userId?: string | null | undefined;
  token?: string | null;
}

export default function BrowserSourceTab({ userId: propUserId, token: propToken }: BrowserSourceTabProps) {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  
  // Get userId and token from props or auth
  const userId = propUserId || user?.twitchId || user?.id;
  const token = propToken || localStorage.getItem('auth_token');

  // Use Twitch username for battlefieldId to match chat command format (!join uses username)
  // The chat command uses twitch:username, not twitch:userId
  const battlefieldIdentifier = user?.twitchUsername || user?.displayName || userId;
  const battlefieldIdentifierString = battlefieldIdentifier ? String(battlefieldIdentifier).toLowerCase().trim() : null;

  const browserSourceUrl = battlefieldIdentifierString && token 
    ? generateBrowserSourceUrl(battlefieldIdentifierString, token)
    : null;

  const handleCopy = async () => {
    if (!browserSourceUrl) {
      alert('Unable to generate browser source URL. Please ensure you are logged in.');
      return;
    }

    try {
      await navigator.clipboard.writeText(browserSourceUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = browserSourceUrl;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h2 className="text-2xl font-bold text-white mb-4">📺 OBS Browser Source</h2>
      
      <div className="space-y-4">
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
          <p className="text-gray-300 mb-4">
            This unified browser source automatically switches between idle combat, raids, and dungeons.
            When you join a raid or dungeon, the browser source will automatically display it.
          </p>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-2">
                Browser Source URL
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={browserSourceUrl || 'Please log in to generate URL'}
                  readOnly
                  className="flex-1 px-4 py-2 bg-gray-700 text-gray-200 rounded border border-gray-600 focus:outline-none focus:border-cyan-500"
                />
                <button
                  onClick={handleCopy}
                  disabled={!browserSourceUrl}
                  className={`px-6 py-2 rounded font-semibold transition-colors ${
                    copied
                      ? 'bg-green-600 text-white'
                      : browserSourceUrl
                      ? 'bg-cyan-600 hover:bg-cyan-700 text-white'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {copied ? '✓ Copied!' : '📋 Copy'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-blue-900/30 rounded-lg p-4 border border-blue-700">
          <h3 className="text-lg font-semibold text-blue-300 mb-2">📋 OBS Setup Instructions</h3>
          <ol className="list-decimal list-inside space-y-2 text-gray-300 text-sm">
            <li>In OBS, add a <strong className="text-white">Browser Source</strong></li>
            <li>Set the URL to the copied link above</li>
            <li>Set width to <strong className="text-white">1920</strong> and height to <strong className="text-white">1080</strong></li>
            <li>Check <strong className="text-white">"Shutdown source when not visible"</strong> for better performance</li>
            <li>The browser source will automatically switch between idle combat, raids, and dungeons</li>
          </ol>
        </div>

        <div className="bg-yellow-900/30 rounded-lg p-4 border border-yellow-700">
          <h3 className="text-lg font-semibold text-yellow-300 mb-2">✨ Features</h3>
          <ul className="list-disc list-inside space-y-1 text-gray-300 text-sm">
            <li><strong className="text-white">Auto-switching:</strong> Automatically displays raids and dungeons when you join them</li>
            <li><strong className="text-white">Transparent background:</strong> Perfect for overlaying on your stream</li>
            <li><strong className="text-white">Real-time updates:</strong> Uses Firestore listeners for instant updates</li>
            <li><strong className="text-white">1920x1080 resolution:</strong> Optimized for streaming</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
