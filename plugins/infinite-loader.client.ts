import Vue from 'vue';
// @ts-ignore
import InfiniteLoading, { InfiniteOptions } from 'vue-infinite-loading';
// @ts-ignore
import Loader from '~/components/Loader';
// @ts-ignore
import LoaderError from '~/components/LoaderError';
import PortalVue from 'portal-vue';
import PullToRefresh from 'pulltorefreshjs';

// Doc: https://peachscript.github.io/vue-infinite-loading

Vue.use(InfiniteLoading, { 
  slots: { noMore: '', noResults: '', spinner: Loader, error: LoaderError },
} as InfiniteOptions);

Vue.use(PortalVue);

window.PullToRefresh = PullToRefresh;
