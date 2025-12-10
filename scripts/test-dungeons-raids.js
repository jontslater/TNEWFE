/**
 * Dungeon & Raid Testing Script
 * Tests queue, matchmaking, instances, combat, and rewards
 */

const API_URL = process.env.API_URL || 'http://localhost:3001';

// Normalize hero role to tank/healer/dps
function normalizeHeroRole(heroRole) {
  if (!heroRole) return 'dps';
  
  const roleLower = heroRole.toLowerCase();
  
  // Tank roles
  const tankRoles = ['guardian', 'paladin', 'warden', 'bloodknight', 'vanguard', 'brewmaster'];
  if (tankRoles.includes(roleLower) || roleLower === 'tank') {
    return 'tank';
  }
  
  // Healer roles
  const healerRoles = ['cleric', 'atoner', 'druid', 'lightbringer', 'shaman', 'mistweaver', 'chronomancer', 'bard'];
  if (healerRoles.includes(roleLower) || roleLower === 'healer') {
    return 'healer';
  }
  
  // Everything else is DPS
  return 'dps';
}

// Test configuration
const TEST_CONFIG = {
  userId: '1087777297', // Twitch user ID from URL
  battlefieldId: 'twitch:1087777297',
  testDungeons: [
    { id: 'normal', name: 'Normal Dungeon', difficulty: 'normal' },
    { id: 'heroic', name: 'Heroic Dungeon', difficulty: 'heroic' },
    { id: 'mythic', name: 'Mythic Dungeon', difficulty: 'mythic' }
  ],
  testRaids: [
    { id: 'elder_dragon_normal', name: 'Elder Dragon (Normal)', difficulty: 'normal' },
    { id: 'elder_dragon_heroic', name: 'Elder Dragon (Heroic)', difficulty: 'heroic' },
    { id: 'elder_dragon_mythic', name: 'Elder Dragon (Mythic)', difficulty: 'mythic' }
  ]
};

// Test results storage
const testResults = {
  dungeons: [],
  raids: [],
  errors: [],
  warnings: []
};

/**
 * Test helper functions
 */
async function apiCall(endpoint, method = 'GET', body = null) {
  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (body) options.body = JSON.stringify(body);
    
    const response = await fetch(`${API_URL}${endpoint}`, options);
    const data = await response.json();
    return { success: response.ok, data, status: response.status };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : type === 'success' ? '✅' : 'ℹ️';
  console.log(`[${timestamp}] ${prefix} ${message}`);
  
  if (type === 'error') {
    testResults.errors.push(message);
  } else if (type === 'warning') {
    testResults.warnings.push(message);
  }
}

/**
 * Test 1: Get user's heroes
 */
async function testGetHeroes() {
  log('Testing: Get user heroes');
  const result = await apiCall(`/api/heroes/twitch/${TEST_CONFIG.userId}/all`);
  
  if (result.success && Array.isArray(result.data)) {
    log(`Found ${result.data.length} heroes`, 'success');
    return result.data;
  } else {
    log(`Failed to get heroes: ${result.error || result.data}`, 'error');
    return [];
  }
}

/**
 * Test 2: Get available dungeons
 */
async function testGetDungeons() {
  log('Testing: Get available dungeons');
  // Try different possible endpoints - note: route is /api/dungeon (singular)
  let result = await apiCall('/api/dungeon');
  
  if (!result.success) {
    // Try alternative endpoints
    result = await apiCall('/api/dungeon/available');
  }
  
  if (!result.success) {
    // Try with userId (this is the correct endpoint)
    result = await apiCall(`/api/dungeon/available/${TEST_CONFIG.userId}`);
  }
  
  if (result.success) {
    // Response can be either an array or an object with availableDungeons
    if (Array.isArray(result.data)) {
      log(`Found ${result.data.length} dungeons`, 'success');
      return result.data;
    } else if (result.data && result.data.availableDungeons) {
      log(`Found ${result.data.availableDungeons.length} dungeons`, 'success');
      return result.data; // Return full response including itemScore
    } else {
      log(`Unexpected response format: ${JSON.stringify(result.data)}`, 'warning');
      return result.data;
    }
  } else {
    log(`Failed to get dungeons. Status: ${result.status}, Response: ${JSON.stringify(result.data)}`, 'warning');
    log('Note: Dungeons may not have a list endpoint - they might be accessed via queue only', 'info');
    // Return mock data for testing queue
    return {
      availableDungeons: [
        { id: 'normal', name: 'Normal Dungeon', difficulty: 'normal', minLevel: 1, minItemScore: 0 },
        { id: 'heroic', name: 'Heroic Dungeon', difficulty: 'heroic', minLevel: 10, minItemScore: 200 },
        { id: 'mythic', name: 'Mythic Dungeon', difficulty: 'mythic', minLevel: 20, minItemScore: 500 }
      ]
    };
  }
}

/**
 * Test 3: Get available raids
 */
async function testGetRaids() {
  log('Testing: Get available raids');
  const result = await apiCall('/api/raids');
  
  if (result.success && Array.isArray(result.data)) {
    log(`Found ${result.data.length} raids`, 'success');
    return result.data;
  } else {
    log(`Failed to get raids: ${result.error || result.data}`, 'error');
    return [];
  }
}

/**
 * Test 4: Queue for dungeon
 */
async function testQueueDungeon(heroId, dungeonType, heroRole, itemScore) {
  log(`Testing: Queue hero ${heroId} for dungeon type ${dungeonType}`);
  
  // Note: Route is /api/dungeon/queue (singular)
  const result = await apiCall('/api/dungeon/queue', 'POST', {
    userId: TEST_CONFIG.userId,
    heroId,
    role: heroRole,
    itemScore: itemScore || 0,
    dungeonType: dungeonType || 'normal'
  });
  
  if (result.success) {
    log(`Successfully queued for dungeon ${dungeonType}`, 'success');
    return result.data;
  } else {
    log(`Failed to queue for dungeon: ${result.error || result.data?.error || JSON.stringify(result.data)}`, 'error');
    return null;
  }
}

/**
 * Test 5: Queue for raid
 */
async function testQueueRaid(heroId, raidId, heroRole, itemScore) {
  log(`Testing: Queue hero ${heroId} for raid ${raidId}`);
  
  // Try the correct endpoint: /api/raids/queue/:raidId/join
  const result = await apiCall(`/api/raids/queue/${raidId}/join`, 'POST', {
    userId: TEST_CONFIG.userId,
    heroId,
    role: heroRole,
    itemScore: itemScore || 0
  });
  
  if (result.success) {
    log(`Successfully queued for raid ${raidId}`, 'success');
    return result.data;
  } else {
    log(`Failed to queue for raid: ${result.error || result.data?.error || JSON.stringify(result.data)}`, 'error');
    return null;
  }
}

/**
 * Test 6: Check queue status
 */
async function testQueueStatus() {
  log(`Testing: Check queue status for user ${TEST_CONFIG.userId}`);
  
  // Note: Route is /api/dungeon/queue/status (singular)
  const result = await apiCall(`/api/dungeon/queue/status?userId=${TEST_CONFIG.userId}`);
  
  if (result.success) {
    log(`Queue status: ${JSON.stringify(result.data)}`, 'info');
    return result.data;
  } else {
    log(`Failed to get queue status: ${result.error || result.data?.error || JSON.stringify(result.data)}`, 'warning');
    return null;
  }
}

/**
 * Test 6.5: Leave dungeon queue
 */
async function leaveDungeonQueue() {
  log(`Leaving dungeon queue for user ${TEST_CONFIG.userId}`);
  
  const result = await apiCall('/api/dungeon/queue', 'DELETE', {
    userId: TEST_CONFIG.userId
  });
  
  if (result.success) {
    log(`Successfully left dungeon queue`, 'success');
    return true;
  } else {
    // Not in queue is fine
    if (result.status === 404) {
      log(`Not in dungeon queue (expected)`, 'info');
      return true;
    }
    log(`Failed to leave dungeon queue: ${result.error || result.data?.error || JSON.stringify(result.data)}`, 'warning');
    return false;
  }
}

/**
 * Test 6.6: Leave raid queue
 */
async function leaveRaidQueue(raidId) {
  log(`Leaving raid queue for raid ${raidId}`);
  
  const result = await apiCall(`/api/raids/queue/${raidId}/leave`, 'POST', {
    userId: TEST_CONFIG.userId
  });
  
  if (result.success) {
    log(`Successfully left raid queue`, 'success');
    return true;
  } else {
    // Not in queue is fine
    if (result.status === 404) {
      log(`Not in raid queue (expected)`, 'info');
      return true;
    }
    log(`Failed to leave raid queue: ${result.error || result.data?.error || JSON.stringify(result.data)}`, 'warning');
    return false;
  }
}

/**
 * Test 8: Create test dungeon instance
 */
async function createTestDungeonInstance(heroId, dungeonId = 'goblin_cave') {
  log(`Creating test dungeon instance for hero ${heroId} in dungeon ${dungeonId}`);
  
  // Use the start endpoint with just the hero as participant (for testing)
  // This will create an instance that the browser can detect
  // Use goblin_cave which is a solo dungeon (minPlayers: 1)
  const result = await apiCall(`/api/dungeon/${dungeonId}/start`, 'POST', {
    organizerId: TEST_CONFIG.userId,
    participants: [heroId] // Just this hero for testing
  });
  
  if (result.success) {
    log(`Test dungeon instance created successfully`, 'success');
    log(`Instance ID: ${result.data.instanceId || result.data.id}`, 'info');
    return result.data;
  } else {
    log(`Failed to create test instance: ${result.error || result.data?.error || JSON.stringify(result.data)}`, 'error');
    log(`Note: You may need to wait for matchmaking (5 players) or create a test instance manually`, 'info');
    return null;
  }
}

/**
 * Test 7: Get dungeon instance
 */
async function testGetDungeonInstance(instanceId) {
  log(`Testing: Get dungeon instance ${instanceId}`);
  
  const result = await apiCall(`/api/dungeons/instance/${instanceId}`);
  
  if (result.success) {
    log(`Dungeon instance data retrieved`, 'success');
    return result.data;
  } else {
    log(`Failed to get dungeon instance: ${result.error || result.data}`, 'error');
    return null;
  }
}

/**
 * Test 8: Get raid instance
 */
async function testGetRaidInstance(instanceId) {
  log(`Testing: Get raid instance ${instanceId}`);
  
  const result = await apiCall(`/api/raids/instance/${instanceId}`);
  
  if (result.success) {
    log(`Raid instance data retrieved`, 'success');
    return result.data;
  } else {
    log(`Failed to get raid instance: ${result.error || result.data}`, 'error');
    return null;
  }
}

/**
 * Test 9: Check dungeon requirements
 */
async function testDungeonRequirements(dungeon) {
  log(`Testing: Check requirements for ${dungeon.name || dungeon.id}`);
  
  const requirements = {
    minLevel: dungeon.minLevel || 0,
    minGearScore: dungeon.minGearScore || 0,
    roles: dungeon.roles || {}
  };
  
  log(`Requirements: Level ${requirements.minLevel}+, Gear Score ${requirements.minGearScore}+`, 'info');
  log(`Roles needed: ${JSON.stringify(requirements.roles)}`, 'info');
  
  return requirements;
}

/**
 * Test 10: Check raid requirements
 */
async function testRaidRequirements(raid) {
  log(`Testing: Check requirements for ${raid.name || raid.id}`);
  
  const requirements = {
    minLevel: raid.minLevel || 0,
    minGearScore: raid.minGearScore || 0,
    roles: raid.roles || {}
  };
  
  log(`Requirements: Level ${requirements.minLevel}+, Gear Score ${requirements.minGearScore}+`, 'info');
  log(`Roles needed: ${JSON.stringify(requirements.roles)}`, 'info');
  
  return requirements;
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('\n' + '='.repeat(60));
  console.log('DUNGEON & RAID TESTING SCRIPT');
  console.log('='.repeat(60) + '\n');
  
  log(`Testing with user ID: ${TEST_CONFIG.userId}`);
  log(`API URL: ${API_URL}\n`);
  
  // Test 1: Get heroes
  const heroes = await testGetHeroes();
  if (heroes.length === 0) {
    log('No heroes found. Cannot continue testing.', 'error');
    return;
  }
  
  const testHero = heroes[0];
  let heroItemScore = testHero.itemScore || testHero.item_score || 0;
  
  // Test 2: Get dungeons
  const dungeonsResponse = await testGetDungeons();
  const dungeonsArray = Array.isArray(dungeonsResponse) ? dungeonsResponse : (dungeonsResponse.availableDungeons || []);
  
  // If dungeons response includes itemScore, use it
  if (dungeonsResponse && typeof dungeonsResponse === 'object' && dungeonsResponse.itemScore) {
    heroItemScore = dungeonsResponse.itemScore;
    log(`Hero item score from API: ${heroItemScore}`, 'info');
  }
  
  log(`Using hero: ${testHero.name || testHero.id} (Level ${testHero.level || 1}, Role: ${testHero.role || 'unknown'}, ItemScore: ${heroItemScore})\n`);
  log(`\nFound ${dungeonsArray.length} dungeons available\n`);
  
  // Cleanup: Leave any existing queues before testing
  console.log('\n' + '-'.repeat(60));
  console.log('CLEANUP: Leaving existing queues');
  console.log('-'.repeat(60));
  await leaveDungeonQueue();
  
  // Try to leave raid queues for common raids
  const commonRaids = ['corrupted_temple', 'bandit_stronghold', 'haunted_crypt'];
  for (const raidId of commonRaids) {
    await leaveRaidQueue(raidId);
  }
  console.log('');
  
  // Test 3: Get raids
  const raids = await testGetRaids();
  log(`\nFound ${raids.length} raids available\n`);
  
  // Test 4: Check dungeon requirements
  console.log('\n' + '-'.repeat(60));
  console.log('DUNGEON REQUIREMENTS CHECK');
  console.log('-'.repeat(60));
  for (const dungeon of dungeonsArray.slice(0, 3)) { // Test first 3
    await testDungeonRequirements(dungeon);
    console.log('');
  }
  
  // Test 5: Check raid requirements
  console.log('\n' + '-'.repeat(60));
  console.log('RAID REQUIREMENTS CHECK');
  console.log('-'.repeat(60));
  for (const raid of raids.slice(0, 3)) { // Test first 3
    await testRaidRequirements(raid);
    console.log('');
  }
  
  // Test 6: Try to queue for a dungeon (if hero meets requirements)
  console.log('\n' + '-'.repeat(60));
  console.log('DUNGEON QUEUE TEST');
  console.log('-'.repeat(60));
  
  if (dungeonsArray.length > 0) {
    const testDungeon = dungeonsArray[0];
    const heroRole = testHero.role || 'dps';
    // Normalize role to tank/healer/dps
    const normalizedRole = normalizeHeroRole(heroRole);
    const itemScore = heroItemScore;
    const dungeonType = testDungeon.difficulty || testDungeon.id || 'normal';
    
    log(`Attempting to queue: Hero ${testHero.name} (${heroRole} -> ${normalizedRole}, ItemScore: ${itemScore}) for ${dungeonType} dungeon`);
    
    const queueResult = await testQueueDungeon(testHero.id, dungeonType, normalizedRole, itemScore);
    
    if (queueResult) {
      // Check queue status
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      await testQueueStatus();
    }
  } else {
    log('No dungeons available to test', 'warning');
  }
  
  // Test 7: Try to queue for a raid (if hero meets requirements)
  console.log('\n' + '-'.repeat(60));
  console.log('RAID QUEUE TEST');
  console.log('-'.repeat(60));
  
  if (raids.length > 0) {
    const testRaid = raids[0];
    const heroRole = testHero.role || 'dps';
    // Normalize role to tank/healer/dps
    const normalizedRole = normalizeHeroRole(heroRole);
    const itemScore = heroItemScore;
    
    log(`Attempting to queue: Hero ${testHero.name} (${heroRole} -> ${normalizedRole}, ItemScore: ${itemScore}) for raid ${testRaid.id}`);
    
    const queueResult = await testQueueRaid(testHero.id, testRaid.id, normalizedRole, itemScore);
    
    if (queueResult) {
      // Check queue status
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      await testQueueStatus();
    }
  } else {
    log('No raids available to test', 'warning');
  }
  
  // Test 8: Create test instance (for visual testing)
  console.log('\n' + '-'.repeat(60));
  console.log('TEST INSTANCE CREATION');
  console.log('-'.repeat(60));
  log('Note: Queuing alone won\'t create an instance. Matchmaking needs 5 players for dungeons, 10 for raids.', 'info');
  log('Creating a test dungeon instance for visual testing...', 'info');
  log('Using goblin_cave (solo dungeon) which only needs 1 player...', 'info');
  
  // Use goblin_cave which is a solo dungeon (minPlayers: 1)
  const testInstanceResult = await createTestDungeonInstance(testHero.id, 'goblin_cave');
  if (testInstanceResult) {
    log(`Test instance created: ${testInstanceResult.instanceId}`, 'success');
    log('Browser source should now switch to dungeon mode!', 'success');
    log(`Check your browser - it should show dungeon mode with instance ID: ${testInstanceResult.instanceId}`, 'info');
  } else {
    log('Could not create test instance. You may need to wait for matchmaking or test with multiple players.', 'warning');
  }
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Errors: ${testResults.errors.length}`);
  console.log(`Total Warnings: ${testResults.warnings.length}`);
  
  if (testResults.errors.length > 0) {
    console.log('\nErrors:');
    testResults.errors.forEach((error, i) => {
      console.log(`  ${i + 1}. ${error}`);
    });
  }
  
  if (testResults.warnings.length > 0) {
    console.log('\nWarnings:');
    testResults.warnings.forEach((warning, i) => {
      console.log(`  ${i + 1}. ${warning}`);
    });
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
}

// Run tests if executed directly
if (import.meta.url === `file://${process.argv[1]}` || import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))) {
  runTests().catch(console.error);
}

export { runTests, testResults };
