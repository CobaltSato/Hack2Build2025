// Simple error signature calculator for common ValidationRegistry errors
// Error signature 0xbeab6e29 analysis

const crypto = require('crypto');

function calculateErrorSignature(errorString) {
  const hash = crypto.createHash('sha256').update(errorString).digest('hex');
  return '0x' + hash.substring(0, 8);
}

const errorCandidates = [
  'DataHashNotAllowed()',
  'DataNotAllowed()', 
  'HashNotApproved()',
  'UnauthorizedDataHash()',
  'DataHashNotApproved()',
  'NotAllowedDataHash()',
  'InvalidDataRequest()',
  'RequireDataHashApproval()',
  'DataHashNotAuthorized()'
];

const targetSignature = '0xbeab6e29';

console.log(`Target signature: ${targetSignature}`);
console.log('\nChecking possible error signatures:');

errorCandidates.forEach(error => {
  const signature = calculateErrorSignature(error);
  console.log(`${error.padEnd(25)} -> ${signature}`);
  
  if (signature === targetSignature) {
    console.log(`*** MATCH FOUND: ${error} ***`);
  }
});

// Most likely this is a DataHashNotAllowed error based on the sequence diagram
console.log('\n=== Analysis ===');
console.log('Based on the ERC8004 sequence diagram, this error is likely:');
console.log('- DataHashNotAllowed(): Data hash not pre-approved by admin');
console.log('- Missing setDataHashAllowed() function in current contract');
console.log('- Admin approval required before validation requests');