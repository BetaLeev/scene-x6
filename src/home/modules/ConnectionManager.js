export class ConnectionManager {
  static getConnectionConfig() {
    return {
      connectionPoint: 'anchor',

      createEdge() {
        return this.createEdge({
          allowBlank: false,
          allowMulti: false,
          allowLoop: false,
          allowEdge: false,
          allowNode: false,
          dangling: false, // 禁止悬空连线
          snap: {
            radius: 30,
          },
          router: {
            name: 'manhattan',  // 使用曼哈顿路由算法
            args: {
              step: 20,         // 控制转折点间距
              padding: 10       // 控制边距
            }
          },
          connector: {
            name: 'rounded',    // 使用圆角连接器
            args: {
              radius: 10        // 圆角半径
            }
          },
          attrs: {
            line: {
              stroke: '#5F95FF',
              strokeWidth: 2,
              targetMarker: {
                name: 'block',
                width: 12,
                height: 8
              }
            }
          },
        })
      },
      validateConnection: ({ sourceView, targetView, sourceMagnet, targetMagnet }) => {
        // 检查连接桩是否有效
        if (!sourceMagnet || !targetMagnet) {
          return false;
        }

        const sourceNodeType = sourceView.cell.data.nodeType;
        const targetNodeType = targetView.cell.data.nodeType;

        console.log(sourceNodeType, 'sourceNodeType');
        console.log(targetNodeType, 'targetNodeType');

        // 允许的连接类型
        const allowedConnections = [
          { source: 'Input', target: 'Space' },
          { source: 'Space', target: 'Space' },
          { source: 'Space', target: 'Output' }
        ];

        // 输入节点只能连接到空间的左侧
        if (sourceNodeType === 'Input' && targetNodeType === 'Space' && targetMagnet.getAttribute('port') !== 'left') {
          return false;
        }

        // 只有空间可以连接输出
        if (targetNodeType === 'Output' && sourceNodeType !== 'Space') {
          return false;
        }

        if (sourceNodeType === 'Space') {
          if (sourceMagnet.getAttribute('port') === 'left' || targetMagnet.getAttribute('port') === 'right') {
            return false;
          } else {
            return true
          }
        }

        return allowedConnections.some(connection =>
          connection.source === sourceNodeType && connection.target === targetNodeType
        );
      },
    }
  }
}