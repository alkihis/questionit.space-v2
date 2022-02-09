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

<script lang="ts" src="./QuestionTextArea.ts"></script>
