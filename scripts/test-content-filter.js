/**
 * Content Filter Test Script
 * Run with: node scripts/test-content-filter.js
 */

// Simplified content filter logic for testing
const BLOCKED_WORDS = [
  // Add actual blocked words here for testing
  'profanity', 'slur', 'hate',
];

function shouldFilterMessage(message, settings) {
  const lowerMessage = message.toLowerCase();

  // Blocked words filter
  if (settings.blockedWordsFilter) {
    for (const word of BLOCKED_WORDS) {
      const regex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (regex.test(lowerMessage)) {
        return { filtered: true, reason: 'Contains blocked word' };
      }
    }
  }

  // Maturity filter
  if (settings.maturityFilter) {
    // Strict
    if (settings.maturityLevel === 'strict') {
      const strictPatterns = [
        /\b(f\*ck|fuck|sh\*t|shit|b\*tch|bitch|a\*s|ass)\b/i,
        /\b(d\*mn|damn|h\*ll|hell)\b/i,
      ];
      
      for (const pattern of strictPatterns) {
        if (pattern.test(message)) {
          return { filtered: true, reason: 'Maturity filter (strict)' };
        }
      }
    }

    // Moderate
    if (settings.maturityLevel === 'moderate' || settings.maturityLevel === 'strict') {
      const moderatePatterns = [
        /\b(f\*ck|fuck|sh\*t|shit)\b/i,
      ];
      
      for (const pattern of moderatePatterns) {
        if (pattern.test(message)) {
          return { filtered: true, reason: 'Maturity filter (moderate)' };
        }
      }
    }
  }

  return { filtered: false };
}

// Test messages
const testMessages = [
  'Hello world',
  'This is a test message',
  'What the hell is this?',
  'That was damn good',
  'This message contains profanity',
  'Great game!',
  'How are you doing?',
];

// Test cases
const testCases = [
  {
    name: 'Blocked Words Filter ON',
    settings: {
      maturityFilter: false,
      blockedWordsFilter: true,
      maturityLevel: 'none'
    }
  },
  {
    name: 'Maturity Filter - Strict',
    settings: {
      maturityFilter: true,
      blockedWordsFilter: false,
      maturityLevel: 'strict'
    }
  },
  {
    name: 'Maturity Filter - Moderate',
    settings: {
      maturityFilter: true,
      blockedWordsFilter: false,
      maturityLevel: 'moderate'
    }
  },
  {
    name: 'Both Filters ON - Strict',
    settings: {
      maturityFilter: true,
      blockedWordsFilter: true,
      maturityLevel: 'strict'
    }
  },
  {
    name: 'All Filters OFF',
    settings: {
      maturityFilter: false,
      blockedWordsFilter: false,
      maturityLevel: 'none'
    }
  }
];

console.log('🧪 Starting Content Filter Tests...\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];

testCases.forEach(testCase => {
  console.log(`\n📋 Test: ${testCase.name}`);
  console.log(`Settings:`, JSON.stringify(testCase.settings, null, 2));
  console.log('─'.repeat(60));
  
  testMessages.forEach(message => {
    totalTests++;
    const result = shouldFilterMessage(message, testCase.settings);
    
    // Determine if this should be filtered based on content
    const shouldFilter = 
      (testCase.settings.blockedWordsFilter && BLOCKED_WORDS.some(word => 
        new RegExp(`\\b${word}\\b`, 'i').test(message.toLowerCase())
      )) ||
      (testCase.settings.maturityFilter && 
        (testCase.settings.maturityLevel === 'strict' && 
          (/\b(hell|damn|fuck|shit|bitch|ass)\b/i.test(message))) ||
        (testCase.settings.maturityLevel === 'moderate' && 
          (/\b(fuck|shit)\b/i.test(message)))
      );
    
    const status = result.filtered === shouldFilter ? '✅' : '❌';
    const resultText = result.filtered ? 'FILTERED' : 'ALLOWED';
    const expectedText = shouldFilter ? 'FILTERED' : 'ALLOWED';
    
    if (result.filtered === shouldFilter) {
      passedTests++;
      console.log(`  ${status} "${message.substring(0, 50)}" - ${resultText} (expected: ${expectedText})`);
    } else {
      failedTests++;
      const failure = {
        test: testCase.name,
        message,
        got: result.filtered ? 'FILTERED' : 'ALLOWED',
        expected: shouldFilter ? 'FILTERED' : 'ALLOWED',
        reason: result.reason
      };
      failures.push(failure);
      console.log(`  ${status} "${message.substring(0, 50)}" - ${resultText} (expected: ${expectedText})`);
      if (result.reason) {
        console.log(`     Reason: ${result.reason}`);
      }
    }
  });
});

console.log(`\n\n📊 Test Results:`);
console.log(`   Total: ${totalTests}`);
console.log(`   Passed: ${passedTests} ✅`);
console.log(`   Failed: ${failedTests} ${failedTests > 0 ? '❌' : ''}`);
console.log(`   Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

if (failures.length > 0) {
  console.log(`\n⚠️  Failed Tests:`);
  failures.forEach((failure, idx) => {
    console.log(`\n   ${idx + 1}. ${failure.test}`);
    console.log(`      Message: "${failure.message}"`);
    console.log(`      Got: ${failure.got}, Expected: ${failure.expected}`);
    if (failure.reason) {
      console.log(`      Reason: ${failure.reason}`);
    }
  });
}

if (failedTests === 0) {
  console.log(`\n🎉 All tests passed!`);
} else {
  console.log(`\n⚠️  Some tests failed. Review the filter logic.`);
  process.exit(1);
}






