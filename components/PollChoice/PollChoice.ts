import { Vue, Component, Prop } from 'nuxt-property-decorator';

@Component({})
export default class extends Vue {
  @Prop({ required: true, type: Array }) choices!: string[];
  @Prop({ required: false, type: String, default: '' }) choice!: string;
  @Prop({ required: false, type: Boolean, default: false }) allowChoice!: boolean;
}
