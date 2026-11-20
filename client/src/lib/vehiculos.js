import { supabase } from './supabaseClient'

// Adaptar las columnas SQL al formato de AutoLibrary
function adaptarVehiculo(v) {
  const marca = v.marca || ''
  const modelo = v.modelo || ''
  const anio = Number(v.anio)

  const esCivic2003 =
    marca.toLowerCase() === 'honda' &&
    modelo.toLowerCase().includes('civic') &&
    anio === 2003

  const esPassat2010 =
    marca.toLowerCase() === 'volkswagen' &&
    modelo.toLowerCase().includes('passat') &&
    anio === 2010

  return {
    id: v.id,
    make: marca,
    model: modelo,
    year: anio,
    trim: v.version || '',
    engineCode: v.motor_codigo || '',
    displacementL: parseFloat(v.cilindrada) || null,
    fuel: v.combustible || '',
    description: v.descripcion || '',
    imageUrl: v.imagen_url || '',

    bodyStyle:
      esPassat2010
        ? 'Sedán'
        : esCivic2003
          ? 'Sedán'
          : '',

    // Valor provisional hasta obtener las relaciones completas.
    transmissions:
      esCivic2003
        ? ['Automática', 'Manual']
        : esPassat2010
          ? ['Automática']
          : ['No especificada'],
  }
}

export async function obtenerVehiculos() {
  const { data, error } = await supabase
    .from('vehiculos')
    .select(`
      *,
      transmisiones (
        id,
        tipo,
        velocidades,
        traccion,
        descripcion
      )
    `)
    .order('id', { ascending: true })

  if (error) throw error

  return (data || []).map(v => {
    const vehiculo = adaptarVehiculo(v)

    return {
      ...vehiculo,

      transmissions:
        v.transmisiones?.length > 0
          ? v.transmisiones.map(t => t.tipo)
          : vehiculo.transmissions,

      transmisiones: v.transmisiones || [],
    }
  })
}

export async function obtenerVehiculo(id) {
  const { data, error } = await supabase
    .from('vehiculos')
    .select(`
      *,
      motores (
        *
      ),
      transmisiones (
        *
      ),
      documentos (
        *
      )
    `)
    .eq('id', id)
    .single()

  if (error) throw error

  const vehiculo = adaptarVehiculo(data)

  const transmisiones = data.transmisiones || []
  const motores = data.motores || []
  const documentos = data.documentos || []

  return {
    ...vehiculo,

    motor: motores[0] ?? null,
    motores,
    transmisiones,
    documentos,

    transmissions:
      transmisiones.length > 0
        ? transmisiones.map(t => t.tipo)
        : vehiculo.transmissions,
  }
}