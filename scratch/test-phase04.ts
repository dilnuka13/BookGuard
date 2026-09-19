// Test script for Phase 04 logic: Totals, Budget, Grouping, Currency
import { calculateCartTotals } from "../lib/cart/queries";
import { groupPurchasesByPeriod } from "../lib/purchases/queries";
import { formatCurrency, formatPriceCompact } from "../lib/utils/currency";

console.log("=== Testing Phase 04 Core Business Logic ===");

// 1. Test Cart Totals & Missing Prices
const mockCart = [
  {
    id: "1",
    user_id: "user-1",
    title: "Madol Doova",
    author: "Martin Wickramasinghe",
    isbn10: null,
    isbn13: "9789552012345",
    publisher: "Sarasavi",
    edition: "1st",
    published_year: 1947,
    cover_url: null,
    source: null,
    price: 1200,
    quantity: 2,
    seller: "Sarasavi",
    notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "2",
    user_id: "user-1",
    title: "Gamperaliya",
    author: "Martin Wickramasinghe",
    isbn10: null,
    isbn13: "9789552098765",
    publisher: "M.D. Gunasena",
    edition: null,
    published_year: 1944,
    cover_url: null,
    source: null,
    price: null, // Unpriced book!
    quantity: 1,
    seller: null,
    notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "3",
    user_id: "user-1",
    title: "Village in the Jungle",
    author: "Leonard Woolf",
    isbn10: null,
    isbn13: "9789551234567",
    publisher: "Vijitha Yapa",
    edition: null,
    published_year: 1913,
    cover_url: null,
    source: null,
    price: 2500,
    quantity: 1,
    seller: "Vijitha Yapa",
    notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Calculation with budget: Rs. 5000
const summaryWithBudget = calculateCartTotals(mockCart, 5000);
console.log("Cart Totals (Budget: 5000):", {
  cartTotal: summaryWithBudget.cartTotal,
  expectedTotal: 1200 * 2 + 2500, // 4900
  totalQuantity: summaryWithBudget.totalQuantity,
  pricedItemCount: summaryWithBudget.pricedItemCount,
  unpricedItemCount: summaryWithBudget.unpricedItemCount,
  remaining: summaryWithBudget.remaining,
  isOverBudget: summaryWithBudget.isOverBudget,
});

if (summaryWithBudget.cartTotal !== 4900) {
  throw new Error(`Expected cartTotal to be 4900, got ${summaryWithBudget.cartTotal}`);
}
if (summaryWithBudget.pricedItemCount !== 2 || summaryWithBudget.unpricedItemCount !== 1) {
  throw new Error("Priced / Unpriced count mismatch");
}
if (summaryWithBudget.remaining !== 100 || summaryWithBudget.isOverBudget !== false) {
  throw new Error("Budget remaining calculation error");
}

// Over-budget test
const summaryOverBudget = calculateCartTotals(mockCart, 4000);
console.log("Cart Over Budget Check:", {
  cartTotal: summaryOverBudget.cartTotal,
  budget: summaryOverBudget.budget,
  remaining: summaryOverBudget.remaining,
  isOverBudget: summaryOverBudget.isOverBudget,
});

if (summaryOverBudget.isOverBudget !== true || summaryOverBudget.remaining !== -900) {
  throw new Error("Over budget detection failed");
}

// 2. Currency Formatting
console.log("Currency formatting tests:");
console.log("1200 ->", formatCurrency(1200));
console.log("null ->", formatCurrency(null));
console.log("compact 4900 ->", formatPriceCompact(4900));

if (!formatCurrency(1200).includes("1,200.00") || !formatCurrency(1200).includes("Rs.")) {
  throw new Error("formatCurrency failed");
}
if (formatCurrency(null) !== "Unpriced") {
  throw new Error("formatCurrency fallback failed");
}

// 3. Purchase History Period Grouping
const todayStr = new Date().toISOString().split("T")[0];
const thisMonthDate = new Date();
thisMonthDate.setDate(1); // 1st of this month
const thisMonthStr = thisMonthDate.toISOString().split("T")[0];

const mockPurchases = [
  {
    id: "p1",
    user_id: "u1",
    library_item_id: "l1",
    title: "Book 1",
    author: "Author 1",
    isbn10: null,
    isbn13: null,
    edition: null,
    cover_url: null,
    quantity: 1,
    price: 1500,
    seller: "Store A",
    purchase_date: todayStr,
    total_amount: 1500,
    notes: null,
    created_at: new Date().toISOString(),
  },
  {
    id: "p2",
    user_id: "u1",
    library_item_id: "l2",
    title: "Book 2",
    author: "Author 2",
    isbn10: null,
    isbn13: null,
    edition: null,
    cover_url: null,
    quantity: 2,
    price: 2000,
    seller: "Store B",
    purchase_date: "2024-01-15", // Older
    total_amount: 4000,
    notes: null,
    created_at: new Date().toISOString(),
  },
];

const grouped = groupPurchasesByPeriod(mockPurchases);
console.log("Purchase Grouping:", {
  todayCount: grouped.today.length,
  olderCount: grouped.older.length,
});

if (grouped.today.length !== 1 || grouped.older.length !== 1) {
  throw new Error("Group purchases failed");
}

console.log("=== ALL PHASE 04 TESTS PASSED! ===");
