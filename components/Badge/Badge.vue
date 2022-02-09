<template>
  <span v-if="count > 0" :class="{ 'icon-badge': true, inline, navbadge }">
    <span>{{ formatted_count }}</span>
  </span>
</template>

<style lang="scss" src="./Badge.scss" scoped></style>

<script lang="ts" src="./Badge.ts"></script>
