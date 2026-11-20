
import { supabase } from './supabaseClient'

// Adaptar las columnas SQL al formato de AutoLibrary
function adaptarVehiculo(v) {
  return {
    id: v.id,
    make: v.marca,
    model: v.modelo,
    year: v.anio,
    trim: v.version || '',
    engineCode: v.motor_codigo || '',
    displacementL: parseFloat(v.cilindrada) || null,
    fuel: v.combustible || '',
    description: v.descripcion || '',
    imageUrl: v.imagen_url || '',

    // Valores temporales para el Civic EX 2003.
    // Posteriormente vendran de tablas relacionadas.
    transmissions:
      v.marca?.toLowerCase() === 'honda' &&
      v.modelo?.toLowerCase() === 'civic' &&
      v.anio === 2003
        ? ['Automática', 'Manual']
        : ['No especificada'],
  }
}

export async function obtenerVehiculos() {
  const { data, error } = await supabase
    .from('vehiculos')
    .select('*')
    .order('id', { ascending: true })

  if (error) throw error

  return (data || []).map(adaptarVehiculo)
}


export async function obtenerVehiculo(id) {
  const { data, error } = await supabase
    .from('vehiculos')
    .select(`
      *,
      motores (*),
      transmisiones (*),
      documentos (*)
    `)
    .eq('id', id)
    .single()

  if (error) throw error

  const vehiculo = adaptarVehiculo(data)

  return {
    ...vehiculo,
    motor: data.motores?.[0] ?? null,
    motores: data.motores ?? [],
    transmisiones: data.transmisiones ?? [],
    documentos: data.documentos ?? [],
    transmissions: data.transmisiones?.length
      ? data.transmisiones.map(t => t.tipo)
      : vehiculo.transmissions
  }
}

