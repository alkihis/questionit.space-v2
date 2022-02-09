import { Context } from '@nuxt/types';
import { TOKEN_UNVALIDATED_500_ERROR } from '~/utils/helpers';
import Vue from 'vue';

export default ({ app }: Context) => {
  const has_been_unlogged: string[] = app.$accessor.userWhoseHasBeenUnlogged;

  if (!has_been_unlogged || !has_been_unlogged.length) {
    return;
  }

  // If so, inject a popup onto document
  const t = app.i18n.t.bind(app.i18n);
  const is_500 = has_been_unlogged[0] === TOKEN_UNVALIDATED_500_ERROR;

  let header: string = "";
  let content: string = "";

  if (app.$accessor.isLogged) {
    // Tjs connecté, donc seulement une partie des comptes a été déconnecté
    header = t('some_accounts_logged_out').toString();
    content = t('you_have_been_unlogged_from_some_accounts', { count: has_been_unlogged.length }).toString();
  }
  else if (has_been_unlogged.length > 1) {
    // Ts déconnectés, et déconnexion de plus d'un compte
    header = t('all_logged_out').toString();
    content = t('you_have_been_unlogged_from_all_accounts').toString();
  }
  else if (is_500) {
    // Ts déconnectés à cause d'une erreur 500 (cookie non effacé)
    header = t('server_error_logged_out').toString();
    content = t('server_error_please_reload').toString();
  }
  else {
    // Déconnecté, seul compte déconnecté
    header = t('logged_out').toString();
    content = t('you_have_been_unlogged').toString();
  }

  const popup_root = document.createElement('div');
  popup_root.classList.add('logout-popup-wrapper');
  popup_root.innerHTML = `
    <div class="logout-popup nanum">
      <article class="message is-danger logout-content">
        <div class="message-header">
          <p>
            ${header}
          </p>
          <button class="delete" aria-label="delete"></button>
        </div>

        <div class="message-body">
          ${content}
        </div>
      </article>
    </div>
  `;

  popup_root.querySelector('.delete')!
    .addEventListener('click', () => {
      popup_root.remove();
    });

  document.body.insertAdjacentElement('afterbegin', popup_root);
};
