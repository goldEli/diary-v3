// 用户类型
export interface User {
  id: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

// 日记类型
export interface Diary {
  id: string;
  content: string;
  journalDate: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

// 创建日记的数据类型
export interface CreateDiaryData {
  content: string;
  journalDate: string;
}

// 更新日记的数据类型
export interface UpdateDiaryData {
  content?: string;
  journalDate?: string;
}

// 查询日记的参数类型
export interface QueryDiaryParams {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  keyword?: string;
}

// 分页响应类型
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
}

// 认证相关类型
export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  message: string;
}