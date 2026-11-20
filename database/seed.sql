INSERT INTO brands (id, name) VALUES ('honda', 'Honda') ON CONFLICT (id) DO NOTHING;
INSERT INTO models (id, brand_id, name) VALUES ('honda-civic', 'honda', 'Civic') ON CONFLICT (id) DO NOTHING;
INSERT INTO vehicles (id, model_id, year, trim, body_style, engine_code, displacement_l)
VALUES ('honda-civic-2003-ex', 'honda-civic', 2003, 'EX', 'Sedán', 'D17A2', 1.7)
ON CONFLICT (id) DO NOTHING;
INSERT INTO transmissions (vehicle_id, name) VALUES
  ('honda-civic-2003-ex', 'Automática'),
  ('honda-civic-2003-ex', 'Manual')
ON CONFLICT (vehicle_id, name) DO NOTHING;
