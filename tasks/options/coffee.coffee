module.exports = () ->
  all:
    files: [{
      expand: true
      cwd: '<%= srcDir %>/coffee'
      src: '**/*.coffee'
      dest: '<%= destDir %>/'
      ext: '.js'
    }, {
      expand: true
      cwd: '<%= demo %>/src/coffee'
      src: '**/*.coffee'
      dest: '<%= demo %>/dist/'
      ext: '.js'
    }]
    options:
      bare: true
