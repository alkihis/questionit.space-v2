# questionit.space

<p align="center" style="margin-top: 2rem">
  <a href="https://questionit.space/" target="_blank"><img src="https://questionit.space/images/logo/BannerBlue.png" width="380" alt="QuestionIt Logo" /></a>
</p>

> A lightweight, simple question-answer website for Twitter users

**This is the web client of QuestionIt.space**. Please see [bootstrap](https://github.com/alkihis/questionit.bootstrap) to access all projects.

### Tech stack

- Vue 2.6.x
- Nuxt 2
- Node ^14

### Architecture

Classic Nuxt project:
- `assets`: stands for static files meant to be compiled
- `components`: Vue independant components
- `i18n`: language files
- `layouts`: base Vue components to build pages
- `middleware`: functions meant to be called before each page access
- `pages`: Vue components associated to URL route
- `plugins`: functions meant to be called by the server for each page or by the client at initialization
- `static`: static files, uncompiled
- `store`: Vuex store
- `utils`: Functions, helpers, types for whole project

## Run

See bootstrap to learn how service can be started in dev mode.
