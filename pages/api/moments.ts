import type { NextApiRequest, NextApiResponse } from 'next';
import { getMoments } from '../../lib/notion';

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

interface MomentsData {
  success: boolean;
  data: Moment[];
  count: number;
  generatedAt: string;
  error?: string;
  message?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<MomentsData>
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
    // 获取所有 moments
    const moments = await getMoments();

    res.status(200).json({
      success: true,
      data: moments,
      count: moments.length,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('[api/moments] 错误:', error);

    res.status(500).json({
      success: false,
      data: [],
      count: 0,
      generatedAt: new Date().toISOString(),
      error: '获取 moments 失败',
      message: error instanceof Error ? error.message : '未知错误'
    });
  }
}
