import { useEffect, useMemo, useState } from 'react'
import './AutoLibrary.css'
import MotorViewer from './components/MotorViewer'
import CarViewer, { HYUNDAI_I10_MODEL } from './components/CarViewer'
import PassatViewer from './components/PassatViewer'
import VehicleDetailLayout from './components/VehicleDetailLayout'
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

function getVehicleImage(vehicle) {
    if (isCamaro1972(vehicle)) return '/images/Camaro.png'
    if (vehicle.make?.toLowerCase() === 'honda' && vehicle.model?.toLowerCase().includes('civic')) {
        return '/images/Civic.png'
    }
    if (vehicle.make?.toLowerCase() === 'volkswagen' && vehicle.model?.toLowerCase().includes('passat')) {
        return '/images/Passat.png'
    }
    if (isHyundaiI10(vehicle)) return '/images/i10.png'
    return vehicle.imageUrl || null
}

function VehicleDisplay({ vehicle }) {
    if (isCivic2003(vehicle)) return <CarViewer />
    if (isHyundaiI10(vehicle)) return <CarViewer modelPath={HYUNDAI_I10_MODEL} />
    if (isCamaro1972(vehicle)) {
        return <PassatViewer modelPath="/models/camaro_1972/car/base_basic_shaded.glb" />
    }
    if (isPassat2010(vehicle)) {
        return <PassatViewer modelPath="/models/passat_2010/car/base_basic_shaded.glb" />
    }

    const image = getVehicleImage(vehicle)
    return image ? (
        <img
            className="vehicle-reference-image"
            src={image}
            alt={`${vehicle.make} ${vehicle.model}${vehicle.year ? ` ${vehicle.year}` : ''}`}
        />
    ) : (
        <p className="vehicle-visual-pending">Vista del vehículo pendiente de registrar</p>
    )
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
    const carImage = getVehicleImage(v)

    return (
        <div className="favorite-card-shell">
            <button type="button" className="card" onClick={onOpen}>
                <div className="car-bg">
                    <span>{v.year}</span>
                    {carImage && (
                        <img
                            src={carImage}
                            alt={`${v.make} ${v.model} ${v.year}`}
                            className="catalog-car-image"
                        />
                    )}
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
                            isPassat2010(car) ||
                            isCamaro1972(car)
                        }
                        motorViewer={isCivic2003(car) && <MotorViewer />}
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

function Content({ car, gear, tab }) {
    if (tab === 'mantenimiento') {
        return (
            <section className="panel">
                <Label>MANTENIMIENTO</Label>
                <h2>Guía de servicio</h2>
                <Pending
                    title="Plan de mantenimiento en preparación"
                    text="Procedimientos e intervalos pendientes de documentación para esta versión."
                />
            </section>
        )
    }


    if (tab === 'documentos') {
        const documentos = car.documentos || []

        return (
            <section className="panel">
                <Label>DOCUMENTOS</Label>
                <h2>Manuales y diagramas</h2>

                {documentos.length > 0 ? (
                    <div className="documents-list">
                        {documentos.map(doc => (
                            <div className="document-item" key={doc.id}>
                                <h3>{displayData(doc.titulo)}</h3>
                                <p>{displayData(doc.categoria)}</p>
                                <p>{displayData(doc.descripcion)}</p>

                                {doc.archivo_url && (
                                    <a
                                        href={doc.archivo_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        Consultar documento
                                    </a>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <Pending
                        title="Aún no hay documentos disponibles"
                        text="Todavía no se han registrado manuales para este vehículo."
                    />
                )}
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

function Pending({ title, text }) {
    return (
        <div className="pending">
            <Icon n="file" />
            <div>
                <strong>{title}</strong>
                <p>{text}</p>
            </div>
            <small>PENDIENTE</small>
        </div>
    )
}

export default App
