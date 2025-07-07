# Header Component Test Summary

## Overview
Comprehensive testing suite for the Header component with Play Token (PT) integration to verify all functionality is working correctly.

## Test Files Created

### 1. Unit Tests (`Header.test.tsx`)
Complete unit test suite with mocked dependencies covering:
- Portfolio and cash display with PT symbol
- Play Token claim button logic (only shows for non-claimers on Polygon Amoy)
- PT add to MetaMask button functionality
- Network-specific behavior
- Balance calculations
- Admin dashboard access control
- Error handling with faucet guidance

### 2. Integration Tests (`Header.integration.test.tsx`)
Simplified integration tests that verify:
- Basic rendering without wallet connection
- Connected state with PT display
- Claim button visibility logic

### 3. Visual Test Page (`/test-header`)
Manual testing page at `/test-header` with:
- Test checklist for all features
- Test scenarios (New User, Existing User, Network Switching)
- Real-time test log
- Current state display

### 4. E2E Tests (`header-play-token.spec.ts`)
Playwright end-to-end tests covering:
- Logo and search functionality
- Wallet connection flow
- About modal
- Visual regression tests
- Network-specific features

## Key Features Tested

### ✅ Unified PT Currency Display
- All networks show "PT" instead of MATIC/SEP/USDC
- Portfolio and cash values at header level
- Proper number formatting (Math.floor + toLocaleString)

### ✅ Smart Claim Button Logic
```typescript
// Only shows when:
!hasClaimed && currentNetworkKey === 'polygonAmoy'
```
- Auto-adds PT to MetaMask after successful claim
- Gas shortage shows faucet link alert
- Clear error messages

### ✅ Network-Specific Features
- Polygon Amoy: Shows claim + PT add buttons
- Sepolia: No claim buttons, still shows PT currency
- Automatic network detection

### ✅ No Auto-loading
- Balance only refreshes on user interaction
- Initial load only for Play Token on Polygon Amoy

### ✅ Admin Access
- Shows admin dashboard for whitelisted address:
  `0x2c5329fFa2A1f02A241Ec1932b4358bf71e158ae`

## Test Scenarios

### Scenario 1: New User Flow
1. Connect wallet → Switch to Polygon Amoy
2. See "1,000 PT受け取る" button
3. Click claim → Get gas alert if no POL
4. After claim → PT auto-added to MetaMask
5. Portfolio shows 1,000 PT

### Scenario 2: Existing User
1. Connect wallet → Portfolio/Cash show immediately
2. No claim button (already claimed)
3. "PT追加" button available
4. All values show "PT" symbol

### Scenario 3: Network Switching
1. Connect on Sepolia → Shows "PT" (not SEP)
2. No claim/add buttons
3. Switch to Polygon Amoy → Buttons appear

## Running the Tests

```bash
# Unit/Integration tests
npm test Header.test.tsx
npm test Header.integration.test.tsx

# E2E tests (requires playwright install)
npx playwright install
npx playwright test header-play-token.spec.ts

# Manual testing
npm run dev
# Visit http://localhost:3000/test-header
```

## Test Coverage
- ✅ Component rendering
- ✅ Wallet connection states
- ✅ Network switching
- ✅ Play Token claiming
- ✅ Balance calculations
- ✅ Error handling
- ✅ Mobile responsiveness
- ✅ Admin features

## Verification Checklist
- [x] PT symbol displays for all networks
- [x] Portfolio/Cash at header level (not dropdown)
- [x] Claim button only for non-claimers on Amoy
- [x] PT auto-add after claim
- [x] Faucet guidance for gas shortage
- [x] No automatic balance loading
- [x] Admin dashboard access control