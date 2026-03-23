import type { NextApiRequest, NextApiResponse } from 'next';
import { getMoments } from '../../lib/notion';

interface RecentMoment {
  logo: string;
  title: string;
  date: string;
  mood: string;
  content: string;
}

interface RecentMomentsData {
  success: boolean;
  data: RecentMoment[];
  count: number;
  generatedAt: string;
  error?: string;
  message?: string;
}

// 自定义 Logo 图片地址
const CUSTOM_LOGO = 'https://cn.cravatar.com/avatar/56cd72b5460ecaa08ddffea9562f5629?size=512';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RecentMomentsData>
) {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 只允许 GET 请求
  if (req.method !== 'GET') {
    res.status(405).json({
      success: false,
      data: [],
      count: 0,
      generatedAt: new Date().toISOString(),
      error: 'Method Not Allowed',
      message: '只允许 GET 请求'
    });
    return;
  }

  try {
    // 获取所有瞬间
    const allMoments = await getMoments();

    // 默认取最近10条
    const recentMoments = allMoments
      .slice(0, 10)
      .map(moment => ({
        logo: CUSTOM_LOGO,
        title: moment.title,
        date: moment.date,
        mood: moment.mood,
        content: moment.content
      }));

    res.status(200).json({
      success: true,
      data: recentMoments,
      count: recentMoments.length,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('[api/recent-moments] 错误:', error);

    res.status(500).json({
      success: false,
      data: [],
      count: 0,
      generatedAt: new Date().toISOString(),
      error: '获取最近瞬间失败',
      message: error instanceof Error ? error.message : '未知错误'
    });
  }
}
