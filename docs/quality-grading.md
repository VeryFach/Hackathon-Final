# Metode Perhitungan Quality Grading

Pada proses **quality control**, sistem melakukan penilaian kualitas minyak berdasarkan tiga parameter utama:

- **Free Fatty Acid (FFA)**
- **Water Content**
- **Impurity Level**

Ketiga parameter tersebut dipilih karena secara ilmiah menjadi indikator utama kualitas minyak, terutama pada proses **waste cooking oil (WCO)** dan biodiesel *preprocessing*.

---

## Normalisasi Parameter

Karena setiap parameter memiliki skala berbeda, dilakukan normalisasi dengan rumus:

```math
FFA_n = \frac{FFA}{6}
```

```math
W_n = \frac{Water}{1}
```

```math
I_n = \frac{Impurity}{0.8}
```

---

## Weighted Scoring

Sistem menggunakan pembobotan:

```math
w_1 = 0.5
```

```math
w_2 = 0.3
```

```math
w_3 = 0.2
```

Dengan formula:

```math
Q = (FFA_n \times 0.5) + (W_n \times 0.3) + (I_n \times 0.2)
```

Dimana:

- **FFA** memiliki bobot terbesar karena paling memengaruhi degradasi minyak.
- **Water** dan **impurity** menjadi faktor pendukung kualitas.

---

## Klasifikasi Grade

Grade ditentukan berdasarkan nilai skor:

| Rentang Nilai Q          | Grade |
|--------------------------|-------|
| \( Q \le 0.30 \)         | A     |
| \( 0.30 < Q \le 0.60 \)  | B     |
| \( 0.60 < Q \le 1.00 \)  | C     |

Jika:

```math
Q > 1.00
```

maka minyak dianggap **tidak layak**.

---

## Referensi

1. American Oil Chemists’ Society (AOCS), Official Method Ca 5a-40.  
2. EN 14214 Biodiesel Standard.  
3. Knothe, G. (2005). *Fuel Processing Technology*.  
4. Atadashi et al. (2012). *Renewable and Sustainable Energy Reviews*.

Metode ini dipilih karena lebih fleksibel dan lebih representatif dibanding metode *hard-threshold*.