import { Vue, Component, Prop } from 'nuxt-property-decorator';
import BulmaModal from '../BulmaModal/BulmaModal';
import { handleError } from '~/utils/helpers';

declare const Croppie: { new (el: HTMLElement, options?: any): any };

@Component({
  components: {
    BulmaModal: BulmaModal,
  }
})
export default class extends Vue {
  @Prop({ required: true })
  mode!: 'pp' | 'banner';

  @Prop({ required: true })
  image!: File;

  croppie!: any;
  image_url?: string;
  croppie_loading = false;

  async crop() {
    this.croppie_loading = true;

    try {
      const blob: Blob = await this.croppie.result({
        type: 'blob',
        size: { width: this.mode === 'banner' ? 1500 : 250, height: this.mode === 'banner' ? 500 : 250 },
        format: this.image.name.endsWith('.png') ? 'png' : 'jpeg',
      });

      this.$emit('cropped', new File([blob], this.image.name, { type: this.image.type }));
    } catch (e) {
      handleError(new Error(), this);
    }

    this.croppie_loading = false;
  }

  initCroppieBanner() {
    let wid = 550;
    let hei = 300;
    let vwid = 500;
    let vhei = 175;

    if (window.innerWidth < 1024){ // Mode mobile
      wid = 290;
      hei = 150;

      vwid = 270;
      vhei = 90;
    }

    this.croppie = new Croppie(
      this.$el.querySelector('.modal-crop-container') as HTMLElement,
      {
        viewport: {
          width: vwid,
          height: vhei,
          type: 'square',
        },
        boundary: {
          width: wid,
          height: hei
        },
        showZoomer: true,
        enableZoom: true,
      }
    );
  }

  initCroppiePp() {
    let wid = 400;
    let hei = 300;

    if (window.innerWidth < 996){ // Mode mobile
      wid = 290;
      hei = 260;
    }

    this.croppie = new Croppie(
      this.$el.querySelector('.modal-crop-container') as HTMLElement,
      {
        viewport: {
          width: 200,
          height: 200,
          type: 'square',
        },
        boundary: {
          width: wid,
          height: hei
        },
        showZoomer: true,
        enableZoom: true,
      }
    );
  }

  async initCroppie() {
    if (this.mode === 'banner') {
      this.initCroppieBanner();
    }
    else {
      this.initCroppiePp();
    }

    this.image_url = URL.createObjectURL(this.image);
    this.croppie
      .bind({ url: this.image_url })
      .catch(() => {
        this.$toast.error(this.$t('invalid_file'));
        this.$emit('close');
      });
  }

  mounted() {
    this.$nextTick(() => {
      this.initCroppie();
    });
  }

  beforeDestroy() {
    if (this.image_url) {
      URL.revokeObjectURL(this.image_url);
    }
  }
}
