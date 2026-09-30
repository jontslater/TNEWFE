import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, QuerySnapshot, DocumentData, doc, getDoc } from 'firebase/firestore';
import { db } from '../utils/firebase';

export interface BattlefieldState {
  battlefieldId: string;
  heroes: any[];
  enemies: any[];
  background: string;
  combatLog: string[];
  inCombat: boolean;
  timestamp: number;
}

/**
 * Real-time listener for battlefield state
 * Only updates when heroes in the battlefield actually change
 * This minimizes backend calls by using Firebase real-time listeners
 */
export function useBattlefieldListener(battlefieldId: string | null) {
  const [battlefieldState, setBattlefieldState] = useState<BattlefieldState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log(`[Battlefield Listener] Effect triggered with battlefieldId:`, battlefieldId);
    
    if (!battlefieldId) {
      console.log(`[Battlefield Listener] No battlefieldId provided, clearing state`);
      setBattlefieldState(null);
      setLoading(false);
      return;
    }

    console.log(`[Battlefield Listener] Initializing listener for battlefieldId: ${battlefieldId}`);
    setLoading(true);
    setError(null);

    // Decode battlefieldId in case it's URL encoded
    let decodedBattlefieldId = decodeURIComponent(battlefieldId);
    
    // Normalize to lowercase for consistency (Twitch usernames are case-insensitive)
    // Format: "twitch:username" or "twitch:userId" -> normalize the username part (but keep numeric IDs as-is)
    if (decodedBattlefieldId.startsWith('twitch:')) {
      const parts = decodedBattlefieldId.split(':');
      if (parts.length === 2) {
        const identifier = parts[1].trim();
        // Only lowercase if it's not a pure numeric ID (usernames are lowercase, IDs stay as-is)
        const normalizedIdentifier = /^\d+$/.test(identifier) ? identifier : identifier.toLowerCase();
        decodedBattlefieldId = `twitch:${normalizedIdentifier}`;
      }
    }

    console.log(`[Battlefield Listener] Querying heroes with currentBattlefieldId == "${decodedBattlefieldId}"`);
    console.log(`[Battlefield Listener] Decoded battlefieldId type: ${typeof decodedBattlefieldId}, value: "${decodedBattlefieldId}"`);

    // Create query for heroes in this battlefield
    const heroesQuery = query(
      collection(db, 'heroes'),
      where('currentBattlefieldId', '==', decodedBattlefieldId)
    );
    
    console.log(`[Battlefield Listener] Query created, setting up listener...`);

    // Set up real-time listener - only triggers when data changes
    // Firebase charges per document read, but only when data changes (not on every snapshot)
    // This is much cheaper than polling backend APIs
    // Using includeMetadataChanges: true ensures we get updates even for pending writes
    const unsubscribe = onSnapshot(
      heroesQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        try {
          console.log(`[Battlefield Listener] Snapshot update for ${decodedBattlefieldId}: ${snapshot.docs.length} heroes`);
          console.log(`[Battlefield Listener] Snapshot metadata:`, {
            hasPendingWrites: snapshot.metadata.hasPendingWrites,
            fromCache: snapshot.metadata.fromCache
          });
          
          // Log hero details for debugging
          if (snapshot.docs.length > 0) {
            snapshot.docs.forEach(doc => {
              const hero = doc.data();
              console.log(`  - Hero: ${hero.name || hero.characterName || 'Unknown'} (${hero.role}) - Battlefield: ${hero.currentBattlefieldId || 'none'} - ID: ${doc.id}`);
            });
          } else {
            console.log(`  ⚠️ No heroes found with currentBattlefieldId == "${decodedBattlefieldId}"`);
            console.log(`  💡 Make sure heroes are synced to Firebase with the correct battlefield ID`);
            console.log(`  💡 Try clicking "Push" button in Electron app to sync heroes with battlefield ID`);
            console.log(`  💡 Debug: Check Firebase console for heroes with different battlefield IDs`);
            
            // Try to find any heroes to help debug - but only once to avoid spam
            if (!snapshot.metadata.fromCache) {
              const allHeroesQuery = query(collection(db, 'heroes'), where('currentBattlefieldId', '!=', null));
              onSnapshot(allHeroesQuery, (debugSnapshot: any) => {
                if (debugSnapshot.docs.length > 0) {
                  const battlefieldIds = new Set();
                  debugSnapshot.docs.forEach((doc: any) => {
                    const hero = doc.data();
                    if (hero.currentBattlefieldId) {
                      battlefieldIds.add(hero.currentBattlefieldId);
                    }
                  });
                  console.log(`  🔍 Found ${debugSnapshot.docs.length} heroes in Firebase with battlefield IDs:`, Array.from(battlefieldIds));
                  console.log(`  🔍 Looking for: "${decodedBattlefieldId}"`);
                  console.log(`  🔍 Match found: ${Array.from(battlefieldIds).includes(decodedBattlefieldId)}`);
                }
              }, { onlyOnce: true });
            }
          }
          
          const heroes = snapshot.docs.map(doc => {
            const hero = doc.data();
            return {
              id: doc.id,
              ...hero,
              spriteImage: hero.spriteImage || null,
              spritePosition: hero.spritePosition || null
            };
          });

          // Always update state, even if heroes array is empty (to clear previous state)
          // This ensures the UI updates immediately when heroes join/leave
          console.log(`[Battlefield Listener] ✅ Updating state with ${heroes.length} heroes (timestamp: ${Date.now()})`);
          setBattlefieldState(prevState => {
            // Only update if heroes actually changed to avoid unnecessary re-renders
            const prevHeroIds = prevState?.heroes?.map(h => h.id).sort().join(',') || '';
            const newHeroIds = heroes.map(h => h.id).sort().join(',');
            if (prevHeroIds === newHeroIds && prevState?.heroes?.length === heroes.length) {
              console.log(`[Battlefield Listener] ⏭️ Skipping state update - heroes unchanged`);
              return prevState;
            }
            // State changed - updating with new heroes (silent in production)
            if (import.meta.env.MODE === 'development') {
              console.log(`[Battlefield Listener] 🔄 State changed - updating with new heroes`);
            }
            // Also load battlefield document for enemies and combat state
            // Check if battlefield document exists
            const battlefieldDocRef = doc(db, 'battlefields', decodedBattlefieldId);
            
            // Load enemies from battlefield document if it exists
            getDoc(battlefieldDocRef).then((battlefieldDoc) => {
              if (battlefieldDoc.exists()) {
                const battlefieldData = battlefieldDoc.data();
                const enemies = battlefieldData.enemies || battlefieldData.currentEnemies || [];
                const inCombat = battlefieldData.inCombat || false;
                
                // Loaded battlefield doc (silent in production)
                if (import.meta.env.MODE === 'development') {
                  console.log(`[Battlefield Listener] ✅ Loaded battlefield doc with ${enemies.length} enemies, inCombat: ${inCombat}`);
                }
                
                setBattlefieldState(prevState => ({
                  ...prevState!,
                  enemies,
                  inCombat,
                  background: battlefieldData.background || 'forest',
                  combatLog: battlefieldData.combatLog || []
                }));
              } else {
                // No battlefield doc, enemies will be empty (expected during initial load - silent)
                // This is normal behavior, no need to log
              }
            }).catch((err) => {
              console.warn(`[Battlefield Listener] ⚠️ Could not load battlefield doc:`, err);
            });
            
            return {
              battlefieldId: decodedBattlefieldId,
              heroes,
              currentEnemy: null,
              enemies: [], // Will be populated from battlefield doc above
              background: 'forest', // Default background
              combatLog: [],
              inCombat: false,
              timestamp: Date.now()
            };
          });

          setLoading(false);
          setError(null);
        } catch (err: any) {
          console.error('Error processing battlefield snapshot:', err);
          setError(err.message || 'Failed to process battlefield data');
          setLoading(false);
        }
      },
      (err) => {
        console.error('[Battlefield Listener] ❌ Firebase listener error:', err);
        console.error('[Battlefield Listener] Error details:', {
          code: err.code,
          message: err.message,
          stack: err.stack
        });
        setError(err.message || 'Failed to connect to battlefield');
        setLoading(false);
      },
      {
        // Include metadata changes to detect when writes are committed
        // This helps detect when pending writes are committed to the server
        includeMetadataChanges: true
      }
    );
    
    console.log(`[Battlefield Listener] ✅ Listener set up successfully, waiting for snapshot...`);
    
    // Also set up listener for battlefield document (for enemies and combat state)
    const battlefieldDocRef = doc(db, 'battlefields', decodedBattlefieldId);
    const unsubscribeBattlefield = onSnapshot(
      battlefieldDocRef,
      (battlefieldDoc) => {
        if (battlefieldDoc.exists()) {
          const battlefieldData = battlefieldDoc.data();
          const enemies = battlefieldData.enemies || battlefieldData.currentEnemies || [];
          const inCombat = battlefieldData.inCombat || false;
          
          // Battlefield doc update (silent in production)
          if (import.meta.env.MODE === 'development') {
            console.log(`[Battlefield Listener] 🔄 Battlefield doc update: ${enemies.length} enemies, inCombat: ${inCombat}`);
          }
          
          setBattlefieldState(prevState => {
            if (!prevState) {
              // If no state yet, create initial state with empty heroes (will be populated by heroes listener)
              return {
                battlefieldId: decodedBattlefieldId,
                heroes: [],
                currentEnemy: battlefieldData.currentEnemy || null,
                enemies,
                background: battlefieldData.background || 'forest',
                combatLog: battlefieldData.combatLog || [],
                inCombat,
                timestamp: Date.now()
              };
            }
            return {
              ...prevState,
              enemies,
              inCombat,
              background: battlefieldData.background || prevState.background || 'forest',
              combatLog: battlefieldData.combatLog || prevState.combatLog || [],
              currentEnemy: battlefieldData.currentEnemy || prevState.currentEnemy || null
            };
          });
        } else {
          // Battlefield doc does not exist yet (expected during initial load - silent)
          // This is normal behavior, no need to log
        }
      },
      (err) => {
        console.warn(`[Battlefield Listener] ⚠️ Battlefield doc listener error:`, err);
      }
    );

    // Cleanup listeners on unmount
    return () => {
      unsubscribe();
      unsubscribeBattlefield();
    };
  }, [battlefieldId]);

  return { battlefieldState, loading, error };
}
