module.exports = () ->
  all:
    files: [{
      expand: true
      cwd: '<%= srcDir %>/coffee'
      src: '**/*.coffee'
      dest: '<%= destDir %>/js/'
      ext: '.js'
    }, {
      expand: true
      cwd: '<%= demo %>/src/coffee'
      src: '**/*.coffee'
      dest: '<%= demo %>/dist/js/'
      ext: '.js'
    }]
    options:
      bare: true
