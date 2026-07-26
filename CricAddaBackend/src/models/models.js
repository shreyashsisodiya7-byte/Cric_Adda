

const mongoose = require("mongoose");

// 1. TOURNAMENT INVITE

const TournamentInviteSchema = new mongoose.Schema(
  {
    tournament: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tournament",
      required: true,
    },
    invitedBy: {
      // tournament owner
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    invitedPlayer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined"],
      default: "pending",
    },
    message: { type: String, default: "" }, // optional invite note
  },
  { timestamps: true }
);

// Prevent duplicate invites
TournamentInviteSchema.index(
  { tournament: 1, invitedPlayer: 1 },
  { unique: true }
);


// 2. CHAT MESSAGE

const ChatMessageSchema = new mongoose.Schema(
  {
    chatRoom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChatRoom",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: { type: String, required: true, maxlength: 2000 },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);


// 3. CHAT ROOM

const ChatRoomSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["squad", "individual"],
      required: true,
    },
    tournament: {
      // for squad rooms
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tournament",
    },
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
    },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    name: { type: String }, // only for squad rooms
    lastMessage: {
      content: String,
      sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      sentAt: Date,
    },
  },
  { timestamps: true }
);

// 4. PLAYER RATING

const PlayerRatingSchema = new mongoose.Schema(
  {
    player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    ratedBy: {
      // hire owner
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tournament: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tournament",
      required: true,
    },
    match: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Match",
      required: true,
    },
    stars: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    review: { type: String, maxlength: 500, default: "" },
    isPublic: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// One rating per player per match per rater
PlayerRatingSchema.index(
  { player: 1, ratedBy: 1, match: 1 },
  { unique: true }
);

// 5. RATING REMINDER

const RatingReminderSchema = new mongoose.Schema(
  {
    player: {
      // player sending reminder
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    owner: {
      // hire owner to remind
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    match: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Match",
      required: true,
    },
    status: {
      type: String,
      enum: ["sent", "reviewed"],
      default: "sent",
    },
  },
  { timestamps: true }
);

// Max 1 reminder per player per match
RatingReminderSchema.index({ player: 1, match: 1 }, { unique: true });

module.exports = {
  TournamentInvite: mongoose.model("TournamentInvite", TournamentInviteSchema),
  ChatMessage: mongoose.model("ChatMessage", ChatMessageSchema),
  ChatRoom: mongoose.model("ChatRoom", ChatRoomSchema),
  PlayerRating: mongoose.model("PlayerRating", PlayerRatingSchema),
  RatingReminder: mongoose.model("RatingReminder", RatingReminderSchema),
};
