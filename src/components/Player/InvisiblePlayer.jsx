import React, { useState, useRef, useEffect } from 'react';
import ReactPlayer from 'react-player'; // ✅ CORRECTED for react-player v3.4.0.
// v3 is a full rewrite: the old `react-player/youtube` subpath import from v2
// does NOT exist in v3 — that import was almost certainly failing to resolve
// at build time, which is why the previous patch had no visible effect.
// v3 has a single default export that lazy-loads the right provider based on
// the `src` prop's URL pattern. If the pattern doesn't match anything
// recognized (e.g. a malformed videoId), it falls back to a native HTML5
// media player — that's the exact bug you're seeing (stuck 0:00 controls).
import { motion, useDragControls } from 'framer-motion'; // ✅ useDragControls added
import { Maximize2, Minimize2, GripHorizontal, Volume2, VolumeX } from 'lucide-react';
import { useVibe } from '../../hooks/useVibe';
import { extractYouTubeId } from '../../utils/youtube'; // ✅ NEW

const InvisiblePlayer = () => {
  const { nowPlaying, handleSongEnd } = useVibe() || {};
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMuted, setIsMuted] = useState(true); // Start muted to bypass browser autoplay blocks
  const playerRef = useRef(null);
  const dragControls = useDragControls(); // ✅ NEW: lets us start a drag only from the handle

  // ✅ NEW: react to the "JOIN & SYNC" gesture in RoomPage.jsx, which is the
  // actual user interaction browsers require before allowing unmuted audio.
  // RoomPage dispatches this event from its startPlayback() handler.
  useEffect(() => {
    const handleJoin = () => setIsMuted(false);
    window.addEventListener('vibe:join', handleJoin);
    return () => window.removeEventListener('vibe:join', handleJoin);
  }, []);

  // ✅ Defense in depth: even though useVibe.js now normalizes videoId
  // before it reaches nowPlaying, re-validate here so this component can
  // never render a broken player regardless of what state it's handed.
  const cleanVideoId = nowPlaying ? extractYouTubeId(nowPlaying.videoId) : null;

  // Safety check: Don't render if there's no track or valid YouTube ID
  if (!nowPlaying || !cleanVideoId) return null;

  return (
    <div className="fixed bottom-0 left-0 w-full h-16 bg-zinc-900/90 backdrop-blur-md border-t border-white/10 flex items-center px-6 z-50">
      <div className="flex items-center gap-4 w-full max-w-4xl mx-auto">
        
        {/* Track Artwork */}
        <img 
          src={nowPlaying.thumbnail} 
          className="w-10 h-10 rounded shadow-lg object-cover" 
          alt={nowPlaying.title || "Now Playing"} 
        />

        {/* Track Info */}
        <div className="flex-1 overflow-hidden">
          <p className="text-[10px] text-purple-400 font-bold uppercase tracking-widest">Now Playing</p>
          <p className="text-sm truncate font-medium text-white">{nowPlaying.title}</p>
        </div>        

        {/* Unmute Action Prompt */}
        {isMuted && (
          <button
            onClick={() => setIsMuted(false)}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white text-xs px-3 py-1.5 rounded-full font-semibold transition-all animate-bounce shadow-lg"
          >
            <VolumeX size={14} /> Unmute Sound
          </button>
        )}

        {/* DRAGGABLE FLOATING VIDEO PLAYER */}
        <motion.div 
          drag
          dragMomentum={false}
          dragListener={false} // ✅ CHANGED: drag only starts via dragControls.start()
          // below, fired from the handle bar's onPointerDown — so dragging can
          // never intercept clicks/touches on the iframe's own controls beneath it.
          dragControls={dragControls}
          className={`
            fixed bottom-20 right-4 z-[100] bg-black border-2 border-purple-500/80 rounded-xl overflow-hidden shadow-2xl transition-all duration-200
            ${isExpanded 
              ? 'w-[360px] h-[202px]' 
              : 'w-[280px] h-[157px]'}
          `}
        >
          {/* Drag Handle & Control Top Bar */}
          <div
            className="absolute top-0 left-0 right-0 h-6 bg-black/80 z-[120] cursor-grab active:cursor-grabbing flex items-center justify-between px-2 text-white"
            onPointerDown={(e) => dragControls.start(e)} // ✅ only this bar can start a drag
          >
            <GripHorizontal size={14} className="mx-auto text-purple-400" />
            
            {/* Audio Toggle */}
            <button 
              onClick={() => setIsMuted(!isMuted)} 
              className="mr-2 text-white hover:text-purple-400"
            >
              {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>

            {/* Size Toggle */}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="text-white hover:text-purple-400"
            >
              {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
          </div>

          {/* YouTube Video Viewport */}
          <div className="w-full h-full pt-6 bg-black">
            <ReactPlayer
              ref={playerRef}
              src={`https://www.youtube.com/watch?v=${cleanVideoId}`} // ✅ CHANGED: v3 renamed
              // the `url` prop to `src`. Passing `url` on v3 is silently ignored,
              // which is a second, independent reason the player had nothing to play.
              playing={true}     
              muted={isMuted}      
              volume={1} 
              controls={true}
              width="100%"       
              height="100%"
              onEnded={handleSongEnd}
              onError={(err) => {
                console.error("YouTube Playback Error on track:", cleanVideoId, err);
                if (handleSongEnd) handleSongEnd();
              }}
              config={{ 
                playerVars: {  // ✅ NOTE: flat, no nested "youtube" key needed
                  // in v3 config (only relevant if you're playing one URL type).
                  autoplay: 1, 
                  mute: isMuted ? 1 : 0,
                  modestbranding: 1,
                  enablejsapi: 1,
                  rel: 0
                } 
              }}
            />
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default InvisiblePlayer;
