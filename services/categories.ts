"use server";

import client from "@/lib/db/mongo";
import { Category } from "@/lib/db/schemas";

export async function getCategories() {
  await client.connect();
  try {
    const categories: Category[] = await client
      .db("fintrack")
      .collection("categories")
      .find({})
      .toArray();

    const response = categories.map((category) => ({
      _id: category._id?.toString() || "",
      name: category.name,
      description: category.description,
      icon: category.icon,
    }));
    return {
      success: true,
      data: response,
    };
  } catch (error) {
    return {
      success: false,
      error: error,
    };
  } finally {
    await client.close();
  }
}

export async function addCategory(category: Category) {
  await client.connect();
  try {
    const result = await client
      .db("fintrack")
      .collection("categories")
      .insertOne(category);
    const response = {
      _id: result.insertedId.toString(),
      name: category.name,
      description: category.description,
      icon: category.icon,
    };

    return {
      success: true,
      data: response,
    };
  } catch (error) {
    return {
      success: false,
      error: error,
    };
  } finally {
    await client.close();
  }
}
