<template>
  <span v-if="part.type === 'text'">{{ part.content }}</span>

  <nuxt-link 
    v-else-if="part.type === 'at'" 
    :to="localePath('/u/' + part.content)"
  >{{ part.display_text }}</nuxt-link>
  
  <a 
    v-else-if="part.type === 'link'" 
    :href="part.content" 
    target="_blank" 
    rel="noopener noreferrer"
  >{{ part.display_text }}</a>
</template>

<script lang="ts" src="./QuestionText.ts"></script>
