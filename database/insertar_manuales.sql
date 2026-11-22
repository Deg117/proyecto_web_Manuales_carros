-- Inserta únicamente los manuales confirmados en R2 y evita duplicarlos por ruta.
-- No se ejecutó en Supabase; revisar y ejecutar manualmente cuando corresponda.
INSERT INTO public.documentos (
  vehiculo_id,
  titulo,
  categoria,
  descripcion,
  archivo_url,
  fuente
)
SELECT
  manuales.vehiculo_id,
  manuales.titulo,
  manuales.categoria,
  manuales.descripcion,
  manuales.archivo_url,
  manuales.fuente
FROM (
  VALUES
    (
      1,
      'Torque de culata — Honda Civic 2003 D17A2',
      'Especificaciones técnicas',
      'Documento PDF de referencia para el torque de culata del Honda Civic 2003 con motor D17A2.',
      'honda/Torque_Culata.pdf',
      'Honda'
    ),
    (
      1,
      'Manual de taller — Honda Civic 2003 D17A2',
      'Manual de taller',
      'Manual PDF de taller para consulta y mantenimiento del Honda Civic 2003 con motor D17A2.',
      'honda/honda_manual_de_taller.pdf',
      'Honda'
    ),
    (
      5,
      'Manual del propietario — Ford Fiesta 2014',
      'Manual del propietario',
      'Manual PDF del propietario para el Ford Fiesta 2014.',
      'fiesta/manual_de_propietario.pdf',
      'Ford'
    )
) AS manuales(vehiculo_id, titulo, categoria, descripcion, archivo_url, fuente)
JOIN public.vehiculos AS vehiculos
  ON vehiculos.id = manuales.vehiculo_id
 AND (
   (
     manuales.vehiculo_id = 1
     AND vehiculos.marca = 'Honda'
     AND vehiculos.modelo = 'Civic'
     AND vehiculos.anio = 2003
     AND vehiculos.motor_codigo = 'D17A2'
   )
   OR (
     manuales.vehiculo_id = 5
     AND vehiculos.marca = 'Ford'
     AND vehiculos.modelo = 'Fiesta'
     AND vehiculos.anio = 2014
   )
 )
WHERE NOT EXISTS (
  SELECT 1
  FROM public.documentos AS existente
  WHERE existente.vehiculo_id = manuales.vehiculo_id
    AND right(
      split_part(existente.archivo_url, '?', 1),
      char_length(manuales.archivo_url)
    ) = manuales.archivo_url
);
