import React, { useState, useRef } from 'react';
import ReactPlayer from 'react-player';
import { motion } from 'framer-motion';
import { Maximize2, Minimize2, GripHorizontal, Volume2, VolumeX } from 'lucide-react';
import { useVibe } from "../../hooks/useVibe";

const InvisiblePlayer = () => {
  const { nowPlaying, handleSongEnd } = useVibe();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMuted, setIsMuted] = useState(true); // Default muted to allow autoplay
  const playerRef = useRef(null);

  // Return nothing if track data or videoId is missing
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
          <p className="text-sm truncate font-medium text-white">{nowPlaying.title}</p>
        </div>        

        {/* Unmute Button */}
        {isMuted && (
          <button
            onClick={() => setIsMuted(false)}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-xs px-3 py-1.5 rounded-full font-semibold transition-all animate-bounce"
          >
            <VolumeX size={14} /> Unmute Sound
          </button>
        )}

        {/* DRAGGABLE FLOATING VIDEO PLAYER */}
        <motion.div 
          drag
          dragMomentum={false}
          className={`
            fixed bottom-20 right-4 z-[100] bg-black border-2 border-purple-500/80 rounded-xl overflow-hidden shadow-2xl transition-all duration-200
            ${isExpanded 
              ? 'w-[360px] h-[202px]' 
              : 'w-[280px] h-[157px]'}
          `}
        >
          {/* Drag Handle Top Bar */}
          <div className="absolute top-0 left-0 right-0 h-6 bg-black/80 z-[120] cursor-grab active:cursor-grabbing flex items-center justify-between px-2 text-white">
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

          {/* YouTube Viewport */}
          <div className="w-full h-full pt-6 bg-black">
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
              config={{ 
                youtube: { 
                  playerVars: { 
                    autoplay: 1, 
                    mute: isMuted ? 1 : 0,
                    modestbranding: 1
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
