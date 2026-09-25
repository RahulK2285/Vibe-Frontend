import React, { useState, useRef } from 'react';
import ReactPlayer from 'react-player';
import { useVibe } from "../../hooks/useVibe";
import { Maximize2, Minimize2, VolumeX, Play } from 'lucide-react';

const InvisiblePlayer = ({ roomCode }) => {
  const { nowPlaying, handleSongEnd } = useVibe(); 
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [hasAutoplayBlocked, setHasAutoplayBlocked] = useState(false);
  const playerRef = useRef(null);

  if (!nowPlaying || !nowPlaying.videoId) return null;

  // Safe window origin check for SSR/Next.js
  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  // User click gesture manually enables audio if browser blocks autoplay
  const handleEnableAudio = () => {
    setIsMuted(false);
    setHasAutoplayBlocked(false);
  };

  return (
    <div className="fixed bottom-0 left-0 w-full h-16 bg-zinc-900/90 backdrop-blur-md border-t border-white/10 flex items-center px-6 z-50">
      <div className="flex items-center gap-4 w-full max-w-4xl mx-auto">
        
        {/* Track Thumbnail */}
        <img 
          src={nowPlaying.thumbnail} 
          className="w-10 h-10 rounded shadow-lg object-cover" 
          alt={nowPlaying.title || "Now Playing"} 
        />

        {/* Track Info */}
        <div className="flex-1 overflow-hidden">
          <p className="text-[10px] text-purple-400 font-bold uppercase tracking-widest">Now Playing</p>
          <p className="text-sm truncate font-medium">{nowPlaying.title}</p>
        </div>        

        {/* Unmute / Start Banner (Appears if Browser Blocks Autoplay) */}
        {hasAutoplayBlocked && (
          <button
            onClick={handleEnableAudio}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-xs px-3 py-1.5 rounded-full font-semibold transition-colors animate-pulse"
          >
            <Play size={12} fill="white" /> Click to Unmute
          </button>
        )}

        {/* Floating Player Viewport */}
        <div className={`
          fixed transition-all duration-300 ease-in-out z-[100] bg-black border-2 border-purple-500 rounded-xl overflow-hidden shadow-2xl
          ${isExpanded 
            ? 'bottom-20 right-4 w-[320px] h-[180px]' 
            : 'bottom-20 right-4 w-16 h-16 md:w-[320px] md:h-[180px]'}
        `}>
          
          {/* Mobile Size Toggle Button */}
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            aria-label={isExpanded ? "Minimize player" : "Maximize player"}
            className="md:hidden absolute top-1 right-1 z-[110] bg-black/60 p-1 rounded-md text-white hover:bg-black/80"
          >
            {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>

          <ReactPlayer
            ref={playerRef}
            url={`https://www.youtube.com/watch?v=${nowPlaying.videoId}`}
            playing={true}     
            muted={isMuted}      
            volume={1} 
            controls={isExpanded}
            width="100%"       
            height="100%"
            onEnded={handleSongEnd}
            
            /* Catches restricted or unembeddable YouTube videos and skips them */
            onError={(err) => {
              console.warn("Playback error on video:", nowPlaying.videoId, err);
              handleSongEnd();
            }}

            /* Detects autoplay blocking and prompts user */
            onStart={() => {
              setHasAutoplayBlocked(false);
            }}

            config={{ 
              youtube: { 
                playerVars: { 
                  autoplay: 1, 
                  mute: isMuted ? 1 : 0,
                  origin: origin,
                  modestbranding: 1,
                  enablejsapi: 1
                } 
              } 
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default InvisiblePlayer;
