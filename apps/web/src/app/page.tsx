import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            欢迎来到 Diary V3
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            记录生活，分享心情，让每一天都有意义
          </p>
        </div>

        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📝 开始写日记
              </CardTitle>
              <CardDescription>
                记录你的日常生活，保存珍贵的回忆
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button asChild className="w-full">
                  <Link href="/auth/login">登录</Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/auth/register">注册</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📚 浏览日记
              </CardTitle>
              <CardDescription>
                查看和管理你的所有日记条目
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href="/diaries">查看日记</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-16 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            使用现代技术栈构建 - Next.js, TypeScript, Tailwind CSS
          </p>
        </div>
      </div>
    </div>
  );
}
