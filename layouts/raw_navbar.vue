<template>
  <div>
    <Navbar :showLogo="false" />
    <nuxt />
  </div>
</template>

<script lang="ts" src="./raw_navbar.ts"></script>

<style lang="scss">
  *,
  *:before,
  *:after {
    box-sizing: border-box;
    margin: 0;
  }
</style>
