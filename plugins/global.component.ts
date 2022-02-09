import { Vue } from 'nuxt-property-decorator';
// @ts-ignore
import FluidContainer from '~/components/FluidContainer';
// @ts-ignore
import Loader from '~/components/Loader';
import FullError from '~/components/FullError';

Vue.component('fluid-container', FluidContainer);
Vue.component('bulma-loader', Loader);
Vue.component('full-error', FullError);
