// Mini event-bus para toasts y barra de carga global.
// Usa CustomEvent del DOM para no requerir un context provider de React.
// Cualquier componente/funcion puede dispatch sin saber del estado interno.

export function notify(type, msg) {
  window.dispatchEvent(new CustomEvent('app:toast', {
    detail: { type, msg, id: Date.now() + Math.random() }
  }))
}

notify.ok = (msg) => notify('ok', msg)
notify.err = (msg) => notify('err', msg)
notify.info = (msg) => notify('info', msg)

export function loadingStart() {
  window.dispatchEvent(new Event('app:loading-start'))
}

export function loadingEnd() {
  window.dispatchEvent(new Event('app:loading-end'))
}
