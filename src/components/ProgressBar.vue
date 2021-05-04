<template>
  <div class="progress">
      <div
        class="progress-bar"
        role="progressbar"
        :aria-valuenow="progress"
        :style="style"
        aria-valuemin="0"
        aria-valuemax="100">
        {{ progress }}%
        </div>
  </div>
</template>

<script>
export default {
    name: 'ProgressBar',
    props: ['progress'],
    computed: {
      style() {
        return {
          width: `${this.progress}%`
        }
      }
    }
}
</script>