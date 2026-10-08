import { Schema } from 'mongoose';

const SalonReservationSchema = new Schema({
  customerId: { type: Schema.Types.ObjectId, required: true, ref: 'Member', index: true },
  reservationReference: { type: String, required: true, unique: true },
  reservationStatus: { type: String, enum: ['REQUESTED', 'CONFIRMED', 'CANCELLED'], default: 'REQUESTED', index: true },
  suiteId: { type: String, required: true },
  suiteName: { type: String, required: true },
  bookingDate: { type: Date, required: true },
  bookingTime: { type: Date, required: true },
  guestName: { type: String, required: true },
  guestContact: { type: String, required: true },
  itemManifest: { type: String, default: '' },
  selectedAmenities: { type: [String], default: [] },
  valetRequested: { type: Boolean, default: false },
}, { timestamps: true, collection: 'salonReservations' });

SalonReservationSchema.index({ suiteId: 1, bookingTime: 1, reservationStatus: 1 });
export default SalonReservationSchema;
