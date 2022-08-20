const { defineConfig } = require('cypress')

module.exports = defineConfig({
  projectId: '3wa1j2',
  e2e: {
    baseUrl: 'http://localhost:5555',
    // for such a simple project,
    // we don't need utility files
    supportFile: false
  }
})
