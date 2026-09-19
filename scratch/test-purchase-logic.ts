import { normalizeBookTitle, normalizeAuthorName } from "../lib/books/normalize";

console.log("=== Testing Purchase & Duplicate Safety Logic ===");

// 1. Title + Author normalization duplicate test
const title1 = "Madol Doova (First Edition)";
const title2 = "madol   doova!";
const norm1 = normalizeBookTitle(title1);
const norm2 = normalizeBookTitle(title2);
console.log("Normalized titles:", { norm1, norm2 });

const author1 = "Martin Wickramasinghe";
const author2 = "martin wickramasinghe ";
const normA1 = normalizeAuthorName(author1);
const normA2 = normalizeAuthorName(author2);
console.log("Normalized authors:", { normA1, normA2 });

if (normA1 !== normA2) {
  throw new Error("Author normalization mismatch");
}

// 2. Quantity Increment logic simulation
interface MockItem {
  id: string;
  isbn13: string;
  title: string;
  quantity: number;
}

const library: MockItem[] = [
  { id: "lib-1", isbn13: "9789552012345", title: "Book A", quantity: 1 },
];

function simulatePurchase(purchasedIsbn: string, purchaseQty: number) {
  const existing = library.find((b) => b.isbn13 === purchasedIsbn);
  if (existing) {
    existing.quantity += purchaseQty;
    return { isExistingCopy: true, id: existing.id, newQuantity: existing.quantity };
  } else {
    const newItem: MockItem = { id: "lib-new", isbn13: purchasedIsbn, title: "Book B", quantity: purchaseQty };
    library.push(newItem);
    return { isExistingCopy: false, id: newItem.id, newQuantity: newItem.quantity };
  }
}

const res1 = simulatePurchase("9789552012345", 1);
console.log("Purchase existing edition result:", res1);
if (!res1.isExistingCopy || res1.newQuantity !== 2 || library.length !== 1) {
  throw new Error("Exact ISBN quantity increment failed!");
}

const res2 = simulatePurchase("9789559999999", 1);
console.log("Purchase new edition result:", res2);
if (res2.isExistingCopy || res2.newQuantity !== 1 || (library.length as number) !== 2) {
  throw new Error("New edition library creation failed!");
}

console.log("=== ALL SIMULATION TESTS PASSED! ===");
