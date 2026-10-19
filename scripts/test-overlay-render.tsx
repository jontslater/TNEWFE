/**
 * SSR smoke: SkillChargeBar + minimal hero card shell (no Firebase).
 */
import React from 'react';
import { renderToString } from 'react-dom/server';
import { SkillChargeBar } from '../src/overlay/SkillChargeBar';

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

function MinimalHeroCard({ name, role }: { name: string; role: string }) {
  return (
    <div data-hero-id="test-hero" style={{ width: 120 }}>
      <SkillChargeBar heroRole={role} cooldowns={{ roleActiveReadyAt: 0 }} />
      <div>{name}</div>
    </div>
  );
}

const barHtml = renderToString(
  <SkillChargeBar heroRole="cleric" cooldowns={{ roleActiveReadyAt: Date.now() + 5000 }} />
);
assert(barHtml.includes('120px'), 'SkillChargeBar renders width');
assert(!barHtml.includes('Cannot access'), 'SkillChargeBar does not throw TDZ on ready');

const cardHtml = renderToString(<MinimalHeroCard name="Smoke" role="guardian" />);
assert(cardHtml.includes('data-hero-id'), 'hero card shell renders');
assert(cardHtml.includes('Smoke'), 'hero name in card');

console.log('test-overlay-render: OK');
