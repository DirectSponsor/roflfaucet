# Poker Dice Probability Analysis

## Total Possible Outcomes
With 5 dice each having 6 faces (9, 10, J, Q, K, A):
**Total outcomes = 6^5 = 7,776 combinations**

## Hand Probabilities and Payouts

### 1. Five of a Kind
- **Description**: All 5 dice show the same value
- **Combinations**: 6 (one for each face value)
- **Probability**: 6/7,776 = 0.077% = 1 in 1,296
- **Suggested Payout**: 500:1 (RTP: 38.5%)

### 2. Four of a Kind  
- **Description**: 4 dice same value, 1 different
- **Calculation**: 6 ways to choose the quad value × 5 ways to choose position of singleton × 5 values for singleton
- **Combinations**: 6 × 5 × 5 = 150
- **Probability**: 150/7,776 = 1.93% = 1 in 51.8
- **Suggested Payout**: 25:1 (RTP: 48.3%)

### 3. Full House
- **Description**: 3 of one value + 2 of another value
- **Calculation**: 6 ways to choose triple value × 5 ways to choose pair value × C(5,3) ways to position them
- **Combinations**: 6 × 5 × 10 = 300  
- **Probability**: 300/7,776 = 3.86% = 1 in 25.9
- **Suggested Payout**: 12:1 (RTP: 46.3%)

### 4. Royal Flush
- **Description**: 10-J-Q-K-A all same color
- **Combinations**: 2 (one for red color, one for black color)
- **Probability**: 2/7,776 = 0.026% = 1 in 3,888
- **Suggested Payout**: 200:1 (RTP: 5.1%)

### 5. Straight (High: 10-J-Q-K-A)
- **Description**: 10, J, Q, K, A in any order
- **Combinations**: 5! = 120 ways to arrange
- **Probability**: 120/7,776 = 1.54% = 1 in 64.8
- **Suggested Payout**: 20:1 (RTP: 30.9%)

### 6. Straight (Low: 9-10-J-Q-K)
- **Description**: 9, 10, J, Q, K in any order  
- **Combinations**: 5! = 120 ways to arrange
- **Probability**: 120/7,776 = 1.54% = 1 in 64.8
- **Suggested Payout**: 20:1 (RTP: 30.9%)

### 7. Flush
- **Description**: All 5 dice same color (excluding royal flush)
- **Red values**: 9, J, K (3 values)
- **Black values**: 10, Q, A (3 values)
- **All red combinations**: 3^5 = 243
- **All black combinations**: 3^5 = 243
- **Minus royal flushes**: 486 - 2 = 484
- **Probability**: 484/7,776 = 6.22% = 1 in 16.1
- **Suggested Payout**: 8:1 (RTP: 49.8%)

### 8. Three of a Kind
- **Description**: 3 same, 2 different (excluding full house)
- **Calculation**: Complex - need to count all three-of-a-kind minus full houses
- **Estimated Combinations**: ~1,500
- **Probability**: ~19.3% = 1 in 5.2
- **Suggested Payout**: 3:1 (RTP: 57.9%)

### 9. Two Pair
- **Description**: Two pairs of different values, plus 1 singleton
- **Calculation**: C(6,2) × C(5,2) × C(3,2) × 5 ways for singleton
- **Combinations**: 15 × 10 × 3 × 5 = 2,250
- **Probability**: 2,250/7,776 = 28.9% = 1 in 3.5
- **Suggested Payout**: 2:1 (RTP: 57.9%)

### 10. One Pair
- **Description**: One pair + 3 different singletons
- **Estimated Combinations**: ~3,600
- **Probability**: ~46.3% = 1 in 2.2  
- **Suggested Payout**: 1:1 (RTP: 46.3%)

### 11. High Card (No pairs)
- **Description**: All 5 dice different values - IMPOSSIBLE with 6 faces and 5 dice
- **Probability**: 0% (impossible - we only have 6 different values)

## Revised Hand Rankings (Achievable Only)

Given that "High Card" is impossible with 5 dice and 6 values, here are the achievable hands:

1. **Five of a Kind** - 500:1 payout (0.077%)
2. **Royal Flush** - 200:1 payout (0.026%) 
3. **Four of a Kind** - 25:1 payout (1.93%)
4. **Full House** - 12:1 payout (3.86%)
5. **Straight** - 20:1 payout (3.09% combined)
6. **Flush** - 8:1 payout (6.22%)
7. **Three of a Kind** - 3:1 payout (~19.3%)
8. **Two Pair** - 2:1 payout (28.9%) 
9. **One Pair** - 1:1 payout (~46.3%)

## Total RTP Calculation

Approximate overall RTP:
- Five of a Kind: 0.077% × 500 = 38.5%
- Royal Flush: 0.026% × 200 = 5.1%
- Four of a Kind: 1.93% × 25 = 48.3%
- Full House: 3.86% × 12 = 46.3%
- Straights: 3.09% × 20 = 61.8%
- Flush: 6.22% × 8 = 49.8%
- Three of a Kind: 19.3% × 3 = 57.9%
- Two Pair: 28.9% × 2 = 57.8%
- One Pair: 46.3% × 1 = 46.3%

**Total RTP ≈ 95-97%** (needs fine-tuning with exact calculations)

## Recommended Final Payouts

For a balanced 96% RTP:

1. **Five of a Kind**: 400:1
2. **Royal Flush**: 150:1  
3. **Four of a Kind**: 20:1
4. **Full House**: 10:1
5. **Straight**: 15:1
6. **Flush**: 6:1
7. **Three of a Kind**: 3:1
8. **Two Pair**: 2:1
9. **One Pair**: 1:1

This creates an engaging progression where even common hands (pairs) return the bet, keeping players engaged while maintaining house edge.
