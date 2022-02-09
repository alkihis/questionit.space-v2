import type { Context } from '@nuxt/types';

declare module 'axios' {
  interface AxiosRequestConfig {
    [startedAt]?: number;
  }
}

const startedAt = Symbol('request.startedAt');

export default function ({ $axios }: Context) {
  if (('__logger_plugin__' in $axios) || process.env.NODE_ENV !== 'development') {
    return;
  }

  // @ts-ignore
  $axios.__logger_plugin__ = true;
  $axios.onRequest(config => {
    config[startedAt] = Date.now();
  });
  $axios.onResponse(response => {
    const startDate = response.config[startedAt];
    const now = Date.now();

    if (startDate) {
      const config = response.config;
      let url = config.url?.split('?', 2)[0] ?? '';
      let header = '(Fetch)';

      const log = `${header} ${config.method?.toUpperCase()} ${url}: Taken ${now - startDate}ms`;
      if (process.server) {
        console.log(log);
      } else {
        console.debug(log);
      }
    }
  });
  $axios.onResponseError(error => {
    const startDate = error.config[startedAt];
    const now = Date.now();

    if (startDate) {
      const config = error.config;
      let url = config.url?.split('?', 2)[0] ?? '';
      let header = '(ERROR Fetch)';

      const log = `${header} ${config.method?.toUpperCase()} ${url}: ${error.response?.status} ${error.response?.statusText} (Taken ${now - startDate}ms)`;
      if (process.server) {
        console.log(log);
      } else {
        console.debug(log);
      }
    }
  });
}
