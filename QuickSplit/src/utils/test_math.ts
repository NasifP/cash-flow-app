import { calculateSplits, formatCurrency } from './math';
import Decimal from 'decimal.js';

const testMath = () => {
  console.log('--- Testing QuickSplit Math Engine ---\n');

  const participants = [
    { id: '1', name: 'Alice', itemsSubtotal: 100 },
    { id: '2', name: 'Bob', itemsSubtotal: 200 },
  ];
  const extraCharges = 30; // 10% tax/service

  console.log('Input:');
  console.log('Alice Subtotal:', 100);
  console.log('Bob Subtotal:', 200);
  console.log('Extra Charges:', 30);
  console.log('\nProcessing...');

  const result = calculateSplits(participants, extraCharges);

  result.participants.forEach(p => {
    console.log(`${p.name} Total: ${formatCurrency(p.total)}`);
  });

  console.log('Grand Total:', formatCurrency(result.grandTotal));
  
  // Verification
  // Alice should pay: 100 + (100/300)*30 = 100 + 10 = 110
  // Bob should pay: 200 + (200/300)*30 = 200 + 20 = 220
  // Total: 330
  
  if (result.participants[0].total.equals(110) && result.participants[1].total.equals(220)) {
    console.log('\n✅ TEST PASSED: Proportional distribution is correct.');
  } else {
    console.log('\n❌ TEST FAILED: Result mismatch.');
  }
};

testMath();
