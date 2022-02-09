<template>
  <article class="media">
    <section class="media-left">
      <nuxt-link v-if="has_emitter" :to="profile_link">
        <figure class="image is-64x64">
          <img :src="profile_picture" :alt="username" draggable="false">
        </figure>
      </nuxt-link>
      <figure v-else class="image is-64x64">
        <img :src="profile_picture" :alt="username" draggable="false">
      </figure>
    </section>

    <section class="media-content">
      <div class="content">
        <div :class="divider_class"></div>

        <p>
          <span class="question-card-user">
            <nuxt-link v-if="has_emitter" :to="profile_link" class="question-card-user-username">{{ username }}</nuxt-link>
            <span v-else :class="username_class">{{ username }}</span>
            <span v-if="!ofDay">
              <span class="question-card-user-divider">·</span>
              <span class="question-card-user-time" :title="full_date">{{ question_date }}</span>
            </span>
          </span>
          <a
            v-if="is_reply"
            class="question-card-reply"
            target="_blank"
            :href="localePath('/u/' + question.receiver.slug + '/' + question.in_reply_to)"
          >
            <span class="icon has-text-info">
              <i class="fas fa-reply"></i>
            </span>
            <span>
              {{ $t('in_reply_to_a_question') }}
            </span>
          </a>

          <span class="question-card-question">
            <question-text 
              v-for="(item, $index) in array_content" 
              :key="$index" 
              :part="item" 
            />
          </span>
        </p>
      </div>

      <div class="question-card-response">
        <question-text-area 
          v-if="!is_poll"
          v-model="answer"
          :placeholder="$t('write_response')"
          :maxLength="650"
          :hasImageIcon="image ? null : true"
          @ctrl-enter="submitAnswer"
          @addimage="clickImage"
          @drop.native.prevent.stop="onDrop"
          @paste="onPaste"
        />
        <poll-choice
          v-else
          :choices="question.attachements.poll.options"
          :choice="answer"
          :allowChoice="true"
          @item-select="onPollChoice"
        />

        <div :class="{ 'reply-buttons': true, 'no-reply-footer': true, 'with-image': !!image_url }">
          <div v-if="image_url" class="will-reply-image">
            <div :style="{ backgroundImage: 'url(' + image_url + ')' }" class="img" />

            <span class="icon" @click="removeImage">
              <i class="fas fa-times"></i>
            </span>
          </div>

          <input type="checkbox" class="is-checkradio is-circle is-info" :id="'post_on_twitter' + question.id" v-model="post_on_twitter">
          <label class="checkbox" :for="'post_on_twitter' + question.id">
            {{ $t('post_on_twitter') }}
          </label>
        </div>

        <div class="reply-buttons">
          <button class="button is-danger" @click="deleteQuestion">
            <span v-if="ofDay">
              {{ $t('hide') }}
            </span>
            <span v-else>
              {{ $t('delete') }}
            </span>
          </button>

          <button :class="{ 'button': true, 'is-link': true, 'is-loading': posting }" :disabled="posting || (!answer && !image)" @click="submitAnswer">
            {{ $t('answer') }}
          </button>
        </div>
      </div>
    </section>

    <input type="file" class="hidden-file" @change="addImage" />
  </article>
</template>

<style lang="scss" src="./QuestionCardNoReply.scss" scoped></style>

<script lang="ts" src="./QuestionCardNoReply.ts"></script>
