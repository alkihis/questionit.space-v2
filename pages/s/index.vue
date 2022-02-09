
<script lang="ts">
import { Component, Vue } from 'nuxt-property-decorator';

@Component({
  middleware: 'logged',
  components: {},
  layout: 'empty',
  asyncData({ store, redirect, app }) {
    // Redirect to current user slug (middleware ensure that we're logged in)
    const user = app.$accessor.loggedUser!;

    return redirect(
      app.localePath({
        path: '/u/' + user.slug
      })
    );
  }
})
export default class extends Vue {}
</script>
