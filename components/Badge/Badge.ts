import { Vue, Component, Prop } from 'nuxt-property-decorator';

@Component({
  components: {}
})
export default class extends Vue {
  @Prop({ default: 0 })
  readonly count!: number;

  @Prop({ default: false })
  readonly inline!: boolean;

  @Prop({ default: false })
  readonly navbadge!: boolean;

  get formatted_count() {
    if (this.count > 9) {
      return '9+';
    }
    return String(this.count);
  }
}
