// EdgeOne Pages Function - SSR 渲染
// 此文件会在边缘节点运行，每次请求都会执行

export async function onRequest(context) {
  const { request, env } = context;
  
  // 这里可以调用 Notion API 获取实时数据
  // 然后返回渲染后的 HTML
  
  // 示例：返回一个简单的响应
  return new Response('Hello from EdgeOne Pages Function!', {
    headers: { 'content-type': 'text/plain' }
  });
}
