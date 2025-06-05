export const formConfig = {
  '输入': {
    title: '编辑输入节点',
    fields: [
      { label: '描述', prop: 'description', type: 'textarea' }
    ]
  },
  '环境': {
    title: '编辑环境节点',
    fields: [
      { label: '系统', prop: 'system', type: 'text' },
      { label: '版本', prop: 'version', type: 'text' },
      { label: '型号', prop: 'model', type: 'text' }
    ]
  },
  '空间': {
    title: '编辑空间节点',
    fields: [
      {
        label: '选择环境',
        prop: 'selectedEnv',
        type: 'select',
        options: [
          { value: 'dev', label: '开发环境' },
          { value: 'test', label: '测试环境' },
          { value: 'prod', label: '生产环境' }
        ]
      },
      {
        label: '加载空间',
        prop: 'loadSpace',
        type: 'select',
        options: [
          { value: 'full', label: '完整空间' },
          { value: 'partial', label: '部分空间' },
          { value: 'custom', label: '自定义空间' }
        ]
      },
      {
        label: '加载时机',
        prop: 'loadTime',
        type: 'select',
        options: [
          { value: 'startup', label: '启动时加载' },
          { value: 'runtime', label: '运行时加载' },
          { value: 'ondemand', label: '按需加载' }
        ]
      },
      {
        label: '安全策略',
        prop: 'securityPolicy',
        type: 'select',
        options: [
          { value: 'standard', label: '标准策略' },
          { value: 'enhanced', label: '增强策略' },
          { value: 'custom', label: '自定义策略' }
        ]
      }
    ]
  },
  '输出': {
    title: '编辑输出节点',
    fields: [
      {
        label: '输出类型',
        prop: 'outputType',
        type: 'select',
        options: [
          { value: 'file', label: '文件输出' },
          { value: 'database', label: '数据库输出' },
          { value: 'api', label: 'API输出' }
        ]
      },
      {
        label: '实例上限',
        prop: 'instanceLimit',
        type: 'select',
        options: [
          { value: '10', label: '10个实例' },
          { value: '50', label: '50个实例' },
          { value: 'unlimited', label: '无限制' }
        ]
      },
      {
        label: '空间用途',
        prop: 'spaceUsage',
        type: 'select',
        options: [
          { value: 'storage', label: '存储' },
          { value: 'compute', label: '计算' },
          { value: 'hybrid', label: '混合用途' }
        ]
      },
      {
        label: '实例创建方式',
        prop: 'creationMethod',
        type: 'select',
        options: [
          { value: 'auto', label: '自动创建' },
          { value: 'manual', label: '手动创建' },
          { value: 'scheduled', label: '定时创建' }
        ]
      },
      {
        label: '加载空间',
        prop: 'loadSpace',
        type: 'select',
        options: [
          { value: 'full', label: '完整加载' },
          { value: 'partial', label: '部分加载' },
          { value: 'lazy', label: '懒加载' }
        ]
      },
      {
        label: '数据导入',
        prop: 'dataImport',
        type: 'select',
        options: [
          { value: 'batch', label: '批量导入' },
          { value: 'stream', label: '流式导入' },
          { value: 'hybrid', label: '混合导入' }
        ]
      },
      {
        label: '安全策略',
        prop: 'securityPolicy',
        type: 'select',
        options: [
          { value: 'basic', label: '基础策略' },
          { value: 'advanced', label: '高级策略' },
          { value: 'custom', label: '自定义策略' }
        ]
      }
    ]
  }
}

export function getEditForm(node) {
  const category = node.getData()?.category;
  
  if (!category || !formConfig[category]) {
    return {
      fields: [
        {
          prop: 'label',
          label: '节点名称',
          type: 'text'
        }
      ],
      data: {
        label: node.label || ''
      }
    };
  }

  const config = formConfig[category];
  const nodeData = node.getData() || {};
  
  // 构建表单数据，优先使用节点已有数据
  const formData = {};
  config.fields.forEach(field => {
    formData[field.prop] = nodeData[field.prop] || '';
  });

  return {
    fields: config.fields,
    data: {
      label: node.label || '',
      ...formData
    }
  };
}