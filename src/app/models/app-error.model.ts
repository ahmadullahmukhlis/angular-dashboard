export interface AppErrorState {
  title: string;
  message: string;
  details?: string | null;
  code?: string | number | null;
  retryable: boolean;
}
