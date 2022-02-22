<template>
  <div :class="{ 'response-wrapper': true, 'normal': type === 'normal' }">
    <textarea
      class="textarea is-info has-fixed-size"
      :maxlength="maxLength"
      :placeholder="placeholder"
      :value="value"
      @keypress="onKeyPress"
      @keydown.exact="onKeyDown"
      @input="onInput"
      @keydown.ctrl.enter="$emit('ctrl-enter')"
      @keydown.meta.enter="$emit('ctrl-enter')"
      @paste="$emit('paste', $event)"
    ></textarea>

    <div v-if="show_poll_options" class="poll-inputs">
      <div class="poll-text nanum">
        {{ $t('poll') }}
      </div>

      <span class="icon has-text-white close-poll" @click="removePoll">
        <i class="fas fa-times"></i>
      </span>

      <!-- Fields -->
      <div v-for="index in Object.keys(options).map(Number)" :key="index" class="field poll-input">
        <div class="control">
          <input
            :class="{ input: 'true', 'is-danger': pollFieldHasError(index) }"
            type="text"
            :value="options[index]"
            :placeholder="$t('choice') + ' ' + (index + 1) + (index > 1 ? (' (' + $t('optional') + ')') : '')"
            @input="refreshPollInput(index, $event)"
          />
        </div>

        <div
          v-if="isLastIndex(index) && options.length < 4"
          class="icon has-text-info add-poll-input"
          @click="addPollItem"
        >
          <i class="fas fa-plus"></i>
          <span>
            {{ $t('add_option') }}
          </span>
        </div>
      </div>

      <div class="field-end" />
    </div>

    <div class="items" @click="focus()">
      <span>
        <span class="root-emoji-picker" data-tooltip="Emojis" @click="togglePicker()">
          <i class="far fa-smile fa-lg"></i>
        </span>

        <span
          v-if="hasImageIcon !== false"
          :class="{ 'root-image-picker': true, 'has-text-grey-light': hasImageIcon === null }"
          data-tooltip="Image"
          @click="$emit('addimage')"
        >
          <i class="fas fa-images"></i>
        </span>

        <span
          v-if="enable_poll !== false"
          :class="{ 'root-image-picker': true, 'has-text-grey-light': enable_poll === null }"
          :data-tooltip="$t('poll')"
          @click="showPoll"
        >
          <i class="fas fa-poll-h"></i>
        </span>
      </span>
      <span class="root-char-counter nanum">
        <span
          :class="{ 'has-text-danger': remaining <= 0, 'warning': remaining > 0 && remaining < 15 }"
        >
          {{ remaining }}
        </span>
      </span>
    </div>
    <portal v-if="picker_open" to="emoji-picker-main">
      <div class="picker-root">
        <VEmojiPicker
          @select="closePicker"
          class="thepicker"
          :style="getPickerStyles()"
          :continuousList="true"
          :i18n="picker_i18n"
          :emojiSize="28"
          :emojisByRow="6"
        />
        <div class="background" @click="closePicker()"></div>
      </div>
    </portal>
  </div>
</template>

<style lang="scss" scoped>
  .picker-root {
    .thepicker {
      position: absolute;
      z-index: 9999999;
      max-width: 80vw;
    }

    .background {
      position: fixed;
      z-index: 9999998;
      width: 100%;
      height: 100%;
      background-color: #0000005b;
    }
  }

  .response-wrapper {
    .poll-inputs {
      display: flex;
      flex-direction: column;
      box-sizing: border-box;

      padding: 0 14px;
      margin-bottom: .5rem;

      position: relative;
      border: 1px #d0d0d0 solid;
      border-radius: 5px;

      .poll-text {
        margin: .5rem 0;
        font-weight: 600;
      }

      .close-poll {
        box-sizing: border-box;
        padding: 5px;
        background-color: rgba(0, 0, 0, 0.459);
        border-radius: 50%;
        position: absolute;
        cursor: pointer;
        top: .5rem;
        right: .25rem;
        z-index: 9;
      }

      .add-poll-input {
        text-align: center;
        margin-top: 1rem;
        width: 100%;
        cursor: pointer;

        span {
          margin-left: .5rem;
        }
      }

      .field-end {
        margin-bottom: .5rem;
      }
    }

    border-color: #3298dc;
    transition: border-color .2s;
    width: 100%;

    &.normal {
      border-color: #d0d0d0;

      &:focus-within {
        border-color: #3298dc;
      }
    }

    border-radius: 4px;
    border-width: 1px;
    border-style: solid;

    textarea.textarea {
      outline: 0;
      border: none;
      box-shadow: unset !important;
      min-height: 6rem;
      margin-bottom: .5rem;
    }

    .items {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      padding: 0 5px 3px 5px;

      .root-emoji-picker {
        cursor: pointer;

        @media screen and (max-width: 767px) {
          display: none;
        }
      }

      .root-image-picker {
        cursor: pointer;
        margin-bottom: -.5rem;
        font-size: 1.2rem;
        margin-left: .3rem;
        display: inline-block;
      }

      .root-char-counter {
        font-size: .9rem;

        .warning {
          color: #d2432b;
        }
      }
    }
  }
</style>

<script lang="ts">
import { Vue, Component, Prop } from 'nuxt-property-decorator';
import { searchEmoji, EmojiLib } from '~/utils/helpers';
import VEmojiPicker from 'v-emoji-picker';
import { IEmoji } from 'v-emoji-picker/lib/models/Emoji';

export type PollInputEvent = ({
  type: 'change',
} & PollInputData) | {
  type: 'clear',
};

export type PollInputData = {
  fields: string[],
  valid: boolean,
};

// @ts-ignore
@Component({
  components: {
    VEmojiPicker: VEmojiPicker as any,
  }
})
export default class extends Vue {
  @Prop({ required: true })
  value!: string;

  @Prop({ default: 'info' })
  type!: 'info' | 'normal';

  @Prop({ default: '' })
  placeholder!: string;

  @Prop({ default: 650 })
  maxLength!: number;

  @Prop({ default: false })
  hasImageIcon!: boolean | null;

  @Prop({ default: false, type: Boolean })
  hasPollIcon!: boolean;

  emoji_open = false;
  picker_open = false;
  enable_poll: boolean | null = false;
  show_poll_options = false;

  options: string[] = ['', ''];

  constructor() {
    super();

    this.enable_poll = this.hasPollIcon;
  }

  get remaining() {
    return this.maxLength - this.value.length;
  }

  get emoji_selector() {
    return document.getElementsByClassName('emoji-text-selector')[0] as HTMLDivElement;
  }

  get is_mobile() {
    return window.innerWidth < 768;
  }

  getValidInputs() {
    // TODO : Better filter
    return this.options
      .filter(e => e)
      .map(e => e.replace(/\s+/g, ' '));
  }

  showPoll() {
    if (!this.enable_poll)
      return;

    this.enable_poll = null;
    this.show_poll_options = true;

    const valid_inputs = this.getValidInputs();

    const evt: PollInputEvent = {
      type: 'change',
      fields: valid_inputs,
      valid: valid_inputs.length >= 2 && valid_inputs.length <= 4 && !this.testIfFieldsHasErrors(),
    };

    this.$emit('poll-change', evt);
  }

  removePoll() {
    this.show_poll_options = false;
    this.options = ['', ''];
    this.enable_poll = true;
    this.$emit('poll-change', { type: 'clear' } as PollInputEvent);
  }

  refreshPollInput(index: number, event: InputEvent) {
    if (index >= this.options.length)
      return;

    this.options[index] = (event.target as HTMLInputElement).value;

    const valid_inputs = this.getValidInputs();

    const evt: PollInputEvent = {
      type: 'change',
      fields: valid_inputs,
      valid: valid_inputs.length >= 2 && valid_inputs.length <= 4 && !this.testIfFieldsHasErrors(),
    };

    // force refresh
    this.options = [...this.options];

    this.$emit('poll-change', evt);
  }

  addPollItem() {
    this.options.push('');
  }

  isLastIndex(index: number) {
    return index + 1 === this.options.length;
  }

  testIfFieldsHasErrors() {
    return this.options.filter((_, i) => !this.pollFieldHasError(i)).length !== this.options.length;
  }

  pollFieldHasError(index: number) {
    const item = this.options[index];

    if (item.length === 0)
      return false;

    if (item.length > 32)
      return true;

    // Search if field is duplicated
    for (let i = 0; i < this.options.length; i++) {
      if (i === index)
        continue;

      if (item === this.options[i])
        return true;
    }

    return false;
  }

  getPickerStyles() {
    const final_coords = this.getTextAreaCoords();
    const window_size = window.innerHeight;

    // 450 is picker height
    if (final_coords.original.bottom + 450 > window_size) {
      return `left: ${final_coords.left}px; top: calc(${final_coords.bottom - 430}px);`;
    }

    return `left: ${final_coords.left}px; top: calc(${final_coords.bottom}px + 2rem);`;
  }

  getTextAreaCoords() {
    const coords = this.$el.querySelector('textarea')!.getBoundingClientRect();
    return {
      left: coords.left + window.scrollX,
      right: coords.right + window.scrollX,
      top: coords.top + window.scrollY,
      bottom: coords.bottom + window.scrollY,
      original: coords,
    };
  }

  openPicker() {
    this.picker_open = true;
  }

  togglePicker() {
    this.picker_open = !this.picker_open;
  }

  closePicker(input?: IEmoji) {
    if (input) {
      this.$emit('input', this.value + input.data);
      if (!this.is_mobile) {
        return;
      }
    }
    this.picker_open = false;
  }

  focus() {
    this.$el.querySelector('textarea')?.focus();
  }

  wordAtPosition(pos: number, text: string) {
    let buffer = '';
    let pos_before = 0;
    let pos_after = text.length;

    // Explore before
    for (let i = pos - 1; i >= 0; i--) {
      pos_before = i + 1;
      if (text[i].match(/^\s$/)) {
        break;
      }
      buffer = text[i] + buffer;
    }

    // Explore after
    for (let i = pos; i < text.length; i++) {
      pos_after = i;
      if (text[i].match(/^\s$/)) {
        break;
      }
      buffer += text[i];
    }

    return {
      word: buffer,
      before: pos_before,
      after: pos_after,
    };
  }

  insertEmoji(element: HTMLLIElement) {
    const emoji = element.dataset.emoji as string;
    // Remove current value
    const textarea = this.$el.querySelector('textarea')!;
    const current_pos = Number(element.dataset.pos);

    const { before, after } = this.wordAtPosition(current_pos, this.value);
    const real_before = before === 1 ? 0 : before;
    const new_val = this.value.slice(0, real_before) + EmojiLib.lib[emoji].char + this.value.slice(after);

    const em_length = EmojiLib.lib[emoji].char.length;
    this.$emit('input', new_val);
    this.closeEmojiSelector();

    // Set selection cursor after emoji
    this.$nextTick(() => {
      textarea.setSelectionRange(real_before + em_length, real_before + em_length);
    });
  }

  onKeyPress(e: KeyboardEvent) {
    if (!this.emoji_open) {
      return;
    }

    if (e.key === 'Enter' || e.key === 'Tab') {
      // validate selection
      const selected = this.emoji_selector.querySelector('li.selected') as HTMLLIElement;

      if (!selected) {
        return;
      }
      e.preventDefault();
      e.stopImmediatePropagation();

      this.insertEmoji(selected);
    }
  }

  onKeyDown(e: KeyboardEvent) {
    if (!this.emoji_open) {
      return;
    }

    if (e.key === 'ArrowDown') {
      const selected = this.emoji_selector.querySelector('li.selected') as HTMLLIElement;

      if (!selected) {
        return;
      }
      e.preventDefault();
      e.stopImmediatePropagation();

      selected.classList.remove('selected');
      if (selected.nextElementSibling) {
        selected.nextElementSibling.classList.add('selected');
      }
      else {
        this.emoji_selector.querySelector('li:first-child')!.classList.add('selected');
      }
    }
    else if (e.key === 'ArrowUp') {
      const selected = this.emoji_selector.querySelector('li.selected') as HTMLLIElement;

      if (!selected) {
        return;
      }
      e.preventDefault();
      e.stopImmediatePropagation();

      selected.classList.remove('selected');
      if (selected.previousElementSibling) {
        selected.previousElementSibling.classList.add('selected');
      }
      else {
        this.emoji_selector.querySelector('li:last-child')!.classList.add('selected');
      }
    }
  }

  onInput(e: InputEvent) {
    const target = (e.target as HTMLTextAreaElement);

    this.$emit('input', target.value);

    const char_pos = target.selectionStart;
    const { word } = this.wordAtPosition(char_pos, target.value);

    if (word.startsWith(':') && word.length >= 2) {
      const matches = searchEmoji(word.slice(1));

      if (matches.length) {
        if (!this.emoji_open) {
          this.openEmojiSelector(matches, char_pos);
        }
        else {
          this.refreshEmojiSelector(matches, char_pos);
        }
      }
      else if (this.emoji_open) {
        this.closeEmojiSelector();
      }
    }
    else {
      if (this.emoji_open) {
        this.closeEmojiSelector();
      }
    }
  }

  openEmojiSelector(matches: [string, string][], pos: number) {
    window.addEventListener('click', this.assignEmojiClose);

    const sel = this.emoji_selector;
    this.emoji_open = true;
    sel.classList.remove('hidden');
    this.refreshEmojiSelector(matches, pos);
  }

  refreshEmojiSelector(matches: [string, string][], pos: number) {
    const sel = this.emoji_selector;

    sel.innerHTML = '';

    const wrapper = document.createElement('ul');
    wrapper.classList.add('emoji-text-list');

    let first = true;
    for (const match of matches.slice(0, 6)) {
      const item = document.createElement('li');
      item.classList.add('emoji-text-item');
      item.dataset.emoji = match[0];
      item.dataset.pos = String(pos);
      item.onclick = () => {
        this.insertEmoji(item);
      };

      if (first) {
        first = false;
        item.classList.add('selected');
      }

      const emoji_span = document.createElement('span');
      emoji_span.textContent = match[1];

      const text_span = document.createElement('span');
      text_span.textContent = match[0];

      item.append(emoji_span, text_span);
      wrapper.appendChild(item);
    }

    // Insert the wrapper inside el
    sel.insertAdjacentElement('afterbegin', wrapper);

    // Positionnate the selector under the textarea
    const final_coords = this.getTextAreaCoords();

    sel.style.left = final_coords.left + 'px';
    sel.style.top = final_coords.bottom + 'px';
  }

  closeEmojiSelector() {
    window.removeEventListener('click', this.assignEmojiClose);

    const sel = this.emoji_selector;
    this.emoji_open = false;
    sel.classList.add('hidden');
    sel.innerHTML = '';

    sel.style.left = '0';
    sel.style.top = '0';
  }

  get picker_i18n() {
    return {
      search: this.$t('emoji_picker.search').toString(),
      categories: {
        Frequently: this.$t('emoji_picker.categories.recents').toString(),
        Activity: this.$t('emoji_picker.categories.activities').toString(),
        Nature: this.$t('emoji_picker.categories.animals').toString(),
        Places: this.$t('emoji_picker.categories.travel').toString(),
        Flags: this.$t('emoji_picker.categories.flags').toString(),
        smileys: this.$t('emoji_picker.categories.smileys').toString(),
        Symbols: this.$t('emoji_picker.categories.symbols').toString(),
        Objects: this.$t('emoji_picker.categories.objects').toString(),
        Foods: this.$t('emoji_picker.categories.food').toString(),
        Peoples: this.$t('emoji_picker.categories.people').toString(),
      },
    };
  }

  assignEmojiClose() {
    this.closeEmojiSelector();
  }

  mounted() {
    this.assignEmojiClose = this.assignEmojiClose.bind(this);
  }
}
</script>
