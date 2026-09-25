const Room = require('../models/Room');
const User = require('../models/User');

module.exports = (io, socket) => {
  // 1. Join a specific room
  // ✅ RENAMED: 'join_room' -> 'join-room' to match useVibe.js, which does
  // socket.emit('join-room', { roomCode, userName: user.name }). Note the
  // payload key is also `userName`, not `userId` — the old handler expected
  // a field the frontend was never sending.
  socket.on('join-room', async ({ roomCode, userName }) => {
    socket.join(roomCode);
    console.log(`User ${userName} joined room: ${roomCode}`);
  });

  // 2. Handle Voting with Weights
  // ✅ RENAMED: 'cast_vote' -> 'vote-song' to match useVibe.js's castVote():
  // socket.emit('vote-song', { roomCode, songId, userId })
  socket.on('vote-song', async ({ roomCode, songId, userId }) => {
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
      // ✅ RENAMED + RESHAPED: 'queue_updated' (bare array) -> 'update-queue'
      // wrapped as { queue, nowPlaying }. useVibe.js's listener does
      // setQueue(data.queue) / setNowPlaying(data.nowPlaying) — emitting a
      // bare array meant data.queue was always undefined on the client.
      io.to(roomCode).emit('update-queue', {
        queue: updatedRoom.queue,
        nowPlaying: updatedRoom.nowPlaying
      });
    }
  });

  // 3. Handle Song End & Auto-Play Next
  // ✅ RENAMED: 'song_ended' -> 'next-song' to match InvisiblePlayer.jsx's
  // onEnded handler, which calls handleSongEnd() -> socket.emit('next-song', { roomCode }).
  // This exact mismatch was your bug: the client emit was firing correctly
  // (confirmed by your console log), the server just wasn't listening for it.
  socket.on('next-song', async ({ roomCode }) => {
    const room = await Room.findOne({ roomCode });
    if (!room) return;

    if (room.queue.length === 0) {
      // ✅ NEW: previously, an empty queue meant this handler returned early
      // and did nothing — nowPlaying (and the floating player) would be
      // stuck showing the just-finished track forever. Now we clear it and
      // tell clients, so the UI can show "queue is empty" instead.
      room.nowPlaying = null;
      await room.save();
      io.to(roomCode).emit('update-queue', { queue: [], nowPlaying: null });
      return;
    }

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

    // ✅ CHANGED: one 'update-queue' emit instead of two separate events
    // ('play_song' + 'queue_updated'). The frontend never had a listener for
    // 'play_song' at all — that emit was silently going nowhere.
    io.to(roomCode).emit('update-queue', {
      queue: room.queue,
      nowPlaying: room.nowPlaying
    });
  });
};
