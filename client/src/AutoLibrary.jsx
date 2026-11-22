import { useEffect, useMemo, useState } from 'react'
import './AutoLibrary.css'
import MotorViewer from './components/MotorViewer'
import CarViewer from './components/CarViewer'
import PassatViewer from './components/PassatViewer'
import VehicleDetailLayout from './components/VehicleDetailLayout'
import { MODELOS_3D, RESPALDOS_LOCALES } from './config/modelos3d'
import { useAuth } from './auth/AuthContext'
import AuthForm from './auth/AuthForm'
import {
    obtenerVehiculos,
    obtenerVehiculo
} from './lib/vehiculos'
import AdminPanel from './components/AdminPanel'
import {
    obtenerFavoritos,
    agregarFavorito,
    quitarFavorito,
    esIdVehiculoBigintValido
} from './lib/favoritos'
import './favoritos.css'
import './biblioteca.css'

function getDocumentUrl(filePath) {
    const path = filePath?.trim()
    if (!path) return null
    if (/^https?:\/\//i.test(path)) return path

    const baseUrl = import.meta.env.VITE_R2_MANUALES_BASE_URL?.trim().replace(/\/+$/, '')
    return baseUrl ? `${baseUrl}/${path.replace(/^\/+/, '')}` : null
}

function documentUrlError(filePath) {
    if (filePath && !/^https?:\/\//i.test(filePath.trim()) && !import.meta.env.VITE_R2_MANUALES_BASE_URL?.trim()) {
        return 'Falta configurar la variable VITE_R2_MANUALES_BASE_URL para acceder a los manuales PDF.'
    }

    return 'No se pudo acceder al PDF en Cloudflare R2. Verifica que el archivo exista y que el bucket permita solicitudes desde este sitio.'
}

function isCamaro1972(vehicle) {
    return vehicle?.make?.toLowerCase() === 'chevrolet' &&
        vehicle.model?.toLowerCase().includes('camaro') &&
        Number(vehicle.year) === 1972
}

function isCivic2003(vehicle) {
    return vehicle?.make?.toLowerCase() === 'honda' &&
        vehicle.model?.toLowerCase().includes('civic') &&
        Number(vehicle.year) === 2003
}

function isPassat2010(vehicle) {
    return vehicle?.make?.toLowerCase() === 'volkswagen' &&
        vehicle.model?.toLowerCase().includes('passat') &&
        Number(vehicle.year) === 2010
}

function isHyundaiI10(vehicle) {
    return vehicle?.make?.toLowerCase() === 'hyundai' &&
        vehicle.model?.toLowerCase().includes('i10')
}

function isFordFiesta2014(vehicle) {
    return vehicle?.make?.toLowerCase() === 'ford' &&
        vehicle.model?.toLowerCase().includes('fiesta') &&
        Number(vehicle.year) === 2014
}

function getVehicleImage(vehicle) {
    if (isCamaro1972(vehicle)) return '/images/Camaro.png'
    if (vehicle.make?.toLowerCase() === 'honda' && vehicle.model?.toLowerCase().includes('civic')) {
        return '/images/Civic.png'
    }
    if (vehicle.make?.toLowerCase() === 'volkswagen' && vehicle.model?.toLowerCase().includes('passat')) {
        return '/images/Passat.png'
    }
    if (isHyundaiI10(vehicle)) return '/images/i10.png'
    if (isFordFiesta2014(vehicle)) return '/images/fiesta.png'
    return vehicle.imageUrl || null
}

function VehicleDisplay({ vehicle }) {
    const vehicleName = [vehicle.make, vehicle.model, vehicle.year]
        .filter(value => value != null && value !== '')
        .join(' ')

    if (isCivic2003(vehicle)) {
        return (
            <CarViewer
                key="civic-2003"
                modelPath={MODELOS_3D.hondaCivic2003}
                fallbackModelPath={import.meta.env.DEV ? RESPALDOS_LOCALES.hondaCivic2003 : undefined}
                vehicleName={vehicleName}
            />
        )
    }
    if (isHyundaiI10(vehicle)) {
        return (
            <CarViewer
                key={MODELOS_3D.hyundaiI102025}
                modelPath={MODELOS_3D.hyundaiI102025}
                fallbackModelPath={import.meta.env.DEV ? RESPALDOS_LOCALES.hyundaiI102025 : undefined}
                vehicleName={vehicleName}
            />
        )
    }
    if (isFordFiesta2014(vehicle)) {
        return (
            <PassatViewer
                key="fiesta-2014"
                modelPath={MODELOS_3D.fordFiesta2014}
                vehicleName={vehicleName}
            />
        )
    }
    if (isCamaro1972(vehicle)) {
        return (
            <PassatViewer
                key="camaro-1972"
                modelPath={MODELOS_3D.chevroletCamaro1972}
                fallbackModelPath={import.meta.env.DEV ? RESPALDOS_LOCALES.chevroletCamaro1972 : undefined}
                vehicleName={vehicleName}
            />
        )
    }
    if (isPassat2010(vehicle)) {
        return (
            <PassatViewer
                key="passat-2010"
                modelPath={MODELOS_3D.volkswagenPassat2010}
                fallbackModelPath={import.meta.env.DEV ? RESPALDOS_LOCALES.volkswagenPassat2010 : undefined}
                vehicleName={vehicleName}
            />
        )
    }

    return <VehicleImage vehicle={vehicle} className="vehicle-reference-image" />
}

const P = {
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    car: <><path d="m5 11 2-5h10l2 5" /><path d="M3 11h18v7H3zM6 18v2m12-2v2" /></>,
    book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 1 4 17.5z" /><path d="M4 16h16" /></>,
    wrench: <path d="M14 6a5 5 0 0 0-6 6l-5 6 3 3 6-5a5 5 0 0 0 6-6l-4 3-3-3z" />,
    file: <><path d="M14 2H6a2 2 0 0 0-2 2v16h16V8z" /><path d="M14 2v6h6M8 13h8m-8 4h8" /></>,
    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
    back: <path d="m15 18-6-6 6-6" />
}

function Icon({ n }) {
    return (
        <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            {P[n]}
        </svg>
    )
}

function VehicleImage({ vehicle, className, compact = false }) {
    const source = getVehicleImage(vehicle)
    const [failedSource, setFailedSource] = useState('')
    const alt = `${vehicle.make} ${vehicle.model}${vehicle.year ? ` ${vehicle.year}` : ''}`

    if (!source || failedSource === source) {
        return <VehiclePlaceholder vehicle={vehicle} compact={compact} />
    }

    return (
        <img
            className={className}
            src={source}
            alt={alt}
            onError={() => setFailedSource(source)}
        />
    )
}

function VehiclePlaceholder({ vehicle, compact = false }) {
    const name = `${vehicle.make} ${vehicle.model}${vehicle.year ? ` ${vehicle.year}` : ''}`

    return (
        <div
            className={`vehicle-visual-placeholder${compact ? ' is-compact' : ''}`}
            role="img"
            aria-label={`Imagen de ${name} pendiente de registrar`}
        >
            <Icon n="car" />
            <span>Imagen pendiente de registrar</span>
        </div>
    )
}

function Label({ children }) {
    return <div className="eyebrow"><i />{children}</div>
}

function Logo() {
    return (
        <a className="logo" href="#">
            <i><Icon n="book" /></i>
            <span>auto<b>library</b><small>LA BIBLIOTECA DEL MOTOR</small></span>
        </a>
    )
}

function VehicleCard({ v, onOpen, onToggle, isFavorite, busy }) {
    return (
        <div className="favorite-card-shell">
            <button type="button" className="card" onClick={onOpen}>
                <div className="car-bg">
                    <span>{v.year}</span>
                    <VehicleImage vehicle={v} className="catalog-car-image" compact />
                </div>
                <div className="card-info">
                    <small>
                        {v.make.toUpperCase()}
                        {v.trim ? ` · ${v.trim.toUpperCase()}` : ''}
                    </small>
                    <h3>{v.model}</h3>
                    <p>
                        <Icon n="wrench" /> {v.engineCode || 'Datos técnicos no registrados'}
                        <span>
                            {v.transmissions?.length
                                ? `${v.transmissions.length} transmisiones`
                                : 'Transmisión no registrada'}
                        </span>
                    </p>
                </div>
            </button>

            <button
                type="button"
                className={`favorite-toggle ${isFavorite ? 'is-favorite' : ''}`}
                aria-label={isFavorite
                    ? `Quitar ${v.make} ${v.model} de favoritos`
                    : `Guardar ${v.make} ${v.model} en favoritos`}
                aria-pressed={isFavorite}
                title={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                onClick={onToggle}
                disabled={busy}
            >
                {isFavorite ? '♥' : '♡'}
            </button>
        </div>
    )
}

function App() {
    const { user, logout, isAdmin } = useAuth()
    const [showAdmin, setShowAdmin] = useState(false)
    const [showAuth, setShowAuth] = useState(false)
    const [authError, setAuthError] = useState('')
    const [list, S] = useState([])
    const [car, C] = useState(null)
    const [gear, G] = useState('')
    const [tab, T] = useState('catalogo')
    const [q, Q] = useState('')
    const [make, M] = useState('')
    const [model, D] = useState('')
    const [year, Y] = useState('')
    const [error, E] = useState('')
    const [loading, L] = useState(true)
    const [favoriteIds, setFavoriteIds] = useState([])
    const [favoritesLoading, setFavoritesLoading] = useState(false)
    const [favoriteBusyId, setFavoriteBusyId] = useState(null)
    const [favoritesError, setFavoritesError] = useState('')


    useEffect(() => {
        let activo = true

        async function cargarVehiculos() {
            try {
                L(true)
                E('')

                const vehiculos = await obtenerVehiculos()

                if (activo) S(vehiculos)
            } catch (error) {
                console.error('Error de Supabase:', error)

                if (activo) {
                    S([])
                    E('No se pudieron cargar los vehículos desde Supabase.')
                }
            } finally {
                if (activo) L(false)
            }
        }

        cargarVehiculos()

        return () => {
            activo = false
        }
    }, [])


    // Los favoritos se recuperan por cuenta y permanecen en Supabase.
    useEffect(() => {
        let active = true
        setFavoritesError('')

        if (!user?.id) {
            setFavoriteIds([])
            setFavoritesLoading(false)
            return
        }

        setFavoriteIds([])
        setFavoritesLoading(true)

        obtenerFavoritos(user.id)
            .then(ids => {
                if (active) setFavoriteIds(ids)
            })
            .catch(error => {
                if (!active) return
                console.error('Error consultando favoritos:', error)
                setFavoritesError('No se pudieron cargar tus favoritos.')
            })
            .finally(() => {
                if (active) setFavoritesLoading(false)
            })

        return () => { active = false }
    }, [user?.id])

    async function toggleFavorite(vehiculoId) {
        if (!esIdVehiculoBigintValido(vehiculoId)) {
            setFavoritesError('Este vehículo aún no tiene un ID numérico válido en Supabase y no se puede guardar como favorito.')
            return
        }

        if (!user) {
            setShowAuth(true)
            return
        }

        if (favoriteBusyId !== null) return

        const id = String(vehiculoId)
        const exists = favoriteIds.includes(id)
        setFavoritesError('')
        setFavoriteBusyId(id)

        try {
            if (exists) {
                await quitarFavorito(user.id, vehiculoId)
                setFavoriteIds(previous => previous.filter(x => x !== id))
            } else {
                await agregarFavorito(user.id, vehiculoId)
                setFavoriteIds(previous => previous.includes(id)
                    ? previous
                    : [...previous, id])
            }
        } catch (error) {
            console.error('Error guardando favorito:', error)
            setFavoritesError(error.message || 'No se pudo actualizar el favorito.')
        } finally {
            setFavoriteBusyId(null)
        }
    }

    const favoriteCars = list.filter(v => favoriteIds.includes(String(v.id)))

    const makes = [...new Set(list.map(x => x.make))]
    const models = [...new Set(list.filter(x => !make || x.make === make).map(x => x.model))]
    const years = [...new Set(
        list
            .filter(x =>
                (!make || x.make === make) &&
                (!model || x.model === model) &&
                x.year !== null &&
                x.year !== undefined &&
                x.year !== ''
            )
            .map(x => x.year)
    )]

    const filtered = useMemo(
        () => list.filter(x =>
            (!q || [x.make, x.model, x.year, x.trim, x.engineCode].join(' ').toLowerCase().includes(q.toLowerCase())) &&
            (!make || x.make === make) &&
            (!model || x.model === model) &&
            (!year || String(x.year) === year)
        ),
        [list, q, make, model, year]
    )


    async function open(v) {
        C(v)

        G(
            v.transmissions.includes('Automática')
                ? 'Automática'
                : v.transmissions[0] || ''
        )

        T('catalogo')

        try {
            const vehiculo = await obtenerVehiculo(v.id)

            console.log('Ficha técnica desde Supabase:', vehiculo)

            C(vehiculo)
            G(
                vehiculo.transmissions.includes('Automática')
                    ? 'Automática'
                    : vehiculo.transmissions[0] || ''
            )
        } catch (error) {
            console.error('Error al cargar vehículo:', error)
            // Conservamos los datos iniciales del catálogo.
        }
    }


    function go(t) {
        T(t)
        C(null)
        window.scrollTo(0, 0)
    }

    return (
        <div className="autolibrary">

            <header>
                <div className="nav">
                    <Logo />

                    <nav>
                        <button onClick={() => go('catalogo')}>
                            Explorar
                        </button>

                        <button onClick={() => go('mantenimiento')}>
                            Mantenimiento
                        </button>

                        <button onClick={() => go('documentos')}>
                            Biblioteca
                        </button>
                        {user && (
                            <button onClick={() => go('favoritos')}>
                                ♥ Mis favoritos ({favoriteIds.length})
                            </button>
                        )}
                        {isAdmin && (
                            <button onClick={() => setShowAdmin(true)}>
                                Administración
                            </button>
                        )}
                    </nav>

                    <div className="nav-account">
                        {user ? (
                            <>
                                <span className="nav-username">
                                    {user.user_metadata?.full_name ||
                                        user.email?.split('@')[0] ||
                                        'Usuario'}
                                </span>

                                <button
                                    className="nav-logout"
                                    onClick={async () => {
                                        try {
                                            setAuthError('')
                                            await logout()
                                            setShowAdmin(false)
                                            go('catalogo')
                                        } catch (error) {
                                            setAuthError(
                                                error.message ||
                                                'No se pudo cerrar sesión'
                                            )
                                        }
                                    }}
                                >
                                    Cerrar sesión
                                </button>
                            </>
                        ) : (
                            <button
                                className="nav-login"
                                onClick={() => setShowAuth(true)}
                            >
                                Iniciar sesión
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {authError && (
                <p role="alert" className="auth-nav-error">
                    {authError}
                </p>
            )}

            {showAuth && !user && (
                <AuthForm onClose={() => setShowAuth(false)} />
            )}

            {showAdmin && isAdmin && (
                <AdminPanel onClose={() => setShowAdmin(false)} />
            )}


            {car ? (
                <main className="wrap detail-page">
                    <VehicleDetailLayout
                        vehicle={car}
                        viewer={<VehicleDisplay vehicle={car} />}
                        isInteractive={
                            isCivic2003(car) ||
                            isHyundaiI10(car) ||
                            isFordFiesta2014(car) ||
                            isPassat2010(car) ||
                            isCamaro1972(car)
                        }
                        motorViewer={isCivic2003(car) && (
                            <MotorViewer
                                vehicleName={`Motor ${car.make} ${car.engineCode || 'D17A2'}`}
                            />
                        )}
                        isFavorite={favoriteIds.includes(String(car.id))}
                        favoriteBusy={favoritesLoading || favoriteBusyId === String(car.id)}
                        favoritesError={favoritesError}
                        onFavoriteToggle={() => toggleFavorite(car.id)}
                        onBack={() => {
                            C(null)
                            T('catalogo')
                        }}
                        transmissions={car.transmissions || []}
                        selectedTransmission={gear}
                        onTransmissionChange={G}
                        activeTab={tab}
                        onTabChange={T}
                    >
                        <Content car={car} gear={gear} tab={tab} />
                    </VehicleDetailLayout>
                </main>
            ) : tab === 'catalogo' ? (
                <>
                    <section className="hero">
                        <div className="hero-inner">
                            <div>
                                <Label>TU CENTRO DE INFORMACIÓN AUTOMOTRIZ</Label>
                                <h1>Conoce tu auto.<br /><em>Cuídalo mejor.</em></h1>
                                <p>Datos técnicos, mantenimiento y recursos útiles para entender cada vehículo.</p>
                                <button
                                    className="primary"
                                    onClick={() => document.querySelector('#catalogo').scrollIntoView({ behavior: 'smooth' })}
                                >
                                    Explorar catálogo <Icon n="arrow" />
                                </button>
                                <span className="hint">✓ Información organizada por vehículo</span>
                            </div>

                            <div className="hero-car hero-dashboard">
                                <img
                                    src="/images/TypeR.png"
                                    alt="Honda Civic Type R"
                                    className="dashboard-image"
                                />
                            </div>

                        </div>
                    </section>

                    <main className="wrap catalog" id="catalogo">
                        <div className="title">
                            <div>
                                <Label>EXPLORA LA BIBLIOTECA</Label>
                                <h2>Encuentra tu vehículo</h2>
                                <p>Empieza por la marca, el modelo o el año.</p>
                            </div>
                            <b>{String(filtered.length).padStart(2, '0')} VEHÍCULOS</b>
                        </div>

                        <div className="layout">
                            <aside>
                                <strong>Filtrar catálogo</strong>
                                <label className="search">
                                    <Icon n="search" />
                                    <input
                                        aria-label="Buscar vehículo"
                                        placeholder="Buscar vehículo..."
                                        value={q}
                                        onChange={e => Q(e.target.value)}
                                    />
                                </label>
                                <Filter
                                    label="MARCA"
                                    value={make}
                                    options={makes}
                                    empty="Todas las marcas"
                                    change={v => {
                                        M(v)
                                        D('')
                                        Y('')
                                    }}
                                />
                                <Filter
                                    label="MODELO"
                                    value={model}
                                    options={models}
                                    empty="Todos los modelos"
                                    change={v => {
                                        D(v)
                                        Y('')
                                    }}
                                />
                                <Filter
                                    label="AÑO"
                                    value={year}
                                    options={years.map(String)}
                                    empty="Todos los años"
                                    change={Y}
                                />
                                <button className="clear" onClick={() => {
                                    Q('')
                                    M('')
                                    D('')
                                    Y('')
                                }}>
                                    Limpiar filtros　↗
                                </button>
                                <small>El catálogo se ampliará pronto</small>
                            </aside>

                            <div className="results">
                                {error && <p className="error">{error}</p>}
                                {favoritesError && <p role="alert" className="error">{favoritesError}</p>}
                                {loading ? (
                                    <p>Cargando catálogo…</p>
                                ) : filtered.length ? (
                                    <div className="cards">
                                        {filtered.map(v => (
                                            <VehicleCard
                                                key={v.id}
                                                v={v}
                                                onOpen={() => open(v)}
                                                onToggle={() => toggleFavorite(v.id)}
                                                isFavorite={favoriteIds.includes(String(v.id))}
                                                busy={favoritesLoading || favoriteBusyId !== null}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <p>No encontramos vehículos. Prueba otros filtros.</p>
                                )}
                            </div>
                        </div>
                    </main>
                </>
            ) : tab === 'favoritos' && user ? (
                <main className="wrap catalog favorites-page">
                    <div className="title">
                        <div>
                            <Label>TU BIBLIOTECA PERSONAL</Label>
                            <h2>Mis vehículos favoritos</h2>
                            <p>Vehículos guardados en tu cuenta de AutoLibrary.</p>
                        </div>
                        <b>{String(favoriteCars.length).padStart(2, '0')} FAVORITOS</b>
                    </div>

                    {favoritesError && (
                        <p className="error" role="alert">{favoritesError}</p>
                    )}

                    {loading || favoritesLoading ? (
                        <p>Cargando favoritos…</p>
                    ) : favoriteCars.length ? (
                        <div className="cards">
                            {favoriteCars.map(v => (
                                <VehicleCard
                                    key={v.id}
                                    v={v}
                                    onOpen={() => open(v)}
                                    onToggle={() => toggleFavorite(v.id)}
                                    isFavorite={true}
                                    busy={favoriteBusyId !== null}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="favorites-empty">
                            <h3>Todavía no tienes vehículos favoritos</h3>
                            <p>Explora el catálogo y utiliza el corazón para guardar uno.</p>
                            <button className="primary" onClick={() => go('catalogo')}>
                                Explorar catálogo <Icon n="arrow" />
                            </button>
                        </div>
                    )}
                </main>
            ) : (
                <main className="wrap content">
                    <Label>{tab === 'mantenimiento' ? 'CUIDADO DEL VEHÍCULO' : 'BIBLIOTECA TÉCNICA'}</Label>
                    <h1>{tab === 'mantenimiento' ? 'Mantenimiento' : 'Manuales y documentos'}</h1>
                    <p>Abre una ficha del catálogo para consultar el contenido asociado.</p>
                    <button className="primary" onClick={() => go('catalogo')}>
                        Ir al catálogo <Icon n="arrow" />
                    </button>
                </main>
            )}

            <footer>
                <Logo />
                <span>Información automotriz, organizada para encontrarla.</span>
                <small>© 2026 AUTOLIBRARY</small>
            </footer>
        </div>
    )
}

function Filter({ label, value, options, empty, change }) {
    return (
        <label className="filter">
            {label}
            <select value={value} onChange={e => change(e.target.value)}>
                <option value="">{empty}</option>
                {options.map(x => <option key={x}>{x}</option>)}
            </select>
        </label>
    )
}

const GUIAS_MANTENIMIENTO = [
    { id: 'aceite', titulo: 'Aceite y filtro de motor', sistema: 'Motor', resumen: 'Verificar nivel, especificación de aceite, filtro e intervalo aplicable.', precaucion: 'No trabajar sobre piezas calientes; desechar el aceite en un centro de acopio.' },
    { id: 'aire', titulo: 'Filtro de aire', sistema: 'Admisión', resumen: 'Inspección del elemento filtrante y revisión de la caja del filtro.' },
    { id: 'bujias', titulo: 'Bujías', sistema: 'Encendido', resumen: 'Comprobar el tipo de bujía recomendado y el procedimiento de sustitución.', precaucion: 'No intervenir el encendido con el motor en marcha.' },
    { id: 'refrigerante', titulo: 'Sistema de refrigeración', sistema: 'Motor', resumen: 'Revisar el nivel, fugas y especificación del refrigerante.', precaucion: 'Nunca abrir la tapa del radiador con el motor caliente.' },
    { id: 'transmision', titulo: 'Fluido de transmisión', sistema: 'Transmisión', resumen: 'Consultar el fluido y procedimiento específicos de la transmisión seleccionada.' },
    { id: 'frenos', titulo: 'Frenos', sistema: 'Seguridad', resumen: 'Inspección de pastillas, discos, fugas y fluido de frenos.', precaucion: 'Una falla de frenos debe revisarla personal calificado antes de circular.' },
    { id: 'distribucion', titulo: 'Distribución del motor', sistema: 'Motor', resumen: 'Identificar si el motor utiliza correa o cadena y consultar su plan de inspección o sustitución.', precaucion: 'Una instalación incorrecta puede ocasionar daños graves al motor.' },
    { id: 'fusibles', titulo: 'Fusibles y sistema eléctrico', sistema: 'Eléctrico', resumen: 'Localizar cajas de fusibles y consultar el amperaje correspondiente.', precaucion: 'Nunca sustituir un fusible por uno de amperaje superior.' }
]

// Fichas técnicas iniciales para el Civic EX 2003 D17A2 (EE. UU.).
// Los procedimientos son resúmenes de orientación; no sustituyen las precauciones del fabricante.
const SERVICIOS_CIVIC_D17A2 = {
    aire: {
        datos: [['INTERVALO NORMAL', '48,000 km'], ['USO CON POLVO', '24,000 km']],
        nota: 'El intervalo más corto aplica cuando el vehículo circula en ambientes polvorientos. Reemplaza antes si el filtro está dañado o muy contaminado.',
        materiales: ['Elemento filtrante compatible con Civic EX 2003 1.7 L D17A2.', 'Destornillador o herramienta adecuada para los sujetadores de la caja de aire.', 'Paño limpio para retirar suciedad de la carcasa.'],
        pasos: ['Apaga el motor y abre el cofre.', 'Localiza la caja del filtro de aire del motor.', 'Libera sus sujetadores sin forzar las conexiones o conductos.', 'Retira el filtro usado y comprueba el estado de su sello y de la carcasa.', 'Limpia con cuidado la suciedad acumulada, evitando que entre en la admisión.', 'Coloca el elemento nuevo en la misma orientación y asegúrate de que selle correctamente.', 'Cierra la caja y comprueba que los sujetadores y conductos queden firmes.'],
        aviso: 'No hagas funcionar el motor sin el elemento filtrante instalado.'
    },
    bujias: {
        datos: [['INTERVALO DE SUSTITUCIÓN', '176,000 km (110,000 mi)'], ['MOTOR', 'D17A2 · 4 cilindros']],
        nota: 'Utiliza bujías de la referencia y grado térmico aprobados para el motor exacto. La separación y el torque deben verificarse antes de instalarlas; no se asigna un valor genérico.',
        materiales: ['Juego de cuatro bujías compatibles con el D17A2.', 'Dado para bujías, extensión y matraca.', 'Llave dinamométrica apropiada.', 'Aire o cepillo para retirar suciedad alrededor de los pozos, sin introducirla en el motor.'],
        pasos: ['Estaciona, apaga el motor y deja enfriar completamente la culata.', 'Localiza las bobinas de encendido y desconecta cuidadosamente sus conectores.', 'Retira los tornillos de sujeción y extrae las bobinas sin tirar de los cables.', 'Limpia la zona alrededor de los pozos para impedir que caiga suciedad a los cilindros.', 'Retira una bujía a la vez y verifica la referencia de la nueva.', 'Enrosca primero la bujía nueva a mano para evitar dañar la rosca de la culata.', 'Aprieta con llave dinamométrica al valor especificado para la bujía y motor.', 'Reinstala las bobinas y conectores; arranca y verifica un funcionamiento uniforme.'],
        aviso: 'No cambies bujías con la culata caliente ni fuerces una rosca que ofrezca resistencia.'
    },
    refrigerante: {
        datos: [['PRIMER CAMBIO', '192,000 km o 10 años'], ['CAMBIOS POSTERIORES', '96,000 km o 5 años'], ['TIPO', 'Honda Type 2 o equivalente aprobado']],
        nota: 'Se aplica el plazo o kilometraje que ocurra primero. Si desconoces el historial del vehículo, inspecciona el sistema antes de decidir el servicio.',
        materiales: ['Refrigerante Honda All Season Antifreeze/Coolant Type 2 o producto aprobado para esta aplicación.', 'Recipiente de recuperación y embudo limpio.', 'Guantes y equipo de protección.', 'Herramientas y equipo de purga adecuados para el procedimiento específico.'],
        pasos: ['Deja enfriar completamente el motor; nunca abras el sistema bajo presión.', 'Comprueba visualmente mangueras, abrazaderas, radiador, depósito y posibles fugas.', 'Verifica el nivel en el depósito de expansión y el estado del refrigerante.', 'Para un reemplazo completo, utiliza el procedimiento de drenado y purga específico del motor D17A2.', 'Llena con el refrigerante aprobado evitando mezclar fórmulas incompatibles.', 'Purga el aire según el procedimiento del fabricante y controla la temperatura del motor.', 'Comprueba que no haya fugas y vuelve a revisar el nivel después del enfriamiento completo.', 'Entrega el refrigerante usado a un gestor autorizado.'],
        aviso: 'El refrigerante es tóxico. No abras la tapa del radiador en caliente y no dejes residuos al alcance de animales o niños.'
    },
    distribucion: {
        datos: [['SISTEMA', 'Correa de distribución'], ['INTERVALO NORMAL', '176,000 km o 7 años'], ['CONDICIONES EXTREMAS', 'Consultar pauta especial Honda']],
        nota: 'El motor D17A2 utiliza correa de distribución. Se recomienda inspeccionar también el tensor y la bomba de agua durante el servicio. En temperaturas extremas Honda establece una sustitución anticipada; comprobar las condiciones y el historial antes de decidir el intervalo.',
        materiales: ['Kit de distribución compatible con el motor D17A2 (correa y componentes correspondientes).', 'Elementos de inspección del tensor y bomba de agua; repuestos cuando corresponda.', 'Herramientas de sincronización, sujeción, elevación y llave dinamométrica específicas del procedimiento.', 'Sellos y refrigerante aprobados si el trabajo incluye componentes del sistema de refrigeración.'],
        pasos: ['Identifica el motor D17A2 y confirma cuándo se reemplazó la correa por última vez.', 'Inspecciona externamente posibles fugas, ruidos anormales y el estado de las tapas de distribución.', 'Programa el reemplazo de la correa y la revisión del tensor y la bomba de agua con un técnico especializado.', 'Antes del desmontaje se deben verificar las marcas de sincronización, el soporte del motor y el método de inmovilización especificado.', 'Después del armado, el especialista debe comprobar la sincronización, los aprietes y la ausencia de fugas antes de poner en funcionamiento el motor.', 'Registra fecha, kilometraje y piezas reemplazadas para planificar el próximo servicio.'],
        aviso: 'Procedimiento de alta complejidad: una sincronización incorrecta puede causar daño interno. Esta ficha es una guía de planificación, no instrucciones suficientes para desmontar o sincronizar el motor.'
    },
    transmision: {
        datos: [['CAJA', 'Seleccionar transmisión'], ['AUTOMÁTICA', 'Honda ATF-Z1 (especificación original)'], ['MANUAL', 'Honda Manual Transmission Fluid (MTF)']],
        nota: 'El Civic EX 2003 se ofreció con transmisión manual de cinco velocidades o automática. El fluido, la ubicación del tapón y la verificación del nivel son diferentes. No intercambies ATF y MTF.',
        materiales: ['Fluido Honda compatible con la transmisión específica.', 'Recipiente de recuperación, embudo y herramienta de llenado adecuada.', 'Arandelas o sellos nuevos cuando lo indique el procedimiento de servicio.', 'Herramienta para tapones y soportes homologados si se eleva el vehículo.'],
        pasos: ['Confirma qué caja está instalada y consulta su historial de servicio.', 'Inspecciona fugas, cambios anormales y la condición externa de retenes y conexiones.', 'Verifica el fluido especificado antes de abrir cualquier tapón.', 'Mantén el vehículo nivelado y utiliza el método de comprobación de nivel correspondiente a la caja.', 'Para el reemplazo, sigue el procedimiento de drenado y llenado específico; evita sobrellenar.', 'Revisa fugas y funcionamiento después del servicio y registra el kilometraje.'],
        aviso: 'No utilices un fluido universal sin compatibilidad documentada. El aceite del motor no sustituye de manera permanente al Honda MTF.'
    },
    frenos: {
        datos: [['LÍQUIDO', 'Honda DOT 3 recomendado'], ['REEMPLAZO DEL FLUIDO', 'Cada 3 años'], ['INSPECCIÓN', 'Según programa y condición']],
        nota: 'El cambio de líquido se determina por tiempo independientemente del kilometraje. Pastillas, discos, líneas y cilindros se inspeccionan y se sustituyen según su desgaste y estado; no existe un kilometraje único para todas las pastillas.',
        materiales: ['Líquido de frenos DOT 3 nuevo, de envase sellado, compatible con la especificación Honda.', 'Equipo de revisión de espesor y estado de pastillas, discos, tuberías y flexibles.', 'Equipo de purga apropiado si se va a renovar el líquido.', 'Guantes, protección ocular y materiales para limpiar derrames.'],
        pasos: ['Con el automóvil inmóvil y asegurado, comprueba el nivel del depósito y observa si existen fugas.', 'Inspecciona pastillas, discos y componentes de frenado sin contaminar las superficies de fricción.', 'Comprueba el estado de latiguillos, conexiones y el funcionamiento del freno de estacionamiento.', 'Si corresponde cambiar el líquido, utiliza el procedimiento de purga adecuado para la configuración del vehículo, incluyendo ABS cuando aplique.', 'Verifica el tacto del pedal, la ausencia de fugas y el comportamiento del sistema antes de circular.', 'Ante vibraciones intensas, pedal esponjoso o pérdida de eficacia, no conduzcas hasta que se repare.'],
        aviso: 'Sistema de seguridad crítica. La apertura del circuito hidráulico y la purga deben realizarse con el procedimiento correcto; una intervención deficiente puede reducir o eliminar la capacidad de frenado.'
    },
    fusibles: {
        datos: [['SISTEMA', 'Protección eléctrica'], ['UBICACIONES', 'Habitáculo y compartimento del motor'], ['SUSTITUCIÓN', 'Mismo amperaje y formato']],
        nota: 'Las asignaciones de fusibles dependen del equipamiento y la configuración del Civic. El diagrama de la tapa y la identificación del circuito tienen prioridad antes de sustituirlo.',
        materiales: ['Extractor de fusibles adecuado.', 'Fusible de reemplazo del mismo tipo y amperaje que el original.', 'Linterna y, para diagnóstico, multímetro con uso correcto.'],
        pasos: ['Apaga el vehículo y el circuito afectado; retira la llave.', 'Localiza la caja de fusibles del habitáculo o del compartimento del motor.', 'Identifica el circuito en el diagrama y verifica que el fusible corresponda a la función afectada.', 'Extrae el fusible sin dañar los terminales y comprueba visualmente o con un medidor si está abierto.', 'Instala únicamente un fusible del mismo amperaje y formato.', 'Prueba el circuito. Si el fusible se vuelve a fundir, detén las pruebas y busca la causa eléctrica.', 'Registra el circuito y la reparación realizada.'],
        aviso: 'Nunca aumentes el amperaje, uses puentes de alambre o manipules cableado dañado energizado. Un fusible que falla repetidamente indica una avería que requiere diagnóstico.'
    }
}

function FichaServicioCivic({ ficha }) {
    return (
        <div className="servicio-tecnico">
            <div className="servicio-datos">
                {ficha.datos.map(([etiqueta, valor]) => (
                    <div key={etiqueta}><small>{etiqueta}</small><strong>{valor}</strong></div>
                ))}
            </div>
            <p className="servicio-nota">{ficha.nota}</p>
            <h4>Materiales y herramientas</h4>
            <ul>{ficha.materiales.map((texto, i) => <li key={i}>{texto}</li>)}</ul>
            <h4>Procedimiento general</h4>
            <ol>{ficha.pasos.map((texto, i) => <li key={i}>{texto}</li>)}</ol>
            <p className="servicio-nota"><strong>Precaución:</strong> {ficha.aviso}</p>
        </div>
    )
}

function MantenimientoBiblioteca({ car, gear }) {
    const [busqueda, setBusqueda] = useState('')
    const [activo, setActivo] = useState(null)
    const visibles = GUIAS_MANTENIMIENTO.filter(item =>
        `${item.titulo} ${item.sistema}`.toLowerCase().includes(busqueda.toLowerCase())
    )
    return (
        <section className="panel biblioteca-section">
            <Label>MANTENIMIENTO</Label>
            <h2>Guía de servicio</h2>
            <p className="biblioteca-muted">Temas de mantenimiento para {car.make} {car.model} {car.year}{gear ? ` · ${gear}` : ''}. Los intervalos, fluidos y torques deben comprobarse con documentación de la versión exacta.</p>
            <label className="biblioteca-search">
                <span>Buscar mantenimiento</span>
                <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Ej. aceite, bujías, frenos..." />
            </label>
            <div className="biblioteca-grid">
                {visibles.map(item => (
                    <article className="biblioteca-card" key={item.id}>
                        <small>{item.sistema.toUpperCase()}</small>
                        <h3>{item.titulo}</h3>
                        <p>{item.resumen}</p>
                        <button type="button" onClick={() => setActivo(activo === item.id ? null : item.id)} aria-expanded={activo === item.id}>
                            {activo === item.id ? 'Cerrar detalles' : 'Ver detalles'}
                        </button>
                        {activo === item.id && (
                            <div className="biblioteca-detail">
                                {item.id === 'aceite' && isCivic2003(car) ? (
                                    <div className="servicio-tecnico">
                                        <div className="servicio-datos">
                                            <div><small>VISCOSIDAD</small><strong>SAE 5W-20</strong></div>
                                            <div><small>CAPACIDAD CON FILTRO</small><strong>3.5 L aprox. (3.7 US qt)</strong></div>
                                            <div><small>USO SEVERO · ACEITE</small><strong>8,000 km o 6 meses</strong></div>
                                            <div><small>USO NORMAL</small><strong>Según programa por distancia y tiempo</strong></div>
                                        </div>
                                        <p className="servicio-nota">Datos de referencia del manual del propietario para Civic EX 2003 (EE. UU.). Existe una discrepancia histórica entre documentos Honda respecto a la capacidad: añade aceite gradualmente y comprueba el nivel con la varilla. No sobrellenes.</p>
                                        <h4>Materiales y herramientas</h4>
                                        <ul>
                                            <li>Aceite para motor SAE 5W-20 que cumpla la especificación indicada en el manual.</li>
                                            <li>Filtro de aceite compatible con Civic EX 2003 D17A2.</li>
                                            <li>Arandela nueva para el tornillo de drenaje.</li>
                                            <li>Recipiente para aceite usado, embudo, guantes y herramienta para el filtro.</li>
                                            <li>Llave dinamométrica y medios seguros para elevar y sostener el vehículo si fuera necesario.</li>
                                        </ul>
                                        <h4>Procedimiento general</h4>
                                        <ol>
                                            <li>Estaciona sobre suelo nivelado, aplica el freno de estacionamiento y apaga el motor. Evita superficies calientes.</li>
                                            <li>Abre la tapa de llenado y coloca el recipiente debajo del cárter.</li>
                                            <li>Retira el tornillo de drenaje y deja salir el aceite.</li>
                                            <li>Instala una arandela nueva y aprieta el tornillo al torque indicado por el manual de servicio.</li>
                                            <li>Cambia el filtro, lubricando la junta y ajustándolo según sus indicaciones.</li>
                                            <li>Agrega aceite gradualmente y revisa el nivel con la varilla.</li>
                                            <li>Arranca y verifica que la luz de presión de aceite se apague. Comprueba que no existan fugas.</li>
                                            <li>Apaga, espera unos minutos y revisa nuevamente el nivel sin exceder la marca superior.</li>
                                            <li>Entrega el aceite y filtro usados a un centro de acopio autorizado.</li>
                                        </ol>
                                        <p className="servicio-nota">El cambio del filtro sigue las entradas correspondientes del programa de mantenimiento; no necesariamente coincide con cada cambio de aceite. La periodicidad depende de las condiciones normales o severas de operación.</p>
                                    </div>
                                ) : isCivic2003(car) && SERVICIOS_CIVIC_D17A2[item.id] ? (
                                    <>
                                        <FichaServicioCivic ficha={SERVICIOS_CIVIC_D17A2[item.id]} />
                                        {item.id === 'transmision' && (
                                            <div className="servicio-transmision" role="note">
                                                <h4>Datos de tu transmisión seleccionada</h4>
                                                {gear?.toLowerCase().includes('autom') ? (
                                                    <p><strong>Automática:</strong> especificación original Honda ATF-Z1; Honda DW-1 es su reemplazo moderno compatible. No usar Honda MTF. Comprueba el procedimiento de nivel y el intervalo correspondiente a transmisión automática.</p>
                                                ) : gear?.toLowerCase().includes('manual') ? (
                                                    <p><strong>Manual:</strong> utiliza Honda Manual Transmission Fluid (MTF). No usar ATF-Z1 ni DW-1. Comprueba el nivel mediante el procedimiento del tapón de llenado de esta caja.</p>
                                                ) : (
                                                    <p>Selecciona primero <strong>Automática</strong> o <strong>Manual</strong> en la ficha del vehículo para consultar la recomendación específica.</p>
                                                )}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <p><strong>Intervalo y especificaciones:</strong> pendientes de validación para este vehículo.</p>
                                )}
                                {item.precaucion && <p><strong>Precaución:</strong> {item.precaucion}</p>}
                            </div>
                        )}
                    </article>
                ))}
            </div>
            {!visibles.length && <p className="biblioteca-muted">No se encontraron mantenimientos con ese término.</p>}
        </section>
    )
}

function Content({ car, gear, tab }) {
    const [pdfError, setPdfError] = useState('')

    async function checkPdfAccess(url) {
        setPdfError('')

        try {
            const response = await fetch(url, { method: 'HEAD' })
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`)
            }
        } catch (error) {
            console.error('No se pudo verificar el acceso al PDF:', error)
            setPdfError('No se pudo verificar el acceso al PDF en Cloudflare R2. Comprueba que el archivo exista y que CORS permita solicitudes desde este sitio.')
        }
    }

    async function downloadPdf(url, title) {
        setPdfError('')

        try {
            const response = await fetch(url)
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`)
            }

            const objectUrl = URL.createObjectURL(await response.blob())
            const link = document.createElement('a')
            link.href = objectUrl
            link.download = `${title || 'manual'}.pdf`
            link.click()
            setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
        } catch (error) {
            console.error('No se pudo descargar el PDF:', error)
            setPdfError('No se pudo descargar el PDF desde Cloudflare R2. Comprueba que el archivo exista y que CORS permita solicitudes desde este sitio.')
        }
    }

    if (tab === 'mantenimiento') {
        return <MantenimientoBiblioteca car={car} gear={gear} />
    }

    if (tab === 'documentos') {
        const documentosGuardados = Array.isArray(car.documentos) ? car.documentos : []

        return (
            <section className="panel biblioteca-section">
                <Label>DOCUMENTOS</Label>
                <h2>Manuales y diagramas</h2>
                <p className="biblioteca-muted">Documentación relacionada con {car.make} {car.model} {car.year}. Verifica la versión antes de realizar reparaciones.</p>
                {documentosGuardados.length > 0 ? (
                    <div className="biblioteca-grid">
                        {documentosGuardados.map((doc, index) => {
                            const url = getDocumentUrl(doc.archivo_url)
                            const title = doc.titulo || ''

                            return (
                                <article className="biblioteca-card" key={doc.id ?? `${doc.archivo_url}-${index}`}>
                                    <small>{doc.categoria ? `${displayData(doc.categoria)} · PDF` : 'PDF'}</small>
                                    <h3>{displayData(doc.titulo)}</h3>
                                    <p>{displayData(doc.descripcion)}</p>
                                    {doc.fuente && <p>Fuente: {doc.fuente}</p>}
                                    {url ? (
                                        <div className="biblioteca-actions">
                                            <a href={url} target="_blank" rel="noopener noreferrer" onClick={() => checkPdfAccess(url)}>Ver PDF</a>
                                            <button type="button" onClick={() => downloadPdf(url, title)}>Descargar</button>
                                        </div>
                                    ) : (
                                        <p className="biblioteca-error" role="alert">{documentUrlError(doc.archivo_url)}</p>
                                    )}
                                </article>
                            )
                        })}
                    </div>
                ) : (
                    <p className="biblioteca-muted">No hay documentos disponibles</p>
                )}
                {pdfError && <p className="biblioteca-error" role="alert">{pdfError}</p>}
            </section>
        )
    }

    const selectedTransmission = car.transmisiones?.find(t => t.tipo === gear)
    const transmissionDetails = selectedTransmission
        ? [
            selectedTransmission.velocidades != null
                ? `${selectedTransmission.velocidades} velocidades`
                : null,
            selectedTransmission.traccion
                ? `Tracción ${selectedTransmission.traccion}`
                : null,
        ].filter(Boolean).join(' · ')
        : null

    return (
        <section className="specs">
            <Label>DATOS PRINCIPALES</Label>
            <h2>Especificaciones técnicas</h2>

            {car.motor && (
                <div className="motor-specs">
                    <h3>Información del motor</h3>

                    <div className="spec-grid">
                        <Spec
                            label="CÓDIGO"
                            value={car.motor.codigo}
                            detail="Identificación del motor"
                        />
                        <Spec
                            label="CILINDRADA"
                            value={car.motor.cilindrada_cc != null
                                ? `${car.motor.cilindrada_cc} cc`
                                : null}
                            detail="Desplazamiento"
                        />
                        <Spec
                            label="POTENCIA"
                            value={car.motor.potencia_hp != null
                                ? `${car.motor.potencia_hp} hp`
                                : null}
                            detail={car.motor.potencia_rpm != null
                                ? `${car.motor.potencia_rpm} rpm`
                                : null}
                        />
                        <Spec
                            label="TORQUE"
                            value={car.motor.torque_lbft != null
                                ? `${car.motor.torque_lbft} lb-pie`
                                : null}
                            detail={car.motor.torque_rpm != null
                                ? `${car.motor.torque_rpm} rpm`
                                : null}
                        />
                        <Spec
                            label="CILINDROS"
                            value={car.motor.cilindros}
                            detail={car.motor.configuracion}
                        />
                        <Spec
                            label="DISTRIBUCIÓN"
                            value={car.motor.distribucion}
                            detail={car.motor.valvulas != null
                                ? `${car.motor.valvulas} válvulas`
                                : null}
                        />
                    </div>
                </div>
            )}


            <div className="spec-grid">
                <Spec
                    label="MOTOR"
                    value={car.motor?.codigo || car.engineCode || null}
                    detail={
                        car.motor?.cilindrada_cc != null
                            ? `${car.motor.cilindrada_cc} cc`
                            : null
                    }
                />

                <Spec
                    label="TRANSMISIÓN"
                    value={gear || null}
                    detail={transmissionDetails}
                />

                <Spec
                    label="CARROCERÍA"
                    value={car.bodyStyle || null}
                    detail={[car.make, car.model, car.year].filter(Boolean).join(' · ')}
                />

                <Spec
                    label="COMBUSTIBLE"
                    value={car.motor?.combustible || car.fuel || null}
                    detail="Tipo de combustible"
                />
            </div>
            {car.specifications?.map(x => (
                <p className="spec-row" key={x.label}>
                    {displayData(x.label)}<b>{displayData(x.value)}</b>
                </p>
            ))}
        </section>
    )
}

function Spec({ label, value, detail }) {
    return (
        <article>
            <small>{displayData(label)}</small>
            <strong>{displayData(value)}</strong>
            <p>{displayData(detail)}</p>
        </article>
    )
}

function displayData(value) {
    return value == null || (typeof value === 'string' && !value.trim())
        ? 'Pendiente de registrar'
        : value
}

export default App
