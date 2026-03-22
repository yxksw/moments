import { GetStaticProps } from 'next';
import Head from 'next/head';
import { getMoments } from '../lib/notion';
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
  images?: string[]; // 新增图片数组字段
}

interface MomentsPageProps {
  moments: Moment[];
}

const TWIKOO_URL = process.env.NEXT_PUBLIC_TWIKOO_URL || '';
const BLOG_URL = process.env.NEXT_PUBLIC_BLOG_URL || 'https://blog.lusyoe.com';

const MomentsPage: React.FC<MomentsPageProps> = ({ moments }) => {
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const twikooInitedRef = useRef<string | null>(null);
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [zoomImg, setZoomImg] = useState<string | null>(null);
  // 删除缩略图url、原图url状态
  // const [zoomImgThumb, setZoomImgThumb] = useState<string | null>(null);
  // const [zoomImgOrigin, setZoomImgOrigin] = useState<string | null>(null);
  const [zoomImgIndex, setZoomImgIndex] = useState<number>(-1);
  const [zoomImgList, setZoomImgList] = useState<string[]>([]);
  const [showOriginal, setShowOriginal] = useState(false);
  const [loadingOriginal, setLoadingOriginal] = useState(false);
  // 新增主题状态
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  // 删除 getThumbUrl 函数

  // 批量获取评论数
  useEffect(() => {
    if (typeof window === 'undefined') return;
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
    // 销毁上一个评论区内容
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

  // 从 localStorage 读取主题设置，如果没有则根据时间自动切换
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
      <div>
        {moments.map(moment => {
          const divId = `twikoo-moment-${moment.id}`;
          const isActive = activeCommentId === moment.id;
          return (
            <div key={moment.id} className="moment-card">
              <div className="moment-header">
                <div className="moment-user">
                  <img
                    src="https://cn.cravatar.com/avatar/56cd72b5460ecaa08ddffea9562f5629?size=512"
                    alt="avatar"
                    style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', background: '#f5f5f5', marginRight: 6 }}
                  />
                  { <a href={BLOG_URL} target="_blank" rel="noopener noreferrer" style={{ fontSize: 16, color: '#0070f3', textDecoration: 'none' }}>{moment.username}</a> }
                </div>
                <div className="moment-date">{dayjs(moment.date).fromNow()}</div>
              </div>
              {moment.image && <img src={moment.image} alt={moment.title} style={{ width: '100%', borderRadius: 8, margin: '12px 0' }} />}
              <div style={{ fontWeight: 'bold', fontSize: 16 }} className="moment-title">{moment.title}</div>
              {moment.mood && (
                <div className="mood-tag" style={{
                  display: 'inline-block',
                  background: '#f0f0f0',
                  borderRadius: '12px',
                  padding: '2px 10px',
                  fontSize: 14,
                  color: '#666',
                  margin: '8px 0',
                  marginBottom: 4,
                }}>{moment.mood}</div>
              )}
              {moment.content && (
                <div style={{ margin: '8px 0', color: '#444', fontSize: 15 }} className="markdown-content">
                  <ReactMarkdown>
                    {moment.content}
                  </ReactMarkdown>
                  {/* 新增：渲染图片数组，每行4张 */}
                  {moment.images && moment.images.length > 0 && (
                    <div style={{ margin: '12px 0' }}>
                      {Array.from({ length: Math.ceil(moment.images.length / 4) }).map((_, rowIdx) => (
                        <div key={rowIdx} style={{ display: 'flex', gap: '2%', marginBottom: 8 }}>
                          {moment.images!.slice(rowIdx * 4, rowIdx * 4 + 4).map((url, idx) => (
                            <img
                              key={url}
                              src={url}
                              alt={`图片${rowIdx * 4 + idx + 1}`}
                              style={{
                                width: '24%',
                                borderRadius: 8,
                                cursor: 'pointer',
                                objectFit: 'cover',
                                boxShadow: zoomImg === url ? '0 4px 24px rgba(0,0,0,0.18)' : undefined,
                                zIndex: zoomImg === url ? 1001 : undefined,
                                display: zoomImg === url ? 'none' : undefined, // 放大时隐藏原图
                              }}
                              onClick={() => {
                                setZoomImg(url);
                                setZoomImgList(moment.images!);
                                setZoomImgIndex(rowIdx * 4 + idx);
                                setShowOriginal(false);
                              }}
                            />
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                  {/* 遮罩层和放大图片 */}
                  {zoomImg && (
                    <div
                      onClick={() => setZoomImg(null)}
                      style={{
                        position: 'fixed',
                        left: 0,
                        top: 0,
                        width: '100vw',
                        height: '100vh',
                        background: 'rgba(0,0,0,0.5)',
                        zIndex: 1000,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'zoom-out',
                        flexDirection: 'column',
                      }}
                    >
                      <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={e => e.stopPropagation()}>
                        {/* 左侧半圆弧按钮 */}
                        {zoomImgList.length > 1 && zoomImgIndex > 0 && (
                          <button
                            style={{
                              position: 'absolute',
                              left: 0,
                              top: '50%',
                              transform: 'translateY(-50%)',
                              width: 32,
                              height: '60%',
                              minHeight: 48,
                              maxHeight: 320,
                              background: 'rgba(0,0,0,0.10)',
                              border: 'none',
                              borderRadius: '0 999px 999px 0',
                              color: '#fff',
                              fontSize: 22,
                              cursor: 'pointer',
                              zIndex: 2,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: 0,
                              outline: 'none',
                              transition: 'background 0.2s',
                              boxShadow: '2px 0 8px rgba(0,0,0,0.08)',
                              opacity: 0.7,
                            }}
                            onClick={e => {
                              e.stopPropagation();
                              if (zoomImgIndex > 0) {
                                const nextIdx = zoomImgIndex - 1;
                                setShowOriginal(false);
                                setZoomImg(zoomImgList[nextIdx]);
                                setZoomImgIndex(nextIdx);
                              }
                            }}
                            aria-label="上一张"
                            onMouseOver={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.18)')}
                            onMouseOut={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.10)')}
                          >
                            <span style={{fontSize: 22, fontWeight: 'bold', userSelect: 'none'}}>{'<'}</span>
                          </button>
                        )}
                        {/* 右侧半圆弧按钮 */}
                        {zoomImgList.length > 1 && zoomImgIndex < zoomImgList.length - 1 && (
                          <button
                            style={{
                              position: 'absolute',
                              right: 0,
                              top: '50%',
                              transform: 'translateY(-50%)',
                              width: 32,
                              height: '60%',
                              minHeight: 48,
                              maxHeight: 320,
                              background: 'rgba(0,0,0,0.10)',
                              border: 'none',
                              borderRadius: '999px 0 0 999px',
                              color: '#fff',
                              fontSize: 22,
                              cursor: 'pointer',
                              zIndex: 2,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: 0,
                              outline: 'none',
                              transition: 'background 0.2s',
                              boxShadow: '-2px 0 8px rgba(0,0,0,0.08)',
                              opacity: 0.7,
                            }}
                            onClick={e => {
                              e.stopPropagation();
                              if (zoomImgIndex < zoomImgList.length - 1) {
                                const nextIdx = zoomImgIndex + 1;
                                setShowOriginal(false);
                                setZoomImg(zoomImgList[nextIdx]);
                                setZoomImgIndex(nextIdx);
                              }
                            }}
                            aria-label="下一张"
                            onMouseOver={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.18)')}
                            onMouseOut={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.10)')}
                          >
                            <span style={{fontSize: 22, fontWeight: 'bold', userSelect: 'none'}}>{'>'}</span>
                          </button>
                        )}
                        {/* 图片本体 */}
                        {!showOriginal && zoomImg && (
                          <img
                            src={zoomImg}
                            alt="放大图片"
                            style={{
                              maxWidth: '90vw',
                              maxHeight: '90vh',
                              width: 'auto',
                              height: 'auto',
                              display: 'block',
                              margin: 'auto',
                              borderRadius: 12,
                              boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
                              background: '#fff',
                              cursor: 'zoom-out',
                            }}
                            onClick={() => setZoomImg(null)}
                          />
                        )}
                        {showOriginal && zoomImg && (
                          <img
                            src={zoomImg}
                            alt="原图"
                            style={{
                              maxWidth: 'none',
                              maxHeight: 'none',
                              width: 'auto',
                              height: 'auto',
                              display: loadingOriginal ? 'none' : 'block',
                              margin: 'auto',
                              borderRadius: 12,
                              boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
                              background: '#fff',
                              cursor: 'zoom-out',
                            }}
                            onClick={() => setZoomImg(null)}
                            onLoad={() => setLoadingOriginal(false)}
                          />
                        )}
                        {showOriginal && loadingOriginal && (
                          <div style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0070f3', fontSize: 18, background: 'rgba(255,255,255,0.7)', borderRadius: 12 }}>
                            原图加载中...
                          </div>
                        )}
                        {/* 底部小圆点 */}
                        {zoomImgList.length > 1 && (
                          <div style={{
                            position: 'absolute',
                            left: 0,
                            right: 0,
                            bottom: 12,
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: 8,
                            zIndex: 2,
                          }}>
                            {zoomImgList.map((img, idx) => (
                              <span
                                key={img + idx}
                                onClick={e => {
                                  e.stopPropagation();
                                  setShowOriginal(false);
                                  setZoomImg(img);
                                  setZoomImgIndex(idx);
                                }}
                                style={{
                                  width: 6,
                                  height: 6,
                                  borderRadius: '50%',
                                  background: idx === zoomImgIndex ? '#0070f3' : 'rgba(255,255,255,0.7)',
                                  border: idx === zoomImgIndex ? '1.5px solid #0070f3' : '1px solid #ccc',
                                  display: 'inline-block',
                                  cursor: 'pointer',
                                  transition: 'background 0.2s',
                                }}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
              <button
                style={{ marginTop: 8, padding: '4px 16px', borderRadius: 6, border: '1px solid #ddd', background: '#fafbfc', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                onClick={() => setActiveCommentId(isActive ? null : moment.id)}
              >
                <FontAwesomeIcon icon={faComment as IconProp} style={{ color: isActive ? '#0070f3' : '#888', fontSize: 14 }} />
                <span style={{ color: '#888', fontSize: 14 }}>
                  {typeof commentCounts[moment.id] === 'number' ? commentCounts[moment.id] : '-'}
                </span>
                {isActive ? '' : ''}
              </button>
              <div
                className="twikoo-comment-area"
                style={{
                  marginTop: 16,
                  display: isActive ? 'block' : 'none',
                }}
              >
                <div id={divId}></div>
              </div>
            </div>
          );
        })}
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
        }
        .moment-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .moment-user {
          display: flex;
          align-items: center;
        }
        .moment-date {
          color: #888;
          font-size: 14px;
          margin-left: 12px;
          white-space: nowrap;
        }
        body.dark-theme, .main-container.dark-theme {
          background: #181818 !important;
        }
        body.light-theme, .main-container.light-theme {
          background: #fff !important;
        }
        .markdown-content {
        }
        .markdown-content > img {
          width: calc((100% - 3 * 2%) / 4);
          margin: 0;
          border-radius: 8px;
          cursor: pointer;
          height: auto;
          box-sizing: border-box;
          object-fit: cover;
        }
        .markdown-content > img:nth-child(4n) {
          margin-right: 0;
        }
        /* 隐藏全局滚动条，兼容主流浏览器 */
        html, body, .main-container {
          -ms-overflow-style: none; /* IE and Edge */
          scrollbar-width: none;    /* Firefox */
        }
        html::-webkit-scrollbar, body::-webkit-scrollbar, .main-container::-webkit-scrollbar {
          width: 0 !important;
          height: 0 !important;
          display: none;
          background: transparent;
        }
        .markdown-content > img {
          display: inline-block;
          width: 23%;
          margin: 1%;
          border-radius: 8px;
          cursor: pointer;
          height: auto;
          box-sizing: border-box;
          object-fit: cover;
        }
        .markdown-content p {
          margin-bottom: 0.1em;
        }
        .markdown-content blockquote,
        .markdown-content pre,
        .markdown-content ul,
        .markdown-content ol,
        .markdown-content hr {
          margin-bottom: 0.4em;
        }
        @media (max-width: 600px) {
          .main-container {
            max-width: 100%;
            margin: 0;
            padding: 0 4vw;
          }
          h1 {
            font-size: 1.3rem;
          }
          .markdown-content {
            flex-direction: column;
            gap: 0;
          }
          .markdown-content > img {
            width: 100%;
            margin: 8px 0;
            border-radius: 6px;
            display: block;
          }
          .main-container > div > div {
            padding: 10px 6px;
            margin-bottom: 14px;
            border-radius: 6px;
          }
          /* 保证头像、名称和时间同一行 */
          .moment-header {
            flex-direction: row !important;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 8px;
          }
          .moment-user {
            flex-direction: row;
            align-items: center;
          }
          .moment-date {
            margin-left: 8px;
            font-size: 13px;
          }
          .main-container button {
            font-size: 13px;
            padding: 4px 10px;
            border-radius: 5px;
          }
          .main-container img {
            max-width: 100%;
            height: auto;
          }
          .main-container span, .main-container div {
            font-size: 15px;
          }
        }
        /* 横线到底提示 */
        .bottom-line {
          width: 100%;
          text-align: center;
          border: none;
          border-top: 1.5px solid #e0e0e0;
          color: #888;
          font-size: 15px;
          margin: 36px 0 18px 0;
          position: relative;
          background: transparent;
        }
        .bottom-line span {
          position: relative;
          top: -0.9em;
          background: #fff;
          padding: 0 18px;
          color: #888;
          font-size: 15px;
        }
        body.dark-theme .bottom-line,
        .main-container.dark-theme .bottom-line {
          border-top: 1.5px solid #333;
          color: #bbbbbb;
        }
        body.dark-theme .bottom-line span,
        .main-container.dark-theme .bottom-line span {
          background: #181818;
          color: #bbbbbb;
        }
        .moment-title {
          font-weight: bold;
          font-size: 16px;
        }
        .main-title {
          text-align: center;
        }
        .main-container button {
          background: #fafbfc;
        }
        body.dark-theme .main-container button,
        .main-container.dark-theme button {
          background: #232323 !important;
          border-color: #444 !important;
        }
        body.dark-theme .moment-title,
        .main-container.dark-theme .moment-title {
          color: #bbbbbb !important;
        }
        body.dark-theme .markdown-content,
        .main-container.dark-theme .markdown-content {
          color: #bbbbbb !important;
        }
        body.dark-theme .main-title,
        .main-container.dark-theme .main-title {
          color: #bbbbbb !important;
        }
        .moment-card {
          border: 1px solid #eee;
          border-radius: 12px;
          margin-bottom: 32px;
          padding: 32px;
        }
        body.dark-theme .moment-card,
        .main-container.dark-theme .moment-card {
          border-color: #333 !important;
        }
        .twikoo-comment-area {
          background: #fafbfc;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
          padding: 16px;
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
      `}</style>
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
    </>
  );
};

export const getStaticProps: GetStaticProps = async () => {
  const moments = await getMoments();
  return {
    props: {
      moments,
    }
  };
};

export default MomentsPage; 