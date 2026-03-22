import { GetStaticProps } from 'next';
import { getMoments } from '../lib/notion';

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

// 这个页面会生成静态JSON文件
export default function RecentMomentsJSON({ data }: { data: RecentMomentsData }) {
  // 返回纯JSON字符串，不包含任何HTML
  return JSON.stringify(data, null, 2);
}

// 自定义 Logo 图片地址（放在 public 目录下或外部 URL）
const CUSTOM_LOGO = 'https://cn.cravatar.com/avatar/56cd72b5460ecaa08ddffea9562f5629?size=512'; // 或者使用外部 URL: 'https://your-cdn.com/logo.png'

export const getStaticProps: GetStaticProps<{ data: RecentMomentsData }> = async () => {
  try {
    // 获取所有瞬间
    const allMoments = await getMoments();

    // 默认取最近10条，并只返回需要的字段
    const recentMoments = allMoments
      .slice(0, 10)
      .map(moment => ({
        logo: CUSTOM_LOGO,
        title: moment.title,
        date: moment.date,
        mood: moment.mood,
        content: moment.content
      }));

    const data: RecentMomentsData = {
      success: true,
      data: recentMoments,
      count: recentMoments.length,
      generatedAt: new Date().toISOString()
    };

    return {
      props: {
        data
      }
    };
  } catch (error) {
    console.error('[recent-moments] 静态生成错误:', error);
    
    const data: RecentMomentsData = {
      success: false,
      data: [],
      count: 0,
      generatedAt: new Date().toISOString(),
      error: '获取最近瞬间失败',
      message: error instanceof Error ? error.message : '未知错误'
    };

    return {
      props: {
        data
      }
    };
  }
}; 