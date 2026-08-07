import mongoose from "mongoose";

const roleSchema = new mongoose.Schema({
    title: String,
    description: {
        type: String,
        default: ""
    },
    permissions: Array,
    createdBy: {
        user_id: String,
        createdAt: {
            type: Date,
            default: Date.now,
        }
    },
    deleted: {
        type: Boolean,
        default: false,
    },
    deleteAt: Date,
}, {
    timestamps: true
});
const Role = mongoose.model('Role', roleSchema, 'role')

export default Role;