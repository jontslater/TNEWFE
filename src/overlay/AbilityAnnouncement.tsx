import React from 'react';
import { roleCategoryColor } from '../game/skills/activeAbilities';
import type { SkillCategory } from '../game/skills/types';

export interface AbilityAnnouncementProps {
  abilityName: string;
  heroName: string;
  category: SkillCategory;
}

export const AbilityAnnouncement: React.FC<AbilityAnnouncementProps> = ({
  abilityName,
  heroName,
  category,
}) => {
  const color = roleCategoryColor(category);

  return (
    <div
      className="fixed top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none"
      style={{ animation: 'bounce 0.5s ease-in-out 2' }}
    >
      <div
        className="rounded-lg px-8 py-5 shadow-2xl border-4"
        style={{
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          borderColor: color,
          boxShadow: `0 0 28px ${color}`,
        }}
      >
        <div className="text-center">
          <div className="text-2xl font-bold mb-1" style={{ color }}>
            {abilityName}
          </div>
          <div className="text-sm text-gray-300">{heroName}</div>
        </div>
      </div>
    </div>
  );
};
