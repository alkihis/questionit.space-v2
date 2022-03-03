import en from './en.lang.js';
import fr from './fr.lang.js';

export default {
  locales: ['en', 'fr'],
  defaultLocale: 'fr',
  vueI18n: {
    fallbackLocale: 'en',
    messages: {
      en,
      fr,
    },
  },
  detectBrowserLanguage: {
    // If enabled, a cookie is set once a user has been redirected to his
    // preferred language to prevent subsequent redirections
    // Set to false to redirect every time
    useCookie: true,
    // Set to override the default domain of the cookie. Defaults to host of the site.
    cookieDomain: null,
    // Cookie name
    cookieKey: 'lang',
    // Set to always redirect to value stored in the cookie, not just once
    alwaysRedirect: true,
    // If no locale for the browsers locale is a match, use this one as a fallback
    fallbackLocale: 'en',
  },
};
