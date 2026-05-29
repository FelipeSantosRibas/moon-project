from PIL import Image
import numpy as np
import json
import matplotlib.pyplot as plt

# abre o TIFF
img = Image.open("../data/ldem_16_uint.tif")

# transforma em matriz
heightmap = np.array(img)

print("Tamanho do mapa:")
print(heightmap.shape)

# pega uma região pequena
#crop = heightmap[1000:1200, 2000:2200]
#crop = heightmap[1200:2200, 2200:3200]
#crop = heightmap[1000:2500, 1000:2500]
#crop = heightmap[::8, ::8]
crop = heightmap

# converte altura
#(crop - 20000)
crop = (crop / 30).astype(int)

# mostra imagem
plt.imshow(crop, cmap="gray")
plt.show()

# salva JSON
with open("../data/terrain.json", "w") as f:
    json.dump(crop.tolist(), f)

print("terrain.json criado!")