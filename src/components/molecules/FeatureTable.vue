<template>
  <table>
    <tr
      v-for="(value, key) in data"
      :key="key"
    >
      <td>{{ key }}</td>
      <td
        v-if="indicator"
        class="indicator"
        :class="{ green: value }"
      >
        &nbsp;
      </td>
      <td v-else>
        {{ value }}
      </td>
    </tr>
  </table>
</template>

<script>
export default {
  props: {
    data: {
      type: Object,
      default () {
        return {};
      }
    },
    indicator: {
      type: Boolean,
      default () {
        return false;
      }
    }
  }
};
</script>

<style lang="postcss" scoped>
.indicator {
  background-color: red;

  &.green {
    background-color: green;
  }
}
</style>
