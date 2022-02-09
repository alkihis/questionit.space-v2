<template>
  <div class="wrapper loader-wrapper">
    <div class="loader-5 center">
      <span></span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .center {
    display: block;
    top: 0; left: 0;
    bottom: 0; right: 0;
    margin: auto;
  }
  .wrapper {
    width: 100%;
    max-width: 1000px;
    height: 100%;
    margin: 0 auto;
    margin-top: 3rem;
    margin-bottom: 2rem;
    animation: fade-in .3s;
  }
  .loader-wrapper {
    margin-top: 2rem;
  }
</style>
