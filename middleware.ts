import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 配置允许的来源（根据你的需求修改）
const allowedOrigins = [
  'https://your-domain.edgeone.app',  // EdgeOne 域名
  'https://your-custom-domain.com',    // 自定义域名
  'http://localhost:3000',             // 本地开发
  'http://localhost:8080',
]

// 或者允许所有来源（生产环境不建议）
const allowAllOrigins = process.env.NODE_ENV === 'development'

export function middleware(request: NextRequest) {
  // 获取请求的来源
  const origin = request.headers.get('origin') || ''
  
  // 检查是否允许该来源
  const isAllowedOrigin = allowAllOrigins || allowedOrigins.includes(origin)
  
  // 处理预检请求（OPTIONS）
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 204 })
    
    // 添加 CORS 头
    if (isAllowedOrigin) {
      response.headers.set('Access-Control-Allow-Origin', origin || '*')
    }
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    response.headers.set('Access-Control-Max-Age', '86400')
    
    return response
  }
  
  // 处理普通请求
  const response = NextResponse.next()
  
  // 添加 CORS 头
  if (isAllowedOrigin) {
    response.headers.set('Access-Control-Allow-Origin', origin || '*')
  }
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  
  return response
}

// 配置匹配路径
export const config = {
  matcher: [
    // 匹配 API 路由
    '/api/:path*',
    // 匹配 JSON 数据文件
    '/recent-moments.json',
    // 如果需要匹配所有路径，使用：
    // '/:path*',
  ],
}
