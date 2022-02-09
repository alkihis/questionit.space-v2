<template>
  <div>
    <div v-if="error">
      <full-error :title="$t('error')" :subtitle="$t('unable_to_load_page') + '.'"></full-error>
    </div>
  </div>
</template>

<style lang="scss" scoped>

</style>

<script lang="ts">
import { Component, Vue } from 'nuxt-property-decorator';
// Création d'un request token depuis twitter

@Component({
  components: {},
  layout: 'empty',
})
export default class extends Vue {
  error: any = null;

  async mounted() {
    try {
      let { url } = (await this.$axios.get('token/from-twitter/request')).data;

      if (this.$accessor.isLogged) {
        // Si on est déjà connecté, force l'acceptation
        url = (url as string).replace('/authenticate?', '/authorize?');
      }

      // redirect to url
      window.location.href = url;
    } catch (error) {
      this.error = error;
    }
  }
}
</script>
