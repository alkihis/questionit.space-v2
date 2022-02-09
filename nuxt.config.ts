import i18nConfig from './i18n/i18n.config.js';
import hooks from './utils/hooks';

export default {
  hooks,
  server: { port: 5000, host: process.env.NODE_ENV === 'production' ? '127.0.0.1' : '0.0.0.0' },
  /*
   ** Headers of the page
   */
  head: {
    title: 'QuestionIt.space',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no' },
      { name: 'theme-color', content: '#368ad2' },
      { title: 'QuestionIt.space' },
      { name: 'twitter:card', content: 'summary' },
      { name: 'twitter:site', content: '@QuestionItSpace' },
      { name: 'twitter:creator', content: '@Alkihis', hid: 'twitter:creator' },
      { property: 'og:url', content: 'https://questionit.space', hid: 'og:url' },
      { property: 'og:title', content: 'QuestionIt.space', hid: 'og:title' },
      { property: 'og:image', content: 'https://questionit.space/images/logo/LogoBlack.png', hid: 'og:image' },
    ],
    link: [
      { rel: 'alternate', hreflang: 'fr', href: 'https://questionit.space/' },
      { rel: 'alternate', hreflang: 'en', href: 'https://questionit.space/en/' },
      { rel: 'manifest', href: '/manifest.json' },
      { rel: 'apple-touch-startup-image', href: '/images/logo/LogoBlack.png' },
      { rel: 'apple-touch-icon', href: '/images/icons/apple-touch-icon.png' },
      { rel: 'icon', sizes: '192x192', href: '/images/icons/icon-192x192.png' },
      { rel: 'icon', sizes: '512x512', href: '/images/icons/icon-512x512.png' },
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
      // Doc: https://demo.creativebulma.net/components/tooltip/1.1/get-started/
      { rel: 'stylesheet', href: '/css/bulma-tooltip.min.css' },
      // Doc: https://wikiki.github.io/components/timeline/
      { rel: 'stylesheet', href: '/css/bulma-timeline.min.css' },
      // Doc: https://github.com/CreativeBulma/bulma-divider/
      { rel: 'stylesheet', href: '/css/bulma-divider.min.css' },
      // FontAwesome
      { rel: 'stylesheet', href: '/css/all.min.css' },
      // Croppy
      { rel: 'stylesheet', href: '/css/croppie.css' },
      // Bulma checkboxes
      { rel: 'stylesheet', href: '/css/bulma-checkradio.min.css' },
      // Font
      { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css?family=Nanum+Gothic' },
    ],
    script: [
      { src: '/modernizr-webp.js' },
      { src: '/sw-load.js', async: true, defer: true },
      { src: '/imports/croppie.min.js', async: true, defer: true },
    ],
  },
  /*
   ** Customize the progress-bar color
   */
  loading: { color: '#50c8ff', throttle: 750, height: '6px' },
  /*
   ** Global CSS
   */
  css: [
    '~/assets/css/global.scss',
  ],
  /*
   ** Plugins to load before mounting the App
   */
  plugins: [
    '~/plugins/global.component.ts',
    '~/plugins/axios.logger.plugin.ts',
    {
      src: '~/plugins/infinite-loader.client.ts',
      mode: 'client'
    },
    {
      src: '~/plugins/auth.ts',
      mode: 'client'
    },
    {
      src: '~/plugins/push-notifications.client.ts',
      mode: 'client'
    },
    {
      src: '~/plugins/logout-verifier.client.ts',
      mode: 'client'
    },
    {
      src: '~/plugins/cookie-accepter.client.ts',
      mode: 'client'
    },
  ],
  /*
   ** Nuxt.js dev-modules
   */
  buildModules: [
    '@nuxt/typescript-build',
    // Doc: https://nuxt-typed-vuex.danielcroe.com/
    'nuxt-typed-vuex',
  ],
  /*
   ** Nuxt.js modules
   */
  modules: [
    // Doc: https://axios.nuxtjs.org/usage
    '@nuxtjs/axios',
    // Doc: https://github.com/nuxt-community/dotenv-module
    '@nuxtjs/dotenv',
    'cookie-universal-nuxt',
    [
      'nuxt-i18n',
      i18nConfig,
    ],
    '@nuxtjs/proxy',
    '@nuxtjs/toast',
  ],
  toast: {
    position: 'bottom-left',
    duration: 5000,
  },
  /*
   ** Axios module configuration
   ** See https://axios.nuxtjs.org/options
   */
  axios: {
    // prefix: '/api/',
    // proxy: true,
    browserBaseURL: process.env.NODE_ENV === 'production' ? 'https://api.questionit.space/' : 'http://localhost:5001/',
    baseURL: 'http://api:5000/',
    retry: { retries: 3 },
  },
  /*
   ** Build configuration
   */
  build: {
    postcss: {
      preset: {
        features: {
          customProperties: false
        }
      }
    },
    /*
     ** You can extend webpack config here
     */
    extend() {},
    transpile: [
      /typed-vuex/,
    ],
    babel: {
      presets({ envName }: { envName: 'client' | 'server' }) {
        const envTargets = {
          client: { browsers: ["last 2 versions"], edge: 18 },
          server: { node: "current" },
        };
        return [
          [
            "@nuxt/babel-preset-app",
            {
              targets: envTargets[envName]
            }
          ]
        ];
      }
    }
  },
  render: {
    static: {
      maxAge: 1000 * 60 * 60 * 24 * 7
    },
  }
};
