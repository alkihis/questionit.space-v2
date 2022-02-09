import { Component, Vue, Prop } from 'nuxt-property-decorator';
import BulmaModal from '../BulmaModal/BulmaModal';

@Component({
  components: {
    BulmaModal: BulmaModal,
  }
})
export default class extends Vue {
  @Prop({ required: true, type: String }) url!: string;

  get is_video() {
    return this.url.endsWith('.mp4');
  }
}
