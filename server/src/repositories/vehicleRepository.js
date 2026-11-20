import { seedVehicles } from '../data/vehicles.js'

const clone = (value) => structuredClone(value)

function memoryRepository() {
  return {
    async list(filters = {}) {
      const q = (filters.q || '').toLowerCase()
      return seedVehicles.filter((v) =>
        (!filters.make || v.make.toLowerCase() === filters.make.toLowerCase()) &&
        (!filters.model || v.model.toLowerCase() === filters.model.toLowerCase()) &&
        (!filters.year || String(v.year) === String(filters.year)) &&
        (!q || [v.make, v.model, v.year, v.trim, v.engineCode].join(' ').toLowerCase().includes(q))
      ).map(clone)
    },
    async findById(id) {
      const vehicle = seedVehicles.find((v) => v.id === id)
      return vehicle ? clone(vehicle) : null
    },
  }
}

async function postgresRepository(connectionString) {
  const { Pool } = await import('pg')
  const pool = new Pool({ connectionString })
  const from = ' FROM vehicles v JOIN models m ON m.id=v.model_id JOIN brands b ON b.id=m.brand_id '
  const base = 'SELECT v.id,b.name AS make,m.name AS model,v.year,v.trim,v.body_style AS "bodyStyle",v.engine_code AS "engineCode",v.displacement_l AS "displacementL"'
  const aggregate = "COALESCE((SELECT json_agg(t.name ORDER BY t.name) FROM transmissions t WHERE t.vehicle_id=v.id),'[]') AS transmissions"
  return {
    async list(f = {}) {
      const sql = base + ',' + aggregate + from + "WHERE ($1='' OR b.name ILIKE $1) AND ($2='' OR m.name ILIKE $2) AND ($3='' OR v.year::text=$3) AND ($4='' OR concat_ws(' ',b.name,m.name,v.year,v.trim,v.engine_code) ILIKE $4) ORDER BY b.name,m.name,v.year DESC"
      const result = await pool.query(sql, [f.make || '', f.model || '', f.year ? String(f.year) : '', f.q ? '%' + f.q + '%' : ''])
      return result.rows.map((v) => ({ ...v, specifications: [] }))
    },
    async findById(id) {
      const sql = base + ",COALESCE(v.specifications,'[]'::jsonb) AS specifications," + aggregate + ",COALESCE((SELECT json_agg(json_build_object('title',x.title,'description',x.description,'interval',x.interval) ORDER BY x.sort_order) FROM maintenance_items x WHERE x.vehicle_id=v.id),'[]') AS maintenance,COALESCE((SELECT json_agg(json_build_object('title',d.title,'type',d.document_type,'url',d.url) ORDER BY d.title) FROM documents d WHERE d.vehicle_id=v.id),'[]') AS documents" + from + 'WHERE v.id=$1'
      const result = await pool.query(sql, [id])
      return result.rows[0] || null
    },
  }
}

let repository
export function getVehicleRepository() {
  if (!repository) repository = process.env.DATABASE_URL ? postgresRepository(process.env.DATABASE_URL) : Promise.resolve(memoryRepository())
  return repository
}
