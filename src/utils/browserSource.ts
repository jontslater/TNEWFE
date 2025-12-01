/**
 * Browser Source URL Generation Utility
 * Generates unique URLs for OBS browser sources
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const WEB_URL = import.meta.env.VITE_WEB_URL || window.location.origin;

/**
 * Generate browser source URL for a streamer
 * @param userId - Twitch user ID
 * @param token - JWT authentication token
 * @param bgX - Background X position (0-100)
 * @param bgY - Background Y position (0-100)
 * @param cropX - Crop X position (pixels from original image)
 * @param cropY - Crop Y position (pixels from original image)
 * @param cropWidth - Crop width (pixels)
 * @param cropHeight - Crop height (pixels)
 * @param transparent - Whether to use transparent background (hide background and banner)
 * @param dragonContainerBottom - Elder Dragon container bottom position (e.g., "-136px")
 * @param dragonContainerRight - Elder Dragon container right position (e.g., "200px")
 * @param dragonContainerWidth - Elder Dragon container width (e.g., "648px")
 * @param dragonContainerHeight - Elder Dragon container height (e.g., "648px")
 * @param dragonTargetBottom - Elder Dragon target bottom position (e.g., "-136px")
 * @param dragonTargetRight - Elder Dragon target right position (e.g., "200px")
 * @returns Browser source URL
 */
export function generateBrowserSourceUrl(
  userId: string, 
  token: string, 
  bgX?: number, 
  bgY?: number,
  cropX?: number,
  cropY?: number,
  cropWidth?: number,
  cropHeight?: number,
  transparent?: boolean,
  dragonContainerBottom?: string,
  dragonContainerRight?: string,
  dragonContainerWidth?: string,
  dragonContainerHeight?: string,
  dragonTargetBottom?: string,
  dragonTargetRight?: string
): string {
  // Use Twitch username for battlefieldId to match chat command format
  // The chat command uses twitch:username, not twitch:userId
  // We'll need to get the username from the user object or use userId as fallback
  // For now, we'll use userId but the BrowserSourcePage will normalize it
  const battlefieldId = `twitch:${userId}`;
  const url = new URL('/browser-source-unified', WEB_URL);
  url.searchParams.set('token', token);
  url.searchParams.set('battlefieldId', battlefieldId);
  
  // Include background position in URL so it works in OBS (which may have isolated localStorage)
  if (bgX !== undefined) {
    url.searchParams.set('bgX', bgX.toString());
  }
  if (bgY !== undefined) {
    url.searchParams.set('bgY', bgY.toString());
  }
  
  // Include crop parameters
  if (cropX !== undefined) {
    url.searchParams.set('cropX', cropX.toString());
  }
  if (cropY !== undefined) {
    url.searchParams.set('cropY', cropY.toString());
  }
  if (cropWidth !== undefined) {
    url.searchParams.set('cropWidth', cropWidth.toString());
  }
  if (cropHeight !== undefined) {
    url.searchParams.set('cropHeight', cropHeight.toString());
  }
  
  // Include transparent background setting
  if (transparent !== undefined) {
    url.searchParams.set('transparent', transparent.toString());
  }
  
  // Include dragon container and target positions (for raid browser source)
  if (dragonContainerBottom !== undefined) {
    url.searchParams.set('dragonContainerBottom', dragonContainerBottom);
  }
  if (dragonContainerRight !== undefined) {
    url.searchParams.set('dragonContainerRight', dragonContainerRight);
  }
  if (dragonContainerWidth !== undefined) {
    url.searchParams.set('dragonContainerWidth', dragonContainerWidth);
  }
  if (dragonContainerHeight !== undefined) {
    url.searchParams.set('dragonContainerHeight', dragonContainerHeight);
  }
  if (dragonTargetBottom !== undefined) {
    url.searchParams.set('dragonTargetBottom', dragonTargetBottom);
  }
  if (dragonTargetRight !== undefined) {
    url.searchParams.set('dragonTargetRight', dragonTargetRight);
  }
  
  return url.toString();
}

/**
 * Copy browser source URL to clipboard
 * @param userId - Twitch user ID
 * @param token - JWT authentication token
 * @param bgX - Background X position (0-100)
 * @param bgY - Background Y position (0-100)
 * @param cropX - Crop X position (pixels)
 * @param cropY - Crop Y position (pixels)
 * @param cropWidth - Crop width (pixels)
 * @param cropHeight - Crop height (pixels)
 * @returns Promise that resolves when URL is copied
 */
export async function copyBrowserSourceUrl(
  userId: string, 
  token: string, 
  bgX?: number, 
  bgY?: number,
  cropX?: number,
  cropY?: number,
  cropWidth?: number,
  cropHeight?: number
): Promise<void> {
  const url = generateBrowserSourceUrl(userId, token, bgX, bgY, cropX, cropY, cropWidth, cropHeight);
  
  try {
    await navigator.clipboard.writeText(url);
  } catch (err) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = url;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
  }
}

/**
 * Get browser source instructions for OBS
 */
export function getBrowserSourceInstructions(): string {
  return `To add this to OBS:
1. In OBS, add a Browser Source
2. Set the URL to the copied link
3. Set width to 1920 and height to 1080 (or your stream resolution)
4. Check "Shutdown source when not visible" for better performance
5. The battlefield will update automatically every 2 seconds`;
}
