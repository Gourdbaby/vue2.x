class Compile {
  constructor(el, vm){
    this.el = this.isElementNode(el) ? el : document.querySelector(el)
    this.vm = vm

    if(this.el){
      const fragment = this.nodeToFragment(this.el) // 把整个el里面的元素 放到内存中 fragment
      this.compile(fragment) // 编译文档碎片
      this.el.appendChild(fragment)
    }
  }

  isElementNode(node){ // 验证当前传进来的el是否是节点类型
    return node.nodeType === 1
  }
  
  isDirective(name){ // 检查name是不是指令
    return name.includes('v-')
  }

  compileElement(node){
    // 编译元素就是 看 当前元素上有没有指令 例如：v-model
    const attrs = node.attributes // 获取当前节点的所有属性
    const attrsArr = Array.from(attrs)

    attrsArr.forEach(attr => {
      if(this.isDirective(attr.name)){ // 验证当前节点属性是不是指令
        // 取出指令对应的值，去$data中取出对应的值，放到节点的value上
        // 元素节点上有可能是 v-mode v-text v-html 等
        const value = attr.value
        const type = attr.name.slice(2) // 取出 model text html
        CompileUtil[type](node, this.vm, value)
      }
    })
  }

  compileText(node){
    // 编译文本 就是看文本有没有 {{  }}
    const text = node.textContent
    const reg = /\{\{([^}]+)\}\}/g

    if(reg.test(text)){
      CompileUtil['text'](node, this.vm, text)
    }
  } 

  compile(fragment){
    const childNodes = fragment.childNodes // 拿到fragment中所有的子节点
    const childNodesArr = Array.from(childNodes)
    childNodesArr.forEach(node => {
      if(this.isElementNode(node)){ // 如果是元素节点 编译元素 需要递归 子节点 继续编译元素
        this.compileElement(node)
        this.compile(node)
      }else{  // 文本节点
        this.compileText(node)
      }
    })
  }

  nodeToFragment(el){
    const fragment = document.createDocumentFragment()
    let firstChild;

    while(firstChild = el.firstChild){ // 把dom元素都放入到内存中 并返回
      fragment.appendChild(firstChild) 
    }

    return fragment // 操作 fragment 因为是在内存中 性能高，不会造成页面 Reflow Repaint
  }
}

// 编译工具
CompileUtil = {
  getVal(vm, expr){ // expr有可能是 message.a.b.c
    expr = expr.split('.') // [message, a, b, c]
    return expr.reduce((prev, current) => {
      return prev[current.replace(/^\s+|\s+$/g, '')]
    }, vm.$data)
  },
  getTextVal(vm, text){
    const reg = /\{\{([^}]+)\}\}/g
    return text.replace(reg, (...arguments) => {
      return this.getVal(vm, arguments[1])
    })
  },
  text(node, vm, text){ // 处理文本
    const reg = /\{\{([^}]+)\}\}/g
    // text 有可能是这样的值 {{ a }} {{ b }}，所以replace 匹配两次 一次a  一次b
    text.replace(reg, (...arguments) => {
      const format = arguments[1].replace(/^\s+|\s+$/g, '')
      new Watcher(vm, format, () => {
        // 这里调用this.getTextVal(vm, text)这个方法整体从新取值也是因为有可能是这个情况{{ a }} {{ b }}如果直接用新值，就发生丢数据的情况
        this.updater.textUpdater(node, this.getTextVal(vm, text)) // 更新视图
      })
    })

    const textVal = this.getTextVal(vm, text)
    this.updater.textUpdater(node, textVal)
  },
  setVal(vm, expr, newVal){ // 输入框v-model双向数据绑定
    expr = expr.split('.') // [message, a, b, c]
    return expr.reduce((prev, current, index) => {
      const format = current.replace(/^\s+|\s+$/g, '')
      if(index === expr.length - 1){ // 如果reduce走到了最后一个属性例如c 那就设置新值
        prev[format] = newVal
      }
      return prev[format]
    }, vm.$data)
  },
  model(node, vm, value){ // 处理输入框
    // 模板编译的时候 添加观察者，观察当前属性值的变化
    new Watcher(vm, value, () => { // 默认不会调用这个回调，在触发watcher的update，就会触发这个回调
      this.updater.modelUpdater(node, this.getVal(vm, value)) // 触发视图更新
    })
    node.addEventListener('input', (e) => {
      const newVal = e.target.value
      this.setVal(vm, value, newVal)
    })
    this.updater.modelUpdater(node, this.getVal(vm, value))
  },
  updater: {
    textUpdater(node, value){  // 更新文本
      node.textContent = value
    },
    modelUpdater(node, value){  // 更新数据
      node.value = value
    }
  }
}