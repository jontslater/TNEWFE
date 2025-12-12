/**
 * Test script for content filter functionality
 * Run this in the browser console to test the filter
 */

import { shouldFilterMessage, getFilterSettings, saveFilterSettings, FilterSettings, MaturityLevel } from './contentFilter';

// Test messages
const testMessages = [
  // Should be filtered (blocked words)
  'This is a test message with profanity',
  'Hello world',
  'Testing chat functionality',
  
  // Should be filtered (maturity - strict)
  'What the hell is this?',
  'That was damn good',
  
  // Should be filtered (maturity - moderate/strict)
  'This is a test',
  'Another message here',
  
  // Should pass
  'Hello everyone!',
  'How are you doing today?',
  'Great game!',
];

// Test cases
const testCases = [
  {
    name: 'Blocked Words Filter ON',
    settings: {
      maturityFilter: false,
      blockedWordsFilter: true,
      maturityLevel: 'none' as MaturityLevel
    },
    expectedFiltered: ['This is a test message with profanity'] // Add actual blocked words to test
  },
  {
    name: 'Maturity Filter - Strict',
    settings: {
      maturityFilter: true,
      blockedWordsFilter: false,
      maturityLevel: 'strict' as MaturityLevel
    },
    expectedFiltered: ['What the hell is this?', 'That was damn good']
  },
  {
    name: 'Maturity Filter - Moderate',
    settings: {
      maturityFilter: true,
      blockedWordsFilter: false,
      maturityLevel: 'moderate' as MaturityLevel
    },
    expectedFiltered: ['This is a test'] // Add actual profanity patterns
  },
  {
    name: 'Both Filters ON - Strict',
    settings: {
      maturityFilter: true,
      blockedWordsFilter: true,
      maturityLevel: 'strict' as MaturityLevel
    },
    expectedFiltered: ['This is a test message with profanity', 'What the hell is this?', 'That was damn good']
  },
  {
    name: 'All Filters OFF',
    settings: {
      maturityFilter: false,
      blockedWordsFilter: false,
      maturityLevel: 'none' as MaturityLevel
    },
    expectedFiltered: []
  }
];

/**
 * Run filter tests
 */
export function runFilterTests() {
  console.log('🧪 Starting Content Filter Tests...\n');
  
  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  testCases.forEach(testCase => {
    console.log(`\n📋 Test: ${testCase.name}`);
    console.log(`Settings:`, testCase.settings);
    
    testMessages.forEach(message => {
      totalTests++;
      const result = shouldFilterMessage(message, testCase.settings);
      const shouldBeFiltered = testCase.expectedFiltered.includes(message);
      
      if (result.filtered === shouldBeFiltered) {
        passedTests++;
        console.log(`  ✅ "${message.substring(0, 40)}..." - ${result.filtered ? 'FILTERED' : 'ALLOWED'} (expected: ${shouldBeFiltered ? 'FILTERED' : 'ALLOWED'})`);
      } else {
        failedTests++;
        console.error(`  ❌ "${message.substring(0, 40)}..." - ${result.filtered ? 'FILTERED' : 'ALLOWED'} (expected: ${shouldBeFiltered ? 'FILTERED' : 'ALLOWED'})`);
        if (result.reason) {
          console.error(`     Reason: ${result.reason}`);
        }
      }
    });
  });

  console.log(`\n\n📊 Test Results:`);
  console.log(`   Total: ${totalTests}`);
  console.log(`   Passed: ${passedTests} ✅`);
  console.log(`   Failed: ${failedTests} ${failedTests > 0 ? '❌' : ''}`);
  console.log(`   Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  if (failedTests === 0) {
    console.log(`\n🎉 All tests passed!`);
  } else {
    console.log(`\n⚠️  Some tests failed. Review the filter logic.`);
  }
}

/**
 * Test specific message with current settings
 */
export function testMessage(message: string, settings?: FilterSettings) {
  const filterSettings = settings || getFilterSettings();
  const result = shouldFilterMessage(message, filterSettings);
  
  console.log(`\n🔍 Testing: "${message}"`);
  console.log(`Settings:`, filterSettings);
  console.log(`Result: ${result.filtered ? '❌ FILTERED' : '✅ ALLOWED'}`);
  if (result.reason) {
    console.log(`Reason: ${result.reason}`);
  }
  
  return result;
}

/**
 * Test with different maturity levels
 */
export function testMaturityLevels(message: string) {
  console.log(`\n🔍 Testing message with different maturity levels: "${message}"\n`);
  
  const levels: MaturityLevel[] = ['none', 'mild', 'moderate', 'strict'];
  
  levels.forEach(level => {
    const settings: FilterSettings = {
      maturityFilter: true,
      blockedWordsFilter: false,
      maturityLevel: level
    };
    
    const result = shouldFilterMessage(message, settings);
    console.log(`  ${level.toUpperCase().padEnd(10)}: ${result.filtered ? '❌ FILTERED' : '✅ ALLOWED'}${result.reason ? ` (${result.reason})` : ''}`);
  });
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  (window as any).testContentFilter = {
    runTests: runFilterTests,
    testMessage,
    testMaturityLevels,
    getSettings: getFilterSettings,
    saveSettings: saveFilterSettings
  };
  
  console.log('📝 Content Filter Test Utilities loaded!');
  console.log('   Usage:');
  console.log('   - testContentFilter.runTests() - Run all tests');
  console.log('   - testContentFilter.testMessage("your message") - Test a specific message');
  console.log('   - testContentFilter.testMaturityLevels("your message") - Test across all maturity levels');
  console.log('   - testContentFilter.getSettings() - Get current filter settings');
  console.log('   - testContentFilter.saveSettings({...}) - Save filter settings');
}






