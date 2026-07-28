const Room = require('../models/Room');
const User = require('../models/User');

module.exports = (io, socket) => {
  // 1. Join a specific room
  socket.on('join_room', async ({ roomCode, userId }) => {
    socket.join(roomCode);
    console.log(`User ${userId} joined room: ${roomCode}`);
  });

  // 2. Handle Voting with Weights
  socket.on('cast_vote', async ({ roomCode, songId, userId }) => {
    const user = await User.findById(userId);
    const weight = user?.membershipStatus === 'premier' ? 3 : 1;

    const updatedRoom = await Room.findOneAndUpdate(
      { roomCode, "queue._id": songId },
      { 
        $addToSet: { "queue.$.votes": { userId, weight } },
        $inc: { "queue.$.totalWeight": weight }
      },
      { new: true }
    );

    if (updatedRoom) {
      // Broadcast updated queue to everyone in the room
      io.to(roomCode).emit('queue_updated', updatedRoom.queue);
    }
  });

  // 3. Handle Song End & Auto-Play Next
  socket.on('song_ended', async ({ roomCode }) => {
    const room = await Room.findOne({ roomCode });
    if (!room || room.queue.length === 0) return;

    // Sort by weight and pick the winner
    const sortedQueue = room.queue.sort((a, b) => b.totalWeight - a.totalWeight);
    const winner = sortedQueue[0];

    // Remove winner from queue and update nowPlaying
    room.queue = room.queue.filter(s => s._id.toString() !== winner._id.toString());
    room.nowPlaying = {
      videoId: winner.videoId,
      title: winner.title,
      thumbnail: winner.thumbnail
    };

    await room.save();

    io.to(roomCode).emit('play_song', room.nowPlaying);
    io.to(roomCode).emit('queue_updated', room.queue);
  });
};