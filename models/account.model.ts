import mongoose from "mongoose";

const accountShema = new mongoose.Schema({
    fullname: String,
    email: String,
    password: String,
    token: {
      type: String,
      required: true,
    },
    phone: String,
    avatar: String,
    role_id: String,
    status: String,
    deleted: {
        type: Boolean,
        default: false,
    },
    deleteAt: Date,
}, {
    timestamps: true
});
const Account = mongoose.model('Account', accountShema, 'accounts');

export default Account;