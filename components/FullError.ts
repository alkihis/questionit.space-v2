import { Vue, Component, Prop } from 'nuxt-property-decorator';
import { translateApiError } from '~/utils/helpers';
import { IApiError } from "~/utils/types/error.types";

@Component({
  components: {}
})
export default class extends Vue {
  @Prop()
  error!: any;

  @Prop()
  title!: string;

  @Prop()
  subtitle!: string;

  get response() {
    if (this.error && this.error.response && this.error.response.data) {
      return this.error.response.data as IApiError;
    }
    else if (typeof this.error === 'object' && 'status_code' in this.error) {
      return this.error as IApiError;
    }
  }

  get error_title() {
    if (this.title) {
      return this.title;
    }

    // déduire le titre avec error
    const resp = this.response;
    if (resp) {
      return this.$t('error');
    }
    else {
      const code = this.error.message;
      if (code.startsWith('Request failed with status code')) {
        const n_code = Number(code.split('Request failed with status code')[1].trim());

        return this.textForError(n_code);
      }

      return this.textForError(0);
    }
  }

  get error_text() {
    if (this.subtitle) {
      return this.subtitle;
    }

    // déduire le titre avec error
    const resp = this.response;
    if (resp) {
      return translateApiError(this, resp);
    }
    else {
      const code = this.error.message;
      if (code.startsWith('Request failed with status code')) {
        const n_code = Number(code.split('Request failed with status code')[1].trim());

        return this.fullTextForError(n_code);
      }

      return this.fullTextForError(0);
    }
  }

  textForError(code: number) {
    switch (code) {
      case 400:
        return this.$t('bad_request');
      case 403:
        return this.$t('forbidden');
      case 404:
        return this.$t('page_not_found');
      case 500:
      case 504:
        return this.$t('server_error');
      default:
        return this.$t('unknown_error');
    };
  }

  fullTextForError(code: number) {
    switch (code) {
      case 400:
        return this.$t('bad_request_message');
      case 403:
        return this.$t('forbidden_message');
      case 404:
        return this.$t('page_not_found_message');
      case 500:
      case 504:
        return this.$t('server_error_message');
      default:
        return this.$t('unknown_error');
    };
  }
}
