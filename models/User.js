import mongoose from 'mongoose';
import passportLocalMongoose from 'passport-local-mongoose';

const UserSchema = new mongoose.Schema({
    username: String,
    password: String,
    posts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }]
});

UserSchema.plugin(passportLocalMongoose);

export const User = mongoose.model('User', UserSchema);
