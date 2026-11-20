import trimesh, numpy as np, sys
from scipy.cluster.vq import kmeans2
K = int(sys.argv[1]) if len(sys.argv)>1 else 12
src = sys.argv[2]; out = sys.argv[3]
s = trimesh.load(src)
name, g = list(s.geometry.items())[0]
V, F = np.asarray(g.vertices), np.asarray(g.faces)
N = np.asarray(g.vertex_normals)
uv = np.asarray(g.visual.uv) if hasattr(g.visual,'uv') and g.visual.uv is not None else None
mat = g.visual.material
cent = V[F].mean(axis=1)
# k-means sobre centroides de caras (reparto espacial)
rng = np.random.default_rng(1)
n_sample = min(len(cent), 60000)
sample = cent[rng.choice(len(cent), n_sample, replace=False)]
init = sample[rng.choice(len(sample), K, replace=False)]
c,_ = kmeans2(sample, init, iter=30, minit='matrix')
d = ((cent[:,None,:]-c[None,:,:])**2).sum(-1) if len(cent)*K < 8e6 else None
if d is None:
    lab = np.empty(len(cent),dtype=np.int32)
    for i in range(0,len(cent),100000):
        lab[i:i+100000] = ((cent[i:i+100000,None,:]-c[None])**2).sum(-1).argmin(1)
else:
    lab = d.argmin(1)
scene = trimesh.Scene()
order = np.argsort(c[:,1])  # de abajo hacia arriba
for rank, k in enumerate(order):
    m = lab==k
    if not m.any(): continue
    f = F[m]
    uniq, inv = np.unique(f.ravel(), return_inverse=True)
    mesh = trimesh.Trimesh(vertices=V[uniq], faces=inv.reshape(-1,3), vertex_normals=N[uniq], process=False)
    if uv is not None:
        mesh.visual = trimesh.visual.TextureVisuals(uv=uv[uniq], material=mat)
    scene.add_geometry(mesh, node_name=f"pieza_{rank+1:02d}", geom_name=f"pieza_{rank+1:02d}")
    print(f"pieza_{rank+1:02d}", int(m.sum()), "caras", np.round(mesh.bounds,2).tolist())
scene.export(out)
print("OK", out)
