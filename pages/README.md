# PAGES

## Pages with an interface (a vue)

- index.vue => Home Page
- u/_slug.vue => User page
- login.vue => Twitter login. May be merged with home page..
- t_callback.vue => Redirect if came from Twitter and keys are valid. Otherwise, print error.

## Pages without interface (redirections...)

- s.vue => redirection to logged user if any, otherwise to home page
- logout.vue => redirection to / after logout

This directory contains your Application Views and Routes.
The framework reads all the `*.vue` files inside this directory and creates the router of your application.

More information about the usage of this directory in [the documentation](https://nuxtjs.org/guide/routing).
