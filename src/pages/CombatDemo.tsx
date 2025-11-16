import { useState, useEffect } from 'react';
import CombatInterface from '../components/CombatInterface';

export default function CombatDemo() {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [bossHp, setBossHp] = useState(500000);
  const [combatLogs, setCombatLogs] = useState<any[]>([
    { id: '1', timestamp: Date.now() - 5000, type: 'system', message: 'Combat has begun!' },
    { id: '2', timestamp: Date.now() - 4000, type: 'mechanic', message: 'Boss casts Flame Breath!' },
    { id: '3', timestamp: Date.now() - 3000, type: 'damage', message: 'Tank takes damage', amount: 1200 },
    { id: '4', timestamp: Date.now() - 2000, type: 'heal', message: 'Healer heals Tank', amount: 800 },
  ]);

  const mockParticipants = [
    { id: '1', name: 'SteelShield', role: 'tank' as const, level: 50, hp: 8500, maxHp: 10000, isDead: false },
    { id: '2', name: 'HolyLight', role: 'healer' as const, level: 48, hp: 6000, maxHp: 7000, isDead: false },
    { id: '3', name: 'ShadowBlade', role: 'dps' as const, level: 52, hp: 5500, maxHp: 8000, isDead: false },
    { id: '4', name: 'FireMage', role: 'dps' as const, level: 49, hp: 4800, maxHp: 7500, isDead: false },
    { id: '5', name: 'DeadRogue', role: 'dps' as const, level: 47, hp: 0, maxHp: 7000, isDead: true },
  ];

  const mockMechanics = [
    { name: 'Flame Breath', description: 'Deals massive fire damage to all players in front', cooldown: 30 },
    { name: 'Ground Slam', description: 'AOE damage that stuns nearby players', cooldown: 20 },
    { name: 'Enrage', description: 'Increases attack speed by 50% when below 30% HP', cooldown: 0 },
    { name: 'Shadow Clone', description: 'Summons adds that must be killed quickly', cooldown: 60 },
  ];

  // Simulate combat timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Simulate boss taking damage
  useEffect(() => {
    const damageTimer = setInterval(() => {
      setBossHp(prev => {
        const newHp = Math.max(0, prev - Math.random() * 5000);
        
        // Add damage log
        const newLog = {
          id: Date.now().toString(),
          timestamp: Date.now(),
          type: 'damage',
          message: `${mockParticipants[Math.floor(Math.random() * 4)].name} hits Boss`,
          amount: Math.floor(Math.random() * 3000) + 500
        };
        
        setCombatLogs(prev => [...prev, newLog].slice(-50)); // Keep last 50 logs
        
        return newHp;
      });
    }, 2000);

    return () => clearInterval(damageTimer);
  }, []);

  // Simulate mechanics
  useEffect(() => {
    const mechanicTimer = setInterval(() => {
      const mechanic = mockMechanics[Math.floor(Math.random() * mockMechanics.length)];
      const newLog = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        type: 'mechanic',
        message: `Boss uses ${mechanic.name}!`
      };
      
      setCombatLogs(prev => [...prev, newLog].slice(-50));
    }, 15000);

    return () => clearInterval(mechanicTimer);
  }, []);

  return (
    <div>
      <CombatInterface
        bossName="Ancient Dragon"
        bossHp={bossHp}
        bossMaxHp={500000}
        bossLevel={50}
        bossSprite="🐉"
        mechanics={mockMechanics}
        participants={mockParticipants}
        combatLogs={combatLogs}
        duration={180} // 3 minutes
        elapsedTime={elapsedTime}
      />
    </div>
  );
}
