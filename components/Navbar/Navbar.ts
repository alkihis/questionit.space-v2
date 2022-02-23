import { Vue, Component, Prop } from 'nuxt-property-decorator';
import Badge from '~/components/Badge/Badge';
import BulmaModal from '../BulmaModal.vue';
import AccountHandler from '../AccountHandler.vue';

type ValidPage = 'home' | 'search' | 's' | 'notification' | 'waiting';

@Component({
  components: {
    Badge,
    BulmaModal: BulmaModal,
    AccountHandler: AccountHandler,
  }
})
export default class extends Vue {
  @Prop({ default: true })
  readonly showLogo!: boolean;

  @Prop()
  solid!: boolean;

  is_open: boolean = false;
  interval: any = 0;
  logout_modal = false;
  valid_pages: ValidPage[] = ['home', 'search', 'waiting', 'notification', 's'];

  toggle() {
    this.is_open = !this.is_open;
  }

  async downloadWaiting() {
    if (!this.$accessor.isLogged)
      return;

    const waiting = (await this.$axios.get('notification/counts')).data as { questions: number; notifications: number; };
    this.$accessor.setNotificationWait(waiting.notifications);
    this.$accessor.setAnswerWait(waiting.questions);
  }

  onWindowClick(e: MouseEvent) {
    if (!this.is_open) {
      return;
    }

    let current: HTMLElement | null = e.target as HTMLElement;
    let should_close = true;
    // Find if click is in mobile
    while (current) {
      if ('hasAttribute' in current) {
        if (current.hasAttribute('data-mobile-root')) {
          should_close = false;
          break;
        }
        if (current.hasAttribute('data-navbar-root')) {
          break;
        }
      }

      current = current.parentElement;
    }

    if (should_close) {
      this.close();
    }
  }

  isPageActive(page: ValidPage) {
    const pages = this.getPages();

    let path: string;
    // Get only path after locale (if any)
    const locale_prefix = this.localePath('/');
    if (locale_prefix && locale_prefix !== '/') {
      path = this.$route.path.slice(locale_prefix.length);
    }
    else {
      path = this.$route.path;
    }

    const valid = page in pages ? pages[page] : undefined;

    if (!valid) {
      return false;
    }

    return valid.some(p => p.endsWith(path));
  }

  getPages() : { [K in ValidPage]: string[] } {
    return {
      home: ['/home'],
      search: ['/search'],
      waiting: ['/waiting', '/waiting/muted'],
      s: [
        '/settings/apps',
        '/settings/developer',
        '/settings',
        '/s',
        '/u/' + (this.$accessor.isLogged ? this.$accessor.loggedUser?.id ?? '0' : '0'),
        '/u/' + (this.$accessor.isLogged ? this.$accessor.loggedUser?.slug ?? '0' : '0'),
      ],
      notification: ['/notification'],
    };
  }

  getIcon(p: ValidPage) {
    switch (p) {
      case 'home': return 'fas fa-globe-europe';
      case 'notification': return 'far fa-bell';
      case 's': return 'far fa-user';
      case 'search': return 'fas fa-search';
      case 'waiting': return 'far fa-comment';
    }
  }

  getStyles() {
    return `
      <style>
      /* used for bottom bar navigation */
      @media screen and (max-width: 1023px) {
        body {
          margin-bottom: 64px;
        }
      }
      </style>`;
  }

  mounted() {
    this.downloadWaiting();
    this.onWindowClick = this.onWindowClick.bind(this);

    // Every two minutes
    this.interval = setInterval(() => {
      this.downloadWaiting();
    }, 2 * 1000 * 60);

    window.addEventListener('click', this.onWindowClick);
  }

  accountModal() {
    this.logout_modal = true;
    this.close();
  }

  close() {
    this.is_open = false;
  }

  closeAccountModal() {
    this.logout_modal = false;
  }

  beforeDestroy() {
    clearInterval(this.interval);
    window.removeEventListener('click', this.onWindowClick);
  }
}
