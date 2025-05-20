import request from 'supertest';
import app from './index';

describe('Server Endpoints', () => {
  // Test the root endpoint
  describe('GET /', () => {
    it('should return a hello message', async () => {
      const response = await request(app).get('/');
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ msg: 'Hello' });
    });
  });

  // Test the ping endpoint
  describe('GET /ping', () => {
    it('should return ping message', async () => {
      const response = await request(app).get('/ping');
      expect(response.status).toBe(200);
      expect(response.text).toBe('Ping!');
    });
  });
}); 