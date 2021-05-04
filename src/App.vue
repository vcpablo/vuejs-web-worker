<template>
  <div class="container text-center">
    <h1>Levenshtein Distance Web Worker</h1>
    <LevenshteinDistanceMapper v-if="ready" v-bind="{ source, destination }"/>
    <Loading v-else/>
  </div>
</template>

<script>
import Loading from '@/components/Loading'
import LevenshteinDistanceMapper from '@/components/LevenshteinDistanceMapper'

const NUMBER_OF_WORDS = 5000
const RANDOM_WORDS_API_URL = 'https://random-word-api.herokuapp.com/word?number='

export default {
  name: 'App',
  components: {
    Loading,
    LevenshteinDistanceMapper
  },
  data() {
    return {
      source: [],
      destination: []
    }
  },
  computed: {
    ready() {
      const { source, destination } = this
      return source.length > 0 && destination.length > 0
    }
  },
  async created() {
    this.source = await this.fetchRandomWords()
    this.destination = await this.fetchRandomWords()
  },
  methods: {
    fetchRandomWords() {
      return fetch(`${RANDOM_WORDS_API_URL}${NUMBER_OF_WORDS}`)
        .then(response => response.json())
    }
  }
}
</script>
