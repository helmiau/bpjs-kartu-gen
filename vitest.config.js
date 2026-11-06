// Vitest: hanya berkas uji, lingkungan Node (tidak ada DOM).
export default {
  test: {
    include: ['test/**/*.test.js'],
    environment: 'node'
  }
};
