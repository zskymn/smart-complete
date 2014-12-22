module.exports = () ->
  coffee:
    files: ['<%= srcDir%>/coffee/**/*.coffee', '<%= demo %>/src/coffee/**/*.coffee']
    tasks: ['newer:coffee:all']
  sass:
    files: ['<%= srcDir%>/scss/**/*.scss', '<%= demo %>/src/scss/**/*.scss']
    tasks: ['newer:sass:all']
    
