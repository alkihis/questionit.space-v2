// Check if user is authentificated.
import { Context } from '@nuxt/types';

export default function ({ redirect, app }: Context) {
  // Si l'utilisateur n'est pas authentifi√©
  if (!app.$accessor.isLogged) {
    return redirect(app.localePath('/'));
  }
}
