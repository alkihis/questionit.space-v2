import { Context } from '@nuxt/types';
import { ActionContext } from 'vuex';
import { getAccessorType } from 'typed-vuex';
import { v4 as uuid } from 'uuid';
import { isAxiosError, TOKEN_UNVALIDATED_500_ERROR } from '~/utils/helpers';
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
  async nuxtServerInit({ commit }: ActionContext<GlobalState, GlobalState>, { app }: Context) {
    let token: string | null = null, sessionId: string | null = null;

    if (app.$cookies) {
      if (app.$cookies.get('token') !== undefined) {
        const savedTokens: string[] = app.$cookies.get('token').split('|');
        const logged: ISentUser[] = [];
        const errors: [string, number][] = [];
        const validTokens: string[] = [];

        // Log each user correctly
        // todo fix: users are not in the same order when page is refreshed
        await Promise.all(savedTokens.map(async t => {
          try {
            const { data: res } = await app.$axios.get('token/user', { headers: { 'Authorization': 'Bearer ' + t } })
            logged.push(res.user);
            validTokens.push(t);
          } catch (e) {
            if (isAxiosError(e) && e.response && e.response.status) {
              errors.push([t, e.response.status]);
            }
            else {
              // Connect error
              errors.push([t, 500]);
            }
          }
        }));

        const loggedTokens = [...validTokens];

        if (errors.length && errors.some(e => e[1] < 500)) {
          commit('setHasBeenUnlogged', errors.filter(e => e[1] < 500).map(e => e[0]));

          if (logged.length) {
            for (const [t, c] of errors) {
              if (c >= 500) {
                // server error, add token as valid
                validTokens.push(t);
              }
            }

            // Refresh cookie token
            app.$cookies.set('token', validTokens.join('|'), { path: '/', expires: new Date("2099-01-01") });
          }
          // No user logged, every user has been unvalidated
          else {
            token = null;
            app.$cookies.remove('token', { path: '/' });
          }
        }
        else if (errors.length && errors.every(e => e[1] >= 500)) {
          commit('setHasBeenUnlogged', [TOKEN_UNVALIDATED_500_ERROR]);
        }

        if (logged.length) {
          // Add every user to store
          for (let i = 0; i < logged.length; i++) {
            const user = logged[i];
            const t = loggedTokens[i];
            commit('addLoggedUser', [user, t]);
          }

          // Set current logged user
          if (loggedTokens.includes(app.$cookies.get('current_token'))) {
            const current = app.$cookies.get('current_token');
            const currentIndex = loggedTokens.findIndex(e => e === current);

            const usr = logged[currentIndex];
            token = loggedTokens[currentIndex];

            commit('setLoggedUser', usr);
          }
          else {
            // Logged user is first token
            const usr = logged[0];
            const tok = loggedTokens[0];

            token = tok;
            commit('setLoggedUser', usr);
            app.$cookies.set('current_token', tok, { path: '/', expires: new Date("2099-01-01") });
          }
        }
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

    // Register token
    commit('setToken', token);

    // Register session id
    commit('setSessionId', sessionId);

    // Register credential helper
    if (token) {
      app.$axios.setToken(token, 'Bearer');
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
