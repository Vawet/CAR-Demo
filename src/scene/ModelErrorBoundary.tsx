import { Component, type ReactNode } from 'react'

interface Props {
  onError: (error: Error) => void
  children: ReactNode
}

/** 位于 Canvas 内部，出错时不渲染 3D 内容，由外层 DOM 展示错误信息 */
export class ModelErrorBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: Error) {
    this.props.onError(error)
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}
