const mongoose = require('mongoose');
const app = require('./app');

const PORT = process.env.PORT || 8000;
const MONGO_URI = "mongodb://localhost:27017/test123";

mongoose
    .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log('Connected to MongoDB');
        app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    })
    .catch((err) => console.error('MongoDB connection error:', err));