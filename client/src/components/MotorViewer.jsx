import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Bounds, Center, OrbitControls, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import './MotorViewer.css'
import ModelErrorBoundary from './ModelErrorBoundary'
import ModelLoadingOverlay from './ModelLoadingOverlay'
import { MODELOS_3D } from '../config/modelos3d'
import { MOTOR_D17A2_PIECES_BY_ID } from '../config/motorD17A2'

const MODEL = MODELOS_3D.hondaD17A2
const PENDING_INFORMATION = 'Información pendiente'

function inspectScene(scene) {
  const inventory = []

  scene.traverse(object => {
    if (!object.isGroup && !object.isMesh) return

    inventory.push({
      uuid: object.uuid,
      name: object.name || '(sin nombre)',
      type: object.isMesh ? 'Malla' : 'Grupo',
      selectable: Boolean(object.isMesh),
    })
  })

  return inventory
}

function SceneNode({
  object,
  onSelect,
  onHover,
  selectedId,
  hoveredId,
  pointerStartRef,
}) {
  const clonedMaterial = useMemo(() => {
    if (!object.isMesh || !object.material) return null

    return Array.isArray(object.material)
      ? object.material.map(material => material.clone())
      : object.material.clone()
  }, [object])

  useEffect(() => {
    if (!clonedMaterial) return undefined

    const materials = Array.isArray(clonedMaterial)
      ? clonedMaterial
      : [clonedMaterial]

    return () => materials.forEach(material => material.dispose())
  }, [clonedMaterial])

  useEffect(() => {
    if (!object.isMesh || !clonedMaterial) return

    const originals = Array.isArray(object.material)
      ? object.material
      : [object.material]
    const clones = Array.isArray(clonedMaterial)
      ? clonedMaterial
      : [clonedMaterial]
    const highlight = selectedId === object.uuid
      ? 'selected'
      : hoveredId === object.uuid
        ? 'hovered'
        : null

    clones.forEach((material, index) => {
      const original = originals[index]
      if (!original) return

      if (material.emissive && original.emissive) {
        material.emissive.copy(original.emissive)
        material.emissiveIntensity = original.emissiveIntensity

        if (highlight) {
          material.emissive.set(
            highlight === 'selected' ? '#ff421f' : '#c9473a',
          )
          material.emissiveIntensity = highlight === 'selected' ? 1.15 : 0.4
        }
      } else if (material.color && original.color) {
        material.color.copy(original.color)

        if (highlight) {
          material.color.lerp(
            new THREE.Color(
              highlight === 'selected' ? '#ff421f' : '#c9473a',
            ),
            highlight === 'selected' ? 0.42 : 0.2,
          )
        }
      }
    })
  }, [clonedMaterial, hoveredId, object, selectedId])

  const props = {
    name: object.name,
    position: object.position,
    quaternion: object.quaternion,
    scale: object.scale,
    visible: object.visible,
  }

  if (object.isMesh) {
    return (
      <mesh
        {...props}
        geometry={object.geometry}
        material={clonedMaterial || object.material}
        castShadow
        receiveShadow
        onPointerOver={event => {
          event.stopPropagation()
          onHover(object.uuid)
        }}
        onPointerOut={event => {
          event.stopPropagation()
          onHover(current => current === object.uuid ? null : current)
        }}
        onClick={event => {
          event.stopPropagation()
          const pointerStart = pointerStartRef.current
          pointerStartRef.current = null
          const moved = pointerStart && Math.hypot(
            event.clientX - pointerStart.x,
            event.clientY - pointerStart.y,
          ) > 6
          if (moved || event.delta > 6) return

          onSelect({
            id: object.uuid,
            name: object.name || '(sin nombre)',
            point: event.point.toArray(),
          })
        }}
      >
        {object.children.map(child => (
          <SceneNode
            key={child.uuid}
            object={child}
            onSelect={onSelect}
            onHover={onHover}
            selectedId={selectedId}
            hoveredId={hoveredId}
            pointerStartRef={pointerStartRef}
          />
        ))}
      </mesh>
    )
  }

  return (
    <group {...props}>
      {object.children.map(child => (
        <SceneNode
          key={child.uuid}
          object={child}
          onSelect={onSelect}
          onHover={onHover}
          selectedId={selectedId}
          hoveredId={hoveredId}
          pointerStartRef={pointerStartRef}
        />
      ))}
    </group>
  )
}

function EngineModel({
  onSelect,
  onHover,
  onReady,
  selectedId,
  hoveredId,
  pointerStartRef,
}) {
  const { scene } = useGLTF(MODEL)

  useEffect(() => {
    onReady(inspectScene(scene))
  }, [onReady, scene])

  return (
    <SceneNode
      object={scene}
      onSelect={onSelect}
      onHover={onHover}
      selectedId={selectedId}
      hoveredId={hoveredId}
      pointerStartRef={pointerStartRef}
    />
  )
}

function SelectionMarker({ point }) {
  if (!point) return null

  return (
    <group position={point}>
      <mesh>
        <sphereGeometry args={[0.025, 20, 20]} />
        <meshBasicMaterial color="#ff9b72" />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.055, 20, 20]} />
        <meshBasicMaterial
          color="#ff421f"
          transparent
          opacity={0.22}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  )
}

export default function MotorViewer({ vehicleName = 'Motor Honda D17A2' }) {
  const canvasContainerRef = useRef(null)
  const pointerStartRef = useRef(null)
  const [inventory, setInventory] = useState([])
  const [selected, setSelected] = useState(null)
  const [hoveredId, setHoveredId] = useState(null)
  const [retryCount, setRetryCount] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [fullscreenError, setFullscreenError] = useState('')
  const [loadState, setLoadState] = useState({
    loading: true,
    error: '',
  })

  const selectableMeshes = useMemo(
    () => inventory.filter(item => item.selectable),
    [inventory],
  )

  const onModelReady = useCallback(nextInventory => {
    setInventory(nextInventory)
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
    setInventory([])
    setSelected(null)
    setHoveredId(null)
    setLoadState({ loading: true, error: '' })
    useGLTF.clear(MODEL)
    setRetryCount(count => count + 1)
  }, [])

  const clearSelection = useCallback(() => {
    setSelected(null)
  }, [])

  const handleCanvasPointerDown = useCallback(event => {
    if (event.target?.tagName !== 'CANVAS') return

    pointerStartRef.current = {
      x: event.clientX,
      y: event.clientY,
    }
  }, [])

  const handlePointerMissed = useCallback(() => {
    pointerStartRef.current = null
    clearSelection()
  }, [clearSelection])

  const handleFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement === canvasContainerRef.current) {
        await document.exitFullscreen()
      } else if (document.fullscreenElement) {
        throw new Error('Otro elemento ya está en pantalla completa.')
      } else if (canvasContainerRef.current?.requestFullscreen) {
        await canvasContainerRef.current.requestFullscreen()
      } else {
        throw new Error('Pantalla completa no compatible con este navegador.')
      }

      setFullscreenError('')
    } catch (error) {
      console.error('No se pudo cambiar el modo de pantalla completa:', error)
      setFullscreenError('No se pudo cambiar el modo de pantalla completa.')
    }
  }, [])

  useEffect(() => {
    const updateFullscreen = () => {
      setIsFullscreen(document.fullscreenElement === canvasContainerRef.current)
    }

    document.addEventListener('fullscreenchange', updateFullscreen)
    return () => document.removeEventListener('fullscreenchange', updateFullscreen)
  }, [])

  const selectedPiece = selected
    ? MOTOR_D17A2_PIECES_BY_ID[selected.name]
    : null

  return (
    <section className="motor-viewer" aria-label="Visor interactivo del motor Honda D17A2">
      <div className="motor-viewer-heading">
        <div>
          <span>MOTOR INTERACTIVO</span>
          <h2>Motor Honda D17A2</h2>
          <p>Selecciona una malla para resaltarla; arrastra para girar y usa la rueda para acercar.</p>
        </div>
        <span className="motor-format">MODELO 3D</span>
      </div>

      <div
        className="motor-canvas"
        ref={canvasContainerRef}
        onPointerDownCapture={handleCanvasPointerDown}
      >
        <Canvas
          camera={{ position: [0, 1.5, 4], fov: 45 }}
          shadows
          dpr={[1, 2]}
          onPointerMissed={handlePointerMissed}
        >
          <color attach="background" args={['#202631']} />
          <ambientLight intensity={1.5} />
          <directionalLight
            position={[4, 6, 5]}
            intensity={2}
            castShadow
          />
          <directionalLight position={[-4, 2, -3]} intensity={0.8} />

          <ModelErrorBoundary
            key={`${MODEL}:${retryCount}`}
            onError={onModelError}
          >
            <Suspense fallback={null}>
              <Bounds fit clip observe margin={1.25}>
                <Center>
                  <EngineModel
                    onSelect={setSelected}
                    onHover={setHoveredId}
                    onReady={onModelReady}
                    selectedId={selected?.id}
                    hoveredId={hoveredId}
                    pointerStartRef={pointerStartRef}
                  />
                </Center>
              </Bounds>
            </Suspense>

            <SelectionMarker point={selected?.point} />
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

        <button
          className="motor-fullscreen-button"
          type="button"
          onClick={handleFullscreen}
          aria-label={isFullscreen ? 'Salir de pantalla completa' : 'Ver motor en pantalla completa'}
        >
          {isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
        </button>

        <div className="motor-controls-hint">
          Arrastra para girar · Rueda para acercar · Clic para seleccionar
        </div>
      </div>

      {fullscreenError && (
        <p className="motor-fullscreen-error" role="alert">
          {fullscreenError}
        </p>
      )}

      <div className="motor-interaction-panels">
        <section className="motor-parts-panel" aria-label="Piezas seleccionables">
          <div className="motor-panel-heading">
            <div>
              <h3>Piezas del modelo</h3>
              <p>{selectableMeshes.length} mallas independientes detectadas</p>
            </div>
          </div>
          <p className="motor-parts-note">
            El GLB usa identificadores genéricos; sus nombres mecánicos y funciones aún no están verificados.
          </p>

          {selectableMeshes.length ? (
            <div className="motor-parts-list">
              {selectableMeshes.map(mesh => {
                const piece = MOTOR_D17A2_PIECES_BY_ID[mesh.name]
                const label = piece?.label || mesh.name
                const isSelected = selected?.id === mesh.uuid

                return (
                  <button
                    key={mesh.uuid}
                    type="button"
                    className={`motor-part-button${isSelected ? ' is-selected' : ''}`}
                    onClick={() => setSelected({
                      id: mesh.uuid,
                      name: mesh.name,
                      point: null,
                    })}
                    aria-pressed={isSelected}
                  >
                    <span>{label}</span>
                    <small>{mesh.name}</small>
                  </button>
                )
              })}
            </div>
          ) : (
            <p className="motor-parts-empty">
              No se detectaron mallas independientes para seleccionar.
            </p>
          )}
        </section>

        <section className="motor-selection" aria-live="polite">
          {selected ? (
            <>
              <div className="motor-component-info">
                <span className="motor-component-kicker">COMPONENTE SELECCIONADO</span>
                <h3>{selectedPiece?.label || selected.name}</h3>
                <small>Identificador del GLB: {selected.name}</small>
                <dl>
                  <div>
                    <dt>Función principal</dt>
                    <dd>{PENDING_INFORMATION}</dd>
                  </div>
                  <div>
                    <dt>Descripción técnica</dt>
                    <dd>{PENDING_INFORMATION}</dd>
                  </div>
                  <div>
                    <dt>Ubicación o sistema</dt>
                    <dd>{PENDING_INFORMATION}</dd>
                  </div>
                </dl>
              </div>
              <button type="button" onClick={clearSelection}>
                Quitar selección
              </button>
            </>
          ) : (
            <p>
              Selecciona una pieza en el modelo o en la lista. Su información técnica aparecerá aquí.
            </p>
          )}
        </section>
      </div>

      {import.meta.env.DEV && (
        <details className="motor-debug-inventory">
          <summary>Diagnóstico del GLB: nodos y mallas</summary>
          <p>
            Solo las mallas listadas como seleccionables se resaltan por separado.
            No se generan divisiones artificiales de geometría.
          </p>
          <p>
            La variante completa <code>engine/complete/motor_pbr.glb</code> contiene una
            sola malla <code>pieza_01</code>; no permite aislar componentes. El visor utiliza
            la variante local segmentada.
          </p>
          <ul>
            {inventory.map(item => (
              <li key={item.uuid}>
                <span>{item.type}</span>
                <code>{item.name}</code>
                <strong>{item.selectable ? 'Seleccionable' : 'Grupo contenedor'}</strong>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  )
}
