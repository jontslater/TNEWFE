/**
 * Rare Loot Drop Announcement Component
 * Displays animated card when Rare/Epic/Legendary/Mythic loot drops
 */

import React from 'react';
import { getRarityStyle } from '../utils/rarityDisplay';

export interface RareLootAnnouncementProps {
  itemName: string;
  rarity: string;
  heroName: string;
}

export const RareLootAnnouncement: React.FC<RareLootAnnouncementProps> = ({
  itemName,
  rarity,
  heroName
}) => {
  const rarityInfo = getRarityStyle(rarity);
  
  return (
    <div
      className="fixed top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none animate-bounce"
      style={{
        animation: 'bounce 0.5s ease-in-out 3'
      }}
    >
      <div
        className="rounded-lg p-6 shadow-2xl border-4"
        style={{
          backgroundColor: rarityInfo.bgColor,
          borderColor: rarityInfo.borderColor,
          boxShadow: `0 0 30px ${rarityInfo.glowColor}`
        }}
      >
        <div className="text-center">
          <div className="text-6xl mb-2">{rarityInfo.emoji}</div>
          <div
            className="text-2xl font-bold mb-2"
            style={{ color: rarityInfo.color }}
          >
            {rarityInfo.label}!
          </div>
          <div className="text-xl text-white mb-1">{itemName}</div>
          <div className="text-sm text-gray-300">
            {heroName}
          </div>
        </div>
      </div>
    </div>
  );
};
