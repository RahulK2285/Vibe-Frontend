const Room = require('../models/Room');

// 1. CREATE: Returns the new room object as JSON
exports.createRoom = async (req, res) => {
  try {
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    // Use req.user.id if you have auth middleware, otherwise null
    const newRoom = new Room({ 
      roomCode, 
      host: req.user ? req.user.id : null, 
      queue: [] 
    });
    
    await newRoom.save();
    console.log(`✅ Room Saved to DB: ${roomCode}`);
    
    // Explicitly return JSON with a 201 Created status
    return res.status(201).json(newRoom); 
  } catch (err) {
    console.error("Room Creation Error:", err);
    return res.status(500).json({ error: "Database failed to create room" });
  }
};

// 2. FETCH: Used by the RoomPage to load initial state
exports.getRoom = async (req, res) => {
  try {
    const room = await Room.findOne({ roomCode: req.params.code.toUpperCase() });
    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }
    return res.json(room);
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
};

// 3. SKIP/NEXT: Logic for room users
exports.skipToNext = async (roomCode) => {
  try {
    const room = await Room.findOne({ roomCode: roomCode.toUpperCase() });
    if (!room) throw new Error("Room not found");
    
    if (room.queue.length === 0) {
      room.nowPlaying = null;
    } else {
      room.nowPlaying = room.queue.shift(); 
    }
    await room.save();
    return { queue: room.queue, nowPlaying: room.nowPlaying };
  } catch (err) {
    throw err;
  }
};

// 4. ADD SONG
exports.addSong = async (roomCode, songData) => {
  try {
    const upperCode = roomCode.toUpperCase();
    const room = await Room.findOne({ roomCode: upperCode });
    if (!room) throw new Error("Room does not exist");

    // ✅ Log for debugging
    console.log(`Adding song to room ${upperCode} by ${songData.addedBy}`);

    const isDuplicate = room.queue.some(song => song.videoId === songData.videoId);
    if (isDuplicate) throw new Error("Already in queue");

    // ✅ Temporary: Increase limit to 50 for testing
    const userSongs = room.queue.filter(s => s.addedBy === songData.addedBy).length;
    if (userSongs >= 50) throw new Error("User song limit reached");

    room.queue.push(songData);

    if (!room.nowPlaying) {
      room.nowPlaying = songData;
    }

    await room.save();
    return { queue: room.queue, nowPlaying: room.nowPlaying };
  } catch (err) {
    console.error("AddSong Controller Error:", err.message);
    throw err;
  }
};

// 5. VOTE
exports.voteSong = async (roomCode, songId, userId) => {
  try {
    const room = await Room.findOne({ roomCode: roomCode.toUpperCase() });
    if (!room) throw new Error("Room not found");

    const song = room.queue.id(songId); 
    if (!song) throw new Error("Song not found");

    if (!song.votes.some(v => v.userId.toString() === userId.toString())) {
      song.votes.push({ userId });
      song.totalWeight = song.votes.length;
      room.queue.sort((a, b) => b.totalWeight - a.totalWeight);
      await room.save();
    }

    return { queue: room.queue, nowPlaying: room.nowPlaying };
  } catch (err) {
    throw err;
  }
};

// 6. REMOVE
exports.removeSong = async (roomCode, songId) => {
  try {
    const room = await Room.findOneAndUpdate(
      { roomCode: roomCode.toUpperCase() },
      { $pull: { queue: { _id: songId } } },
      { new: true }
    );
    
    if (room && room.nowPlaying && room.nowPlaying._id.toString() === songId) {
      room.nowPlaying = room.queue.length > 0 ? room.queue[0] : null;
      await room.save();
    }
    return { queue: room.queue, nowPlaying: room.nowPlaying };
  } catch (err) {
    throw err;
  }
};