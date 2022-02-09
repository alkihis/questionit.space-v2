<template>
  <!-- Full page error -->
  <main>
    <div class="error-logo">
      <span class="icon is-large has-text-gray-lighter">
        <i class="fas fa-exclamation"></i>
      </span>
    </div>
    <p class="header nanum has-text-grey-light">
      {{ error_title }}
    </p>
    <p class="content nanum has-text-white-ter">
      {{ error_text }}
    </p>
    <p class="go-home nanum">
      <nuxt-link :to="localePath('/')">
        {{ $t('home_title') }}
      </nuxt-link>
    </p>
  </main>
</template>

<style lang="scss" scoped>
  main {
    background-color: rgb(19, 19, 19);
    min-height: 100vh;
    color: white;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }

  .error-logo {
    margin-bottom: 2rem;

    .fas {
      font-size: 4rem;
    }
  }

  .header {
    font-size: 2rem;
    text-align: center;
  }

  .content {
    font-size: 1.5rem;
    text-align: center;
  }

  .header, .content {
    max-width: 90vw;

    @media screen and (min-width: 1024px) {
      max-width: 50vw;
    }
  }

  .go-home {
    font-size: 1.6rem;

    & > a {
      color: rgb(142, 194, 255);

      &:hover {
        color: rgb(0, 106, 226);
      }
    }
  }
</style>

<script lang="ts" src="./FullError.ts"></script>
