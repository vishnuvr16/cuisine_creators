import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, ThumbsDown, ThumbsUp, Share2, 
         Rewind, FastForward, Settings, Bookmark, MessageCircle, ChevronDown,
         PictureInPicture, Subtitles, Camera, RotateCcw, RotateCw, 
         Maximize, Minimize, Clock, Menu } from 'lucide-react';

const CustomTooltip = ({ children, content, position = 'top' }) => {
  const [show, setShow] = useState(false);
  
  return (
    <div className="relative inline-block" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <div className={`absolute ${position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'} 
          left-1/2 -translate-x-1/2 px-2 py-1 bg-black/90 text-white text-sm rounded
          whitespace-nowrap z-50`}>
          {content}
        </div>
      )}
    </div>
  );
};

const VideoPlayer = ({ videoData }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [showVolumeControl, setShowVolumeControl] = useState(false);
  const [currentQuality, setCurrentQuality] = useState('1080p');
  const [showCaptions, setShowCaptions] = useState(false);
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [chapters, setChapters] = useState([]);
  const [activeChapter, setActiveChapter] = useState(0);
  const [showChapters, setShowChapters] = useState(false);
  const [bookmarks, setBookmarks] = useState([]);
  const [replayBuffer, setReplayBuffer] = useState(10);
  const [showControls, setShowControls] = useState(true);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [showPreview, setShowPreview] = useState(false);
  const [previewTime, setPreviewTime] = useState(0);
  const [showQualityMenu, setShowQualityMenu] = useState(false);

  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const progressBarRef = useRef(null);
  const controlsTimeoutRef = useRef(null);

  const speedOptions = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
  const qualityOptions = ['2160p', '1440p', '1080p', '720p', '480p', '360p'];

  useEffect(() => {
    const video = videoRef.current;
    
    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      setProgress((video.currentTime / video.duration) * 100);
      
      // Update active chapter
      const currentChapter = chapters.findIndex(
        (chapter, index) => 
          video.currentTime >= chapter.time && 
          (!chapters[index + 1] || video.currentTime < chapters[index + 1].time)
      );
      if (currentChapter !== -1) {
        setActiveChapter(currentChapter);
      }
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [chapters]);

  useEffect(() => {
    const hideControlsTimer = () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      
      if (isPlaying && !isHovering) {
        controlsTimeoutRef.current = setTimeout(() => {
          setShowControls(false);
        }, 3000);
      }
    };

    hideControlsTimer();
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isPlaying, isHovering]);

  const handleMouseMove = (e) => {
    const rect = containerRef.current.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setShowControls(true);
  };

  const handleProgressClick = (e) => {
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickPosition = (e.clientX - rect.left) / rect.width;
    const newTime = clickPosition * duration;
    videoRef.current.currentTime = newTime;
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    videoRef.current.volume = newVolume;
    setIsMuted(newVolume === 0);
  };

  const handleKeyPress = (e) => {
    switch(e.key) {
      case ' ':
        e.preventDefault();
        togglePlay();
        break;
      case 'ArrowLeft':
        skipTime(-10);
        break;
      case 'ArrowRight':
        skipTime(10);
        break;
      case 'f':
        toggleFullscreen();
        break;
      case 'm':
        toggleMute();
        break;
      case 'ArrowUp':
        e.preventDefault();
        setVolume(prev => Math.min(1, prev + 0.1));
        break;
      case 'ArrowDown':
        e.preventDefault();
        setVolume(prev => Math.max(0, prev - 0.1));
        break;
      default:
        break;
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const togglePlay = () => {
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    videoRef.current.muted = !isMuted;
  };

  const skipTime = (seconds) => {
    const newTime = videoRef.current.currentTime + seconds;
    videoRef.current.currentTime = Math.max(0, Math.min(newTime, duration));
  };

  const handleSpeedChange = (speed) => {
    setPlaybackSpeed(speed);
    videoRef.current.playbackRate = speed;
    setShowSpeedMenu(false);
    setShowSettings(false);
  };

  const handleQualityChange = (quality) => {
    setCurrentQuality(quality);
    setShowQualityMenu(false);
    setShowSettings(false);
  };
  return (
    <div 
      ref={containerRef}
      className={`relative group ${isTheaterMode ? 'w-full aspect-video ' : 'w-full h-[80vh]'}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onKeyDown={handleKeyPress}
      tabIndex={0}
    >
      {/* Main Video */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover bg-black"
        src={videoData.videoUrl}
        onClick={togglePlay}
      >
        {showCaptions && videoData.captions?.map((caption, index) => (
          <track 
            key={index}
            kind="subtitles"
            src={caption.src}
            srcLang={caption.lang}
            label={caption.label}
          />
        ))}
      </video>

      {/* Controls Overlay */}
      <div 
        className={`absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent 
          transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}
      >
        {/* ... [Previous top bar and center play button remain the same] ... */}

        {/* Bottom Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Play/Pause and Skip buttons from previous code */}
              <CustomTooltip content={isPlaying ? 'Pause (Space)' : 'Play (Space)'}>
                <button 
                  onClick={togglePlay}
                  className="hover:text-orange-500 transition-colors"
                >
                  {isPlaying ? (
                    <Pause className="w-8 h-8 text-white" />
                  ) : (
                    <Play className="w-8 h-8 text-white" />
                  )}
                </button>
              </CustomTooltip>

              <div className="flex items-center space-x-2">
                <CustomTooltip content="Rewind 10s">
                  <button 
                    onClick={() => skipTime(-10)}
                    className="p-2 hover:bg-white/20 rounded-full transition-colors"
                  >
                    <Rewind className="w-5 h-5 text-white" />
                  </button>
                </CustomTooltip>

                <CustomTooltip content="Forward 10s">
                  <button 
                    onClick={() => skipTime(10)}
                    className="p-2 hover:bg-white/20 rounded-full transition-colors"
                  >
                    <FastForward className="w-5 h-5 text-white" />
                  </button>
                </CustomTooltip>
              </div>

              {/* Volume Control */}
              <div className="relative group flex items-center">
                <CustomTooltip content={isMuted ? 'Unmute (M)' : 'Mute (M)'}>
                  <button 
                    onClick={toggleMute}
                    className="p-2 hover:bg-white/20 rounded-full transition-colors"
                  >
                    {isMuted ? (
                      <VolumeX className="w-5 h-5 text-white" />
                    ) : (
                      <Volume2 className="w-5 h-5 text-white" />
                    )}
                  </button>
                </CustomTooltip>

                <div className="w-0 overflow-hidden group-hover:w-24 transition-all duration-300">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="w-24 h-1 ml-2 accent-orange-500"
                  />
                </div>
              </div>

              

              {/* Time Display */}
              <div className="text-white text-sm">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>

            {/* Right Controls */}
            <div className="flex items-center space-x-3">
              {/* Captions Toggle */}
              <CustomTooltip content="Subtitles">
                <button 
                  onClick={() => setShowCaptions(!showCaptions)}
                  className={`p-2 rounded-full transition-colors ${
                    showCaptions ? 'bg-white/20' : 'hover:bg-white/20'
                  }`}
                >
                  <Subtitles className="w-5 h-5 text-white" />
                </button>
              </CustomTooltip>

              {/* Picture in Picture */}
              <CustomTooltip content="Picture in Picture">
                <button 
                  onClick={() => videoRef.current.requestPictureInPicture()}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <PictureInPicture className="w-5 h-5 text-white" />
                </button>
              </CustomTooltip>

              {/* Settings Menu */}
              <div className="relative">
                <CustomTooltip content="Settings">
                  <button 
                    onClick={() => setShowSettings(!showSettings)}
                    className={`p-2 rounded-full transition-colors ${
                      showSettings ? 'bg-white/20' : 'hover:bg-white/20'
                    }`}
                  >
                    <Settings className="w-5 h-5 text-white" />
                  </button>
                </CustomTooltip>

                {showSettings && (
                  <div className="absolute bottom-full right-0 mb-2 w-56 bg-black/90 rounded-lg overflow-hidden">
                    {/* Quality Selection */}
                    <button 
                      className="w-full px-4 py-2 flex items-center justify-between hover:bg-white/10"
                      onClick={() => setShowQualityMenu(!showQualityMenu)}
                    >
                      <span className="text-white">Quality</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-white/70">{currentQuality}</span>
                        <ChevronDown className="w-4 h-4 text-white" />
                      </div>
                    </button>

                    {/* Playback Speed */}
                    <button 
                      className="w-full px-4 py-2 flex items-center justify-between hover:bg-white/10"
                      onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                    >
                      <span className="text-white">Playback Speed</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-white/70">{playbackSpeed}x</span>
                        <ChevronDown className="w-4 h-4 text-white" />
                      </div>
                    </button>
                  </div>
                )}

                {/* Quality Menu */}
                {showQualityMenu && (
                  <div className="absolute bottom-full right-0 mb-2 w-56 bg-black/90 rounded-lg overflow-hidden">
                    {qualityOptions.map((quality) => (
                      <button
                        key={quality}
                        className={`w-full px-4 py-2 text-left hover:bg-white/10 ${
                          currentQuality === quality ? 'text-orange-500' : 'text-white'
                        }`}
                        onClick={() => handleQualityChange(quality)}
                      >
                        {quality}
                      </button>
                    ))}
                  </div>
                )}

                {/* Speed Menu */}
                {showSpeedMenu && (
                  <div className="absolute bottom-full right-0 mb-2 w-56 bg-black/90 rounded-lg overflow-hidden">
                    {speedOptions.map((speed) => (
                      <button
                        key={speed}
                        className={`w-full px-4 py-2 text-left hover:bg-white/10 ${
                          playbackSpeed === speed ? 'text-orange-500' : 'text-white'
                        }`}
                        onClick={() => handleSpeedChange(speed)}
                      >
                        {speed}x
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Theater Mode */}
              <CustomTooltip content="Theater Mode">
                <button 
                  onClick={() => setIsTheaterMode(!isTheaterMode)}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  {isTheaterMode ? (
                    <Minimize className="w-5 h-5 text-white" />
                  ) : (
                    <Maximize className="w-5 h-5 text-white" />
                  )}
                </button>
              </CustomTooltip>

              {/* Fullscreen Toggle */}
              <CustomTooltip content="Fullscreen (F)">
                <button 
                  onClick={toggleFullscreen}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  {isFullscreen ? (
                    <Minimize className="w-5 h-5 text-white" />
                  ) : (
                    <Maximize className="w-5 h-5 text-white" />
                  )}
                </button>
              </CustomTooltip>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;