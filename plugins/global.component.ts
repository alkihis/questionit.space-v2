import { Vue } from 'nuxt-property-decorator';
import FluidContainer from '~/components/FluidContainer.vue';
import Loader from '~/components/Loader.vue';
import FullError from '~/components/FullError.vue';

Vue.component('fluid-container', FluidContainer);
Vue.component('bulma-loader', Loader);
Vue.component('full-error', FullError);
