"use server";

import { Transaction } from "@/lib/db/schemas";
import { Coffee, Home, ShoppingBag } from "lucide-react";
import { ArrowDownLeft } from "lucide-react";
import { CreditCard } from "lucide-react";

export const getTransactions = async (): Promise<{
  data: Transaction[];
  success: boolean;
}> => {
  const transactions = [
    {
      _id: "1",
      name: "Grocery Store",
      amount: -85.32,
      date: "Today",
      icon: "ShoppingBag",
      category: {
        _id: "1",
        name: "Shopping",
        icon: "ShoppingBag",
      },
      description: "Grocery store purchase",
    },
    {
      _id: "2",
      name: "Salary Deposit",
      amount: 2150.0,
      date: "Yesterday",
      icon: "ArrowDownLeft",
      category: {
        _id: "2",
        name: "Income",
        icon: "ArrowDownLeft",
      },
      description: "Salary deposit for the month",
    },
    {
      _id: "3",
      name: "Coffee Shop",
      amount: -4.5,
      date: "Yesterday",
      icon: "Coffee",
      category: {
        _id: "3",
        name: "Food & Drink",
        icon: "Coffee",
      },
      description: "Coffee at the local cafe",
    },
    {
      _id: "4",
      name: "Rent Payment",
      amount: -1200.0,
      date: "3 days ago",
      icon: "Home",
      category: {
        _id: "4",
        name: "Housing",
        icon: "Home",
      },
      description: "Rent payment for the month",
    },
    {
      _id: "5",
      name: "Freelance Work",
      amount: 350.0,
      date: "4 days ago",
      icon: "ArrowDownLeft",
      category: {
        _id: "2",
        name: "Income",
        icon: "ArrowDownLeft",
      },
      description: "Freelance work for a client",
    },
    {
      _id: "6",
      name: "Amazon Purchase",
      amount: -29.99,
      date: "5 days ago",
      icon: "ShoppingBag",
      category: {
        _id: "1",
        name: "Shopping",
        icon: "ShoppingBag",
      },
      description: "Amazon purchase",
    },
    {
      _id: "7",
      name: "Utility Bill",
      amount: -75.0,
      date: "1 week ago",
      icon: "Home",
      category: {
        _id: "4",
        name: "Utilities",
        icon: "Home",
      },
      description: "Utility bill for the month",
    },
    {
      _id: "8",
      name: "Restaurant",
      amount: -42.5,
      date: "1 week ago",
      icon: "Coffee",
      category: {
        _id: "3",
        name: "Food & Drink",
        icon: "Coffee",
      },
      description: "Coffee at the local cafe",
    },
    {
      _id: "9",
      name: "Side Project",
      amount: 200.0,
      date: "2 weeks ago",
      icon: "ArrowDownLeft",
      category: {
        _id: "2",
        name: "Income",
        icon: "ArrowDownLeft",
      },
      description: "Side project for the company",
    },
    {
      _id: "10",
      name: "Subscription",
      amount: -15.99,
      date: "2 weeks ago",
      icon: "CreditCard",
      category: {
        _id: "1",
        name: "Entertainment",
        icon: "CreditCard",
      },
      description: "Netflix subscription",
    },
  ];
  return { data: transactions, success: true };
};
