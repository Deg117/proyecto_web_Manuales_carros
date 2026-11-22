
import {
    createContext,
    useContext,
    useEffect,
    useState
} from 'react'

import { supabase } from '../lib/supabaseClient'
import { isValidPassword } from './passwordValidation'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [session, setSession] = useState(null)
    const [loading, setLoading] = useState(true)

    const [profile, setProfile] = useState(null)
    const [profileLoading, setProfileLoading] = useState(true)

    // Escuchar cambios de autenticación
    useEffect(() => {
        let active = true

        const {
            data: { subscription }
        } = supabase.auth.onAuthStateChange(
            (_event, currentSession) => {
                if (!active) return

                setSession(currentSession)
                setLoading(false)
            }
        )

        supabase.auth.getSession()
            .then(({ data, error }) => {
                if (!active) return

                if (error) {
                    console.error('Error de sesión:', error)
                } else {
                    setSession(data.session)
                }

                setLoading(false)
            })
            .catch((error) => {
                if (!active) return

                console.error('Error de sesión:', error)
                setLoading(false)
            })

        return () => {
            active = false
            subscription.unsubscribe()
        }
    }, [])

    // Obtener perfil del usuario desde Supabase
    useEffect(() => {
        let active = true

        const userId = session?.user?.id

        if (!userId) {
            setProfile(null)
            setProfileLoading(false)
            return
        }

        setProfile(null)
        setProfileLoading(true)

        async function loadProfile() {
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('id, nombre, rol')
                    .eq('id', userId)
                    .single()

                if (!active) return

                if (error) {
                    console.error(
                        'Error cargando perfil:',
                        error
                    )
                    setProfile(null)
                } else {
                    setProfile(data)
                }
            } catch (error) {
                if (!active) return

                console.error(
                    'Error inesperado cargando perfil:',
                    error
                )
                setProfile(null)
            } finally {
                if (active) {
                    setProfileLoading(false)
                }
            }
        }

        loadProfile()

        return () => {
            active = false
        }
    }, [session?.user?.id])

    // Iniciar sesión
    async function login(email, password) {
        const { data, error } =
            await supabase.auth.signInWithPassword({
                email: email.trim().toLowerCase(),
                password
            })

        if (error) throw error
        return data
    }

    // Registrar usuario
    async function register(name, email, password) {
        if (!name.trim()) {
            throw new Error('Ingresa un nombre de usuario válido.')
        }

        if (!isValidPassword(password)) {
            throw new Error(
                'La contraseña debe tener al menos 8 caracteres, una letra y un número.'
            )
        }

        const { data, error } = await supabase.auth.signUp({
            email: email.trim().toLowerCase(),
            password,
            options: {
                data: {
                    full_name: name.trim()
                }
            }
        })

        if (error) throw error
        return data
    }

    // Cerrar sesión
    async function logout() {
        const { error } = await supabase.auth.signOut()

        if (error) throw error
    }

    // Verificar si el usuario es administrador
    const isAdmin = Boolean(
        session?.user &&
        profile?.id === session.user.id &&
        profile?.rol === 'admin'
    )

    return (
        <AuthContext.Provider
            value={{
                user: session?.user ?? null,
                session,
                profile,
                role: profile?.rol ?? 'usuario',
                isAdmin,
                loading,
                profileLoading,
                login,
                register,
                logout
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

// Hook de autenticación
export function useAuth() {
    const context = useContext(AuthContext)

    if (!context) {
        throw new Error(
            'useAuth requiere AuthProvider'
        )
    }

    return context
}
