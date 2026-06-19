import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "../models/User.js";
import Ebook from "../models/Ebook.js";
import Transaction from "../models/Transaction.js";
import env from "../config/env.js";

dotenv.config();

const sampleEbooks = [
  {
    title: "The Digital Frontier",
    description:
      "A comprehensive guide to understanding the evolving landscape of technology and its impact on society. From artificial intelligence to blockchain, this book explores the cutting-edge innovations shaping our future.",
    fullContent:
      "# The Digital Frontier\n\n## Chapter 1: The Rise of Artificial Intelligence\n\nArtificial intelligence has transformed every aspect of our lives. From the way we communicate to how we work, AI is everywhere.\n\n## Chapter 2: Blockchain Beyond Cryptocurrency\n\nWhile blockchain is often associated with Bitcoin, its applications extend far beyond digital currency.\n\n## Chapter 3: The Internet of Things\n\nConnected devices are becoming the norm, and the IoT revolution is just beginning.",
    genre: "Technology",
    price: 12.99,
    isPublished: true,
    soldCount: 245,
  },
  {
    title: "Shadows in the Night",
    description:
      "A gripping mystery thriller that follows Detective Sarah Chen as she unravels a web of secrets in a small town. With twists and turns at every corner, this page-turner will keep you guessing until the very end.",
    fullContent:
      "# Shadows in the Night\n\n## Chapter 1: The Discovery\n\nThe morning mist clung to the streets as Detective Chen arrived at the scene. Something told her this case would be different.\n\n## Chapter 2: The First Clue\n\nA single photograph found near the body would change everything.\n\n## Chapter 3: Unraveling\n\nAs the investigation deepened, Sarah realized the truth was more complicated than she imagined.",
    genre: "Mystery",
    price: 9.99,
    isPublished: true,
    soldCount: 189,
  },
  {
    title: "Hearts Entwined",
    description:
      "A beautiful romance novel about two souls who find each other against all odds. Set in the charming streets of Paris, this story will warm your heart and remind you of the power of love.",
    fullContent:
      "# Hearts Entwined\n\n## Chapter 1: Meeting in Paris\n\nThe rain had driven her into the little bookstore on Rue de Rivoli. She never expected to find more than shelter.\n\n## Chapter 2: Second Chances\n\nSometimes the universe has a plan, even when we do not.\n\n## Chapter 3: Together\n\nLove is not about perfection. It is about finding someone who makes your imperfect life perfect.",
    genre: "Romance",
    price: 7.99,
    isPublished: true,
    soldCount: 312,
  },
  {
    title: "Quantum Horizons",
    description:
      "An exploration of quantum physics made accessible to the general reader. Discover the mind-bending concepts that challenge our understanding of reality itself.",
    fullContent:
      "# Quantum Horizons\n\n## Chapter 1: The Quantum World\n\nAt the smallest scales, the rules of classical physics break down completely.\n\n## Chapter 2: Wave-Particle Duality\n\nLight and matter exhibit properties of both waves and particles, a concept that baffled scientists for decades.\n\n## Chapter 3: Quantum Entanglement\n\nEinstein called it spooky action at a distance, but quantum entanglement is very real.",
    genre: "Science",
    price: 14.99,
    isPublished: true,
    soldCount: 156,
  },
  {
    title: "The Last Kingdom",
    description:
      "An epic fantasy adventure set in a world of magic, dragons, and ancient prophecies. Join the hero on a quest to save the realm from darkness.",
    fullContent:
      "# The Last Kingdom\n\n## Chapter 1: The Prophecy\n\nIn the age of dragons, a prophecy spoke of a child who would unite the kingdoms.\n\n## Chapter 2: The Journey Begins\n\nArmed with nothing but courage and a mysterious amulet, the young warrior set forth.\n\n## Chapter 3: The Battle\n\nWhen darkness fell upon the land, only one could stand against it.",
    genre: "Fantasy",
    price: 11.99,
    isPublished: true,
    soldCount: 278,
  },
  {
    title: "Mindful Living",
    description:
      "A practical guide to incorporating mindfulness into your daily life. Learn techniques for stress reduction, improved focus, and greater emotional resilience.",
    fullContent:
      "# Mindful Living\n\n## Chapter 1: What is Mindfulness?\n\nMindfulness is the practice of being present in the moment without judgment.\n\n## Chapter 2: Morning Routines\n\nStarting your day with intention sets the tone for everything that follows.\n\n## Chapter 3: Breathing Techniques\n\nYour breath is the anchor to the present moment.",
    genre: "Self-Help",
    price: 8.99,
    isPublished: true,
    soldCount: 421,
  },
  {
    title: "Cosmic Horror Tales",
    description:
      "A collection of spine-chilling horror stories inspired by the works of H.P. Lovecraft. These tales of cosmic dread will haunt your nightmares.",
    fullContent:
      "# Cosmic Horror Tales\n\n## Story 1: The深渊\n\nDeep beneath the ocean, something ancient stirs.\n\n## Story 2: The Watcher\n\nIn the corner of the room, a shadow moves when no one is looking.\n\n## Story 3: The Signal\n\nFrom the depths of space, a signal arrives. And nothing will ever be the same.",
    genre: "Horror",
    price: 6.99,
    isPublished: true,
    soldCount: 98,
  },
  {
    title: "Startup Secrets",
    description:
      "Insider knowledge on building a successful startup from the ground up. Learn from real-world examples and proven strategies used by top entrepreneurs.",
    fullContent:
      "# Startup Secrets\n\n## Chapter 1: Finding Your Idea\n\nThe best startup ideas solve real problems that people actually have.\n\n## Chapter 2: Building Your Team\n\nA great team can turn a mediocre idea into a billion-dollar company.\n\n## Chapter 3: Fundraising\n\nUnderstanding venture capital is essential for scaling your business.",
    genre: "Business",
    price: 15.99,
    isPublished: true,
    soldCount: 167,
  },
];

async function seedSampleData() {
  try {
    await mongoose.connect(env.MONGO_URI);
    console.log("Connected to MongoDB for seeding");

    const existingUsers = await User.countDocuments();
    if (existingUsers > 1) {
      console.log("Sample data already exists, skipping seed");
      await mongoose.disconnect();
      return;
    }

    const admin = await User.findOne({ email: "admin@fable.com" });

    const writerPassword = await bcrypt.hash("Writer@123", 12);
    const writer = await User.create({
      name: "Jane Author",
      email: "jane@fable.com",
      password: writerPassword,
      role: "writer",
      isVerifiedWriter: true,
      avatar: null,
    });

    const userPassword = await bcrypt.hash("User@123", 12);
    const user = await User.create({
      name: "John Reader",
      email: "john@fable.com",
      password: userPassword,
      role: "user",
      avatar: null,
    });

    const ebooks = [];
    for (const ebookData of sampleEbooks) {
      const ebook = await Ebook.create({
        ...ebookData,
        writer: writer._id,
        coverImage: null,
      });
      ebooks.push(ebook);
    }

    console.log(`Seeded ${ebooks.length} ebooks`);
    console.log(`Seeded writer: ${writer.email}`);
    console.log(`Seeded user: ${user.email}`);
    console.log("Sample data seeding complete");

    await mongoose.disconnect();
  } catch (error) {
    console.error("Seeding error:", error.message);
    process.exit(1);
  }
}

seedSampleData();
