import { accessorType } from '~/store';

// Typings for Vuex store
declare module 'vue/types/vue' {
  interface Vue {
    $accessor: typeof accessorType;
    $toast: {
      show(
        content: string | { toString(): string },
        options?: Partial<VueToastOptions>,
      ): void;

      success(
        content: string | { toString(): string },
        options?: Partial<VueToastOptions>,
      ): void;

      error(
        content: string | { toString(): string },
        options?: Partial<VueToastOptions>,
      ): void;

      info(
        content: string | { toString(): string },
        options?: Partial<VueToastOptions>,
      ): void;
    }
  }

  interface VueToastOptions {
    timeout: number,
    type: 'default' | 'error' | 'info' | 'success'
  }
}

declare module '@nuxt/types' {
  interface NuxtAppOptions {
    $accessor: typeof accessorType;
  }
}

declare global {
  interface Window {
    __sw_broadcast?: boolean;
    PullToRefresh: typeof import('pulltorefreshjs');
  }
}
