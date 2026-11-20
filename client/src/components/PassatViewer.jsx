import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

export default function PassatViewer({
  modelPath = '/models/passat_2010/car/base_basic_shaded.glb',
}) {
  const containerRef = useRef(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    let disposed = false
    let frameId = 0
    let model = null

    setError('')
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(38, 1, 0.01, 1000)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.1
    container.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.07
    controls.maxPolarAngle = Math.PI * 0.9

    scene.add(new THREE.HemisphereLight(0xffffff, 0x616b7a, 2.4))
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.1)
    keyLight.position.set(5, 8, 7)
    scene.add(keyLight)
    const fillLight = new THREE.DirectionalLight(0xffffff, 1.2)
    fillLight.position.set(-6, 4, -5)
    scene.add(fillLight)

    // Encuadre correcto según el tamaño y la proporción del contenedor.
    const fitModel = () => {
      if (!model) return
      const bounds = new THREE.Box3().setFromObject(model)
      if (bounds.isEmpty()) return

      const center = bounds.getCenter(new THREE.Vector3())
      const size = bounds.getSize(new THREE.Vector3())
      model.position.sub(center)

      // Volvemos a medir una vez centrado el vehículo.
      const centeredBounds = new THREE.Box3().setFromObject(model)
      const corners = []
      for (const x of [centeredBounds.min.x, centeredBounds.max.x]) {
        for (const y of [centeredBounds.min.y, centeredBounds.max.y]) {
          for (const z of [centeredBounds.min.z, centeredBounds.max.z]) {
            corners.push(new THREE.Vector3(x, y, z))
          }
        }
      }
      const direction = new THREE.Vector3(1, 0.45, 1).normalize()
      const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), direction).normalize()
      const up = new THREE.Vector3().crossVectors(direction, right).normalize()
      const verticalTan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))
      const horizontalTan = verticalTan * camera.aspect
      let distance = 0
      for (const corner of corners) {
        const depth = corner.dot(direction)
        distance = Math.max(
          distance,
          depth + Math.abs(corner.dot(right)) / horizontalTan,
          depth + Math.abs(corner.dot(up)) / verticalTan,
        )
      }
      distance = Math.max(distance * 1.12, 0.1)
      camera.position.copy(direction.multiplyScalar(distance))
      camera.near = Math.max(distance / 1000, 0.001)
      camera.far = Math.max(distance * 20, size.length() * 10)
      camera.updateProjectionMatrix()
      controls.target.set(0, 0, 0)
      controls.minDistance = Math.max(distance * 0.3, 0.01)
      controls.maxDistance = distance * 4
      controls.update()
    }

    const resize = () => {
      const width = Math.max(container.clientWidth, 1)
      const height = Math.max(container.clientHeight, 1)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height, false)
      fitModel()
    }
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(container)
    resize()

    const loader = new GLTFLoader()
    loader.load(
      modelPath,
      gltf => {
        if (disposed) {
          gltf.scene.traverse(obj => {
            obj.geometry?.dispose()
            const mats = obj.material ? (Array.isArray(obj.material) ? obj.material : [obj.material]) : []
            mats.forEach(mat => mat.dispose())
          })
          return
        }
        model = gltf.scene
        scene.add(model)
        if (new THREE.Box3().setFromObject(model).isEmpty()) {
          setError('El archivo 3D no contiene geometría visible.')
          return
        }
        fitModel()
      },
      undefined,
      err => {
        if (!disposed) {
          console.error('Error cargando GLB del Passat:', err)
          setError(`No se pudo cargar el modelo: ${modelPath}`)
        }
      },
    )

    const animate = () => {
      if (disposed) return
      frameId = requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      disposed = true
      cancelAnimationFrame(frameId)
      resizeObserver.disconnect()
      controls.dispose()
      if (model) {
        model.traverse(obj => {
          obj.geometry?.dispose()
          const mats = obj.material ? (Array.isArray(obj.material) ? obj.material : [obj.material]) : []
          mats.forEach(mat => {
            Object.values(mat).forEach(val => {
              if (val?.isTexture) val.dispose()
            })
            mat.dispose()
          })
        })
      }
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [modelPath])

  return (
    <div style={{ width: '100%', height: '360px', minHeight: '280px', position: 'relative' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%', cursor: 'grab' }} />
      {error && <p role="alert" style={{ position: 'absolute', inset: 'auto 12px 12px', color: '#fca5a5', background: '#161a20', padding: '10px', borderRadius: '8px' }}>{error}</p>}
    </div>
  )
}
