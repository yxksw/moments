// EdgeOne Pages Function - 获取所有 moments
// 路径: /api/moments

export async function onRequest(context) {
  const { request, env } = context;
  
  // 设置 CORS 头
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // 处理预检请求
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  // 只允许 GET 请求
  if (request.method !== 'GET') {
    return new Response(
      JSON.stringify({
        success: false,
        data: [],
        count: 0,
        generatedAt: new Date().toISOString(),
        error: 'Method Not Allowed',
        message: '只允许 GET 请求',
      }),
      {
        status: 405,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }

  try {
    // 从环境变量获取 Notion 配置
    const notionToken = env.NOTION_TOKEN;
    const notionDatabaseId = env.NOTION_DATABASE_ID;

    if (!notionToken || !notionDatabaseId) {
      throw new Error('Missing Notion configuration');
    }

    // 调用 Notion API
    const response = await fetch(`https://api.notion.com/v1/databases/${notionDatabaseId}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${notionToken}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sorts: [
          {
            timestamp: 'created_time',
            direction: 'descending',
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Notion API error: ${response.status}`);
    }

    const notionData = await response.json();

    // 处理数据
    const moments = notionData.results.map((page) => {
      const props = page.properties;
      
      // 获取图片
      let image = '';
      let images = [];
      if (page.cover) {
        image = page.cover.type === 'external' 
          ? page.cover.external?.url 
          : page.cover.file?.url;
      }
      
      // 从内容中提取图片
      if (page.properties['Images']) {
        const files = page.properties['Images'].files || [];
        images = files.map(f => f.type === 'external' ? f.external?.url : f.file?.url).filter(Boolean);
      }

      // 获取内容
      let content = '';
      if (page.properties['Content']) {
        content = page.properties['Content'].rich_text?.[0]?.plain_text || '';
      }

      return {
        id: page.id,
        title: props['Title']?.title?.[0]?.plain_text || '无标题',
        username: props['Username']?.rich_text?.[0]?.plain_text || '佚名',
        date: props['Date']?.date?.start || page.created_time,
        mood: props['Mood']?.select?.name || '',
        image: image,
        images: images,
        content: content,
        icon: page.icon?.type === 'emoji' ? page.icon.emoji : '',
      };
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: moments,
        count: moments.length,
        generatedAt: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=60', // 缓存 60 秒
        },
      }
    );
  } catch (error) {
    console.error('[Edge Function] Error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        data: [],
        count: 0,
        generatedAt: new Date().toISOString(),
        error: '获取 moments 失败',
        message: error.message,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
