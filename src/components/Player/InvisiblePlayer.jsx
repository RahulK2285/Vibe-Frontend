import React, { useState, useRef } from 'react';
import ReactPlayer from 'react-player';
import { motion } from 'framer-motion';
import { Maximize2, Minimize2, GripHorizontal, Play, VolumeX } from 'lucide-react';
import { useVibe } from "../../hooks/useVibe";

const InvisiblePlayer = ({ roomCode }) => {
  const { nowPlaying, handleSongEnd } = useVibe();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [hasAutoplayBlocked, setHasAutoplayBlocked] = useState(false);
  const playerRef = useRef(null);

  if (!nowPlaying || !nowPlaying.videoId) return null;

  return (
    <div className="fixed bottom-0 left-0 w-full h-16 bg-zinc-900/90 backdrop-blur-md border-t border-white/10 flex items-center px-6 z-50">
      <div className="flex items-center gap-4 w-full max-w-4xl mx-auto">
        
        {/* Track Artwork */}
        <img 
          src={nowPlaying.thumbnail} 
          className="w-10 h-10 rounded shadow-lg object-cover" 
          alt={nowPlaying.title || "Now Playing"} 
        />

        {/* Track Title */}
        <div className="flex-1 overflow-hidden">
          <p className="text-[10px] text-purple-400 font-bold uppercase tracking-widest">Now Playing</p>
          <p className="text-sm truncate font-medium">{nowPlaying.title}</p>
        </div>        

        {/* Unmute/Autoplay Fallback Button */}
        {hasAutoplayBlocked && (
          <button
            onClick={() => {
              setIsMuted(false);
              setHasAutoplayBlocked(false);
            }}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-xs px-3 py-1.5 rounded-full font-semibold transition-all animate-pulse"
          >
            <Play size={12} fill="white" /> Click to Play Audio
          </button>
        )}

        {/* DRAGGABLE FLOATING VIDEO PLAYER */}
        <motion.div 
          drag
          dragMomentum={false}
          dragConstraints={{ left: -window.innerWidth + 350, right: 0, top: -window.innerHeight + 250, bottom: 0 }}
          className={`
            fixed bottom-20 right-4 z-[100] bg-black border-2 border-purple-500/80 rounded-xl overflow-hidden shadow-2xl transition-all duration-200
            ${isExpanded 
              ? 'w-[360px] h-[202px]' 
              : 'w-20 h-20 md:w-[320px] md:h-[180px]'}
          `}
        >
          {/* Drag Handle Top Bar */}
          <div className="absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-black/80 to-transparent z-[120] cursor-grab active:cursor-grabbing flex items-center justify-between px-2 text-white/70 hover:text-white">
            <GripHorizontal size={14} className="mx-auto" />
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="md:hidden absolute right-1 bg-black/60 p-0.5 rounded text-white"
            >
              {isExpanded ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
            </button>
          </div>

          {/* YouTube Player */}
          <div className="w-full h-full pt-2">
            <ReactPlayer
              ref={playerRef}
              url={`https://www.youtube.com/watch?v=${nowPlaying.videoId}`}
              playing={true}     
              muted={isMuted}      
              volume={1} 
              controls={true}
              width="100%"       
              height="100%"
              onEnded={handleSongEnd}
              onError={(err) => {
                console.error("YouTube Playback Error:", err);
                handleSongEnd();
              }}
              onStart={() => setHasAutoplayBlocked(false)}
              config={{ 
                youtube: { 
                  playerVars: { 
                    autoplay: 1, 
                    mute: isMuted ? 1 : 0,
                    modestbranding: 1,
                    rel: 0
                  } 
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
