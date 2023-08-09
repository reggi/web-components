/// <reference lib="dom" />

class InputRepeatComponent extends HTMLElement {
  repeatCount: number
  innerHTMLCache: string
  
  name = ''
  action = ''
  method = ''
  values = []
  repeat = 0
  itemLength = 0
  observer: MutationObserver | undefined
  cacheSet = false
  namespace = 'input-repeat'

  get container () {
    return this.dataAttribute('container')
  }
  get newLine () {
    return this.dataAttribute('create-new-line')
  }
  get item () {
    return this.dataAttribute('item')
  }
  get selectorRemove () {
    return this.dataAttribute('remove')
  }
  get up () {
    return this.dataAttribute('up')
  }
  get down () {
    return this.dataAttribute('down')
  }

  constructor() {
    super()
    this.repeatCount = 0
    this.innerHTMLCache = ''
  }

  connectedCallback() {
    this.namespace = this.getAttribute('data-namespace') || 'input-repeat'
    this.name = this.getAttribute('data-name') || ''
    this.values = JSON.parse(this.getAttribute('data-values') || '[]');
    this.repeat = parseInt(this.getAttribute('data-repeat') || '0')
    this.itemLength = Math.max(this.values.length, this.repeat);
    this.observer = new MutationObserver(() => this.render());
    this.observer.observe(this, { childList: true, subtree: true });
    this.render();
  }

  disconnectedCallback() {
    if (this.observer) this.observer.disconnect();
  }

  dataAttribute (name: string) {
    const value = ['data', this.namespace, name].join('-')
    const selector = `[${value}]`
    return {value, selector}
  }

  render() {
    if (this.cacheSet) return;
    if (this.innerHTMLCache === this.innerHTML) return; // prevent infinite loop
    
    this.innerHTMLCache = this.innerHTML;
    this.cacheSet = true;
    this.innerHTML = `<div ${this.container.value}></div>`

    const newLineMatch = document.querySelector(this.newLine.selector)
    if (!newLineMatch) this.innerHTML += `<button type="button" ${this.newLine.value}>Add New Line</button>`

    const values = this.values
    this.repeatCount = this.itemLength
    for (let i = 0; i < this.repeatCount; i++) {
      this.addNewLine(values && values[i] || {}, i);
    }
    this.repeatCount = values.length - 1
    const newLineDocMatch = document.querySelector(this.newLine.selector)
    if (newLineDocMatch) newLineDocMatch.addEventListener('click', () => this.add());
  }

  addNewLine(data: Record<string, string> = {}, id: number) {
    const container = this.querySelector(this.container.selector)
    if (!container) return

    const element = document.createElement('div')
    element.setAttribute(this.item.value, 'true')

    // Create a temporary container to parse the innerHTMLCache
    const tempContainer = document.createElement('div');
    tempContainer.innerHTML = this.innerHTMLCache;

    // Iterate over the data object and set attributes on the elements inside tempContainer
    Object.entries(data).forEach(([key, value]) => {
      const targetSelector = `${this.name}[${id}][${key}]`;
      const item = tempContainer.querySelector(`input[name="${key}"]`);
      if (!item) return
      item.setAttribute('value', value);
      item.setAttribute('name', targetSelector);
    });

    tempContainer.querySelectorAll('input').forEach((input) => {
      if (input.value) return
      const key = input.getAttribute('name')
      const targetSelector = `${this.name}[${id}][${key}]`;
      const item = tempContainer.querySelector(`input[name="${key}"]`);
      if (!item) return
      item.setAttribute('name', targetSelector);
    });

    // Add the modified content to the repeated element
    element.innerHTML = tempContainer.innerHTML;

    const removeMatch = tempContainer.querySelector(this.selectorRemove.selector)
    if (!removeMatch) element.innerHTML += `<button ${this.selectorRemove.value}>Remove</button>`

    const upMatch = tempContainer.querySelector(this.up.selector)
    if (!upMatch) element.innerHTML += `<button ${this.up.value}>Up</button>`

    const downMatch = tempContainer.querySelector(this.down.selector)
    if (!downMatch) element.innerHTML += `<button ${this.down.value}>Down</button>`

    element.querySelector(this.selectorRemove.selector)?.addEventListener('click', () => this.removeElement(element));
    element.querySelector(this.up.selector)?.addEventListener('click', () => this.moveUp(element));
    element.querySelector(this.down.selector)?.addEventListener('click', () => this.moveDown(element));

    container.appendChild(element);
  }

  add () {
    this.repeatCount = this.repeatCount + 1
    this.addNewLine({}, this.repeatCount)
  }

  removeElement(element: HTMLElement) {
    element.remove()
    this.repeatCount = this.repeatCount - 1
  }

  moveUp(element: HTMLElement) {
    if (element === element.parentElement?.firstElementChild) {
      element.parentElement.appendChild(element);
    } else {
      element.parentElement?.insertBefore(element, element.previousElementSibling);
    }
  }

  moveDown(element: HTMLElement) {
    if (element === element.parentElement?.lastElementChild) {
      element.parentElement.insertBefore(element, element.parentElement.firstElementChild);
    } else {
      if (element.nextElementSibling) {
        element.parentElement?.insertBefore(element.nextElementSibling, element);
      }
    }
  }
}

customElements.define('input-repeat', InputRepeatComponent);