import { Router } from 'express'
import { getVehicleRepository } from '../repositories/vehicleRepository.js'

const router = Router()
router.get('/', async (req, res, next) => {
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
