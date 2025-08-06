# 🎰 TEMP: Slot RTP Adjustment Analysis - July 23, 2025

## 🎯 **Objective**
- **Target RTP**: 102% (faucet-style - players gain tokens over time)
- **Current RTP**: ~38% (too low, players losing interest)
- **Strategy**: Keep small wins same frequency, increase big wins

## 📊 **Current Configuration (43 entries per reel)**

### **Current Payouts & Frequencies:**
- Three Watermelons: 0.37% chance (1 in 270 spins) → Pays 8x
- Three Bananas: 0.56% chance (1 in 179 spins) → Pays 10x  
- Three Cherries: 0.23% chance (1 in 435 spins) → Pays 12x
- Three Sevens: 0.06% chance (1 in 1,667 spins) → Pays 35x
- Three Bars: 0.002% chance (1 in 50,000 spins) → Pays 75x
- Three Bigwins: 0.010% chance (1 in 10,000 spins) → Pays 400x
- Melon-Banana Combo: 0.48% chance → Pays 15x
- Any Fruit Mix: ~2.5% chance → Pays 5x

### **Current RTP Breakdown:**
- Small wins (fruits): ~26%
- Medium/big wins: ~12%
- **Total RTP: ~38%**

## 🔧 **Proposed Changes (50 entries per reel)**

### **Keep Small Wins Same:**
- Fruits stay at current frequency levels
- Blanks maintained at 14% (7 out of 50 entries)

### **Increase Big Wins:**

#### **Sevens (Bigger Increase - pays 35x):**
- **Current**: 4, 3, 4 entries → 0.06% chance (1 in 1,667 spins)
- **Proposed**: 8, 6, 8 entries → 0.25% chance (1 in 400 spins)
- **Impact**: +0.088 credits per spin

#### **Bars (Moderate Increase - pays 75x):**
- **Current**: 1, 2, 1 entries → 0.002% chance (1 in 50,000 spins)
- **Proposed**: 2, 3, 2 entries → 0.006% chance (1 in 16,667 spins)
- **Impact**: +0.045 credits per spin

#### **Bigwins (Small Increase - pays 400x):**
- **Current**: 2, 2, 2 entries → 0.010% chance (1 in 10,000 spins)
- **Proposed**: 4, 4, 4 entries → 0.064% chance (1 in 1,560 spins)
- **Impact**: +0.256 credits per spin

### **Expected New RTP:**
- Current: 38%
- Additions: +8.8% + 4.5% + 25.6% + adjustments = **~102%** ✅

## 🎮 **Player Experience Impact**

### **Current Experience (150 spins in 5 minutes):**
- Lots of small fruit wins
- Unlikely to see any big wins
- Probably net loss of tokens

### **Proposed Experience (150 spins in 5 minutes):**
- Same small fruit wins (engaging)
- Possible seven wins (excitement)
- Very small chance of bigwin (jackpot moment)
- **Net positive tokens over time**

### **Longer Sessions (500+ spins):**
- **Sevens**: Expected 1-2 hits
- **Bars**: Small chance (still rare)
- **Bigwins**: Decent possibility (keeps players hoping)

## ⚖️ **Key Constraints**
- **Can't increase payouts much**: Level system multiplies winnings (2x, 3x, 4x etc)
- **Must maintain engagement**: Not too frequent big wins
- **Faucet economics**: Players should gain ~2% over time
- **Current blank ratio**: 14% seems optimal (not boring)

## 🔄 **Next Steps**
1. Andy tests current setup (5 min session) to establish baseline spin count
2. Implement proposed changes to virtual reel lists
3. Test new configuration 
4. Adjust if needed based on actual play experience
5. Update main documentation when finalized

## 📝 **Implementation Notes**
- **File**: `slots/slots.js` lines 109-180
- **Change**: Expand from 43 to 50 entries per reel
- **Method**: Substitute entries, don't just add (maintain balance)
- **Blank preservation**: 6/43 → 7/50 (maintains 14%)

---

**Status**: Ready for testing current baseline, then implementation of proposed changes.
