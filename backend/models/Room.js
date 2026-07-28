const mongoose = require('mongoose'); // <--- YOU ARE MISSING THIS LINE

const songSchema = new mongoose.Schema({
  videoId: String,
  title: String,
  thumbnail: String,
  addedBy: String,
  votes: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    weight: { type: Number, default: 1 }
  }],
  totalWeight: { type: Number, default: 0 }
});

const roomSchema = new mongoose.Schema({
  roomCode: { type: String, required: true, unique: true },
  host: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  queue: [songSchema],
  nowPlaying: songSchema
});

module.exports = mongoose.model('Room', roomSchema);