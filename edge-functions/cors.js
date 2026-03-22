// EdgeOne 边缘函数 - CORS 跨域适配
// 将此代码复制到 EdgeOne 控制台 -> 边缘函数中

async function handleRequest(request) {
  // 获取请求的来源
  const origin = request.headers.get("origin") || "";

  // 配置允许的来源（根据你的需求修改）
  const allowedOrigins = [
    "https://your-domain.edgeone.app",
    "https://your-custom-domain.com",
    "http://localhost:3000",
    "http://localhost:8080",
  ];

  // 检查是否允许该来源
  const isAllowedOrigin = allowedOrigins.includes(origin);
  const allowOrigin = isAllowedOrigin ? origin : allowedOrigins[0];

  // 处理预检请求（OPTIONS）
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": allowOrigin,
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers":
          "Content-Type, Authorization, X-Requested-With",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  // 继续处理原始请求
  const response = await fetch(request);

  // 创建新的响应，添加 CORS 头
  const newResponse = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });

  // 添加 CORS 头
  newResponse.headers.set("Access-Control-Allow-Origin", allowOrigin);
  newResponse.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS",
  );
  newResponse.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With",
  );
  newResponse.headers.set("Access-Control-Allow-Credentials", "true");

  return newResponse;
}

addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});
