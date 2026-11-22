import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Bounds, Center, Html, OrbitControls, useGLTF } from '@react-three/drei'
import './MotorViewer.css'
import ModelErrorBoundary from './ModelErrorBoundary'
import ModelLoadingOverlay from './ModelLoadingOverlay'
import { MODELOS_3D } from '../config/modelos3d'
import { PUNTOS_MOTOR_D17A2 } from '../data/puntosMotorD17A2'

const MODEL = MODELOS_3D.hondaD17A2

function isValidPoint(point) {
  return point !== null &&
    typeof point === 'object' &&
    typeof point.id === 'string' &&
    Boolean(point.id.trim()) &&
    ['nombre', 'sistema', 'descripcion'].every(field =>
      typeof point[field] === 'string' && Boolean(point[field].trim())
    ) &&
    Array.isArray(point.posicion) &&
    point.posicion.length === 3 &&
    point.posicion.every(Number.isFinite)
}

const pointIds = new Set()
const PUNTOS_VALIDOS = (Array.isArray(PUNTOS_MOTOR_D17A2) ? PUNTOS_MOTOR_D17A2 : [])
  .filter(point => {
    if (!isValidPoint(point) || pointIds.has(point.id)) return false
    pointIds.add(point.id)
    return true
  })


function Hotspot({
  point,
  selected,
  hovered,
  onSelect,
  onHover
}) {
  return (
    <group position={point.posicion}>
      <mesh
        scale={selected || hovered ? 1.18 : 1}
        onClick={event => {
          event.stopPropagation()
          onSelect(point.id)
        }}
        onPointerOver={event => {
          event.stopPropagation()
          onHover(point.id)
        }}
        onPointerOut={event => {
          event.stopPropagation()
          onHover(null)
        }}
      >
        <sphereGeometry args={[0.045, 12, 12]} />
        <meshBasicMaterial
          color={
            selected
              ? '#ff4b45'
              : hovered
                ? '#ff7777'
                : '#d62828'
          }
        />
      </mesh>
      <Html center style={{ pointerEvents: 'none' }}>
        <span
          className={
            `motor-hotspot-icon${selected ? ' is-selected' : ''}${hovered ? ' is-hovered' : ''}`
          }
        >
          i
        </span>
      </Html>
    </group>
  )
}


function EngineModel({
  onReady,
  onCapturePoint,
  captureMode,
  selectedId,
  onSelect,
  hoveredId,
  onHover,
}) {
  const modelRoot = useRef(null)
  const { scene } = useGLTF(MODEL)
  useEffect(() => {
    onReady()
  }, [onReady, scene])

  const handleModelClick = useCallback(event => {
    if (!captureMode || !event.nativeEvent.altKey || !modelRoot.current) return

    event.stopPropagation()
    const localPoint = modelRoot.current.worldToLocal(event.point.clone())
    onCapturePoint(localPoint.toArray().map(value => Number(value.toFixed(4))))
  }, [captureMode, onCapturePoint])

  return (
    <group ref={modelRoot}>
      <primitive
        object={scene}
        onClick={import.meta.env.DEV && captureMode ? handleModelClick : undefined}
      />
      {PUNTOS_VALIDOS.map(point => (
        <Hotspot
          key={point.id}
          point={point}
          selected={selectedId === point.id}
          hovered={hoveredId === point.id}
          onSelect={onSelect}
          onHover={onHover}
        />
      ))}
    </group>
  )
}

export default function MotorViewer({ vehicleName = 'Motor Honda D17A2' }) {
  const [selectedId, setSelectedId] = useState(null)
  const [hoveredId, setHoveredId] = useState(null)
  const [captureMode, setCaptureMode] = useState(false)
  const [capturedPoint, setCapturedPoint] = useState(null)
  const [copyMessage, setCopyMessage] = useState('')
  const [retryCount, setRetryCount] = useState(0)
  const [loadState, setLoadState] = useState({
    loading: true,
    error: '',
  })

  const onModelReady = useCallback(() => {
    setLoadState({ loading: false, error: '' })
  }, [])

  const onModelError = useCallback(error => {
    console.error(`Error cargando modelo 3D del motor (${MODEL}):`, error)
    setLoadState({
      loading: false,
      error: 'Comprueba la conexión e inténtalo de nuevo.',
    })
  }, [])

  const retryModel = useCallback(() => {
    setLoadState({ loading: true, error: '' })
    useGLTF.clear(MODEL)
    setRetryCount(count => count + 1)
  }, [])

  const capturePoint = useCallback(point => {
    setCapturedPoint(point)
    setCopyMessage('')
  }, [])

  async function copyCapturedPoint() {
    if (!capturedPoint) return

    try {
      await navigator.clipboard.writeText(`[${capturedPoint.join(', ')}]`)
      setCopyMessage('Coordenadas copiadas.')
    } catch (error) {
      console.error('No se pudieron copiar las coordenadas:', error)
      setCopyMessage('No se pudieron copiar automáticamente; selecciona y copia las coordenadas.')
    }
  }

  const selectedPoint = PUNTOS_VALIDOS.find(point => point.id === selectedId)

  return (
    <section className="motor-viewer">
      <div className="motor-viewer-heading">
        <div>
          <span>MOTOR INTERACTIVO</span>
          <h2>Motor Honda D17A2</h2>
          <p>Explora el motor completo. Gira y acerca el modelo.</p>
        </div>
        <span className="motor-format">MODELO 3D</span>
      </div>

      <div className={`motor-canvas${hoveredId ? ' has-hotspot-hover' : ''}`}>
        <Canvas
          frameloop="demand"
          camera={{ position: [0, 1.5, 4], fov: 45 }}
          dpr={1}
          shadows={false}
          gl={{ powerPreference: 'high-performance' }}
        >
          <color attach="background" args={['#283818']} />
          <ambientLight intensity={1.5} />
          <directionalLight
            position={[4, 6, 5]}
            intensity={2}
          />
          <directionalLight position={[-4, 2, -3]} intensity={0.8} />

          <ModelErrorBoundary key={`${MODEL}:${retryCount}`} onError={onModelError}>
            <Suspense fallback={null}>
              <Bounds fit clip observe margin={1.25}>
                <Center>
                  <EngineModel
                    onReady={onModelReady}
                    onCapturePoint={capturePoint}
                    captureMode={captureMode}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                    hoveredId={hoveredId}
                    onHover={setHoveredId}
                  />
                </Center>
              </Bounds>
            </Suspense>

            <OrbitControls
              makeDefault
              enableDamping
              minDistance={1}
              maxDistance={10}
            />
          </ModelErrorBoundary>
        </Canvas>

        <ModelLoadingOverlay
          loading={loadState.loading}
          progress={null}
          vehicleName={vehicleName}
          error={loadState.error}
          onRetry={retryModel}
          attemptKey={retryCount}
        />

        <div className="motor-controls-hint">
          Arrastra para girar · Rueda para acercar
        </div>
      </div>

      <div className="motor-selection">
        {selectedPoint ? (
          <div className="motor-information" aria-live="polite">
            <div>
              <span>SISTEMA · {selectedPoint.sistema}</span>
              <h3>{selectedPoint.nombre}</h3>
              <p>{selectedPoint.descripcion}</p>
            </div>
            <button type="button" onClick={() => setSelectedId(null)}>
              Quitar selección
            </button>
          </div>
        ) : (
          <>
            <p>Selecciona una pieza resaltable para consultar su información.</p>
            {PUNTOS_VALIDOS.length === 0 && (
              <small>No hay ubicaciones confirmadas; el motor completo permanece visible.</small>
            )}
          </>
        )}
      </div>

      {import.meta.env.DEV && (
        <div className="motor-dev-capture" aria-live="polite">
          <strong>Captura de coordenadas (desarrollo)</strong>
          <p>
            {captureMode
              ? 'Modo activo: mantén Alt y haz clic sobre el motor. Desactívalo con el botón cuando termines.'
              : 'Activa el modo para capturar una coordenada con Alt + clic; así el motor no participa en el raycasting normalmente.'}
          </p>
          <button
            type="button"
            className="motor-capture-toggle"
            aria-pressed={captureMode}
            onClick={() => setCaptureMode(active => !active)}
          >
            {captureMode ? 'Desactivar captura' : 'Activar captura'}
          </button>
          {capturedPoint && (
            <div className="motor-capture-result">
              <code>[{capturedPoint.join(', ')}]</code>
              <button type="button" onClick={copyCapturedPoint}>Copiar coordenadas</button>
              {copyMessage && <small role="status">{copyMessage}</small>}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
