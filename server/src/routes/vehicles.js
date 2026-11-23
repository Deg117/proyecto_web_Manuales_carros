import { Router } from 'express'
import { getVehicleRepository } from '../repositories/vehicleRepository.js'

const router = Router()
router.get('/', async (req, res, next) => {
  const textFilters = [
    { key: 'marca', label: 'La marca', maxLength: 60 },
    { key: 'modelo', label: 'El modelo', maxLength: 60 },
    { key: 'q', label: 'La búsqueda', maxLength: 100 },
  ]
  const invalidFilter = textFilters.find(({ key, maxLength }) => {
    const value = req.query[key]
    return value !== undefined && (typeof value !== 'string' || value.length > maxLength)
  })

  if (invalidFilter) {
    return res.status(400).json({
      error: `${invalidFilter.label} debe ser texto de hasta ${invalidFilter.maxLength} caracteres.`,
    })
  }

  try {
    const repository = await getVehicleRepository()
    const data = await repository.list({ make: req.query.marca, model: req.query.modelo, year: req.query.anio, q: req.query.q })
    res.json({ data, total: data.length })
  } catch (error) { next(error) }
})
router.get('/:id', async (req, res, next) => {
  try {
    const repository = await getVehicleRepository()
    const data = await repository.findById(req.params.id)
    if (!data) return res.status(404).json({ error: 'Vehículo no encontrado.' })
    res.json({ data })
  } catch (error) { next(error) }
})
export default router
