// vue 观察者模式，给劫持的数据增加一个观察者，如果数据变化了，就执行对应的方法，触发模板重新编译
// 在watcher中对比新值和老值 如果发生变化 就调用更新方法

class Watcher {
  constructor(vm, expr, cb){
    this.vm = vm
    this.expr = expr
    this.cb = cb

    this.value = this.getVal(vm, expr) // 获取老值
  }

  getVal(vm, expr){ // expr有可能是 message.a.b.c
    Dep.target = this
    // 在执行编译的时候，会去new Watcher，执行new Watcher会触发 this.value = this.getVal(vm, expr) // 获取老值
    // 这个时候把当前的watcher赋值给Dep的target属性
    // 获取值会触发对象属性的get方法，在get方法中，把当前属性依赖的watcher收集起来
    
    expr = expr.split('.') // [message, a, b, c]
    const value = expr.reduce((prev, current) => {
      return prev[current]
    }, vm.$data)

    Dep.target = null // get方法存储完watcher以后，清空watcher

    return value
  }

  update(){  // 对外暴露的更新方法
    const newValue = this.getVal(this.vm, this.expr) // 外部调用update的时候 重新获取值 这时取新值
    const oldValue = this.value
    if(newValue !== oldValue){
      this.cb() // 调用watcher的 cb
    }
  }
}