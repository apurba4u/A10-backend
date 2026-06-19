import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "../models/User.js";
import Ebook from "../models/Ebook.js";
import Transaction from "../models/Transaction.js";
import Bookmark from "../models/Bookmark.js";
import Wishlist from "../models/Wishlist.js";
import env from "../config/env.js";

import { writers, readers } from "./data/writers.js";
import { coverImages } from "./data/covers.js";
import { fictionEbooks } from "./data/ebooks-fiction.js";
import { mysteryEbooks } from "./data/ebooks-mystery.js";
import { romanceEbooks } from "./data/ebooks-romance.js";
import { fantasyEbooks, scifiEbooks } from "./data/ebooks-fantasy-scifi.js";
import { horrorEbooks, biographyEbooks } from "./data/ebooks-horror-bio.js";
import { selfHelpEbooks, businessEbooks, technologyEbooks } from "./data/ebooks-nonfiction.js";
import { extraEbooks1 } from "./data/ebooks-extra1.js";
import { extraEbooks2 } from "./data/ebooks-extra2.js";

dotenv.config();

const DEFAULT_PASSWORD = "Fable@123";

function pickRandom(arr, count) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function getCoverImage(genre, index) {
  const images = coverImages[genre] || coverImages.Uncategorized;
  return images[index % images.length];
}

async function seedSampleData() {
  try {
    await mongoose.connect(env.MONGO_URI);
    console.log("Connected to MongoDB");

    const existingUsers = await User.countDocuments();
    if (existingUsers > 1) {
      console.log("Sample data already exists, clearing first...");
      await User.deleteMany({});
      await Ebook.deleteMany({});
      await Transaction.deleteMany({});
      await Bookmark.deleteMany({});
      await Wishlist.deleteMany({});
      console.log("Cleared existing data");
    }

    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 12);

    console.log("Creating writers...");
    const createdWriters = [];
    for (const w of writers) {
      const writer = await User.create({
        name: w.name,
        email: w.email,
        password: hashedPassword,
        avatar: w.avatar,
        role: "writer",
        isVerifiedWriter: true,
      });
      createdWriters.push(writer);
    }
    console.log(`Created ${createdWriters.length} writers`);

    console.log("Creating readers...");
    const createdReaders = [];
    for (const r of readers) {
      const reader = await User.create({
        name: r.name,
        email: r.email,
        password: hashedPassword,
        avatar: r.avatar,
        role: "user",
      });
      createdReaders.push(reader);
    }
    console.log(`Created ${createdReaders.length} readers`);

    const allEbooksData = [
      ...fictionEbooks,
      ...mysteryEbooks,
      ...romanceEbooks,
      ...fantasyEbooks,
      ...scifiEbooks,
      ...horrorEbooks,
      ...biographyEbooks,
      ...selfHelpEbooks,
      ...businessEbooks,
      ...technologyEbooks,
      ...extraEbooks1,
      ...extraEbooks2,
    ];
    console.log(`Total ebooks to create: ${allEbooksData.length}`);

    console.log("Creating ebooks...");
    const createdEbooks = [];
    let coverCounters = {};
    for (let i = 0; i < allEbooksData.length; i++) {
      const ebookData = allEbooksData[i];
      const writer = createdWriters[i % createdWriters.length];
      const genre = ebookData.genre;
      coverCounters[genre] = (coverCounters[genre] || 0) + 1;

      const monthsAgo = Math.floor(Math.random() * 18);
      const createdAt = new Date();
      createdAt.setMonth(createdAt.getMonth() - monthsAgo);
      createdAt.setDate(Math.floor(Math.random() * 28) + 1);

      const ebook = await Ebook.create({
        title: ebookData.title,
        description: ebookData.description,
        fullContent: ebookData.fullContent,
        genre: genre,
        price: ebookData.price,
        coverImage: getCoverImage(genre, coverCounters[genre]),
        writer: writer._id,
        isPublished: true,
        soldCount: ebookData.soldCount,
        createdAt: createdAt,
      });
      createdEbooks.push(ebook);
    }
    console.log(`Created ${createdEbooks.length} ebooks`);

    console.log("Creating transactions...");
    const transactions = [];
    const startDate = new Date("2024-01-01");
    const endDate = new Date("2025-06-01");

    for (const writer of createdWriters) {
      transactions.push({
        transactionId: `txn_verify_${writer._id.toString().slice(-8)}`,
        type: "verification",
        amount: 9.99,
        user: writer._id,
        ebook: null,
        createdAt: randomDate(startDate, endDate),
      });
    }

    for (const ebook of createdEbooks) {
      const numSales = Math.min(ebook.soldCount, 30);
      const potentialBuyers = pickRandom(createdReaders, Math.min(numSales, createdReaders.length));

      for (const buyer of potentialBuyers) {
        transactions.push({
          transactionId: `txn_${buyer._id.toString().slice(-6)}_${ebook._id.toString().slice(-6)}`,
          type: "purchase",
          amount: ebook.price,
          user: buyer._id,
          ebook: ebook._id,
          createdAt: randomDate(startDate, endDate),
        });
      }
    }

    const insertedTransactions = await Transaction.insertMany(transactions);
    console.log(`Created ${insertedTransactions.length} transactions`);

    console.log("Creating bookmarks...");
    const bookmarkSet = new Set();
    const bookmarks = [];
    for (const reader of createdReaders) {
      const numBookmarks = Math.floor(Math.random() * 6) + 2;
      const bookmarkedEbooks = pickRandom(createdEbooks, numBookmarks);
      for (const ebook of bookmarkedEbooks) {
        const key = `${reader._id}-${ebook._id}`;
        if (!bookmarkSet.has(key)) {
          bookmarkSet.add(key);
          bookmarks.push({
            user: reader._id,
            ebook: ebook._id,
            createdAt: randomDate(startDate, endDate),
          });
        }
      }
    }
    const insertedBookmarks = await Bookmark.insertMany(bookmarks);
    console.log(`Created ${insertedBookmarks.length} bookmarks`);

    console.log("Creating wishlist entries...");
    const wishlistSet = new Set();
    const wishlistEntries = [];
    for (const reader of createdReaders) {
      const numWishlist = Math.floor(Math.random() * 5) + 1;
      const wishlistedEbooks = pickRandom(createdEbooks, numWishlist);
      for (const ebook of wishlistedEbooks) {
        const key = `${reader._id}-${ebook._id}`;
        if (!wishlistSet.has(key) && !bookmarkSet.has(key)) {
          wishlistSet.add(key);
          wishlistEntries.push({
            user: reader._id,
            ebook: ebook._id,
            createdAt: randomDate(startDate, endDate),
          });
        }
      }
    }
    const insertedWishlist = await Wishlist.insertMany(wishlistEntries);
    console.log(`Created ${insertedWishlist.length} wishlist entries`);

    console.log("\n=== SEED COMPLETE ===");
    console.log(`Writers: ${createdWriters.length}`);
    console.log(`Readers: ${createdReaders.length}`);
    console.log(`Ebooks: ${createdEbooks.length}`);
    console.log(`Transactions: ${insertedTransactions.length}`);
    console.log(`Bookmarks: ${insertedBookmarks.length}`);
    console.log(`Wishlist: ${insertedWishlist.length}`);
    console.log("\nLogin credentials:");
    console.log("Writers: [name]@fable.com / Fable@123");
    console.log("Readers: [name]@fable.com / Fable@123");

    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  } catch (error) {
    console.error("Seeding error:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

seedSampleData();
