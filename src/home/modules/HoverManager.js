import { ToolsView } from '@antv/x6'

export class HoverManager {
  static setupHoverEvents(graph) {
    // graph.on('node:mouseenter', ({ node }) => {
    //   // 存储定时器到节点数据中
    //   const timer = setTimeout(() => {
    //     node.addTools({
    //       name: 'button-remove',
    //       args: {
    //         x: '100%',
    //         y: '100%',
    //         offset: { x: -10, y: -10 },
    //         onClick: ({ view }) => {
    //           if (confirm('确定要删除这个节点吗？')) {
    //             view.cell.remove()
    //           }
    //         }
    //       }
    //     })
    //   }, 3000)

    //   // 使用setData存储定时器
    //   node.setData({
    //     ...node.getData(),
    //     removeTimer: timer
    //   })
    // })

    graph.on('node:mouseleave', ({ node }) => {
      // 获取并清除定时器
      const data = node.getData()
      if (data?.removeTimer) {
        clearTimeout(data.removeTimer)
      }

      node.attr('hoverBox/visibility', 'hidden')
      node.attr('hoverLabel/visibility', 'hidden')
      node.attr('hoverLabelBg/visibility', 'hidden')

      // 移除工具
      node.removeTools()
    })
  }
}