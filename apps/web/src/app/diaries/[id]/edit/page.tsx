'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { useDiary, updateDiary } from '@/hooks/useDiaries';
import { UpdateDiaryData } from '@/types';

export default function EditDiaryPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const diaryId = params.id as string;
  
  const { diary, isLoading: diaryLoading } = useDiary(diaryId);
  
  const [content, setContent] = useState('');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // 当日记数据加载完成后，填充表单
  useEffect(() => {
    if (diary) {
      setContent(diary.content);
      setSelectedDate(diary.journalDate);
    }
  }, [diary]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
  };

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
      const diaryData: UpdateDiaryData = {
        content: content.trim(),
        journalDate: selectedDate,
      };

      await updateDiary(diaryId, diaryData);
      router.push('/diaries');
    } catch (error: any) {
      setError(error.response?.data?.message || '更新日记失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || diaryLoading) {
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
            <CardDescription>请先登录以编辑日记</CardDescription>
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

  if (!diary) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>日记不存在</CardTitle>
            <CardDescription>找不到指定的日记</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild>
              <Link href="/diaries">返回日记列表</Link>
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
          <Card>
            <CardHeader>
              <CardTitle>编辑日记</CardTitle>
              <CardDescription>
                修改您的日记内容
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 日期选择 */}
                <div className="space-y-2">
                  <Label htmlFor="date">日期 *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={selectedDate}
                    onChange={handleDateChange}
                    required
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
                    {isLoading ? '保存中...' : '保存修改'}
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