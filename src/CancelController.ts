export interface CancelControllerInterface {
  cancel(): void;
  onCancel(fn: Function): void;
}

class CancelController implements CancelControllerInterface {
  private promise: Promise<void>
  private resolve: () => void = () => {}

  constructor() {
    this.promise = new Promise<void>(resolve => this.resolve = resolve)
  }

  cancel(): void {
    this.resolve()
  }

  onCancel(fn: Function): void {
    this.promise.then(() => fn())
  }
}

export default CancelController

