<template>
  <div>
    <client-only>
      <portal-target name="emoji-picker-main"></portal-target>
    </client-only>
    <div class="emoji-text-wrapper">
      <div class="emoji-text-selector hidden"></div>
    </div>
    
    <Navbar :solid="true" />
    <nuxt />
  </div>
</template>

<script lang="ts" src="./default_solid.ts"></script>

<style lang="scss">
html {
  font-size: 16px;
  word-spacing: 1px;
  -ms-text-size-adjust: 100%;
  -webkit-text-size-adjust: 100%;
  -moz-osx-font-smoothing: grayscale;
  -webkit-font-smoothing: antialiased;
  box-sizing: border-box;
}

*,
*:before,
*:after {
  box-sizing: border-box;
  margin: 0;
}
</style>
