import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 启用 standalone 输出用于 Docker 部署
  output: 'standalone',
  
  // 图片优化配置
  images: {
    // 如果使用外部图片服务，可以在这里配置域名
    domains: [],
  },
};

export default nextConfig;
