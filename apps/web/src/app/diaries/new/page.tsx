'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { useAuth } from '@/hooks/useAuth';
import { createDiary } from '@/hooks/useDiaries';
import { CreateDiaryData } from '@/types';

export default function NewDiaryPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  
  const [content, setContent] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!content.trim()) {
      setError('请输入日记内容');
      setIsLoading(false);
      return;
    }

    try {
      const diaryData: CreateDiaryData = {
        content: content.trim(),
        journalDate: format(selectedDate, 'yyyy-MM-dd'),
      };

      await createDiary(diaryData);
      router.push('/diaries');
    } catch (error: any) {
      setError(error.response?.data?.message || '创建日记失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
    }
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
            <CardDescription>请先登录以创建日记</CardDescription>
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
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                写新日记
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                记录今天的心情和想法
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/diaries">返回列表</Link>
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>新日记</CardTitle>
              <CardDescription>
                填写下面的信息来创建一篇新的日记
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 日期选择 */}
                <div className="space-y-2">
                  <Label htmlFor="date">日期 *</Label>
                  <DatePicker
                    date={selectedDate}
                    onDateChange={handleDateChange}
                    placeholder="选择日期"
                  />
                </div>

                {/* 内容 */}
                <div className="space-y-2">
                  <Label htmlFor="content">内容 *</Label>
                  <Textarea
                    id="content"
                    name="content"
                    placeholder="写下你今天的想法、经历或感受..."
                    value={content}
                    onChange={handleContentChange}
                    rows={10}
                    required
                    className="resize-none"
                  />
                </div>

                {error && (
                  <div className="text-red-500 text-sm text-center bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
                    {error}
                  </div>
                )}

                <div className="flex gap-4">
                  <Button type="submit" className="flex-1" disabled={isLoading}>
                    {isLoading ? '保存中...' : '保存日记'}
                  </Button>
                  <Button type="button" variant="outline" asChild>
                    <Link href="/diaries">取消</Link>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}