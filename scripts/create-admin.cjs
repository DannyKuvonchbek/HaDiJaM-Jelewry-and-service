// Local-only admin provisioning. Never invoked by HTTP signup.
require("dotenv").config({ quiet: true });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const readline = require("node:readline");
const { Writable } = require("node:stream");
async function main() {
  if (!process.stdin.isTTY)
    throw new Error("Run this command in an interactive terminal.");
  let hidden = false;
  const output = new Writable({
    write(chunk, _encoding, done) {
      if (!hidden) process.stdout.write(chunk);
      done();
    },
  });
  const rl = readline.createInterface({
    input: process.stdin,
    output,
    terminal: true,
  });
  const ask = (label, secret = false) =>
    new Promise((resolve) => {
      process.stdout.write(label);
      hidden = secret;
      rl.question("", (answer) => {
        hidden = false;
        if (secret) process.stdout.write("\n");
        resolve(answer);
      });
    });
  let nick, phone, password;
  try {
    nick = (await ask("Admin nickname (3–12 characters): ")).trim();
    phone = (await ask("Admin phone (+country code): ")).replace(
      /[\s()-]/g,
      "",
    );
    password = await ask("Admin password (12+ characters): ", true);
    const confirm = await ask("Confirm password: ", true);
    if (nick.length < 3 || nick.length > 12)
      throw new Error("Nickname must contain 3–12 characters.");
    if (!/^\+[1-9]\d{7,14}$/.test(phone))
      throw new Error("Use an international phone number, e.g. +998901234567.");
    if (
      password !== confirm ||
      password.length < 12 ||
      Buffer.byteLength(password) > 72
    )
      throw new Error(
        "Passwords must match and contain at least 12 characters and at most 72 UTF-8 bytes.",
      );
  } finally {
    rl.close();
  }
  const uri = process.env.MONGODB_URI || process.env.MONGO_URL;
  if (!uri) throw new Error("MONGODB_URI or MONGO_URL is required.");
  await mongoose.connect(uri);
  try {
    const members = mongoose.connection.collection("members");
    if (
      await members.findOne({
        $or: [{ memberNick: nick }, { memberPhone: phone }],
      })
    )
      throw new Error(
        "Nickname or phone already exists; no account was changed.",
      );
    // Ensure these constraints also protect an initially empty database.
    await members.createIndex(
      { memberNick: 1 },
      { unique: true, sparse: true },
    );
    await members.createIndex(
      { memberPhone: 1 },
      { unique: true, sparse: true },
    );
    const now = new Date();
    await members.insertOne({
      memberNick: nick,
      memberPhone: phone,
      memberPassword: await bcrypt.hash(password, 12),
      memberType: "ADMIN",
      memberStatus: "ACTIVE",
      memberAuthType: "PHONE",
      memberImage: "",
      createdAt: now,
      updatedAt: now,
      ...Object.fromEntries(
        [
          "memberProducts",
          "memberArticles",
          "memberFollowers",
          "memberFollowings",
          "memberPoints",
          "memberLikes",
          "memberViews",
          "memberComments",
          "memberRank",
          "memberWarnings",
          "memberBlocks",
        ].map((k) => [k, 0]),
      ),
    });
    console.log(
      "Administrator created. Sign in using the nickname and password you entered.",
    );
  } finally {
    password = "";
    await mongoose.disconnect();
  }
}
main().catch((error) => {
  console.error(
    error.code === 11000
      ? "Nickname or phone already exists; no account was changed."
      : "Admin creation failed. " +
          (error.message?.includes("password") ||
          error.message?.includes("Nickname") ||
          error.message?.includes("phone") ||
          error.message?.includes("required") ||
          error.message?.includes("interactive")
            ? error.message
            : "Check database connectivity and indexes."),
  );
  process.exitCode = 1;
});
