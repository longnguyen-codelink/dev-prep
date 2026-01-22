# Order Service Test Suite

## Complete Test Structure Overview

```typescript
describe('OrderService', () => {
  describe('processOrder()', () => {
    
    describe('when no coupon is provided', () => {
      it('should calculate the total based on subtotal and default tax'); // ✅ Implemented
      it('should save a receipt file to the local disk'); // 📝 Not yet implemented
    });

    describe('when using the WELCOME coupon', () => {
      it('should apply 15% discount if it is the users first order'); // 📝 Not yet implemented
      it('should apply no discount if the user has previous orders'); // 📝 Not yet implemented
    });

    describe('when it is a Tuesday', () => {
      it('should apply a flat 5 unit discount regardless of coupon'); // 📝 Not yet implemented
    });

    describe('error handling', () => {
      it('should throw an error if the user API is unreachable'); // 📝 Not yet implemented
      it('should fail if the calculated tax results in a negative number'); // ✅ Implemented
      it('should throw an error when userId is null or empty'); // ✅ Implemented
    });

    describe('environment variables', () => {
      it('should throw an error if API_URL is not set'); // ✅ Implemented
      it('should default to the default tax rate, 0.2, if TAX_RATE is not set'); // 📝 Not yet implemented
    });

  });
});
```

---

## Detailed Test Cases

### `describe('OrderService')`
#### `describe('processOrder()')`

##### 📦 `describe('when no coupon is provided')`

**✅ Calculate Total with Default Tax**
```typescript
it("should calculate the total based on subtotal and default tax", async () => {
  // Given: order with items totaling 100, tax rate 0.2, no coupon, user with 5 orders
  // Expected: total = 100 + (100 * 0.2) = 120
});
```
Status: ✅ Implemented

**📝 Receipt Generation**
```typescript
it("should save a receipt file to the local disk", async () => {
  // Given: processed order with total
  // Expected: fs.writeFileSync called with correct path and content
});
```
Status: 📝 Not yet implemented

---

##### 🎟️ `describe('when using the WELCOME coupon')`

**📝 First-Time User Discount**
```typescript
it("should apply 15% discount if it is the users first order", async () => {
  // Given: subtotal 100, user.ordersCount = 0, coupon "WELCOME"
  // Expected: discounted = 100 * 0.85 = 85, total = 85 + (85 * 0.2) = 102
});
```
Status: 📝 Not yet implemented

**📝 No Discount for Existing Users**
```typescript
it("should apply no discount if the user has previous orders", async () => {
  // Given: subtotal 100, user.ordersCount > 0, coupon "WELCOME"
  // Expected: no discount, total = 100 + (100 * 0.2) = 120
});
```
Status: 📝 Not yet implemented

---

##### 📅 `describe('when it is a Tuesday')`

**📝 Tuesday Flat Discount**
```typescript
it("should apply a flat 5 unit discount regardless of coupon", async () => {
  // Given: subtotal 100, current day is Tuesday (mocked)
  // Expected: discounted = 100 - 5 = 95, total = 95 + (95 * 0.2) = 114
});
```
Status: 📝 Not yet implemented

---

##### ⚠️ `describe('error handling')`

**📝 API Unreachable**
```typescript
it("should throw an error if the user API is unreachable", async () => {
  // Given: fetch rejects with network error
  // Expected: throws connection/network error
});
```
Status: 📝 Not yet implemented

**✅ Negative Tax Calculation**
```typescript
it("should fail if the calculated tax results in a negative number", async () => {
  // Given: items with negative prices causing negative tax
  // Expected: throws "Calculated tax is less than 0"
});
```
Status: ✅ Implemented

**✅ Empty/Null User ID**
```typescript
it("should throw an error when userId is null or empty", async () => {
  // Given: order.userId = ""
  // Expected: throws "User id is null or empty"
});
```
Status: ✅ Implemented

---

##### 🔧 `describe('environment variables')`

**✅ Missing API_URL**
```typescript
it("should throw an error if API_URL is not set", async () => {
  // Given: process.env.API_URL = undefined
  // Expected: throws "Invalid URL"
});
```
Status: ✅ Implemented

**📝 Missing TAX_RATE (Default Fallback)**
```typescript
it("should default to the default tax rate, 0.2, if TAX_RATE is not set", async () => {
  // Given: process.env.TAX_RATE = undefined
  // Expected: tax calculated using 0.2 (20%)
});
```
Status: 📝 Not yet implemented

---

## Additional Recommended Tests

### 🎁 VIP Coupon with Cap
```typescript
it("should apply 10% VIP discount but cap the discount amount at 50 units", async () => {
  // Given: subtotal 1000, VIP coupon (10% = 100 discount, but capped at 50)
  // Expected: discounted = 1000 - 50 = 950, total = 950 + (950 * 0.2) = 1140
});
```
**Status**: 💡 Recommended addition

### 📭 Empty Items Array
```typescript
it("should return 0 total when order has empty items array", async () => {
  // Given: order.items = []
  // Expected: total = 0 or throws validation error
});
```
**Status**: 💡 Recommended addition

### 🚨 API Error Responses

#### HTTP 404 Error
```typescript
it("should throw meaningful error when user API returns 404", async () => {
  // Given: fetch returns 404 response
  // Expected: throws "User not found" or similar error
});
```
**Status**: 💡 Recommended addition

#### HTTP 500 Error
```typescript
it("should throw meaningful error when user API returns 500", async () => {
  // Given: fetch returns 500 response
  // Expected: throws "API server error" or similar error
});
```
**Status**: 💡 Recommended addition

---

## Test Coverage Summary

| Category | Implemented | Planned | Total |
|----------|------------|---------|-------|
| No Coupon | 1 | 1 | 2 |
| WELCOME Coupon | 0 | 2 | 2 |
| Tuesday Discount | 0 | 1 | 1 |
| Error Handling | 2 | 1 | 3 |
| Environment Variables | 1 | 1 | 2 |
| **Total Core Tests** | **4** | **6** | **10** |
| **Recommended Additions** | - | - | **4** |
| **Grand Total** | **4** | **10** | **14** |

---

## Implementation Priority

1. **High Priority** (Core functionality)
   - ✅ Calculate total with default tax
   - 📝 WELCOME coupon for first-time users
   - 📝 WELCOME coupon validation for existing users
   - 📝 Receipt generation

2. **Medium Priority** (Business logic)
   - 📝 Tuesday discount
   - 📝 Default TAX_RATE fallback
   - 📝 API unreachable error

3. **Low Priority** (Edge cases & enhancements)
   - 💡 VIP coupon with cap
   - 💡 Empty items array
   - 💡 API 404/500 errors
