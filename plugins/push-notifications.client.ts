import { Context } from '@nuxt/types';

export default ({ app }: Context) => {
  if (window.__sw_broadcast) {
    return;
  }

  // Ensure that event listener will not be applied twice
  window.__sw_broadcast = true;

  if (navigator.serviceWorker)
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event && event.data && event.data.type === 'question-worker') {
        app.$accessor.incrementNotificationWait();
        app.$accessor.incrementAnswerWait();
      }
      if (event && event.data && event.data.type === 'follow-worker') {
        app.$accessor.incrementNotificationWait();
      }
    });
};
