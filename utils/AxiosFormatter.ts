import type { AxiosError, AxiosRequestConfig } from 'axios';

export type TAxiosRequestOptions = AxiosRequestConfig & { params: any };

export default class AxiosFormatter {
  protected static formatRequestString(config: AxiosRequestConfig) {
    return `${config.method} ${config.url}`;
  }

  protected static formatRequestJson(config: AxiosRequestConfig, includeHeaders: boolean) {
    const serializedConfig: any = {
      method: config.method,
      url: config.url,
      params: config.params,
      data: config.data,
    };

    if (includeHeaders) {
      serializedConfig.headers = config.headers;
    }

    return serializedConfig;
  }

  static toErrorString(e: AxiosError) {
    if (e.response) {
      return `${this.formatRequestString(e.config)} / ${e.response.status} ${e.response.data}`;
    }
    if (e.request) {
      // No response
      return `No response for: ${this.formatRequestString(e.config)}`;
    }
    // Error instance, probably from config
    return `Bad configuration data for: ${this.formatRequestString(e.config)}`;
  }

  static toErrorJSON(e: AxiosError, includeHeaders = false) {
    if (e.response) {
      return {
        request: this.formatRequestJson(e.config, includeHeaders),
        data: e.response.data,
        status: e.response.status,
        headers: includeHeaders ? e.response.headers : undefined,
      };
    }
    if (e.request) {
      // No response
      return {
        request: this.formatRequestJson(e.config, includeHeaders),
      };
    }
    // Error instance, probably from config
    return {
      message: e.message,
      request: this.formatRequestJson(e.config, includeHeaders),
    };
  }

  protected static arrayToQueryString(propVal: any[], prefix: string): string[] {
    const itemPrefix = prefix + '[]';
    const parts: string[] = [];

    for (const toEncode of propVal) {
      if (typeof toEncode === 'undefined') {
        continue;
      }

      if (Array.isArray(toEncode)) {
        parts.push(...this.arrayToQueryString(toEncode, itemPrefix));
      } else if (typeof toEncode === 'object') {
        parts.push(...this.toPropQueryString(toEncode, itemPrefix));
      } else {
        parts.push(`${itemPrefix}=${encodeURIComponent(toEncode)}`);
      }
    }

    return parts;
  }

  protected static toPropQueryString(propVal: any, prefix?: string): string[] {
    const parts = [];

    for (const item of Object.keys(propVal)) {
      let itemPrefix = item;
      if (prefix) {
        itemPrefix = `${prefix}[${item}]`;
      }

      if (Array.isArray(propVal[item])) {
        parts.push(...this.arrayToQueryString(propVal[item], itemPrefix));
      } else if (typeof propVal[item] === 'object') {
        parts.push(...this.toPropQueryString(propVal[item], itemPrefix));
      } else if (typeof propVal[item] !== 'undefined') {
        const encoded = encodeURIComponent(propVal[item]);
        parts.push(`${itemPrefix}=${encoded}`);
      }
    }

    return parts;
  }

  static toQueryString(parameters: any) {
    const parts = this.toPropQueryString(parameters);
    return parts.length ? '?' + parts.join('&') : '';
  }

  static getRequestOptions(options: TAxiosRequestOptions) {
    if (options.params) {
      const qs = this.toQueryString(options.params);
      options.params = undefined;
      options.url += qs;
    }
    return options;
  }
}
