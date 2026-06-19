import mongoose from "mongoose";
import dotenv from "dotenv";
import Review from "../models/Review.js";
import Transaction from "../models/Transaction.js";
import User from "../models/User.js";
import Ebook from "../models/Ebook.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_DB_URI;

const reviewComments = {
  5: [
    "Excellent ebook! Couldn't put it down.",
    "One of the best books I've read this year.",
    "Highly recommend to everyone.",
    "Beautiful writing and compelling story.",
    "A masterpiece of modern literature.",
    "Changed my perspective completely.",
    "Incredible depth and character development.",
    "Couldn't stop reading. Finished in one sitting.",
    "Worth every penny. Outstanding work.",
    "This book exceeded all my expectations.",
    "Brilliant storytelling from start to finish.",
    "A must-read for anyone interested in the genre.",
  ],
  4: [
    "Really enjoyed this ebook. Well written.",
    "Great content, minor pacing issues.",
    "Highly recommended for the genre.",
    "Engaging and thought-provoking.",
    "Solid writing and good character development.",
    "Very good overall, a few slow parts.",
    "Impressed by the author's storytelling ability.",
    "Good value for the price.",
  ],
  3: [
    "Decent ebook. Some parts were better than others.",
    "Average read. Not bad but not great.",
    "Had some interesting ideas but execution was lacking.",
    "Okay for a quick read.",
    "Mixed feelings about this one.",
  ],
  2: [
    "Disappointing. Expected more.",
    "Not my cup of tea.",
    "Could have been better.",
    "Started strong but lost momentum.",
  ],
  1: [
    "Unfortunately couldn't finish this one.",
    "Not recommended.",
  ],
};

const ratingDistribution = [5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 4, 4, 4, 4, 4, 4, 4, 4, 3, 3, 3, 3, 2, 2, 2, 1];

async function seedReviews() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    await Review.deleteMany({});
    console.log("Cleared existing reviews");

    // Mark pending purchase transactions as completed for demo
    const pendingTxns = await Transaction.find({ type: "purchase", status: "pending" });
    if (pendingTxns.length > 0) {
      await Transaction.updateMany({ type: "purchase", status: "pending" }, { $set: { status: "completed" } });
      console.log(`Marked ${pendingTxns.length} pending transactions as completed`);
    }

    // Also fix any transactions without status
    await Transaction.updateMany({ type: "purchase", status: { $exists: false } }, { $set: { status: "completed" } });

    const purchases = await Transaction.find({
      type: "purchase",
      status: "completed",
    }).populate("user", "name email").populate("ebook", "title");

    console.log(`Found ${purchases.length} completed purchases`);

    const userEbookPairs = new Map();
    for (const p of purchases) {
      if (!p.user || !p.ebook) continue;
      const key = `${p.user._id}-${p.ebook._id}`;
      if (!userEbookPairs.has(key)) {
        userEbookPairs.set(key, { user: p.user, ebook: p.ebook });
      }
    }

    const pairs = Array.from(userEbookPairs.values());
    console.log(`Found ${pairs.length} unique user-ebook pairs`);

    const shuffledPairs = pairs.sort(() => Math.random() - 0.5);
    const selectedPairs = shuffledPairs.slice(0, Math.min(50, shuffledPairs.length));

    let created = 0;
    for (const pair of selectedPairs) {
      const rating = ratingDistribution[Math.floor(Math.random() * ratingDistribution.length)];
      const comments = reviewComments[rating];
      const comment = comments[Math.floor(Math.random() * comments.length)];

      try {
        await Review.create({
          user: pair.user._id,
          ebook: pair.ebook._id,
          rating,
          comment,
        });
        created++;
      } catch (err) {
        // Skip duplicates
      }
    }

    console.log(`Created ${created} reviews`);

    const stats = await Review.aggregate([
      { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
    ]);
    console.log(`Total reviews: ${stats[0]?.count || 0}, Average: ${(stats[0]?.avg || 0).toFixed(1)}`);

    await mongoose.disconnect();
    console.log("Done!");
  } catch (error) {
    console.error("Error seeding reviews:", error);
    process.exit(1);
  }
}

seedReviews();
