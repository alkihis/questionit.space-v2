<template>
  <div class="container">
    <slot></slot>
  </div>
</template>

<style lang="scss" scoped>
.container {
  width: 50%;
  max-width: 1000px;

  @media screen and (max-width: 1500px) {
    width: 60%;
  }

  @media screen and (max-width: 1023px) {
    width: 90%;
  }
}
</style>
