import mongoose from 'mongoose';

const PlaceSchema = new mongoose.Schema({
    name: String,
    address: String,
    rating: Number,
    reviews: Number,
    hourse: [String],
    position: {
        lat: Number,
        lng: Number,
    },
    memo: String,
    createdAt: { type: Date, default: Date.now}
});

export default mongoose.model("Place", PlaceSchema);