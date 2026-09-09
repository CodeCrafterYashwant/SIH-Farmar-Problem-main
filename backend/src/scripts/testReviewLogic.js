// Test review rating aggregation logic
const assert = require('assert');

function calculateAverageRating(ratings) {
  if (!ratings || ratings.length === 0) return { averageRating: 0, totalReviews: 0 };
  const total = ratings.length;
  const sum = ratings.reduce((acc, r) => acc + r, 0);
  const avg = Math.round((sum / total) * 10) / 10;
  return { averageRating: avg, totalReviews: total };
}

console.log('Testing Rating Calculation Logic...');

// Test 1: Empty ratings
const res1 = calculateAverageRating([]);
assert.strictEqual(res1.averageRating, 0);
assert.strictEqual(res1.totalReviews, 0);
console.log('  ✓ Empty reviews returns 0 avg and 0 total');

// Test 2: Single 5-star rating
const res2 = calculateAverageRating([5]);
assert.strictEqual(res2.averageRating, 5);
assert.strictEqual(res2.totalReviews, 1);
console.log('  ✓ Single 5-star rating returns 5.0');

// Test 3: Multiple ratings with rounding
const res3 = calculateAverageRating([5, 4, 4, 5, 3]);
// sum = 21 / 5 = 4.2
assert.strictEqual(res3.averageRating, 4.2);
assert.strictEqual(res3.totalReviews, 5);
console.log('  ✓ Multiple ratings average correctly calculated to 4.2');

console.log('All Review logic unit checks passed successfully!');
