import mongoose from "mongoose";

// ── Join Request ──────────────────────────────────────────────────────────────
const joinRequestSchema = new mongoose.Schema({
  playerId:    { type: mongoose.Schema.Types.ObjectId, ref: "player", required: true },
  playerName:  { type: String, required: true },
  playerRole:  { type: String, default: "" },
  playerCity:  { type: String, default: "" },
  playerPhoto: { type: String, default: "" },
  playerStats: {
    matches:  { type: Number, default: 0 },
    runs:     { type: Number, default: 0 },
    wickets:  { type: Number, default: 0 },
  },
  message:     { type: String, default: "" },
  status:      { type: String, enum: ["pending", "approved", "rejected", "removed"], default: "pending" },
  // NEW: track whether this request came via invite
  viaInvite:   { type: Boolean, default: false },
  requestedAt: { type: Date, default: Date.now },
  respondedAt: Date,
  // If a player was removed by owner after being approved
  removedAt: Date,
  removedBy: { type: mongoose.Schema.Types.ObjectId, ref: "player" },
  removalReason: { type: String, default: "" },
});

// ── Squad Player ──────────────────────────────────────────────────────────────
const squadPlayerSchema = new mongoose.Schema({
  playerId:     { type: mongoose.Schema.Types.ObjectId, ref: "player" },
  playerName:   { type: String, required: true },
  playerRole:   { type: String, default: "" },
  playerPhoto:  { type: String, default: "" },
  playerStats:  {
    matches:  { type: Number, default: 0 },
    runs:     { type: Number, default: 0 },
    wickets:  { type: Number, default: 0 },
  },
  jerseyNumber: { type: Number },
  isSubstitute: { type: Boolean, default: false },
  addedAt:      { type: Date, default: Date.now },
});

// ── Role Requirement ──────────────────────────────────────────────────────────
const roleRequirementSchema = new mongoose.Schema(
  {
    min:         { type: Number, default: 1 },
    max:         { type: Number, default: 4 },
    description: { type: String, default: "" },
  },
  { _id: false }
);

// ── Chat Message ──────────────────────────────────────────────────────────────
const chatMessageSchema = new mongoose.Schema({
  senderId:   { type: mongoose.Schema.Types.ObjectId, ref: "player", required: true },
  senderName: { type: String, required: true },
  content:    { type: String, required: true, maxlength: 1000 },
  // NEW: soft delete support
  isDeleted:  { type: Boolean, default: false },
  deletedAt:  { type: Date },
  createdAt:  { type: Date, default: Date.now },
});

// ── Tournament Invite ─────────────────────────────────────────────────────────
// NEW: owner invites a player directly
const inviteSchema = new mongoose.Schema({
  playerId:    { type: mongoose.Schema.Types.ObjectId, ref: "player", required: true },
  playerName:  { type: String, required: true },
  playerRole:  { type: String, default: "" },
  playerPhoto: { type: String, default: "" },
  message:     { type: String, default: "" },
  status:      { type: String, enum: ["pending", "accepted", "declined"], default: "pending" },
  invitedAt:   { type: Date, default: Date.now },
  respondedAt: Date,
});

// ── Player Rating ─────────────────────────────────────────────────────────────
// NEW: owner rates a squad player after match
const playerRatingSchema = new mongoose.Schema({
  playerId:    { type: mongoose.Schema.Types.ObjectId, ref: "player", required: true },
  playerName:  { type: String, required: true },
  ratedBy:     { type: mongoose.Schema.Types.ObjectId, ref: "player", required: true },
  raterName:   { type: String, required: true },
  stars:       { type: Number, min: 1, max: 5, required: true },
  review:      { type: String, maxlength: 500, default: "" },
  createdAt:   { type: Date, default: Date.now },
});

// ── Rating Reminder ───────────────────────────────────────────────────────────
// NEW: player sends owner a reminder to rate them
const ratingReminderSchema = new mongoose.Schema({
  playerId:   { type: mongoose.Schema.Types.ObjectId, ref: "player", required: true },
  playerName: { type: String, required: true },
  sentAt:     { type: Date, default: Date.now },
  seen:       { type: Boolean, default: false },
});

// ── Tournament ────────────────────────────────────────────────────────────────
const tournamentSchema = new mongoose.Schema(
  {
    name:                 { type: String, required: true, trim: true },
    description:          { type: String, default: "" },
    format:               { type: String, enum: ["T20", "ODI", "Test", "T10", "Box Cricket"], default: "T20" },
    matchType:            { type: String, default: "League + Knockout" },
    location:             { type: String, required: true },
    city:                 { type: String, required: true },
    pitchType:            { type: String, default: "Turf" },

    startDate:            { type: Date, required: true },
    endDate:              { type: Date },
    registrationDeadline: { type: Date },

    prizePool:            { type: String, default: "" },
    runnerUpPrize:        { type: String, default: "" },
    momPrize:             { type: String, default: "" },
    mosPrize:             { type: String, default: "" },

    entryFee:             { type: Number, default: 0 },
    maxTeams:             { type: Number, default: 8 },
    maxSquadSize:         { type: Number, default: 15 },

    ageGroup:             { type: String, default: "" },
    gender:               { type: String, default: "Open" },

    rules:                { type: String, default: "" },
    contactInfo:          { type: String, default: "" },

    ownerId:              { type: mongoose.Schema.Types.ObjectId, ref: "player", required: true },
    ownerName:            { type: String, required: true },

    status:               { type: String, enum: ["upcoming", "ongoing", "completed", "cancelled"], default: "upcoming" },

    banner:               { type: String, default: "" },

    playerRequirements:   { type: Map, of: roleRequirementSchema, default: {} },

    joinRequests:         [joinRequestSchema],
    squad:                [squadPlayerSchema],

    // Squad group chat
    chat:                 [chatMessageSchema],

    // NEW: owner-sent invites
    invites:              [inviteSchema],

    // NEW: post-match player ratings by owner
    ratings:              [playerRatingSchema],

    // NEW: blocked players (cannot send messages)
    blockedPlayers:       [{ type: mongoose.Schema.Types.ObjectId, ref: "player" }],

    // NEW: rating reminders from players
    ratingReminders:      [ratingReminderSchema],

    tags:                 [{ type: String }],
  },
  { timestamps: true }
);

export default mongoose.model("tournament", tournamentSchema);
