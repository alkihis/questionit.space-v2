<template>
  <main>
    <section class="hero is-light">
      <div class="hero-body">
        <div class="container">
          <h1 class="title">
            {{ $t('privacy_policy') }}
          </h1>
          <h2 class="subtitle">
            {{ $t('privacy_policy_message') }}.
          </h2>
        </div>
      </div>
    </section>

    <fluid-container class="main content">
      <p class="is-size-4">
        Avant-propos : Pourquoi l'application Twitter QuestionIt.space demande autant d'autorisations ?
      </p>

      <p>
        Lorsque vous utilisez le "flow" de connexion via Twitter afin d'obtenir un accès à un compte,
        Twitter autorise 3 niveaux de permissions : <strong>lecture</strong>, <strong>lecture et écriture</strong>, et
        <strong>lecture, écriture + messages privés</strong>.
        Une option supplémentaire permet d'accéder à l'adresse e-mail du détenteur du compte.

        <br><br>

        <strong>QuestionIt.space utilise le second niveau, lecture et écriture</strong>,
        afin de pouvoir envoyer des tweets automatiquement lorsque vous répondez à une question.
        Cette action vous est explicitement demandée par la case "Poster sur Twitter" à côté du champ de réponse.

        <br><br>
        <strong>
          Jamais QuestionIt.space n'utilise l'accès à votre profil pour publier des tweets sans votre accord, miner des données sur votre
          profil ou suivre des utilisateurs sans votre autorisation.
        </strong>
        <br>

        L'accès à votre adresse e-mail est également demandé au cas où un signalement concernant une de vos questions, réponses ou de votre profil
        nous est parvenu. Votre adresse e-mail n'est <strong>pas stockée, revendue ou mise à disposition de tiers</strong>.
      </p>

      <p class="is-size-4">
        Quel type de données QuestionIt.space collecte-t-elle vous concernant ?
      </p>

      <p>
        QuestionIt.space attache une grande importance à la protection et confidentialité de la vie privée de ses abonnés et
        plus particulièrement de leurs données à caractère personnel.
        Dans ce cadre, la présente Politique de confidentialité vous permettra de comprendre quelles données à caractère personnel
        nous collectons et ce que nous en faisons, ainsi que la façon dont vous pouvez protéger votre vie privée dans le cadre des services que nous fournissons.

        Dans le cadre des questions posées aux utilisateurs et dans le cadre de la création de votre profil, les informations suivantes
        sont enregistrées lorsque vous êtes connecté à votre compte :
      </p>
      <ul>
        <li>
          Questions posées : date de l'envoi, contenu de la question, identifiant utilisateur
        </li>
        <li>
          Question répondues : date de la réponse, contenu de la réponse, identifiant utilisateur
        </li>
        <li>
          Profil (initialement téléchargées depuis Twitter) : Nom, pseudo, image de profil, bannière de votre profil
        </li>
      </ul>

      <p class="is-size-4">
        De quelle manière vos données sont utilisées ?
      </p>

      <p>
        QuestionIt.space utilise vos données vous présenter votre profil, vos questions et vos réponses aux utilisateurs de la plateforme.
        Vos données peuvent être saisies en cas d'infraction aux <nuxt-link :to="localePath('mentions')">mentions légales</nuxt-link> ci-présentes.

        <br>

        Vos données ne sont pas utilisées et collectées à des fins commerciales ou d'amélioration de service.
      </p>

      <p class="is-size-4">
        Comment gérer vos données ?
      </p>

      <p>
        Vous pouvez vous adresser à <a href="mailto:questionit.space@gmail.com">questionit.space@gmail.com</a> si jamais vous voulez exercer votre
        droit d'appartenance à vos données. Si vous souhaitez supprimer vos données, vous pouvez supprimer votre compte depuis la page
        <nuxt-link :to="localePath('/settings')">paramètres</nuxt-link>. La suppression de vos données sera effective dès la confirmation de la suppression de votre compte.
      </p>

      <p class="is-size-4">
        Qui peut avoir accès à vos données ?
      </p>
      <p>
        Vos données sont traitées par QuestionIt.space et personne d'autre. Le stockage s'effectue sur des serveurs situés en France.
      </p>

      <p class="is-size-4">
        À propos de la politique de confidentialité
      </p>

      <p>
        La présente Politique de confidentialité peut être amenée à évoluer, notamment en raison des évolutions législatives et réglementaires.
      </p>

      <p class="is-size-4">
        Utilisation des cookies
      </p>
      <p>
        Nous avons besoin de vos cookies pour permettre de vos connecter à votre compte QuestionIt.space.
        En naviguant sur ce site, vous acceptez de manière implicite l'ensemble des cookies utilisés à des fins utilitaires uniquement.

        <br />
        QuestionIt.space n'intègre ni utilise aucun pisteur, cookie publicitaire ou traceur, même ceux de Twitter.
      </p>
    </fluid-container>
  </main>
</template>

<script lang="ts">
import { Vue, Component } from 'nuxt-property-decorator';
import { makeTitle } from '~/utils/helpers';

@Component({
  components: {},
  layout: 'default_solid',
})
export default class extends Vue {
  head() {
    return {
      title: makeTitle(this.$t('privacy_policy').toString()),
    };
  }
}
</script>

<style lang="scss" scoped>
.main {
  padding: 2rem 0 5rem 0;
  font-size: 1.15rem;
}
</style>
