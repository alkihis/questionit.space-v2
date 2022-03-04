import { TextPart } from '~/utils/helpers';

const REGEX_URL = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?)/g;
const REGEX_AROBASE = /(^|\s)(@([a-zA-Z0-9_]{2,20}))\b/g;

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
