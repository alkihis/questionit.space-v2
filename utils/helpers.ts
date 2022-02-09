import { AxiosError } from 'axios';
// @ts-ignore
import RawEmojiLib from 'emojilib';
import { ISentQuestion } from "~/utils/types/sent.entities.types";
import { Vue } from "nuxt-property-decorator";
import { EApiError, IApiError } from "~/utils/types/error.types";

interface IEmojiLib {
  ordered: string[];
  lib: {
    [emojiName: string]: {
      category: string;
      char: string;
      fitzpatrick_scale: boolean;
      keywords: string[];
    };
  };
}

export const EmojiLib: IEmojiLib = RawEmojiLib;
export const AVAILABLE_EMOJIS = Object.keys(EmojiLib.lib);
export const head: any = "head";
export const QUESTION_IT_VERSION = '2.0.0';
export const QUESTION_IT_FULL_URL = 'https://questionit.space';
export const QUESTION_IT_REAL_URL = process.env.NODE_ENV === 'production' ? QUESTION_IT_FULL_URL : 'http://localhost:5002';
export const FULL_BLACK_LOGO = QUESTION_IT_FULL_URL + '/images/logo/LogoBlack.png';
export const FULL_WHITE_LOGO = QUESTION_IT_FULL_URL + '/images/logo/LogoWhite.png';
// Max number for random avatars.
// Images should start to 1.png to {max}.png, max inclusive.
export const NUMBER_OF_RANDOM_AVATARS = 9;
export const NUMBER_OF_RANDOM_QOTD_AVATARS = 5;
const REGEX_URL = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?)/g;
const REGEX_AROBASE = /(^|\s)(@([a-zA-Z0-9_]{2,20}))\b/g;
export const MUTED_WORD_REGEX = /^[\p{L}\p{N}_\. -]{2,32}$/iu;
export const TOKEN_UNVALIDATED_500_ERROR = '__500_Error__';

export interface TextPart {
  type: 'link' | 'at' | 'text',
  content: string,
  display_text?: string,
};

export function isTouchDevice() {
  return 'ontouchstart' in window;
}

export function getLoaderText(vue: Vue) {
  return {
    instructionsPullToRefresh: vue.$t('pull_to_refresh').toString(), // The text is displayed when you pull down
    instructionsReleaseToRefresh: vue.$t('release_to_refresh').toString(), // The text that appears when the trigger distance is pulled down
    instructionsRefreshing: vue.$t('loading').toString(), // The text in the load
  };
}

export function switchTheme(target: string) {
  const theme = target.toLowerCase();

  // Make a transition with CSS
  const style = document.createElement('style');
  style.innerHTML = `
    * {
      transition: background-color .25s;
    }
  `;

  document.documentElement.appendChild(style);

  return new Promise<void>(resolve => {
    requestAnimationFrame(() => {
      if (theme) {
        document.documentElement.dataset.theme = theme;
      }
      else {
        document.documentElement.removeAttribute('data-theme');
      }

      requestAnimationFrame(async () => {
        await sleep(350);

        style.remove();
        resolve();
      });
    });
  });
}

export function makeTitle(title?: string) {
  return (title ? (title + ' - ') : '') + 'QuestionIt.space';
}

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function convertAxiosError(e: AxiosError) {
  return {
    isAxiosError: true,
    response: { data: { ...e.response!.data }, status: e.response!.status }
  };
}

export function isAxiosError(e: any) : e is AxiosError {
  return typeof e === 'object' && e.isAxiosError;
}

export async function getPushSubscription() {
  try {
    const reg = await navigator.serviceWorker.getRegistration();

    if (reg) {
      const sub = await reg.pushManager.getSubscription();
      return sub ?? undefined;
    }
  } catch (e) {}
}

export async function cancelPushSubscription(reg?: PushSubscription) {
  if (!reg) {
    reg = await getPushSubscription();

    if (!reg) {
      return;
    }
  }
  return reg.unsubscribe();
}

export function searchEmoji(input: string) {
  input = input.trim();
  if (input.length < 2) {
    return [];
  }

  const matches_includes = AVAILABLE_EMOJIS.filter(e => e.includes(input));
  const matches_starts = matches_includes.filter(e => e.startsWith(input));
  const matches_full = matches_starts.filter(e => e === input);
  const all = new Set([...matches_full , ...matches_starts, ...matches_includes]);

  const matches = [...all].map(e => [e, EmojiLib.lib[e].char]);

  return matches as [string, string][];
}

/**
 * Returns a random number between min (inclusive) and max (exclusive)
 */
export function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min) + min);
}

export function randomAnonymousImage(question_id: number | string) {
  return '/avatars/' + ((Number(question_id) % NUMBER_OF_RANDOM_AVATARS) + 1) + '.png';
}

export function randomQuestionOfTheDayImage(question_id: number | string) {
  return '/avatars/qotd-' + ((Number(question_id) % NUMBER_OF_RANDOM_QOTD_AVATARS) + 1) + '.png';
}

export function handleError(e: any, vueComponent: any) {
  console.error(e);

  if (isAxiosError(e)) {
    if (e.response?.data?.statusCode) {
      const data = e.response.data as IApiError;

      vueComponent.$toast.error(
        translateApiError(vueComponent, data)
      );
      return;
    }
    else {
      console.log(e.response);
    }
  }
  else if (e instanceof Error) {
    vueComponent.$toast.show(
      e.message,
      { type: 'error' }
    );
  }
  else {
    vueComponent.$toast.show(
      vueComponent.$t('unknown_error'),
      { type: 'error' }
    );
  }
}

export function questionText(original: string) {
  // Escape the possible tags to avoid html injection
  const escaped = original;
  const aro_reg = new RegExp(REGEX_AROBASE, 'g');

  const matches: TextPart[] = [];

  let match: RegExpExecArray | null;
  let last_begin_index = 0;
  // Get the @
  while (match = aro_reg.exec(escaped)) {
    // Match: get the match between reg.lastIndex and reg.lastIndex - match[0].length
    const next = aro_reg.lastIndex;
    const length_of_match = match[0].length;

    const match_begin = next - length_of_match;
    const before_match = escaped.slice(last_begin_index, match_begin + match[1].length);

    last_begin_index = next;

    if (before_match.length) {
      matches.push({ type: 'text', content: before_match });
    }
    matches.push({ type: 'at', content: match[3], display_text: match[2] });
  }

  // Push the possible rest
  if (last_begin_index < escaped.length) {
    matches.push({
      type: 'text',
      content: escaped.slice(last_begin_index, escaped.length)
    });
  }

  // Get the links
  const all_matches: typeof matches = [];
  for (const text of matches) {
    if (text.type !== 'text') {
      all_matches.push(text);
      continue;
    }

    last_begin_index = 0;
    const reg = new RegExp(REGEX_URL, 'g');

    while (match = reg.exec(text.content)) {
      // Match: get the match between reg.lastIndex and reg.lastIndex - match[0].length
      const next = reg.lastIndex;

      try {
        var url = new URL(match[0].match(/^https?:\/\//) ? match[0] : ('https://' + match[0]));
      } catch (e) {
        // Invalid url
        all_matches.push({ type: 'text', content: text.content.slice(last_begin_index, next) });
        last_begin_index = next;
        continue;
      }

      const display_url = url.host + (url.pathname !== '/' ? url.pathname : '');

      const length_of_match = match[0].length;

      const match_begin = next - length_of_match;
      const before_match = text.content.slice(last_begin_index, match_begin);

      last_begin_index = next;

      if (before_match.length) {
        all_matches.push({ type: 'text', content: before_match });
      }
      all_matches.push({ type: 'link', content: url.href, display_text: display_url });
    }

    // Push the possible rest
    if (last_begin_index < text.content.length) {
      all_matches.push({
        type: 'text',
        content: text.content.slice(last_begin_index, text.content.length)
      });
    }
  }

  return all_matches;
}

export function dateDiff(date1: Date, date2: Date) {
  // @ts-ignore
  const diff: {
    sec: number,
    min: number,
    hour: number,
    day: number
  } = {};                           // Initialisation du retour
  let tmp = date2.valueOf() - date1.valueOf();

  tmp = Math.floor(tmp / 1000);             // Nombre de secondes entre les 2 dates
  diff.sec = tmp % 60;                    // Extraction du nombre de secondes

  tmp = Math.floor((tmp-diff.sec) / 60);    // Nombre de minutes (partie entière)
  diff.min = tmp % 60;                    // Extraction du nombre de minutes

  tmp = Math.floor((tmp-diff.min) / 60);    // Nombre d'heures (entières)
  diff.hour = tmp % 24;                   // Extraction du nombre d'heures

  tmp = Math.floor((tmp-diff.hour) / 24);   // Nombre de jours restants
  diff.day = tmp;

  return diff;
}

export function dateText(date: Date, vue_instance: any) {
  const { day, hour, min } = dateDiff(date, new Date);

  if (day >= 7) {
    // superior to 7 days
    const is_sup_year = date.getFullYear() !== new Date().getFullYear();

    const is_fr = vue_instance.$i18n.locale === 'fr';
    const options: Intl.DateTimeFormatOptions = {
      year: is_sup_year ? "numeric" : undefined,
      month: "long",
      day: "numeric",
    };

    return new Intl.DateTimeFormat(is_fr ? 'fr-FR' : 'en-US', options).format(date);
  }

  // If superior to one day
  if (day >= 1) {
    return vue_instance.$t('day_ago', { day, s: day > 1 ? 's' : '' }).toString();
  }

  // If superior to one hour
  if (hour >= 1) {
    return vue_instance.$t('hour_ago', { hour, s: hour > 1 ? 's' : '' }).toString();
  }
  // If superior to one minute
  if (min >= 1) {
    return vue_instance.$t('minute_ago', { min, s: min > 1 ? 's' : '' }).toString();
  }

  return vue_instance.$t('few_seconds_ago').toString();
}

export function fullDateText(date: Date, vue_instance: any, force_year = false, force_hour_data = false) {
  const now = new Date;

  const is_sup_year = now.getFullYear() !== date.getFullYear();

  const is_fr = vue_instance.$i18n.locale === 'fr';
  const options: Intl.DateTimeFormatOptions = {
    year: is_sup_year || force_year ? "numeric" : undefined,
    month: "numeric",
    day: "numeric",
  };

  if (force_hour_data) {
    options.hour = 'numeric';
    options.minute = 'numeric';
    options.second = 'numeric';
  }

  return new Intl.DateTimeFormat(is_fr ? 'fr-FR' : 'en-US', options).format(date);
}

export function numberFormat(n: number) {
  if (n > 1e7) {
    return (n / 1e6).toFixed(1) + 'M';
  }
  else if (n > 1e6) {
    return (n / 1e6).toFixed(2) + 'M';
  }
  else if (n > 1e4) {
    return (n / 1e3).toFixed(1) + 'K';
  }
  else if (n > 1e3) {
    return (n / 1e3).toFixed(2) + 'K';
  }
  return n;
}

export function translateApiError(cmp: Vue, error: IApiError) : string | { toString(): string; } {
  const code = EApiError[error.code];

  if (code !== undefined) {
    return cmp.$t('errors.' + code).toString() + '.';
  }
  return cmp.$t('unknown_error');
}

export async function isWebAuthAvailable() {
  return typeof PublicKeyCredential !== 'undefined' &&
    await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable().catch(() => false);
}

export async function generateWebAuthCreationPublicKey(vue: Vue) {
  if (!vue.$accessor.loggedUser)
    throw new Error('Must be logged');

  const challenge = await vue.$axios.$get('auth/webauthn/challenge');
  const domain = window.location.hostname === 'localhost' ? 'localhost' : 'questionit.space';

  const credential = await navigator.credentials.create({
    publicKey: {
      challenge: Uint8Array.from(challenge.string as string, c => c.charCodeAt(0)),
      rp: {
        name: 'QuestionIt.space',
        id: domain,
      },
      user: {
        id: Uint8Array.from(vue.$accessor.loggedUser.id.toString(), c => c.charCodeAt(0)),
        name: vue.$accessor.loggedUser.slug,
        displayName: vue.$accessor.loggedUser.name,
      },
      pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
      timeout: 60000,
      attestation: 'none'
    }
  }) as PublicKeyCredential | null;

  if (!credential)
    throw new Error('Login flow rejected');

  if (credential.type !== 'public-key')
    throw new Error('Invalid public key');

  const attestation = new Uint8Array((credential.response as any).attestationObject as ArrayBuffer);
  const decoder = new TextDecoder();

  const to_send = {
    id: credential.id,
    response: {
      clientData: JSON.parse(decoder.decode(credential.response.clientDataJSON)),
      // It produce a number[]. Its ugly, but binary data through JSON (or simply JS strings) is a real pain.
      attestation: Array.from(attestation),
    },
    challenge: challenge.string,
  };

  // Send data to server
  await vue.$axios.post('auth/webauthn/create', to_send);

  // Store the credential ID
  vue.$cookies.set('credential_id', credential.id, { expires: new Date('2099-01-01') });

  return to_send;
}
