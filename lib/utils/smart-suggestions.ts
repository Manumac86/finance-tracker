import { UICategory } from "@/lib/db/schemas/category";

// Smart category suggestion based on transaction name/description
export function suggestCategory(transactionName: string, categories: UICategory[]): UICategory | null {
  const name = transactionName.toLowerCase().trim();
  
  // Category keywords mapping
  const categoryKeywords: { [key: string]: string[] } = {
    "Food & Drink": [
      "restaurant", "cafe", "coffee", "starbucks", "mcdonald", "pizza", "burger", "food",
      "grocery", "supermarket", "walmart", "target", "whole foods", "kroger", "safeway",
      "lunch", "dinner", "breakfast", "eat", "drink", "bar", "pub", "dining"
    ],
    "Transportation": [
      "gas", "fuel", "uber", "lyft", "taxi", "parking", "metro", "bus", "train", "subway",
      "car", "vehicle", "auto", "gas station", "shell", "exxon", "bp", "chevron"
    ],
    "Shopping": [
      "amazon", "shop", "store", "mall", "clothing", "clothes", "shirt", "shoes", "dress",
      "electronics", "best buy", "apple", "nike", "adidas", "zara", "h&m", "purchase"
    ],
    "Entertainment": [
      "netflix", "spotify", "movie", "cinema", "theater", "concert", "game", "gaming",
      "subscription", "disney", "hulu", "youtube", "music", "entertainment", "fun"
    ],
    "Bills & Utilities": [
      "electric", "electricity", "water", "gas", "internet", "phone", "cell", "mobile",
      "utility", "bill", "payment", "rent", "mortgage", "insurance", "cable", "wifi"
    ],
    "Healthcare": [
      "doctor", "hospital", "pharmacy", "medical", "health", "dentist", "medicine",
      "prescription", "clinic", "cvs", "walgreens", "urgent care"
    ],
    "Education": [
      "school", "university", "college", "tuition", "book", "education", "course",
      "class", "lesson", "training", "certification", "learning"
    ],
    "Travel": [
      "hotel", "flight", "airline", "booking", "vacation", "trip", "travel", "airbnb",
      "expedia", "booking.com", "delta", "american airlines", "southwest"
    ],
    "Personal Care": [
      "salon", "haircut", "beauty", "spa", "gym", "fitness", "cosmetics", "makeup",
      "skincare", "barber", "nail", "massage"
    ],
    "Home & Garden": [
      "home depot", "lowes", "ikea", "furniture", "garden", "plants", "tools", "hardware",
      "home improvement", "repair", "maintenance"
    ]
  };

  // Find the best matching category
  let bestMatch: { category: UICategory; score: number } | null = null;

  for (const category of categories) {
    const keywords = categoryKeywords[category.name] || [];
    let score = 0;

    // Check for exact matches first (higher score)
    for (const keyword of keywords) {
      if (name.includes(keyword)) {
        score += keyword.length; // Longer keywords get higher scores
      }
    }

    // Check for partial matches
    for (const keyword of keywords) {
      const words = name.split(/\s+/);
      for (const word of words) {
        if (word.startsWith(keyword.substring(0, 3)) && keyword.length > 3) {
          score += 1;
        }
      }
    }

    if (score > 0 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { category, score };
    }
  }

  return bestMatch?.category || null;
}

// Suggest merchant/payee name based on partial input
export function suggestMerchant(input: string, recentTransactions: any[]): string[] {
  const inputLower = input.toLowerCase().trim();
  if (inputLower.length < 2) return [];

  // Get unique merchant names from recent transactions
  const merchantCounts: { [key: string]: number } = {};
  
  recentTransactions.forEach(transaction => {
    const name = transaction.name?.toLowerCase();
    if (name && name.includes(inputLower)) {
      merchantCounts[transaction.name] = (merchantCounts[transaction.name] || 0) + 1;
    }
  });

  // Sort by frequency and return top suggestions
  return Object.entries(merchantCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name]) => name);
}

// Common merchant patterns for quick suggestions
export const COMMON_MERCHANTS = [
  // Food & Restaurants
  "Starbucks", "McDonald's", "Subway", "Pizza Hut", "KFC", "Taco Bell", "Chipotle",
  "Domino's Pizza", "Burger King", "Wendy's", "Dunkin'", "Chick-fil-A",
  
  // Grocery Stores
  "Walmart", "Target", "Kroger", "Safeway", "Whole Foods", "Trader Joe's", "Costco",
  "Sam's Club", "Publix", "Giant", "Stop & Shop",
  
  // Gas Stations
  "Shell", "Exxon", "BP", "Chevron", "Mobil", "Sunoco", "Texaco", "Citgo",
  
  // Shopping
  "Amazon", "eBay", "Best Buy", "Apple Store", "Home Depot", "Lowe's", "CVS",
  "Walgreens", "Nike", "Adidas", "H&M", "Zara", "Old Navy",
  
  // Entertainment & Subscriptions
  "Netflix", "Spotify", "Disney+", "Hulu", "YouTube Premium", "Amazon Prime",
  "HBO Max", "Apple Music", "Gym Membership",
  
  // Transportation
  "Uber", "Lyft", "Gas Station", "Parking", "Metro", "Bus Fare", "Taxi",
  
  // Utilities & Bills
  "Electric Bill", "Water Bill", "Internet Bill", "Phone Bill", "Rent", "Mortgage",
  "Car Insurance", "Health Insurance", "Cable Bill"
];

// Get quick merchant suggestions based on category
export function getQuickMerchantSuggestions(categoryName: string): string[] {
  const suggestions: { [key: string]: string[] } = {
    "Food & Drink": [
      "Starbucks", "McDonald's", "Grocery Store", "Restaurant", "Coffee Shop", "Pizza Place"
    ],
    "Transportation": [
      "Gas Station", "Uber", "Lyft", "Parking", "Bus Fare", "Metro"
    ],
    "Shopping": [
      "Amazon", "Target", "Walmart", "Mall", "Online Purchase", "Clothing Store"
    ],
    "Entertainment": [
      "Netflix", "Spotify", "Movie Theater", "Gym", "Subscription", "Gaming"
    ],
    "Bills & Utilities": [
      "Electric Bill", "Water Bill", "Internet", "Phone Bill", "Rent", "Insurance"
    ],
    "Healthcare": [
      "Doctor Visit", "Pharmacy", "Hospital", "Dentist", "Medical", "Prescription"
    ],
    "Education": [
      "Tuition", "Books", "Course Fee", "Training", "School Supply", "Online Course"
    ],
    "Travel": [
      "Hotel", "Flight", "Airbnb", "Gas for Trip", "Restaurant (Travel)", "Car Rental"
    ]
  };

  return suggestions[categoryName] || ["Purchase", "Payment", "Service"];
}