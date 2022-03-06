<template>
  <div class="timeline-content">
    <p class="heading">
      <span>{{ username }}</span>
      <span> • </span>
      <span :title="full_date">{{ question_date }}</span>
    </p>
    <p>
      <span class="question">
        <question-text
          v-for="(item, $index) in array_content"
          :key="$index"
          :part="item"
        />
      </span>
      <span>
        —
      </span>

      <!-- Show text if any -->
      <span v-if="question.answer" class="answer">
        <!-- Show a poll emoji if on mobile (to avoid weird line break) -->
        <span v-if="has_poll">📊</span>

        <question-text
          v-for="(item, $index) in array_answer"
          :key="$index"
          :part="item"
        />
      </span>
      <!-- Show emoji before text if has image -->
      <span v-if="has_image" class="answer">🖼️</span>
    </p>
  </div>
</template>

<style lang="scss" scoped>
.timeline-content {
  .question {
    font-weight: bold;
  }
}
</style>

<script lang="ts">
import { Component } from 'nuxt-property-decorator';
import QuestionBase from './QuestionBase/QuestionBase';
import QuestionText from './QuestionText/QuestionText';

@Component({
  components: {
    QuestionText: QuestionText,
  }
})
export default class extends QuestionBase {
  mounted() {
  }
}
</script>
