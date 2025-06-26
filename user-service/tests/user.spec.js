process.env.JWT_SECRET = 'testsecret';

const request = require('supertest');
const app = require('../src/app');
const mongoose = require('mongoose');
const User = require('../src/models/userModel');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

afterEach(async () => {
    await User.deleteMany(); // Clean DB between tests
});

describe('User Service', () => {
    it('should register a new user', async () => {
        const response = await request(app)
            .post('/api/users/register')
            .send({
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123',
            });

        expect(response.statusCode).toBe(201);
        expect(response.body.message).toBe('User created successfully');
    });

    it('should login an existing user', async () => {
        await request(app)
            .post('/api/users/register')
            .send({
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123',
            });

        const response = await request(app)
            .post('/api/users/login')
            .send({
                email: 'test@example.com',
                password: 'password123',
            });

        expect(response.statusCode).toBe(200);
        expect(response.body.token).toBeDefined();
    });

    it('should save user in the database', async () => {
        const newUser = {
            username: 'dbuser',
            email: 'dbuser@example.com',
            password: 'mypassword',
        };

        await request(app)
            .post('/api/users/register')
            .send(newUser);

        const userInDB = await User.findOne({ email: newUser.email });
        expect(userInDB).not.toBeNull();
        expect(userInDB.username).toBe(newUser.username);
    });
});
