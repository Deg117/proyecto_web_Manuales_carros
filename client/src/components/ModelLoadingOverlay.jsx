import { useEffect, useState } from 'react'
import './ModelLoadingOverlay.css'

export default function ModelLoadingOverlay({
    loading,
    progress = null,
    vehicleName,
    error = '',
    onRetry,
    attemptKey,
}) {
    const [timedOutAttempt, setTimedOutAttempt] = useState(null)

    useEffect(() => {
        if (!loading) return undefined

        const timeoutId = window.setTimeout(() => {
            console.error(`Tiempo de espera agotado al cargar el modelo 3D (${vehicleName || 'vehículo sin nombre'}).`)
            setTimedOutAttempt(attemptKey)
        }, 120000)

        return () => window.clearTimeout(timeoutId)
    }, [attemptKey, loading, vehicleName])

    const timedOut = loading && timedOutAttempt === attemptKey
    const displayedError = error || (timedOut
        ? 'La carga está tardando demasiado. Comprueba la conexión e inténtalo de nuevo.'
        : '')

    if (!loading && !displayedError) return null

    return (
        <div
            className={`model-loading-overlay ${displayedError ? 'has-error' : ''}`}
            role={displayedError ? 'alert' : 'status'}
            aria-live="polite"
        >
            <svg
                className="model-loading-icon"
                viewBox="0 0 48 48"
                fill="none"
                aria-hidden="true"
            >
                <path d="m24 4 18 10v20L24 44 6 34V14L24 4Z" />
                <path d="m6 14 18 10 18-10M24 24v20M15 9l18 10" />
            </svg>

            {displayedError ? (
                <>
                    <strong>No se pudo cargar el modelo 3D</strong>
                    {vehicleName && <span className="model-loading-name">{vehicleName}</span>}
                    <span className="model-loading-error">{displayedError}</span>
                    <button type="button" className="model-loading-retry" onClick={onRetry}>
                        Reintentar
                    </button>
                </>
            ) : (
                <>
                    <strong>Cargando modelo 3D</strong>
                    {vehicleName && <span className="model-loading-name">{vehicleName}</span>}
                    <div
                        className="model-loading-track"
                        role="progressbar"
                        aria-label="Progreso de descarga del modelo 3D"
                        aria-valuemin="0"
                        aria-valuemax="100"
                        {...(progress == null ? {} : { 'aria-valuenow': progress })}
                    >
                        <span
                            className={`model-loading-bar ${progress == null ? 'is-indeterminate' : ''}`}
                            style={progress == null ? undefined : { width: `${progress}%` }}
                        />
                    </div>
                    <span className="model-loading-status">
                        {progress == null
                            ? 'Preparando modelo...'
                            : progress === 100
                                ? 'Descarga completa · preparando modelo...'
                                : `${progress}% descargado`}
                    </span>
                </>
            )}
        </div>
    )
}
