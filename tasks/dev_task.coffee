module.exports = (grunt) ->
  grunt.registerTask 'dev', [
    'connect:dev'
    'clean:dev'
    'coffee:all'
    'sass:all'
    'watch'
  ]
