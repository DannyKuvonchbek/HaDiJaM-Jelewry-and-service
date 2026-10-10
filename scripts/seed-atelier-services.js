require('dotenv').config();
const mongoose = require('mongoose');

const ateliers = [
	{ slug: 'kang-and-sons', weekdays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], slots: ['14:00', '16:30'], services: [
		{ category: 'ATELIER_KANG_CUSTOM', title: 'Custom Design & 3D Haute Atelier', price: 250, duration: '7–14 days', description: 'Turn a personal sketch or heirloom into a bespoke creation with 3D CAD and a crafted wax preview.', image: '/images/stitch/services/hadijam-services-live-calculator-photo-uploaded-state-digital-3d-cad-rendered-jewelry-blueprint-alongside-an-actual-carved-jew-089.jpg' },
		{ category: 'ATELIER_KANG_RESIZING', title: 'Ring Resizing & Tension Calibration', price: 40, duration: '24–48 hours', description: 'Refine a precious ring with careful sizing, laser work, and a final hand polish.', image: '/images/stitch/services/hadijam-services-live-calculator-photo-uploaded-state-ring-resizing-mandrel-and-gold-calibration-gauges-on-a-dark-oak-jeweler--092.jpg' },
	] },
	{ slug: 'aurum-gemological-lab', weekdays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], slots: ['10:00', '14:00', '17:00'], services: [
		{ category: 'ATELIER_AURUM_GEMOLOGY', title: 'Gemological Appraisal & Valuation', price: 80, duration: '24 hours', description: 'Gemstone identification, origin analysis, and a documented valuation prepared by a certified gemologist.', image: '/images/stitch/services/hadijam-services-live-calculator-photo-uploaded-state-licensed-gia-certified-gemologist-utilizing-an-electronic-refractometer--091.jpg' },
		{ category: 'ATELIER_AURUM_ASSAY', title: 'Precious Metal Assay & Laser Hallmark', price: 80, duration: 'Same day', description: 'Spectrometric precious-metal analysis with a documented assay and laser hallmark service.', image: '/images/stitch/services/hadijam-services-live-calculator-photo-uploaded-state-close-up-precision-shot-of-laser-welding-repair-on-an-antique-intricate--088.jpg' },
	] },
	{ slug: 'milano-heritage-restoration', weekdays: ['Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], slots: ['11:00', '14:00', '17:00'], services: [
		{ category: 'ATELIER_MILANO_RESTORATION', title: 'Jewelry Repair & Archival Restoration', price: 90, duration: '48–72 hours', description: 'Documented conservation and precision restoration for antique and high-value jewelry.', image: '/images/stitch/home/hadijam-bosh-sahifa-desktop-homepage-jewelry-repair-and-restoration-026.jpg' },
		{ category: 'ATELIER_MILANO_POLISHING', title: 'Ultrasonic Deep Cleaning & Rhodium Polish', price: 35, duration: 'Same day', description: 'A careful ultrasonic clean and finish refresh for suitable precious-metal pieces.', image: '/images/stitch/services/hadijam-services-live-calculator-photo-uploaded-state-ultrasonic-gemstone-cleansing-tank-with-microscopic-mist-and-brilliant-p-090.jpg' },
	] },
];

async function main() {
	const uri = process.env.MONGODB_URI || process.env.MONGO_URL;
	if (!uri) throw new Error('MONGODB_URI or MONGO_URL must be set.');
	await mongoose.connect(uri);
	const db = mongoose.connection.db;
	const seller = await db.collection('members').findOne({ memberType: 'SELLER', memberNick: { $regex: /^DANNY$/i }, memberStatus: 'ACTIVE' });
	if (!seller) throw new Error('Active DANNY seller profile was not found.');
	const services = db.collection('services');
	const schedules = db.collection('serviceSchedules');
	let count = 0;
	for (const atelier of ateliers) for (const service of atelier.services) {
		const filter = { memberId: seller._id, serviceCategory: service.category };
		const serviceDoc = {
			serviceType: 'ATELIER', serviceStatus: 'ACTIVE', serviceTitle: service.title, serviceCategory: service.category,
			servicePrice: service.price, serviceDuration: service.duration, serviceImages: [service.image], serviceDesc: service.description,
			memberId: seller._id, deletedAt: null,
		};
		await services.updateOne(filter, { $set: serviceDoc, $setOnInsert: { serviceViews: 0, serviceLikes: 0, serviceComments: 0, serviceRank: 0, createdAt: new Date() }, $currentDate: { updatedAt: true } }, { upsert: true });
		const saved = await services.findOne(filter, { projection: { _id: 1 } });
		for (const dayOfWeek of atelier.weekdays) {
			const firstSlot = atelier.slots[0];
			const lastSlot = atelier.slots[atelier.slots.length - 1];
			const [hour, minute] = lastSlot.split(':').map(Number);
			const endMinute = hour * 60 + minute + 30;
			const endTime = `${String(Math.floor(endMinute / 60)).padStart(2, '0')}:${String(endMinute % 60).padStart(2, '0')}`;
			await schedules.updateOne(
				{ serviceId: saved._id, dayOfWeek },
				{ $set: { serviceId: saved._id, providerId: seller._id, dayOfWeek, isWorking: true, startTime: firstSlot, endTime } },
				{ upsert: true },
			);
		}
		count++;
	}
	console.log(`Atelier seed complete: ${count} services for DANNY.`);
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; }).finally(async () => { await mongoose.disconnect(); });
