import Head from 'next/head';
import React, { useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faComment } from '@fortawesome/free-solid-svg-icons';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import ReactMarkdown from 'react-markdown';
import { ReactNode } from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';
import MusicPlayer from '../components/MusicPlayer';
import Live2DWidget from '../components/Live2DWidget';
dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

interface Moment {
  id: string;
  title: string;
  username: string;
  image?: string;
  date: string;
  mood?: string;
  icon?: string;
  content?: string;
  images?: string[];
}

const TWIKOO_URL = process.env.NEXT_PUBLIC_TWIKOO_URL || '';
const BLOG_URL = process.env.NEXT_PUBLIC_BLOG_URL || 'https://blog.lusyoe.com';

// API 基础 URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

const MomentsPage: React.FC = () => {
  const [moments, setMoments] = useState<Moment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const twikooInitedRef = useRef<string | null>(null);
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [zoomImg, setZoomImg] = useState<string | null>(null);
  const [zoomImgIndex, setZoomImgIndex] = useState<number>(-1);
  const [zoomImgList, setZoomImgList] = useState<string[]>([]);
  const [showOriginal, setShowOriginal] = useState(false);
  const [loadingOriginal, setLoadingOriginal] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [now, setNow] = useState(Date.now());

  // 定时更新相对时间
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  // 从 API 获取数据
  useEffect(() => {
    const fetchMoments = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/moments`);
        if (!response.ok) {
          throw new Error('获取数据失败');
        }
        const data = await response.json();
        if (data.success) {
          // 转换数据格式
          const formattedMoments: Moment[] = data.data.map((item: any, index: number) => ({
            id: `moment-${index}`,
            title: item.title,
            username: '异飨客', // 可以从 API 返回或配置
            date: item.date,
            mood: item.mood,
            content: item.content,
            images: item.images || []
          }));
          setMoments(formattedMoments);
        } else {
          setError(data.message || '获取数据失败');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '未知错误');
      } finally {
        setLoading(false);
      }
    };

    fetchMoments();
  }, []);

  // 批量获取评论数
  useEffect(() => {
    if (typeof window === 'undefined' || moments.length === 0) return;
    function fetchCounts() {
      if ((window as any).twikoo && typeof (window as any).twikoo.getCommentsCount === 'function') {
        (window as any).twikoo.getCommentsCount({
          envId: TWIKOO_URL,
          urls: moments.map(m => m.id),
        }).then((res: { url: string; count: number }[]) => {
          const map: Record<string, number> = {};
          res.forEach(item => {
            map[item.url] = item.count;
          });
          setCommentCounts(map);
        });
      }
    }
    if ((window as any).twikoo) {
      fetchCounts();
    } else {
      const script = document.createElement('script');
      script.src = 'https://s4.zstatic.net/npm/twikoo@1.6.44/dist/twikoo.min.js';
      script.async = true;
      script.onload = () => {
        fetchCounts();
      };
      document.body.appendChild(script);
    }
  }, [moments]);

  useEffect(() => {
    if (!activeCommentId) return;
    const elId = `twikoo-moment-${activeCommentId}`;
    if (twikooInitedRef.current && twikooInitedRef.current !== activeCommentId) {
      const prevEl = document.getElementById(`twikoo-moment-${twikooInitedRef.current}`);
      if (prevEl) prevEl.innerHTML = '';
    }
    function initTwikoo() {
      if ((window as any).twikoo && typeof (window as any).twikoo.init === 'function') {
        (window as any).twikoo.init({
          el: `#${elId}`,
          envId: TWIKOO_URL,
          path: activeCommentId,
        });
        twikooInitedRef.current = activeCommentId;
      }
    }
    if (typeof window !== 'undefined' && (window as any).twikoo) {
      initTwikoo();
    } else if (typeof window !== 'undefined' && !(window as any).twikoo) {
      const script = document.createElement('script');
      script.src = 'https://s4.zstatic.net/npm/twikoo@1.6.44/dist/twikoo.min.js';
      script.async = true;
      script.onload = () => {
        initTwikoo();
      };
      document.body.appendChild(script);
    }
  }, [activeCommentId]);

  // 从 localStorage 读取主题设置
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      const hour = new Date().getHours();
      if (hour >= 18 || hour < 6) {
        setTheme('dark');
      } else {
        setTheme('light');
      }
    }
  }, []);

  useEffect(() => {
    document.body.classList.toggle('dark-theme', theme === 'dark');
    document.body.classList.toggle('light-theme', theme === 'light');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // 图片放大查看
  const openZoom = (img: string, imgs: string[], idx: number) => {
    setZoomImg(img);
    setZoomImgList(imgs);
    setZoomImgIndex(idx);
    setShowOriginal(false);
    setLoadingOriginal(false);
  };
  const closeZoom = () => {
    setZoomImg(null);
    setZoomImgIndex(-1);
    setZoomImgList([]);
    setShowOriginal(false);
    setLoadingOriginal(false);
  };
  const showNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (zoomImgList.length > 0 && zoomImgIndex >= 0) {
      const nextIdx = (zoomImgIndex + 1) % zoomImgList.length;
      setZoomImgIndex(nextIdx);
      setZoomImg(zoomImgList[nextIdx]);
      setShowOriginal(false);
      setLoadingOriginal(false);
    }
  };
  const showPrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (zoomImgList.length > 0 && zoomImgIndex >= 0) {
      const prevIdx = (zoomImgIndex - 1 + zoomImgList.length) % zoomImgList.length;
      setZoomImgIndex(prevIdx);
      setZoomImg(zoomImgList[prevIdx]);
      setShowOriginal(false);
      setLoadingOriginal(false);
    }
  };

  // 自定义图片渲染组件
  const ImageRenderer = ({ src, alt }: { src: string; alt: string }) => (
    <img
      src={src}
      alt={alt}
      style={{ maxWidth: '100%', borderRadius: 8, margin: '8px 0' }}
      loading="lazy"
    />
  );

  return (
    <>
      <Head>
        <title>日常瞬间</title>
        <meta name="description" content="记录生活中的美好瞬间" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="shortcut icon" href="/favicon.ico" />
      </Head>
      <div className={`main-container ${theme}-theme`}>
        {/* 主题切换按钮 */}
        <button
          className="theme-toggle-btn"
          onClick={toggleTheme}
          aria-label={theme === 'light' ? '切换到深色模式' : '切换到浅色模式'}
        >
          {theme === 'light' ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
              <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
                <path d="M12 6c3.31 0 6 2.69 6 6c0 3.31 -2.69 6 -6 6c-3.31 0 -6 -2.69 -6 -6c0 -3.31 2.69 -6 6 -6Z">
                  <animate fill="freeze" attributeName="d" dur="0.6s" values="M12 26c3.31 0 6 2.69 6 6c0 3.31 -2.69 6 -6 6c-3.31 0 -6 -2.69 -6 -6c0 -3.31 2.69 -6 6 -6Z;M12 6c3.31 0 6 2.69 6 6c0 3.31 -2.69 6 -6 6c-3.31 0 -6 -2.69 -6 -6c0 -3.31 2.69 -6 6 -6Z"/>
                </path>
                <path d="M12 21v1M21 12h1M12 3v-1M3 12h-1" opacity="0">
                  <set fill="freeze" attributeName="opacity" begin="0.7s" to="1"/>
                  <animate fill="freeze" attributeName="d" begin="0.7s" dur="0.2s" values="M12 19v1M19 12h1M12 5v-1M5 12h-1;M12 21v1M21 12h1M12 3v-1M3 12h-1"/>
                </path>
                <path d="M18.5 18.5l0.5 0.5M18.5 5.5l0.5 -0.5M5.5 5.5l-0.5 -0.5M5.5 18.5l-0.5 0.5" opacity="0">
                  <set fill="freeze" attributeName="opacity" begin="0.9s" to="1"/>
                  <animate fill="freeze" attributeName="d" begin="0.9s" dur="0.2s" values="M17 17l0.5 0.5M17 7l0.5 -0.5M7 7l-0.5 -0.5M7 17l-0.5 0.5;M18.5 18.5l0.5 0.5M18.5 5.5l0.5 -0.5M5.5 5.5l-0.5 -0.5M5.5 18.5l-0.5 0.5"/>
                </path>
              </g>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
              <path fill="none" stroke="currentColor" strokeDasharray="56" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 6c0 6.08 4.92 11 11 11c0.53 0 1.05 -0.04 1.56 -0.11c-1.61 2.47 -4.39 4.11 -7.56 4.11c-4.97 0 -9 -4.03 -9 -9c0 -3.17 1.64 -5.95 4.11 -7.56c-0.07 0.51 -0.11 1.03 -0.11 1.56Z">
                <animate fill="freeze" attributeName="stroke-dashoffset" dur="0.6s" values="56;0"/>
              </path>
              <g fill="currentColor">
                <path d="M15.22 6.03l2.53 -1.94l-3.19 -0.09l-1.06 -3l-1.06 3l-3.19 0.09l2.53 1.94l-0.91 3.06l2.63 -1.81l2.63 1.81l-0.91 -3.06Z" opacity="0">
                  <animate fill="freeze" attributeName="opacity" begin="0.7s" dur="0.4s" to="1"/>
                </path>
                <path d="M19.61 12.25l1.64 -1.25l-2.06 -0.05l-0.69 -1.95l-0.69 1.95l-2.06 0.05l1.64 1.25l-0.59 1.98l1.7 -1.17l1.7 1.17l-0.59 -1.98Z" opacity="0">
                  <animate fill="freeze" attributeName="opacity" begin="1.1s" dur="0.4s" to="1"/>
                </path>
              </g>
            </svg>
          )}
        </button>
        <h1 style={{ textAlign: 'center' }} className="main-title">日常瞬间</h1>

        {/* 加载状态 */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#888' }}>
            加载中...
          </div>
        )}

        {/* 错误状态 */}
        {error && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#dc2626' }}>
            加载失败: {error}
          </div>
        )}

        {/* 数据展示 */}
        {!loading && !error && moments.map((moment) => (
          <div key={moment.id} className="moment-card">
            <div className="moment-header">
              <div className="moment-user">
                <img
                  src="/favicon.ico"
                  alt="avatar"
                  style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', background: '#f5f5f5', marginRight: 6 }}
                />
                <a href={BLOG_URL} target="_blank" rel="noopener noreferrer" style={{ fontSize: 16, color: '#0070f3', textDecoration: 'none' }}>异飨客</a>
              </div>
              <span className="moment-date">{dayjs(moment.date).fromNow()}</span>
            </div>
            <div className="moment-title" style={{ fontSize: 18, fontWeight: 600, margin: '8px 0' }}>{moment.title}</div>
            {moment.mood && (
              <div className="mood-tag" style={{ display: 'inline-block', background: '#f0f0f0', borderRadius: '12px', padding: '2px 10px', fontSize: 14, color: '#666', margin: '8px 0', marginBottom: 4 }}>{moment.mood}</div>
            )}
            {moment.content && (
              <div className="moment-content" style={{ fontSize: 15, color: '#444', margin: '8px 0', lineHeight: 1.6 }}>
                <ReactMarkdown
                  components={{
                    img: ImageRenderer as any,
                  }}
                >
                  {moment.content}
                </ReactMarkdown>
              </div>
            )}
            {moment.images && moment.images.length > 0 && (
              <div className="moment-images" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '8px 0' }}>
                {moment.images.map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`图片${idx + 1}`}
                    style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 8, cursor: 'pointer' }}
                    onClick={() => openZoom(img, moment.images || [], idx)}
                    loading="lazy"
                  />
                ))}
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
              <button
                className="comment-btn"
                onClick={() => setActiveCommentId(activeCommentId === moment.id ? null : moment.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#f0f0f0', border: 'none', borderRadius: 12, padding: '4px 12px', cursor: 'pointer', fontSize: 14 }}
              >
                <FontAwesomeIcon icon={faComment as IconProp} style={{ width: 16, height: 16 }} />
                <span>{commentCounts[moment.id] || 0}</span>
              </button>
            </div>
            {activeCommentId === moment.id && (
              <div className="twikoo-comment-area" style={{ marginTop: 12, padding: 12, background: '#fafbfc', borderRadius: 8 }}>
                <div id={`twikoo-moment-${moment.id}`} className="twikoo-container" />
              </div>
            )}
          </div>
        ))}

        {/* 图片放大弹窗 */}
        {zoomImg && (
          <div
            className="zoom-modal"
            onClick={closeZoom}
            style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.85)',
              zIndex: 10000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <button
              onClick={showPrev}
              style={{
                position: 'absolute', left: 24, top: '50%', transform: 'translateY(-50%)',
                background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%',
                width: 44, height: 44, fontSize: 28, cursor: 'pointer', zIndex: 2
              }}
            >‹</button>
            <button
              onClick={showNext}
              style={{
                position: 'absolute', right: 24, top: '50%', transform: 'translateY(-50%)',
                background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%',
                width: 44, height: 44, fontSize: 28, cursor: 'pointer', zIndex: 2
              }}
            >›</button>
            <img
              src={zoomImg}
              alt="放大图片"
              style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 12, boxShadow: '0 4px 24px rgba(0,0,0,0.4)' }}
              onClick={e => e.stopPropagation()}
            />
            <button
              onClick={closeZoom}
              style={{
                position: 'absolute', top: 24, right: 24,
                background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%',
                width: 40, height: 40, fontSize: 24, cursor: 'pointer', zIndex: 2
              }}
            >×</button>
          </div>
        )}

        {/* 底部横线提示 */}
        <div className="bottom-line">
          <span>已经到底啦</span>
        </div>

        {/* 音乐播放器 */}
        <MusicPlayer
          server="netease"
          type="playlist"
          id="13681647281"
          volume={0.8}
        />

        {/* Live2D 看板娘 */}
        <Live2DWidget theme={theme} />
      </div>

      <style jsx global>{`
        @import url('https://cdn.jsdelivr.net/npm/lxgw-wenkai-webfont@1.7.0/style.css');
        body, .main-container, html {
          font-family: 'LXGW WenKai', '霞鹜文楷', 'WenKai', 'STKaiti', 'KaiTi', serif !important;
          cursor: url('/default.cur'), auto;
        }
        a, button, [role="button"], input, textarea, select, .cursor-pointer {
          cursor: url('/default.cur'), pointer;
        }
        body, .main-container {
          background: #fff;
          transition: background 0.3s;
        }
        .main-container {
          max-width: 820px;
          margin: 0 auto;
          padding: 24px 8px 40px 8px;
          background: #fff;
          min-height: 100vh;
          transition: background 0.3s, color 0.3s;
        }
        .main-container.dark-theme {
          background: #181818 !important;
          color: #bbbbbb !important;
        }
        .main-container.dark-theme .main-title {
          color: #bbbbbb !important;
        }
        .moment-card {
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
          margin: 18px 0;
          padding: 18px 18px 12px 18px;
          transition: background 0.3s, border-color 0.3s, box-shadow 0.3s;
          border: 1px solid #f0f0f0;
        }
        body.dark-theme .moment-card,
        .main-container.dark-theme .moment-card {
          background: #23232a !important;
          border-color: #333 !important;
          color: #bbbbbb !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.25);
        }
        body.dark-theme .moment-title,
        .main-container.dark-theme .moment-title {
          color: #bbbbbb !important;
        }
        body.dark-theme .moment-content,
        .main-container.dark-theme .moment-content {
          color: #bbbbbb !important;
        }
        body.dark-theme .twikoo-comment-area,
        .main-container.dark-theme .twikoo-comment-area {
          background: #23232a !important;
          border-color: #333 !important;
          color: #bbbbbb !important;
        }
        /* 主题切换按钮样式 */
        .theme-toggle-btn {
          position: fixed;
          top: 20px;
          right: 20px;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: 1px solid #e0e0e0;
          background: #fff;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          z-index: 100;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          color: #dc2626;
        }
        .theme-toggle-btn:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        body.dark-theme .theme-toggle-btn,
        .main-container.dark-theme .theme-toggle-btn {
          background: #232323 !important;
          border-color: #444 !important;
          color: #dc2626;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }
        /* 深色模式下更多元素适配 */
        body.dark-theme .moment-date,
        .main-container.dark-theme .moment-date {
          color: #888 !important;
        }
        body.dark-theme .moment-user a,
        .main-container.dark-theme .moment-user a {
          color: #4a9eff !important;
        }
        body.dark-theme .main-container,
        .main-container.dark-theme {
          background: #181818 !important;
        }
        /* 深色模式下心情标签 */
        body.dark-theme .mood-tag,
        .main-container.dark-theme .mood-tag {
          background: #333 !important;
          color: #aaa !important;
        }
        /* 深色模式下评论按钮 */
        body.dark-theme .comment-btn,
        .main-container.dark-theme .comment-btn {
          background: #333 !important;
          color: #aaa !important;
        }
        /* 底部横线提示 */
        .bottom-line {
          text-align: center;
          margin: 40px 0 20px;
          position: relative;
        }
        .bottom-line::before {
          content: '';
          display: block;
          width: 100%;
          height: 1px;
          background: linear-gradient(to right, transparent, #e0e0e0, transparent);
          position: absolute;
          top: 50%;
          left: 0;
          z-index: 0;
        }
        body.dark-theme .bottom-line::before,
        .main-container.dark-theme .bottom-line::before {
          background: linear-gradient(to right, transparent, #444, transparent);
        }
        .bottom-line span {
          background: #fff;
          padding: 0 16px;
          color: #aaa;
          font-size: 14px;
          position: relative;
          z-index: 1;
        }
        body.dark-theme .bottom-line span,
        .main-container.dark-theme .bottom-line span {
          background: #181818;
          color: #666;
        }
      `}</style>
    </>
  );
};

export default MomentsPage;
