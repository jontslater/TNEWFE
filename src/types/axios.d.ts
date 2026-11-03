import 'axios';

declare module 'axios' {
  export interface AxiosRequestConfig {
    /** When true, 401/403 do not clear auth or redirect to home */
    skipAuthRedirect?: boolean;
  }
}
