'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useDiaries } from '@/hooks/useDiaries';
import { useAuth } from '@/hooks/useAuth';
import { QueryDiaryParams } from '@/types';
import { deleteDiary } from '@/hooks/useDiaries';

export default function DiariesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [queryParams, setQueryParams] = useState<QueryDiaryParams>({
    page: 1,
    limit: 10,
  });
  const [keyword, setKeyword] = useState('');

  const { diaries, total, page, totalPages, isLoading, mutate } = useDiaries(queryParams);

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这篇日记吗？')) {
      return;
    }
    
    try {
      await deleteDiary(id);
      // 重新获取数据
      mutate();
    } catch (error) {
      alert('删除失败，请重试');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setQueryParams({
      ...queryParams,
      keyword: keyword || undefined,
      page: 1,
    });
  };

  const handlePageChange = (newPage: number) => {
    setQueryParams({
      ...queryParams,
      page: newPage,
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>加载中...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>需要登录</CardTitle>
            <CardDescription>请先登录以查看您的日记</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild>
              <Link href="/auth/login">去登录</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              我的日记
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              欢迎回来，{user.email}
            </p>
          </div>
          <Button asChild>
            <Link href="/diaries/new">写新日记</Link>
          </Button>
        </div>

        {/* 搜索栏 */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="flex gap-4">
              <Input
                placeholder="搜索日记..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="flex-1"
              />
              <Button type="submit">搜索</Button>
            </form>
          </CardContent>
        </Card>

        {/* 日记列表 */}
        {isLoading ? (
          <div className="text-center py-8">加载中...</div>
        ) : diaries.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-gray-500 mb-4">还没有日记条目</p>
              <Button asChild>
                <Link href="/diaries/new">写第一篇日记</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {diaries.map((diary) => (
              <Card key={diary.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{diary.title}</CardTitle>
                      <CardDescription>
                        {new Date(diary.journalDate).toLocaleDateString('zh-CN')}
                        {diary.mood && ` • ${diary.mood}`}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/diaries/${diary.id}/edit`}>编辑</Link>
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleDelete(diary.id)}
                      >
                        删除
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300 line-clamp-3">
                    {diary.content}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            <Button
              variant="outline"
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1}
            >
              上一页
            </Button>
            <span className="flex items-center px-4">
              第 {page} 页，共 {totalPages} 页
            </span>
            <Button
              variant="outline"
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages}
            >
              下一页
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}