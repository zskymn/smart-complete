module.exports = (grunt) ->
  config =
    pkg: grunt.file.readJSON 'package.json'
    baseDir: '.'
    srcDir: 'src'
    demo: 'examples'
    destDir: 'dist'
    tempDir: 'tmp'

  # 加载插件
  require('load-grunt-tasks') grunt

  # 加载任务定义
  grunt.loadTasks 'tasks'

  # 加载插件的配置函数
  loadConfig = (config,path) ->
    require('glob').sync('*', {cwd: path}).forEach (option) ->
      key = option.replace /\.coffee$/, ''
      config[key] = config[key] ? {}
      grunt.util._.extend config[key], require(path + option)(config,grunt)
      return
    return config

  loadConfig config, './tasks/options/'

  grunt.initConfig config
  return
