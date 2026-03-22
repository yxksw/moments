import React, { useEffect, useRef, useState, useCallback } from 'react';

interface Song {
  name: string;
  artist: string;
  url: string;
  cover: string;
  lrc?: string;
}

interface MusicPlayerProps {
  server?: 'netease' | 'tencent' | 'kugou' | 'xiami' | 'baidu';
  type?: 'playlist' | 'song';
  id: string;
  volume?: number;
}

const METING_API = 'https://meting2.050815.xyz/api';

const MusicPlayer: React.FC<MusicPlayerProps> = ({
  server = 'netease',
  type = 'playlist',
  id,
  volume = 0.8
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isStretch, setIsStretch] = useState(false);
  const [songs, setSongs] = useState<Song[]>([]);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showLrc, setShowLrc] = useState(false);
  const [currentLrc, setCurrentLrc] = useState('');
  const [lrcList, setLrcList] = useState<{ time: number; text: string }[]>([]);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  // 获取音乐列表
  useEffect(() => {
    const fetchSongs = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${METING_API}?server=${server}&type=${type}&id=${id}`);
        const data = await response.json();

        if (Array.isArray(data) && data.length > 0) {
          const formattedSongs: Song[] = data.map((item: any) => ({
            name: item.name || item.title || '未知歌曲',
            artist: item.artist || item.author || '未知艺术家',
            url: item.url,
            cover: item.pic || item.cover || item.picUrl || '',
            lrc: item.lrc
          }));
          setSongs(formattedSongs);
          setCurrentSong(formattedSongs[0]);
          setCurrentIndex(0);
        }
      } catch (error) {
        console.error('获取音乐列表失败:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchSongs();
    }
  }, [server, type, id]);

  // 解析歌词
  useEffect(() => {
    if (currentSong?.lrc) {
      parseLrc(currentSong.lrc);
    } else {
      setLrcList([]);
      setCurrentLrc('');
    }
  }, [currentSong]);

  const parseLrc = (lrc: string) => {
    const lines = lrc.split('\n');
    const parsed: { time: number; text: string }[] = [];

    lines.forEach(line => {
      const match = line.match(/\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/);
      if (match) {
        const minutes = parseInt(match[1]);
        const seconds = parseInt(match[2]);
        const ms = parseInt(match[3].padEnd(3, '0'));
        const text = match[4].trim();
        const time = minutes * 60 + seconds + ms / 1000;
        if (text) {
          parsed.push({ time, text });
        }
      }
    });

    setLrcList(parsed.sort((a, b) => a.time - b.time));
  };

  // 更新当前歌词
  useEffect(() => {
    if (!isPlaying || lrcList.length === 0) return;

    const updateLrc = () => {
      if (audioRef.current) {
        const currentTime = audioRef.current.currentTime;
        const currentLine = lrcList.find((line, index) => {
          const nextLine = lrcList[index + 1];
          return currentTime >= line.time && (!nextLine || currentTime < nextLine.time);
        });
        if (currentLine) {
          setCurrentLrc(currentLine.text);
        }
      }
    };

    const interval = setInterval(updateLrc, 100);
    return () => clearInterval(interval);
  }, [isPlaying, lrcList]);

  // 播放/暂停
  const togglePlay = useCallback(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  // 切换歌曲
  const changeSong = useCallback((index: number) => {
    if (songs[index]) {
      setCurrentIndex(index);
      setCurrentSong(songs[index]);
      setProgress(0);
      setIsPlaying(true);
    }
  }, [songs]);

  // 下一首
  const nextSong = useCallback(() => {
    const nextIndex = (currentIndex + 1) % songs.length;
    changeSong(nextIndex);
  }, [currentIndex, songs.length, changeSong]);

  // 音频事件监听
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    const handleEnded = () => {
      nextSong();
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, [nextSong, currentSong]);

  // 自动播放新歌曲
  useEffect(() => {
    if (audioRef.current && currentSong) {
      audioRef.current.src = currentSong.url;
      audioRef.current.volume = volume;
      if (isPlaying) {
        audioRef.current.play();
      }
    }
  }, [currentSong, volume, isPlaying]);

  const handleStretch = () => {
    setIsStretch(!isStretch);
    setShowLrc(!isStretch);
  };

  if (isLoading) {
    return (
      <div id="nav-music" className="loading">
        <div className="aplayer">
          <div className="aplayer-body">
            <div className="aplayer-pic" style={{ background: '#f0f0f0' }} />
            <div className="aplayer-info">
              <div className="aplayer-music">
                <span className="aplayer-title">加载中...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentSong) {
    return null;
  }

  return (
    <>
      <div
        id="nav-music"
        className={`${isPlaying ? 'playing' : ''} ${isStretch ? 'stretch' : ''}`}
      >
        <div
          id="nav-music-hoverTips"
          onClick={togglePlay}
        >
          点击播放
        </div>
        <div className="aplayer aplayer-withlrc">
          <div className="aplayer-body">
            <div
              className="aplayer-pic"
              style={{
                backgroundImage: `url(${currentSong.cover})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              <button
                className={`aplayer-button alayer-${isPlaying ? 'pause' : 'play'}`}
                onClick={togglePlay}
              >
                {isPlaying ? (
                  <svg viewBox="0 0 16 16" fill="currentColor">
                    <rect x="4" y="2" width="3" height="12" rx="0.5" />
                    <rect x="9" y="2" width="3" height="12" rx="0.5" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 16 16" fill="currentColor">
                    <path d="M4 2l10 6-10 6z" />
                  </svg>
                )}
              </button>
            </div>
            <div className="aplayer-info">
              <div className="aplayer-music" onClick={handleStretch}>
                <span className="aplayer-title" title={currentSong.name}>
                  {currentSong.name}
                </span>
              </div>
              <div className="aplayer-controller">
                <div className="aplayer-bar-wrap">
                  <div className="aplayer-bar">
                    <div
                      className="aplayer-played"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
            {showLrc && (
              <div className="aplayer-lrc">
                <div className="aplayer-lrc-contents">
                  <p className="aplayer-lrc-current">{currentLrc || '暂无歌词'}</p>
                </div>
              </div>
            )}
          </div>
        </div>
        <audio ref={audioRef} />
      </div>

      <style jsx>{`
        @keyframes changeright {
          0%, 50%, 100% {
            transform: rotate(0deg) scale(1.1);
            box-shadow: 0 0 2px #ffffff00;
          }
          25%, 75% {
            transform: rotate(90deg) scale(1.1);
            box-shadow: 0 0 14px #ffffff;
          }
        }

        @keyframes playingShadow {
          0%, 100% {
            box-shadow: 0 0px 12px -3px #00000000;
          }
          50% {
            box-shadow: 0 0px 12px 0px var(--liushen-theme-color, #dc2626);
          }
        }

        @keyframes lightBar {
          0%, 100% {
            opacity: 0.1;
          }
          60% {
            opacity: 0.3;
          }
        }

        #nav-music {
          display: flex;
          align-items: center;
          position: fixed;
          z-index: 10000;
          bottom: 10px;
          left: 10px;
          cursor: pointer;
          transition: all 0.5s;
          transform-origin: left bottom;
          box-shadow: 0 5px 6px -5px rgba(133, 133, 133, 0.6);
          border-radius: 40px;
          overflow: hidden;
        }

        #nav-music:active {
          transform: scale(0.97);
        }

        #nav-music.playing {
          border: 1px solid #e3e8f7;
          box-shadow: 0 0px 12px -3px #00000000;
          animation: playingShadow 5s linear infinite;
        }

        #nav-music.playing .aplayer.aplayer-withlrc .aplayer-pic {
          box-shadow: 0 0 14px #ffffffa6;
          transform: rotate(0deg) scale(1.1);
          border-color: white;
          animation-play-state: running;
        }

        #nav-music.playing .aplayer.aplayer-withlrc .aplayer-info {
          color: white;
        }

        #nav-music.playing #nav-music-hoverTips {
          width: 0;
        }

        #nav-music.playing .aplayer {
          background: var(--liushen-theme-color, #dc2626);
          border: 1px solid #e3e8f7;
          backdrop-filter: saturate(180%) blur(20px);
        }

        #nav-music.playing .aplayer .aplayer-info .aplayer-controller .aplayer-bar-wrap .aplayer-bar .aplayer-played {
          animation-play-state: running;
        }

        #nav-music:hover:not(.playing) #nav-music-hoverTips {
          opacity: 1;
        }

        #nav-music-hoverTips {
          color: white;
          background: var(--liushen-theme-color, #dc2626);
          width: 100%;
          height: 100%;
          position: absolute;
          top: 0;
          left: 0;
          align-items: center;
          justify-content: center;
          display: flex;
          border-radius: 40px;
          opacity: 0;
          font-size: 12px;
          z-index: 2;
          transition: 0.3s;
        }

        .aplayer {
          background: #fff;
          border-radius: 60px;
          height: 41px;
          display: flex;
          margin: 0;
          transition: 0.3s;
          border: 1px solid #e3e8f7;
          box-shadow: none;
          font-family: inherit;
        }

        .aplayer-body {
          position: relative;
          display: flex;
          align-items: center;
          min-width: 180px;
        }

        .aplayer-pic {
          height: 25px;
          width: 25px;
          border-radius: 40px;
          z-index: 1;
          transition: 0.3s;
          transform: rotate(0deg) scale(1);
          border: 1px solid #e3e8f7;
          animation: changeright 24s linear infinite;
          animation-play-state: paused;
          margin-left: 8px;
          position: relative;
          overflow: hidden;
          flex-shrink: 0;
        }

        .aplayer-button {
          position: absolute;
          bottom: 50%;
          right: 50%;
          transform: translate(50%, 50%);
          margin: 0;
          transition: 0.3s;
          width: 16px;
          height: 16px;
          border: none;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          opacity: 0;
        }

        .aplayer-pic:hover .aplayer-button {
          opacity: 1;
        }

        .aplayer-button svg {
          width: 10px;
          height: 10px;
        }

        .aplayer-info {
          height: 100%;
          color: #4c4948;
          margin: 0;
          padding: 0;
          display: flex;
          align-items: center;
          flex: 1;
          overflow: hidden;
        }

        .aplayer-music {
          margin: 0;
          display: flex;
          align-items: center;
          padding: 0 12px 0 8px;
          cursor: pointer;
          z-index: 1;
          height: 100%;
          overflow: hidden;
        }

        .aplayer-title {
          cursor: pointer;
          line-height: 1;
          display: inline-block;
          white-space: nowrap;
          max-width: 120px;
          overflow: hidden;
          text-overflow: ellipsis;
          transition: 0.3s;
          user-select: none;
          font-size: 13px;
        }

        .aplayer-controller {
          position: absolute;
          width: 100%;
          height: 100%;
          top: 0;
          left: 0;
        }

        .aplayer-bar-wrap {
          margin: 0;
          padding: 0;
        }

        .aplayer-bar {
          height: 100%;
          background: transparent;
          position: relative;
        }

        .aplayer-played {
          height: 100%;
          opacity: 0.1;
          background-color: white !important;
          animation: lightBar 5s ease infinite;
          animation-play-state: paused;
          position: absolute;
          top: 0;
          left: 0;
        }

        .aplayer-lrc {
          width: 0;
          opacity: 0;
          transition: 0.3s;
          margin-bottom: -26px;
          overflow: hidden;
        }

        #nav-music.stretch .aplayer-lrc {
          width: 200px;
          margin-left: 8px;
          opacity: 1;
        }

        .aplayer-lrc-contents {
          padding: 0 8px;
        }

        .aplayer-lrc-current {
          color: white;
          border: none;
          min-height: 20px;
          filter: none;
          font-size: 12px;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* 深色模式适配 */
        :global(body.dark-theme) #nav-music .aplayer {
          background: #2d2d2d;
          border-color: #42444a;
        }

        :global(body.dark-theme) #nav-music .aplayer-info {
          color: #ffffffb3;
        }

        :global(body.dark-theme) #nav-music.playing .aplayer {
          background: var(--liushen-theme-color, #dc2626);
        }

        /* 移动端适配 */
        @media screen and (max-width: 600px) {
          #nav-music {
            bottom: 5px;
            left: 5px;
          }

          #nav-music.stretch .aplayer-lrc {
            width: 150px;
          }

          .aplayer-title {
            max-width: 80px;
          }
        }
      `}</style>
    </>
  );
};

export default MusicPlayer;
