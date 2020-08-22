export class SelfVue {

	constructor(config) {
		this.template = document.querySelector(config.el)
		this.data = reactive(config.data)
		this.traversal(this.template)
	}

	traversal(node) {
		// 文本节点
		if (node.nodeType === Node.TEXT_NODE) {
			// {{ data }} 替换数据
			if (node.textContent.match(/^{{([\s\S]+)}}$/)) {
				let name = RegExp.$1.trim()
				effect(() => node.textContent = this.data[name])
			}
		}
		// 元素节点
		if (node.nodeType === Node.ELEMENT_NODE) {

			// 元素节点所有属性
			let attributes = node.attributes

			for (let attribute of attributes) {
				// 增加v-model指令
				if (attribute.name === 'v-model') {
					let name = attribute.value
					effect(() => node.value = this.data[name])
					node.addEventListener('input', event => this.data[name] = node.value)
				}
				// ...可拓展指令
			}
		}
		// 递归节点
		if (node.childNodes && node.childNodes.length) {
			for (let child of node.childNodes) {
				this.traversal(child)
			}
		}
	}
}


let effects = new Map()
let currentEffect = null;

function effect(fn) {
	currentEffect = fn
	fn()
	currentEffect = null
}

console.log('effects', effects);

function reactive(object) {
	// 数据劫持
	let observed = new Proxy(object, {

		get(object, property) {
			if (currentEffect) {
				if (!effects.has(object)) effects.set(object, new Map)
				if (!effects.get(object).has(property)) effects.get(object).set(property, new Array)

				effects.get(object).get(property).push(currentEffect)
			}
			return object[property]
		},

		set(object, property, value) {
			object[property] = value;
			if (effects.has(object) && effects.get(object).has(property)) {
				for (let effect of effects.get(object).get(property)) {
					effect()
				}
			}
			return true
		}
	})

	return observed
}