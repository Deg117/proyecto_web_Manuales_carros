const DEFAULT_R2_BASE_URL = 'https://pub-588d4cf78a8b4cd38f882ff7e4ebb548.r2.dev'
const R2_BASE_URL = (
    import.meta.env.VITE_R2_BASE_URL?.trim() || DEFAULT_R2_BASE_URL
).replace(/\/+$/, '')

export const MODELOS_3D = {
    fordFiesta2014: `${R2_BASE_URL}/Fiesta_2014/base_basic_pbr.glb`,
    hondaCivic2003: `${R2_BASE_URL}/civic_2003/base_basic_pbr.glb`,
    volkswagenPassat2010: `${R2_BASE_URL}/passat_2010/base_basic_shaded.glb`,
    chevroletCamaro1972: `${R2_BASE_URL}/camaro_1972/base_basic_pbr.glb`,
    hyundaiI102025: `${R2_BASE_URL}/i10_2025/base_basic_pbr.glb`,
    // Both R2 variants are single-mesh, so MotorViewer stays on the local selection model.
    hondaD17A2: '/models/civic-2003/engine/complete/motor_pbr.glb',
    hondaD17A2Remote: `${R2_BASE_URL}/motor_civic/base_basic_pbr.glb`,
    hondaD17A2RemoteShaded: `${R2_BASE_URL}/motor_civic/base_basic_shaded.glb`,
}

export const RESPALDOS_LOCALES = {
    hondaCivic2003: '/models/civic-2003/car/civic_pbr.glb',
    volkswagenPassat2010: '/models/passat_2010/car/base_basic_shaded.glb',
    chevroletCamaro1972: '/models/camaro_1972/car/base_basic_pbr.glb',
    hyundaiI102025: '/models/hyundai_i10/car/base_basic_pbr.glb',
}
