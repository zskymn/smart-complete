module.exports = () ->
  all:
    files: [{
      expand: true
      cwd: '<%= srcDir %>/scss'
      src: '**/*.scss'
      dest: '<%= destDir %>/'
      ext: '.css'
    }, {
      expand: true
      cwd: '<%= demo %>/src/scss'
      src: '**/*.scss'
      dest: '<%= demo %>/dist/'
      ext: '.css'
    }]
    options:
      style: 'expanded'
      sourcemap: 'none'
      unixNewlines: true
      trace: true
