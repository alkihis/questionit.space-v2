import { Component } from 'nuxt-property-decorator';
import QuestionBase from '../QuestionBase/QuestionBase';
import QuestionText from '../QuestionText/QuestionText';

@Component({
  components: {
    QuestionText: QuestionText,
  } 
})
export default class extends QuestionBase {
  mounted() {
  }
}
