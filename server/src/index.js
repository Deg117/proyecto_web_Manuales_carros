import express from 'express'
import cors from 'cors'
import vehicleRoutes from './routes/vehicles.js'

const app = express()
const port = Number(process.env.PORT || 4000)
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }))
app.use(express.json())
app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'AutoLibrary API' }))
app.use('/api/vehicles', vehicleRoutes)
app.use((error, _req, res, next) => {
  if (res.headersSent) return next(error)
  console.error(error)
  res.status(500).json({ error: 'Ocurrió un error al consultar el catálogo.' })
})
app.listen(port, () => console.log('AutoLibrary API disponible en http://localhost:' + port))
