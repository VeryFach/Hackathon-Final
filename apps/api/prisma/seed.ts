import 'dotenv/config';
import { 
  PrismaClient, 
  UserRole, 
  SubmissionStatus, 
  BatchStatus, 
  OilGrade, 
  PayoutStatus 
} from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as argon2 from 'argon2';

// ------------------------------------------------------------------ //
// Setup Prisma Client with pg Pool Adapter (Fix for Initialization Error)
// ------------------------------------------------------------------ //
const pool = new Pool({
  connectionString:
    process.env['NODE_ENV'] === 'production'
      ? process.env['DATABASE_URL_NEON']
      : process.env['DATABASE_URL'],
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// --- HELPER FUNCTIONS ---
const getRandomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const getRandomFloat = (min: number, max: number) => parseFloat((Math.random() * (max - min) + min).toFixed(2));
const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

// Data dummy untuk nama-nama
const firstNames = ['Budi', 'Siti', 'Andi', 'Joko', 'Ayu', 'Rudi', 'Rina', 'Agus', 'Dewi', 'Hendra', 'Maya', 'Eko', 'Dian', 'Faisal', 'Nina', 'Gilang', 'Putri', 'Reza', 'Tari', 'Wahyu'];
const lastNames = ['Setiawan', 'Aminah', 'Pratama', 'Saputra', 'Wulandari', 'Kurniawan', 'Sari', 'Wijaya', 'Lestari', 'Nugroho', 'Hidayat', 'Siregar', 'Ramadhan', 'Kusuma', 'Santoso'];
const streets = ['Jl. Veteran', 'Jl. Soekarno Hatta', 'Jl. Ijen', 'Jl. MT Haryono', 'Jl. Kawi', 'Jl. Galunggung', 'Jl. Dieng', 'Jl. Sulfat', 'Jl. Sigura-gura', 'Jl. Bendungan Sutami'];

async function main() {
  console.log('🌱 Starting dynamic seed for EcoOil...');

  // ------------------------------------------------------------------ //
  //  Clean up (order matters – children first)
  // ------------------------------------------------------------------ //
  console.log('🧹 Clearing existing data...');
  await prisma.payout.deleteMany();
  await prisma.batchItem.deleteMany();
  await prisma.batchPricing.deleteMany();
  await prisma.labResult.deleteMany();
  await prisma.batch.deleteMany();
  await prisma.oilSubmission.deleteMany();
  await prisma.volumeRule.deleteMany();
  await prisma.gradeRule.deleteMany();
  await prisma.pricing.deleteMany();
  await prisma.depositorProfile.deleteMany();
  await prisma.collectorProfile.deleteMany();
  await prisma.user.deleteMany();

  // ------------------------------------------------------------------ //
  //  Users
  // ------------------------------------------------------------------ //
  const passwordHash = await argon2.hash('password123', 10);

  console.log('👔 Creating Stakeholder...');
  const stakeholder = await prisma.user.create({
    data: {
      fullName: 'Sistem Pusat EcoOil',
      email: 'admin@ecooil.com',
      passwordHash,
      role: UserRole.stakeholder,
    },
  });

  // ------------------------------------------------------------------ //
  //  Pricing & Rules
  // ------------------------------------------------------------------ //
  console.log('💰 Creating Pricing configurations...');
  const pricing = await prisma.pricing.create({
    data: {
      createdBy: stakeholder.id,
      active: true,
      gradeRules: {
        create: [
          { grade: OilGrade.A, basePrice: 5000, qualityFactor: 1.2 },
          { grade: OilGrade.B, basePrice: 5000, qualityFactor: 1.0 },
          { grade: OilGrade.C, basePrice: 5000, qualityFactor: 0.8 },
        ]
      },
      volumeRules: {
        create: [
          { minVolume: 0, maxVolume: 10, bonusFactor: 1.0 },
          { minVolume: 10.1, maxVolume: 50, bonusFactor: 1.05 },
          { minVolume: 50.1, maxVolume: null, bonusFactor: 1.1 },
        ]
      }
    }
  });

  // ------------------------------------------------------------------ //
  //  Collectors (Pengepul)
  // ------------------------------------------------------------------ //
  console.log('🚛 Creating 10 Collectors...');
  const collectors: any[] = [];
  for (let i = 1; i <= 10; i++) {
    const firstName = getRandomItem(firstNames);
    const lastName = getRandomItem(lastNames);
    const collector = await prisma.user.create({
      data: {
        fullName: `${firstName} ${lastName} (Pengepul)`,
        email: `pengepul${i}@gmail.com`,
        passwordHash,
        role: UserRole.pengepul,
        collectorProfile: {
          create: {
            latitude: getRandomFloat(-7.90, -8.05), // Area Malang
            longitude: getRandomFloat(112.58, 112.68),
            warehouseAddress: `Gudang ${i}, ${getRandomItem(streets)} No. ${getRandomInt(1, 100)}, Malang`,
            serviceRadiusKm: getRandomFloat(5, 20),
            capacityLiter: getRandomInt(200, 1000),
          }
        }
      },
      include: { collectorProfile: true }
    });
    collectors.push(collector);
  }

  // ------------------------------------------------------------------ //
  //  Depositors (Masyarakat)
  // ------------------------------------------------------------------ //
  console.log('🏡 Creating 50 Depositors (Masyarakat)...');
  const depositors: any[] = [];
  for (let i = 1; i <= 50; i++) {
    const firstName = getRandomItem(firstNames);
    const lastName = getRandomItem(lastNames);
    const depositor = await prisma.user.create({
      data: {
        fullName: `${firstName} ${lastName}`,
        email: `user${i}@gmail.com`,
        passwordHash,
        role: UserRole.masyarakat,
        depositorProfile: {
          create: {
            latitude: getRandomFloat(-7.90, -8.05),
            longitude: getRandomFloat(112.58, 112.68),
            address: `${getRandomItem(streets)} No. ${getRandomInt(1, 200)}, Malang`,
          }
        }
      },
      include: { depositorProfile: true }
    });
    depositors.push(depositor);
  }

  // ------------------------------------------------------------------ //
  //  Submissions (Setoran)
  // ------------------------------------------------------------------ //
  console.log('🛢️ Generating Submissions (Setoran)...');
  const submissionsByCollector: Record<string, any[]> = {};
  collectors.forEach(c => submissionsByCollector[c.collectorProfile.id] = []);

  let totalSubmissions = 0;
  for (const depositor of depositors) {
    const numSubmissions = getRandomInt(1, 4);
    
    for (let s = 0; s < numSubmissions; s++) {
      const isCompleted = Math.random() > 0.3; // 70% completed
      const estimated = getRandomFloat(2.0, 15.0);
      
      if (isCompleted) {
        const assignedCollector = getRandomItem(collectors);
        const actual = parseFloat((estimated * getRandomFloat(0.9, 1.0)).toFixed(2));
        
        const submission = await prisma.oilSubmission.create({
          data: {
            estimatedLiter: estimated,
            actualLiter: actual,
            status: SubmissionStatus.completed,
            depositorId: depositor.depositorProfile.id,
            collectorId: assignedCollector.collectorProfile.id,
          }
        });
        submissionsByCollector[assignedCollector.collectorProfile.id].push(submission);
      } else {
        await prisma.oilSubmission.create({
          data: {
            estimatedLiter: estimated,
            status: SubmissionStatus.pending,
            depositorId: depositor.depositorProfile.id,
          }
        });
      }
      totalSubmissions++;
    }
  }

  // ------------------------------------------------------------------ //
  //  Batches, Lab Results, Batch Pricing, and Payouts
  // ------------------------------------------------------------------ //
  console.log('📦 Processing Batches, Lab Tests, and Payouts...');
  
  let totalBatches = 0;
  for (const collector of collectors) {
    const subs = submissionsByCollector[collector.collectorProfile.id];
    
    if (subs.length >= 2) {
      // Chunk up to 10 items per batch
      const batchItemsSubset = subs.slice(0, 10); 
      
      const totalRaw = parseFloat(batchItemsSubset.reduce((sum, sub) => sum + sub.actualLiter, 0).toFixed(2));
      const totalClean = parseFloat((totalRaw * getRandomFloat(0.85, 0.98)).toFixed(2));
      const residue = parseFloat((totalRaw - totalClean).toFixed(2));

      // Batch
      const batch = await prisma.batch.create({
        data: {
          collectorId: collector.collectorProfile.id,
          validatedBy: stakeholder.id,
          totalRawOilLiter: totalRaw,
          totalCleanOilLiter: totalClean,
          residueLiter: residue,
          sedimentRatio: residue / totalRaw,
          yieldRatio: totalClean / totalRaw,
          totalLiter: totalRaw,
          status: BatchStatus.approved,
          batchItems: {
            create: batchItemsSubset.map(sub => ({ submissionId: sub.id }))
          }
        }
      });
      totalBatches++;

      // Lab Result
      const grades = [OilGrade.A, OilGrade.B, OilGrade.C];
      const randomGrade = getRandomItem(grades);
      
      await prisma.labResult.create({
        data: {
          batchId: batch.id,
          acidityLevel: getRandomFloat(0.5, 3.0),
          impurityLevel: getRandomFloat(1.0, 5.0),
          waterContent: getRandomFloat(0.1, 1.5),
          notes: `Hasil uji acak, masuk ke kategori Grade ${randomGrade}`,
          grade: randomGrade,
        }
      });

      // Batch Pricing
      let priceMultiplier = randomGrade === OilGrade.A ? 1.2 : randomGrade === OilGrade.B ? 1.0 : 0.8;
      let volumeBonus = totalClean > 50 ? 1.1 : totalClean > 10 ? 1.05 : 1.0;
      
      const finalPricePerLiter = Math.floor(5000 * priceMultiplier * volumeBonus);

      await prisma.batchPricing.create({
        data: {
          batchId: batch.id,
          pricingId: pricing.id,
          finalPricePerLiter: finalPricePerLiter,
          totalValue: finalPricePerLiter * totalClean,
        }
      });

      // Payouts
      for (const item of batchItemsSubset) {
        const isPaid = Math.random() > 0.5; // 50% paid
        await prisma.payout.create({
          data: {
            submissionId: item.id,
            amount: item.actualLiter * finalPricePerLiter,
            status: isPaid ? PayoutStatus.paid : PayoutStatus.pending,
            paidAt: isPaid ? new Date() : null,
          }
        });
      }
    }
  }

  // ------------------------------------------------------------------ //
  //  Summary
  // ------------------------------------------------------------------ //
  console.log('\n✨ Seed completed successfully!');
  console.log('─'.repeat(40));
  console.log(`   Collectors   : ${collectors.length}`);
  console.log(`   Depositors   : ${depositors.length}`);
  console.log(`   Submissions  : ${totalSubmissions}`);
  console.log(`   Batches      : ${totalBatches}`);
  console.log('─'.repeat(40));
  console.log('   Default password for all users: password123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end(); // Sangat penting agar terminal process bisa tertutup (exit)
  });