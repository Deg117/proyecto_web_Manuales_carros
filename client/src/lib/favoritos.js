import { supabase } from './supabaseClient'

const MAX_BIGINT = '9223372036854775807'

export function esIdVehiculoBigintValido(id) {
    let value

    if (typeof id === 'number') {
        if (!Number.isSafeInteger(id) || id <= 0) return false
        value = String(id)
    } else if (typeof id === 'string' && /^[1-9]\d*$/.test(id)) {
        value = id
    } else {
        return false
    }

    return value.length < MAX_BIGINT.length ||
        (value.length === MAX_BIGINT.length && value <= MAX_BIGINT)
}

function validarVehiculoId(vehiculoId) {
    if (!esIdVehiculoBigintValido(vehiculoId)) {
        throw new Error('El vehículo no tiene un ID numérico válido de Supabase.')
    }
}

export async function obtenerFavoritos(usuarioId) {
    const { data, error } = await supabase
        .from('favoritos')
        .select('vehiculo_id')
        .eq('usuario_id', usuarioId)

    if (error) throw error

    // Los bigint se comparan como texto para evitar diferencias de tipos.
    return (data ?? []).map(row => String(row.vehiculo_id))
}

export async function agregarFavorito(usuarioId, vehiculoId) {
    validarVehiculoId(vehiculoId)

    const { error } = await supabase
        .from('favoritos')
        .insert({
            usuario_id: usuarioId,
            vehiculo_id: vehiculoId
        })

    if (error) throw error
}

export async function quitarFavorito(usuarioId, vehiculoId) {
    validarVehiculoId(vehiculoId)

    const { error } = await supabase
        .from('favoritos')
        .delete()
        .eq('usuario_id', usuarioId)
        .eq('vehiculo_id', vehiculoId)

    if (error) throw error
}
