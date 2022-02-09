import { Vue, Component, Prop } from 'nuxt-property-decorator';
import { TextPart } from '~/utils/helpers';

@Component({
  components: {}
})
export default class extends Vue {
  @Prop({ required: true })
  part!: TextPart;
}
