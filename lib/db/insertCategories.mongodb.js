// MongoDB Playground
// Use Ctrl+Space inside a snippet or a string literal to trigger completions.

// The current database to use.
use("fintrack");

// Create a new document in the collection.
db.getCollection("categories").insertMany([
  {
    name: "Shopping",
    description: "Purchases of goods and retail items",
    icon: "ShoppingBag",
  },
  {
    name: "Income",
    description: "Money received from salary, investments, or other sources",
    icon: "ArrowUpRight",
  },
  {
    name: "Food & Drink",
    description: "Restaurants, cafes, and grocery expenses",
    icon: "Coffee",
  },
  {
    name: "Housing",
    description: "Rent, mortgage, and home-related expenses",
    icon: "Home",
  },
  {
    name: "Entertainment",
    description: "Movies, games, and recreational activities",
    icon: "Film",
  },
  {
    name: "Utilities",
    description: "Electricity, water, internet, and other utility bills",
    icon: "Zap",
  },
]);
