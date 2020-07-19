class Vue {
  constructor({ el, data }){
    this.$el = el
    this.$data = data

    if(this.$el){ // 如果有el才进行编译
      new Observer(this.$data) // 编译之前 先进行数据劫持
      this.proxyData(this.$data) // 把所有的属性代理到当前的vue实力上
      new Compile(this.$el, this) // 直接把this传过去，方便访问 vue 实例
    }
  }

  proxyData(data){
    Object.keys(data).forEach(key => {
      Object.defineProperty(this, key, {
        get(){
          return data[key]
        },
        set(newValue){
          data[key] = newValue
        }
      })
    })
  }
}