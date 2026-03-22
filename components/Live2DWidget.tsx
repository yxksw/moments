import React, { useEffect, useRef, useState } from 'react';

interface Live2DWidgetProps {
  theme?: 'light' | 'dark';
}

const Live2DWidget: React.FC<Live2DWidgetProps> = ({ theme = 'light' }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [showWidget, setShowWidget] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const waifuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 只在客户端加载，且屏幕宽度大于等于 768px
    if (typeof window === 'undefined' || screen.width < 768) return;

    const cdnPath = 'https://cdn.jsdelivr.net/gh/dogxii/live2d-widget-v3@main/';
    
    const config = {
      path: {
        homePath: '/',
        modelPath: cdnPath + 'Resources/',
        cssPath: cdnPath + 'waifu.css',
        tipsJsonPath: cdnPath + 'waifu-tips.json',
        tipsJsPath: cdnPath + 'waifu-tips.js',
        live2dCorePath: cdnPath + 'Core/live2dcubismcore.js',
        live2dSdkPath: cdnPath + 'live2d-sdk.js',
      },
      tools: [
        'hitokoto',
        'asteroids',
        'express',
        'switch-model',
        'switch-texture',
        'photo',
        'info',
        'quit',
      ],
      drag: {
        enable: true,
        direction: ['x', 'y'] as ('x' | 'y')[],
      },
      switchType: 'order' as const,
    };

    // 异步加载资源
    const loadExternalResource = (url: string, type: 'css' | 'js'): Promise<string> => {
      return new Promise((resolve, reject) => {
        let tag: HTMLLinkElement | HTMLScriptElement | null = null;
        
        if (type === 'css') {
          tag = document.createElement('link');
          tag.rel = 'stylesheet';
          (tag as HTMLLinkElement).href = url;
        } else if (type === 'js') {
          tag = document.createElement('script');
          (tag as HTMLScriptElement).src = url;
        }
        
        if (tag) {
          tag.onload = () => resolve(url);
          tag.onerror = () => reject(url);
          document.head.appendChild(tag);
        }
      });
    };

    // 加载资源并初始化
    Promise.all([
      loadExternalResource(config.path.cssPath, 'css'),
      loadExternalResource(config.path.live2dCorePath, 'js'),
      loadExternalResource(config.path.live2dSdkPath, 'js'),
      loadExternalResource(config.path.tipsJsPath, 'js'),
    ]).then(() => {
      // 等待脚本加载完成
      const checkInit = setInterval(() => {
        if ((window as any).initWidget) {
          clearInterval(checkInit);
          (window as any).initWidget({
            waifuPath: config.path.tipsJsonPath,
            cdnPath: config.path.modelPath,
            tools: config.tools,
            dragEnable: config.drag.enable,
            dragDirection: config.drag.direction,
            switchType: config.switchType,
          });
          setIsLoaded(true);
          setShowWidget(true);
        }
      }, 100);
    }).catch((err) => {
      console.error('Live2D 资源加载失败:', err);
    });

    return () => {
      // 清理
      const waifu = document.getElementById('waifu');
      if (waifu) {
        waifu.remove();
      }
    };
  }, []);

  // 根据主题更新看板娘样式
  useEffect(() => {
    if (!isLoaded) return;
    
    const waifu = document.getElementById('waifu');
    const waifuTips = document.getElementById('waifu-tips');
    const waifuTool = document.getElementById('waifu-tool');
    
    if (waifu) {
      if (theme === 'dark') {
        waifu.style.filter = 'brightness(0.9)';
      } else {
        waifu.style.filter = 'brightness(1)';
      }
    }
    
    if (waifuTips) {
      if (theme === 'dark') {
        waifuTips.style.background = 'rgba(30, 30, 30, 0.9)';
        waifuTips.style.color = '#e0e0e0';
        waifuTips.style.border = '1px solid rgba(255, 255, 255, 0.1)';
      } else {
        waifuTips.style.background = 'rgba(255, 255, 255, 0.9)';
        waifuTips.style.color = '#333';
        waifuTips.style.border = '1px solid rgba(0, 0, 0, 0.1)';
      }
    }

    if (waifuTool) {
      const tools = waifuTool.querySelectorAll('span');
      tools.forEach((tool) => {
        if (theme === 'dark') {
          (tool as HTMLElement).style.background = 'rgba(30, 30, 30, 0.8)';
          (tool as HTMLElement).style.color = '#e0e0e0';
          (tool as HTMLElement).style.border = '1px solid rgba(255, 255, 255, 0.1)';
        } else {
          (tool as HTMLElement).style.background = 'rgba(255, 255, 255, 0.8)';
          (tool as HTMLElement).style.color = '#333';
          (tool as HTMLElement).style.border = '1px solid rgba(0, 0, 0, 0.1)';
        }
      });
    }
  }, [theme, isLoaded]);

  if (!showWidget) {
    return null;
  }

  return (
    <div ref={containerRef} className="live2d-widget-container">
      <style jsx global>{`
        /* Live2D 看板娘深色模式适配 */
        body.dark-theme #waifu {
          filter: brightness(0.9) !important;
        }
        
        body.dark-theme #waifu-tips {
          background: rgba(30, 30, 30, 0.9) !important;
          color: #e0e0e0 !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
        }
        
        body.dark-theme #waifu-tips::before {
          border-top-color: rgba(30, 30, 30, 0.9) !important;
        }
        
        body.dark-theme #waifu-tool span {
          background: rgba(30, 30, 30, 0.8) !important;
          color: #e0e0e0 !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
        }
        
        body.dark-theme #waifu-tool span:hover {
          background: rgba(50, 50, 50, 0.9) !important;
        }
        
        /* 浅色模式 */
        body.light-theme #waifu {
          filter: brightness(1) !important;
        }
        
        body.light-theme #waifu-tips {
          background: rgba(255, 255, 255, 0.9) !important;
          color: #333 !important;
          border: 1px solid rgba(0, 0, 0, 0.1) !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
        }
        
        body.light-theme #waifu-tips::before {
          border-top-color: rgba(255, 255, 255, 0.9) !important;
        }
        
        body.light-theme #waifu-tool span {
          background: rgba(255, 255, 255, 0.8) !important;
          color: #333 !important;
          border: 1px solid rgba(0, 0, 0, 0.1) !important;
        }
        
        body.light-theme #waifu-tool span:hover {
          background: rgba(255, 255, 255, 1) !important;
        }
        
        /* 移动端隐藏 */
        @media screen and (max-width: 767px) {
          #waifu {
            display: none !important;
          }
        }
        
        /* 看板娘位置调整 - 避开音乐播放器，放置在底部 */
        #waifu {
          left: auto !important;
          right: 0 !important;
          bottom: 0 !important;
          z-index: 9999 !important;
        }
        
        #waifu-tool {
          right: auto !important;
          left: 0 !important;
          bottom: 20px !important;
        }
        
        /* 看板娘提示框样式优化 */
        #waifu-tips {
          border-radius: 8px !important;
          padding: 8px 12px !important;
          font-size: 14px !important;
          line-height: 1.5 !important;
          max-width: 250px !important;
          transition: all 0.3s ease !important;
        }
        
        /* 工具栏按钮样式优化 */
        #waifu-tool span {
          border-radius: 6px !important;
          margin: 4px 0 !important;
          padding: 6px 8px !important;
          font-size: 12px !important;
          cursor: pointer !important;
          transition: all 0.3s ease !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
      `}</style>
    </div>
  );
};

export default Live2DWidget;
