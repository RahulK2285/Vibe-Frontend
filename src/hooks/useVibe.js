import { useEffect, useState, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { extractYouTubeId } from '../utils/youtube'; // ✅ NEW

export const useVibe = () => {
  const { socket, queue, setQueue, nowPlaying, setNowPlaying } = useSocket();
  const { user } = useAuth();
  const { code } = useParams(); 
  const roomCode = code?.toUpperCase(); // ✅ Critical: Force uppercase
  
  const [vibers, setVibers] = useState([]); // ✅ Initialize as empty array
  const [showVibers, setShowVibers] = useState(false);
  const [lastJoined, setLastJoined] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // ✅ NEW: normalize whatever shape nowPlaying arrives in (REST or socket)
  // before it ever reaches state. This is the one choke point every source
  // of nowPlaying passes through, so InvisiblePlayer can trust videoId.
  const normalizeNowPlaying = (payload) => {
    if (!payload) return null;
    const cleanId = extractYouTubeId(payload.videoId);
    if (!cleanId) {
      console.warn('[useVibe] Dropping nowPlaying with unparseable videoId:', payload.videoId, payload);
      return null;
    }
    return { ...payload, videoId: cleanId };
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/rooms/${roomCode}`);
        setQueue(res.data.queue || []);
        setNowPlaying(normalizeNowPlaying(res.data.nowPlaying)); // ✅ normalized
      } catch (err) { 
        console.error("Initial Data Load Error:", err); 
      }
    };

    if (roomCode) fetchInitialData();

    if (socket && roomCode && user) {
      // ✅ Handshake: Join room and send username
      socket.emit('join-room', { roomCode, userName: user.name });

      socket.on('update-queue', (data) => {
        setQueue(data.queue || []);
        setNowPlaying(normalizeNowPlaying(data.nowPlaying)); // ✅ normalized
      });

      socket.on('update-vibers', (data) => {
        setVibers(data.users || []); // ✅ Fixes the 0 viber count
        if (data.newUser && data.newUser !== user.name) {
          setLastJoined(data.newUser);
          setTimeout(() => setLastJoined(null), 3000); 
        }
      });

      socket.on('error-msg', (err) => alert(err.message));
    }

    return () => {
      socket?.off('update-queue');
      socket?.off('update-vibers');
      socket?.off('error-msg');
    };
  }, [socket, roomCode, user, setQueue, setNowPlaying, API_BASE_URL]);

  const castVote = useCallback((songId) => {
    if (socket && roomCode && user) {
      socket.emit('vote-song', { roomCode, songId, userId: user._id });
    }
  }, [socket, roomCode, user]);

  const addSongToQueue = (song) => {
    if (socket && roomCode) {
      // ✅ Normalize here too — this is almost certainly where a full URL
      // (instead of a bare id) from your search results first enters the
      // queue, so catching it here stops it from ever reaching playback.
      const cleanId = extractYouTubeId(song.videoId);
      if (!cleanId) {
        console.error('[useVibe] Refusing to queue song with invalid videoId:', song);
        return;
      }
      socket.emit('add-song', { 
        roomCode, 
        songData: { 
          videoId: cleanId, 
          title: song.title, 
          thumbnail: song.thumbnail,
          addedBy: user?.name || 'Guest',
          votes: [],
          totalWeight: 0
        } 
      });
    }
  };

  return { 
    castVote,
    queue: queue || [], // ✅ Always return an array to prevent .map errors
    removeSong: (songId) => socket?.emit('remove-song', { roomCode, songId }),
    nowPlaying, 
    setShowVibers, 
    vibers, 
    showVibers, 
    lastJoined, 
    handleSongEnd: () => socket?.emit('next-song', { roomCode }),
    addSongToQueue,
    socket,
    viberCount: vibers.length, 
    isPremier: user?.membershipStatus === 'premier' 
  };
};
