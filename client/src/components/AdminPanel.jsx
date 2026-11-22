
import { useAuth } from '../auth/AuthContext'
import './AdminPanel.css'

export default function AdminPanel({ onClose }) {
    const { user, profile, isAdmin } = useAuth()

    if (!user || !isAdmin) return null

    return (
        <div className="admin-overlay">
            <section className="admin-panel">
                <div className="admin-top">
                    <div>
                        <span className="admin-label">
                            AUTOLIBRARY / ADMINISTRACIÓN
                        </span>

                        <h2>Panel de administración</h2>

                        <p>
                            Bienvenido, {profile?.nombre || user.email}
                        </p>
                    </div>

                    <button onClick={onClose}>
                        Cerrar
                    </button>
                </div>

                <div className="admin-grid">
                    <article>
                        <h3>Vehículos</h3>
                        <p>
                            Gestión del catálogo de vehículos.
                        </p>
                        <span>Próximamente</span>
                    </article>

                    <article>
                        <h3>Manuales PDF</h3>
                        <p>
                            Carga y organización de documentos.
                        </p>
                        <span>Próximamente</span>
                    </article>

                    <article>
                        <h3>Modelos 3D</h3>
                        <p>
                            Administración de modelos y piezas.
                        </p>
                        <span>Próximamente</span>
                    </article>

                    <article>
                        <h3>Usuarios</h3>
                        <p>
                            Consulta y administración de cuentas.
                        </p>
                        <span>Próximamente</span>
                    </article>
                </div>
            </section>
        </div>
    )
}
