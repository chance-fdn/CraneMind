<template>
  <div class="native-table-main">
    <table>
      <thead>
        <tr v-if="tableColumn.length">
          <th v-for="item in tableColumn" :key="item.label" :style="{width: item.width}">{{ item.label }}</th>
        </tr>
      </thead>
      <tbody v-if="tableData.length" :style="{height: (typeof maxHeight === 'number') ? (maxHeight + 'px') : maxHeight }">
        <tr v-for="row in tableData" :key="row.id">
          <td v-for="item in tableColumn" :key="item.label" :style="{width: item.width}">
            <div v-if="item.prop">{{ row[item.prop] }}</div>
            <slot v-else :row="row" :name="item.key" />
          </td>
        </tr>
      </tbody>
      <div v-else class="empty">
        暂无数据
      </div>
    </table>
  </div>
</template>

<script>
export default {
  components: {

  },
  props: {
    tableData: {
      type: Array,
      default: () => []
    },
    tableColumn: {
      type: Array,
      default: () => []
    },
    maxHeight: {
      type: [Number, String],
      default: () => 'auto'
    }
  }
}
</script>

<style scoped lang="scss">
.native-table-main {
  /* 滚动条宽度 */
  ::-webkit-scrollbar {
    width: 6px;
    background-color: transparent;
  }

  /* 滚动条颜色 */
  ::-webkit-scrollbar-thumb {
    background-color: rgba(28,81,148,0.6);
    border-radius: 3px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
    th, td {
      padding: 10px 2px;
    }
  }
  thead {
    border-bottom: 1px solid #fff;
  }
  tbody {
    width: calc(100% + 6px); /*这里的6px是滚动条的宽度*/
    height: auto;
    display: block;
    overflow-y: auto;
    td {
      border-bottom: 1px solid #fff;
      text-align: center;
    }
  }
  thead tr, table tbody tr {
    width: 100%;
    display: table;
    table-layout: fixed;
    box-sizing: border-box;
  }
  .empty {
    padding: 50px;
    color: #ccc;
    text-align: center;
  }
}
</style>
