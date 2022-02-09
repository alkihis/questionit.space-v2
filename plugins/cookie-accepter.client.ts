import { Context } from '@nuxt/types';

export default ({ app, redirect }: Context) => {
  // If so, inject a popup onto document
  const t = app.i18n.t.bind(app.i18n);

  if (localStorage.getItem('accepted_local_policy')) {
    return;
  }

  const popup_root = document.createElement('div');
  popup_root.classList.add('logout-popup-wrapper');
  popup_root.innerHTML = `
    <div class="logout-popup nanum">
      <article class="message logout-content">
        <div class="message-header">
          <p>
            ${t('about_cookies')}
          </p>
        </div>

        <div class="message-body">
          <div>
            ${t('cookies_dialog_text')}
            <a href="#!" class="to-privacy-policy">${t('privacy_policy').toString().toLowerCase()}</a>.
          </div>
          
          <div class="message-end-actions" style="margin-top: 1rem">
            <button class="button is-dark is-outlined">${t('accept')}</button>
          </div>
        </div>        
      </article>
    </div>
  `;

  popup_root.querySelector('.to-privacy-policy')!
    .addEventListener('click', e => {
      e.preventDefault();

      localStorage.setItem('accepted_local_policy', 'true');
      popup_root.remove();

      redirect(app.localePath('/privacy'));
    });

  popup_root.querySelector('.button.is-dark.is-outlined')!
    .addEventListener('click', () => {
      localStorage.setItem('accepted_local_policy', 'true');

      popup_root.remove();
    });

  document.body.insertAdjacentElement('afterbegin', popup_root);
};
