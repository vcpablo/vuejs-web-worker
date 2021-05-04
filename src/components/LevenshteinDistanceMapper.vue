<template>
  <div>
      <ProgressBar :progress="progress" />
      <!-- <pre class="jumbotron">
          {{ reducedResult}}
      </pre> -->
  </div>
</template>

<script>
import { chunk, getOr, map, reduce } from 'lodash/fp'
import ProgressBar from './ProgressBar'

const PROGRESS_COMPLETED = 100

export default {
    name: 'LevenshteinDistanceMapper',
    components: {
        ProgressBar
    },
    props: ['source', 'destination'],
    data() {
        return {
            progress: 0,
            result: []
        }
    },
    computed: {
        unmappedSourceChunks() {
            const cores = getOr(4, 'navigator.hardwareConcurrency', window)
            const chunkSize = Math.ceil(this.source.length / cores)
            return chunk(chunkSize, this.source)
        },
        reducedResult() {
            return reduce((result, { source, destination, similarity }) => ({
                ...result,
                [destination]: [
                    ...result[destination],
                    {
                        source,
                        similarity
                    }
                ]
            }), {}, this.result)
        }
    },
    created() {
        this.run()
    },
    methods: {
        run() {
            const worker = new Worker('/workers/levenshtein-worker.js')
            const self = this


             worker.onmessage = function(event) {
                self.updateResult(event.data)
                self.updateProgress()
            }

            worker.onerror = function(error) {
                console.error(error)
            }

            const { destination, unmappedSourceChunks } = this
            
            map(chunk => {
                worker.postMessage({
                    chunk,
                    destination
                })
            }, unmappedSourceChunks)
        },
        updateProgress() {
            const size = this.unmappedSourceChunks.length
            const increment = PROGRESS_COMPLETED / size

            this.progress = this.progress + increment
        },
        updateResult(data) {
            this.result = [...this.result, ...data]
        }
    }
}
</script>