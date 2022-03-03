import { Context, NuxtAppOptions } from '@nuxt/types';
import { ActionContext } from 'vuex';
import { getAccessorType } from 'typed-vuex';
import { v4 as uuid } from 'uuid';
import { isAxiosError, isTokenExpiresSoon, TOKEN_UNVALIDATED_500_ERROR } from '~/utils/helpers';
import { ISentUser } from "~/utils/types/sent.entities.types";
import { EAllowedThemes } from "~/utils/types/theme.types";
import '~/utils/types/globals.types';
import * as profile from './profile';

interface GlobalState {
  /** Active token */
  token: string | null;
  availableTokens: string[];
  loggedUser: ISentUser | null;
  /** Must be in the same order as available tokens ! */
  availableUsers: ISentUser[];
  requestToken: string | null;
  sessionId: string | null;
  waitingAnswerCount: number;
  waitingNotificationsCount: number;
  userWhoseHasBeenUnlogged: string[];
  theme: string;
}

export const state: () => GlobalState = () => ({
  token: null,
  sessionId: null,
  loggedUser: null,
  requestToken: null,
  waitingAnswerCount: 0,
  waitingNotificationsCount: 0,
  userWhoseHasBeenUnlogged: [],
  availableTokens: [],
  availableUsers: [],
  theme: 'auto',
});

export const mutations = {
  setToken(state: GlobalState, token: string | null) {
    state.token = token;
  },
  setSessionId(state: GlobalState, sessionId: string | null) {
    state.sessionId = sessionId;
  },
  setLoggedUser(state: GlobalState, user: ISentUser | null) {
    state.loggedUser = user;
  },
  addLoggedUser(state: GlobalState, data: [ISentUser, string]) {
    const existant = state.availableUsers.findIndex(e => e.id === data[0].id);
    if (existant !== -1) {
      // user already exists
      // Refresh user and token then exists
      state.availableUsers[existant] = data[0];
      state.availableTokens[existant] = data[1];
      return;
    }

    state.availableUsers = [...state.availableUsers, data[0]];
    state.availableTokens = [...state.availableTokens, data[1]];
  },
  removeUser(state: GlobalState, user: ISentUser) {
    const index = state.availableUsers.findIndex(e => e.id === user.id);

    if (index !== -1) {
      state.availableUsers.splice(index, 1);
      state.availableTokens.splice(index, 1);
    }
  },
  unlog(state: GlobalState) {
    // Unlog & remove current user and token from store
    if (state.loggedUser) {
      const index = state.availableUsers.findIndex(e => e.id === state.loggedUser!.id);
      if (index !== -1) {
        state.availableUsers.splice(index, 1);
        state.availableTokens.splice(index, 1);
      }
    }

    state.loggedUser = null;
    state.token = null;
  },
  removeAllUsers(state: GlobalState) {
    state.loggedUser = null;
    state.token = null;
    state.availableTokens = [];
    state.availableUsers = [];
  },
  switchUser(state: GlobalState, target: ISentUser) {
    // Change current user to target
    // All users must be intialized with addLoggedUser !
    const index = state.availableUsers.findIndex(e => e.id === target.id);

    if (index !== -1) {
      const user = state.availableUsers[index];
      const token = state.availableTokens[index];

      state.loggedUser = user;
      state.token = token;
    }
  },
  setRequestToken(state: GlobalState, token: string | null) {
    state.requestToken = token;
  },
  setAnswerWait(state: GlobalState, number: number) {
    state.waitingAnswerCount = number;
  },
  decrementAnswerWait(state: GlobalState) {
    state.waitingAnswerCount--;
  },
  incrementAnswerWait(state: GlobalState) {
    state.waitingAnswerCount++;
  },
  setNotificationWait(state: GlobalState, number: number) {
    state.waitingNotificationsCount = number;
  },
  decrementNotificationWait(state: GlobalState) {
    state.waitingNotificationsCount--;
  },
  incrementNotificationWait(state: GlobalState) {
    state.waitingNotificationsCount++;
  },
  setHasBeenUnlogged(state: GlobalState, users: string[]) {
    state.userWhoseHasBeenUnlogged = users;
  },
  validateHasBeenUnlogged(state: GlobalState) {
    state.userWhoseHasBeenUnlogged = [];
  },
  setTheme(state: GlobalState, theme: string) {
    state.theme = theme;
  },
};

export const getters = {
  currentToken(state: GlobalState) {
    return state.token!;
  },
  isLogged(state: GlobalState) {
    return state.token && state.loggedUser;
  },
  tokenString(state: GlobalState) {
    return state.availableTokens.join('|');
  },
  userTokenCouples(state: GlobalState) {
    let result: [ISentUser, string][] = [];

    for (let i = 0; i < state.availableUsers.length; i++) {
      result.push([state.availableUsers[i], state.availableTokens[i]]);
    }

    return result;
  },
};

export const actions = {
  async makeLoginFromCookieToken({ commit }: ActionContext<GlobalState, GlobalState>, { app, tokens }: { app: NuxtAppOptions, tokens: string }) {
    const savedTokens: string[] = tokens.split('|');
    const loginInformation: { user: ISentUser, expiresAt: string, token: string, newToken: string | undefined }[] = [];
    const loginErrors: { code: number, token: string }[] = [];

    const getRefreshedToken = async (token: string) => {
      try {
        const res = await app.$axios.$post('token/refresh', { headers: { 'Authorization': `Bearer ${token}` } });
        return res.token;
      } catch (e) {
        return undefined;
      }
    };

    const doLogin = async (token: string) => {
      try {
        const res = await app.$axios.$get('token/user', { headers: { 'Authorization': `Bearer ${token}` } });
        let newToken: string | undefined;

        if (isTokenExpiresSoon(res.expiresAt)) {
          newToken = await getRefreshedToken(token);
        }

        loginInformation.push({
          user: res.user,
          expiresAt: res.expiresAt,
          token,
          newToken,
        });
      } catch (e) {
        if (isAxiosError(e) && e.response && e.response.status) {
          loginErrors.push({ token, code: e.response.status });
        }
        else {
          // Connect error
          loginErrors.push({ token, code: 500 });
        }
      }
    };

    // Log each user correctly
    await Promise.all(savedTokens.map(doLogin));

    const tokensToKeep = [
      ...loginInformation.map(i => i.newToken || i.token),
      ...loginErrors.filter(e => e.code === 500).map(e => e.token),
    ];

    if (tokensToKeep.length) {
      app.$cookies.set('token', tokensToKeep.join('|'), { path: '/', expires: new Date('2099-01-01') });
    } else {
      app.$cookies.remove('token', { path: '/' });
    }

    if (loginErrors.some(e => e.code !== 500)) {
      const unloggedTokens = loginErrors.filter(e => e.code !== 500).map(e => e.token);
      commit('setHasBeenUnlogged', unloggedTokens);
    } else if (loginErrors.length) {
      // All errros are 500
      commit('setHasBeenUnlogged', [TOKEN_UNVALIDATED_500_ERROR]);
    }

    // Set logged users according to login order (token order)
    const loggedUsers = savedTokens
      .map(token => loginInformation.find(i => i.token === token)!)
      .filter(e => e);

    if (!loggedUsers.length) {
      return;
    }

    // Add every user to store
    for (const user of loggedUsers) {
      commit('addLoggedUser', [user.user, user.newToken || user.token]);
    }

    // Lookup for currently logged user, and set it
    const currentToken = app.$cookies.get('current_token');
    const currentLoggedUser = loggedUsers.find(u => u.token === currentToken);

    if (currentLoggedUser) {
      if (currentLoggedUser.newToken) {
        app.$cookies.set('current_token', currentLoggedUser.newToken, { path: '/', expires: new Date('2099-01-01') });
      }

      commit('setLoggedUser', currentLoggedUser.user);
      commit('setToken', currentLoggedUser.newToken || currentLoggedUser.token);
    } else { // Fallback to any user
      const user = loggedUsers[0];

      commit('setLoggedUser', user.user);
      commit('setToken', user.newToken || user.token);
      app.$cookies.set('current_token', user.newToken || user.token, { path: '/', expires: new Date('2099-01-01') });
    }
  },

  async nuxtServerInit({ commit, dispatch, getters }: ActionContext<GlobalState, GlobalState>, { app }: Context) {
    let sessionId: string | null = null;

    if (app.$cookies) {
      if (app.$cookies.get('token') !== undefined) {
        const cookieToken = app.$cookies.get('token');
        await dispatch('makeLoginFromCookieToken', { app, tokens: cookieToken });
      }

      if (app.$cookies.get('session_id') !== undefined) {
        sessionId = app.$cookies.get('session_id');
      }
      else {
        sessionId = uuid();
        app.$cookies.set('session_id', sessionId, { path: '/' });
      }

      if (app.$cookies.get('theme') !== undefined) {
        const theme = app.$cookies.get('theme') as string;

        // Theme light is default theme
        if (theme in EAllowedThemes) {
          // Register the theme
          commit('setTheme', theme.toLowerCase());
        }
        else {
          commit('setTheme', 'auto');
        }
      }
    }

    // Register session id
    commit('setSessionId', sessionId);

    // Register credential helper
    if (getters.currentToken) {
      app.$axios.setToken(getters.currentToken, 'Bearer');
    }
    else {
      app.$axios.setToken(sessionId || uuid(), 'Session');
    }
  },
}

export const accessorType = getAccessorType({
  state,
  getters,
  mutations,
  actions,
  modules: {
    // The key (submodule) needs to match the Nuxt namespace (e.g. ~/store/submodule.ts)
    profile,
  },
});
