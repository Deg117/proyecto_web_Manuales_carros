import { useEffect, useRef, useState } from 'react'

export default function VehicleDetailLayout({
    vehicle,
    viewer,
    isInteractive,
    motorViewer,
    isFavorite,
    favoriteBusy,
    favoritesError,
    onFavoriteToggle,
    onBack,
    transmissions,
    selectedTransmission,
    onTransmissionChange,
    activeTab,
    onTabChange,
    children,
}) {
    const showcaseRef = useRef(null)
    const [fullscreen, setFullscreen] = useState(false)
    const [fullscreenError, setFullscreenError] = useState('')

    useEffect(() => {
        const updateFullscreen = () => {
            setFullscreen(document.fullscreenElement === showcaseRef.current)
        }

        document.addEventListener('fullscreenchange', updateFullscreen)
        return () => document.removeEventListener('fullscreenchange', updateFullscreen)
    }, [])

    async function toggleFullscreen() {
        setFullscreenError('')

        try {
            if (document.fullscreenElement === showcaseRef.current) {
                await document.exitFullscreen()
            } else if (showcaseRef.current?.requestFullscreen) {
                await showcaseRef.current.requestFullscreen()
            } else {
                setFullscreenError('La pantalla completa no está disponible en este navegador.')
            }
        } catch (error) {
            console.error('No se pudo cambiar el modo de pantalla completa:', error)
            setFullscreenError('No se pudo activar la pantalla completa.')
        }
    }

    return (
        <>
            <button className="back" onClick={onBack}>
                ‹ Volver al catálogo
            </button>

            <section className="vehicle-detail-heading">
                <div className="vehicle-detail-copy">
                    <div className="eyebrow"><i />FICHA DEL VEHÍCULO</div>
                    <h1>
                        {vehicle.make} <em>{vehicle.model}</em>
                        {vehicle.year != null && <> <span>{vehicle.year}</span></>}
                    </h1>
                    <div className="vehicle-detail-meta">
                        <span><small>MARCA</small>{vehicle.make || 'Pendiente de registrar'}</span>
                        <span><small>MODELO</small>{vehicle.model || 'Pendiente de registrar'}</span>
                        <span><small>AÑO</small>{vehicle.year ?? 'Pendiente de registrar'}</span>
                        <span><small>VERSIÓN</small>{vehicle.trim || 'Pendiente de registrar'}</span>
                    </div>
                    {vehicle.description && (
                        <p className="vehicle-description">{vehicle.description}</p>
                    )}
                </div>

                <button
                    type="button"
                    className={`favorite-toggle vehicle-detail-favorite ${isFavorite ? 'is-favorite' : ''}`}
                    aria-label={isFavorite
                        ? `Quitar ${vehicle.make} ${vehicle.model} de favoritos`
                        : `Guardar ${vehicle.make} ${vehicle.model} en favoritos`}
                    aria-pressed={isFavorite}
                    title={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                    onClick={onFavoriteToggle}
                    disabled={favoriteBusy}
                >
                    {isFavorite ? '♥' : '♡'}
                </button>
            </section>

            {favoritesError && (
                <p className="error" role="alert">{favoritesError}</p>
            )}

            <section
                className="vehicle-showcase"
                ref={showcaseRef}
                aria-label={`Vista de ${vehicle.make} ${vehicle.model}`}
            >
                <div className="vehicle-viewer-frame">{viewer}</div>
                <button
                    type="button"
                    className="vehicle-fullscreen"
                    onClick={toggleFullscreen}
                    aria-label={fullscreen ? 'Salir de pantalla completa' : 'Ver en pantalla completa'}
                >
                    {fullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
                </button>
                <p className="vehicle-viewer-hint">
                    {isInteractive
                        ? 'Arrastra para rotar · Rueda o pellizca para acercar'
                        : 'Vista de referencia'}
                </p>
            </section>
            {fullscreenError && <p className="error" role="alert">{fullscreenError}</p>}

            {motorViewer}

            <section className="choice vehicle-transmission">
                <div>
                    <div className="eyebrow"><i />CONFIGURACIÓN</div>
                    <h2>Elige tu transmisión</h2>
                </div>
                <div>
                    {transmissions.length ? transmissions.map(item => (
                        <button
                            className={selectedTransmission === item ? 'chosen' : ''}
                            key={item}
                            onClick={() => onTransmissionChange(item)}
                        >
                            {item}
                        </button>
                    )) : (
                        <span className="transmission-pending">Pendiente de registrar</span>
                    )}
                </div>
            </section>

            <div className="tabs">
                <button
                    className={activeTab === 'specs' || activeTab === 'catalogo' ? 'chosen' : ''}
                    onClick={() => onTabChange('specs')}
                >
                    Especificaciones
                </button>
                <button
                    className={activeTab === 'mantenimiento' ? 'chosen' : ''}
                    onClick={() => onTabChange('mantenimiento')}
                >
                    Mantenimiento
                </button>
                <button
                    className={activeTab === 'documentos' ? 'chosen' : ''}
                    onClick={() => onTabChange('documentos')}
                >
                    Documentos
                </button>
            </div>

            <div className="vehicle-detail-content">{children}</div>
        </>
    )
}
