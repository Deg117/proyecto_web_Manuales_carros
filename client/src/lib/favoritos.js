import { supabase } from './supabaseClient'

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
    const { error } = await supabase
        .from('favoritos')
        .insert({
            usuario_id: usuarioId,
            vehiculo_id: vehiculoId
        })

    if (error) throw error
}

export async function quitarFavorito(usuarioId, vehiculoId) {
    const { error } = await supabase
        .from('favoritos')
        .delete()
        .eq('usuario_id', usuarioId)
        .eq('vehiculo_id', vehiculoId)

    if (error) throw error
}
