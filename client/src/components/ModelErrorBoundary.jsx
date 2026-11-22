import { Component } from 'react'

export default class ModelErrorBoundary extends Component {
    state = { hasError: false }

    static getDerivedStateFromError() {
        return { hasError: true }
    }

    componentDidCatch(error) {
        this.props.onError(error)
    }

    render() {
        return this.state.hasError ? null : this.props.children
    }
}
