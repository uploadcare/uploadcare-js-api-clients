class CancelController {
  private promise: Promise<void>
  private resolve: () => void = () => void 0

  constructor() {
    this.promise = new Promise<void>((resolve) => {
      this.resolve = resolve
    })
  }

  cancel(): void {
    this.resolve()
  }

  onCancel(fn: () => void): void {
    this.promise.then(fn)
  }
}

export default CancelController
