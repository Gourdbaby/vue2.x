class Observer {
  constructor(data){
    this.data = data
    this.observe(data) // 进行劫持
  }

  observe(data){
    if(!data || typeof data !== 'object') return false
    Object.keys(data).forEach(key => {
      this.defineReactive(data, key, data[key]) // 定义响应式
      if(typeof data[key] === 'object'){
        this.observe(data[key])
      }
    })
  }

  defineReactive(data, key, value){
    const that = this
    const dep = new Dep()
    Object.defineProperty(data, key, {
      enumerable: true, // 可枚举
      configurable: true, // 可删除
      get(){
        Dep.target && dep.addSub(Dep.target) // 收集当前属性依赖的watcher
        return value
      },
      set(newValue){
        if(newValue !== value){
          that.observe(newValue) // 在修改对象属性的时候如果设置的是另一个对象就再继续劫持
          value = newValue
          dep.notify() // 通知当前属性依赖的watcher 值改变了 触发更新
        }
      }
    })
  }
}

//  增加一个发布订阅的逻辑 把属性依赖的watcher都放入数组里，数据一变化，循环执行watcher的update方法
class Dep {
  constructor(){
    this.subs = [] //订阅数组
  }

  addSub(watcher){
    this.subs.push(watcher)
  }

  notify(){
    this.subs.forEach(watch => watch.update())
  }
}