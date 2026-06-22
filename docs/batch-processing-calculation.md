# Batch Processing Calculation Method

## Metode Perhitungan Batch Processing

Pada tahap *batch processing*, dilakukan perhitungan untuk mengetahui jumlah minyak bersih yang dapat dipulihkan, rasio hasil produksi (*yield*), serta rasio endapan (*sediment*). Metode ini menggunakan prinsip **mass balance (neraca massa)** yang merupakan dasar dalam teknik kimia.

Prinsip dasar neraca massa:

$$ \text{Input} = \text{Output} + \text{Residue} + \text{Losses} $$

Dalam sistem ini:

- **Input**    = minyak mentah yang dikumpulkan (*raw oil*)
- **Output**   = minyak bersih yang dihasilkan (*clean oil*)
- **Residue**  = kotoran/endapan hasil penyaringan
- **Losses**   = kehilangan selama proses (transfer, filtrasi, evaporasi)

---

## 1. Perhitungan Minyak Bersih

Minyak bersih dihitung dengan mengurangi minyak mentah terhadap endapan dan kehilangan proses.

Rumus:

$$ C = R - S - L $$

Keterangan:

- \( C \) = *Clean Oil* (minyak bersih)
- \( R \) = *Raw Oil* (minyak mentah)
- \( S \) = *Residue* (endapan)
- \( L \) = *Process Loss* (kehilangan proses)

Implementasi sederhana dalam kode:

```ts
const clean = rawOil - residue - processLoss;
```

---

## 2. Perhitungan Yield Ratio

*Yield ratio* menunjukkan tingkat efisiensi minyak yang berhasil dipulihkan.

Rumus:

$$ Y = \frac{C}{R} $$

Atau dalam persen:

$$ Y = \frac{C}{R} \times 100\% $$

Implementasi:

```ts
const yieldRatio = clean / rawOil;
```

> Semakin besar nilai *yield*, maka semakin baik kualitas proses.

---

## 3. Perhitungan Sediment Ratio

*Sediment ratio* menunjukkan proporsi endapan terhadap total minyak mentah.

Rumus:

$$ S_r = \frac{S}{R} $$

Atau dalam persen:

$$ S_r = \frac{S}{R} \times 100\% $$

Implementasi:

```ts
const sedimentRatio = residue / rawOil;
```

> Semakin kecil nilai *sediment ratio*, maka kualitas minyak semakin baik.

---

## Contoh Perhitungan

Diketahui data sebagai berikut:

| Parameter      | Nilai  |
|----------------|--------|
| Raw oil (\(R\)) | 100 L  |
| Residue (\(S\)) | 15 L   |
| Process loss (\(L\)) | 5 L   |

Maka perhitungannya adalah:

**Minyak bersih:**

$$ C = 100 - 15 - 5 = 80 \text{ liter} $$

**Yield ratio:**

$$ Y = \frac{80}{100} = 0.8 = 80\% $$

**Sediment ratio:**

$$ S_r = \frac{15}{100} = 0.15 = 15\% $$

Hasil menunjukkan bahwa dari 100 liter minyak mentah, diperoleh 80 liter minyak bersih dengan tingkat efisiensi 80%.

---

## Referensi

1. Felder, R.M., Rousseau, R.W. (2005). *Elementary Principles of Chemical Processes*. Wiley.
2. McCabe, W.L., Smith, J.C., Harriott, P. (2001). *Unit Operations of Chemical Engineering*. McGraw-Hill.
3. ASTM International. ASTM D2709 – Standard Test Method for Water and Sediment in Middle Distillate Fuels.
4. European Committee for Standardization. EN 14214 Biodiesel Standard.