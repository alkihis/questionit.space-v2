import { Vue, Component, Prop, Watch } from 'nuxt-property-decorator';

@Component({
  components: {},
})
export default class extends Vue {
  @Prop({ default: false })
  right!: boolean;

  @Prop({ default: false })
  noPad!: boolean;

  open = false;
  uuid = "";

  constructor() {
    super();
    this.uuid = String(Math.random());
  }

  toggle() {
    this.open = !this.open;
  }

  toggleOff() {
    this.open = false;
  }

  findIfClickIsFromDropdown(e: MouseEvent) {
    if (!this.open)
      return;
    
    let current: HTMLElement | null = e.target as HTMLElement;

    while (current) {
      if ('hasAttribute' in current && current.hasAttribute('data-uuid') && current.dataset.uuid === this.uuid) {
        return;
      }
      current = current.parentElement;
    }

    this.toggleOff();
  }

  mounted() {
    this.findIfClickIsFromDropdown = this.findIfClickIsFromDropdown.bind(this);
    window.addEventListener('click', this.findIfClickIsFromDropdown);
  }

  beforeDestroy() {
    window.removeEventListener('click', this.findIfClickIsFromDropdown);
  }
}
