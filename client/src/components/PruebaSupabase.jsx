import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function PruebaSupabase() {
  const [mensaje, setMensaje] = useState('Conectando...')

  useEffect(() => {
    async function probar() {
      const { data, error } = await supabase
        .from('vehiculos')
        .select('*')

      if (error) {
        setMensaje(`Error: ${error.message}`)
        return
      }

      setMensaje(`Conexión correcta: ${data.length} vehículos`)
      console.log('Vehículos de Supabase:', data)
    }

    probar()
  }, [])

  return <p>{mensaje}</p>
}