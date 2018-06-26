require('babel-register')
const gulp = require('gulp')
const eslint = require('gulp-eslint')
const nodemon = require('gulp-nodemon')
const rename = require('gulp-rename')
const friendlyFormatter = require('eslint-friendly-formatter')
const nunjucksRender = require('gulp-nunjucks-render');

var jsScript = 'node'
if (process.env.npm_config_argv !== undefined && process.env.npm_config_argv.indexOf('debug') > 0) {
  jsScript = 'node debug'
}
const CodeGenerateConfig = require('./codeGenerate/config').default;

function lintOne(aims) {
  console.log('ESlint:' + aims)
  console.time('Finished eslint')
  return gulp.src(aims)
    .pipe(eslint({ configFile: './.eslintrc.js' }))
    .pipe(eslint.format(friendlyFormatter))
    .pipe(eslint.results(results => {
      // Called once for all ESLint results.
      console.log(`- Total Results: ${results.length}`)
      console.log(`- Total Warnings: ${results.warningCount}`)
      console.log(`- Total Errors: ${results.errorCount}`)
      console.timeEnd('Finished eslint')
    }))
}

gulp.task('ESlint', () => {
  return gulp.src(['src/**/*.js', '!node_modules/**'])
    .pipe(eslint({ configFile: './.eslintrc.js' }))
    .pipe(eslint.format(friendlyFormatter))
    // .pipe(eslint.failAfterError())
    .pipe(eslint.results(results => {
      // Called once for all ESLint results.
      console.log(`- Total Results: ${results.length}`)
      console.log(`- Total Warnings: ${results.warningCount}`)
      console.log(`- Total Errors: ${results.errorCount}`)
    }))
})

gulp.task('ESlint_nodemon', ['ESlint'], function () {
  var stream = nodemon({
    script: 'build/dev-server.js',
    execMap: {
      js: jsScript
    },
    tasks: function (changedFiles) {
      lintOne(changedFiles)
      return []
    },
    verbose: true,
    ignore: ['build/*.js', 'dist/*.js', 'nodemon.json', '.git', 'node_modules/**/node_modules', 'gulpfile.js'],
    env: {
      NODE_ENV: 'development'
    },
    ext: 'js json'
  })

  return stream
    .on('restart', function () {
      // console.log('Application has restarted!')
    })
    .on('crash', function () {
      console.error('Application has crashed!\n')
      // stream.emit('restart', 20)  // restart the server in 20 seconds
    })
})

gulp.task('nodemon', function () {
  return nodemon({
    script: 'build/dev-server.js',
    execMap: {
      js: jsScript
    },
    verbose: true,
    ignore: ['build/*.js', 'dist/*.js', 'nodemon.json', '.git', 'node_modules/**/node_modules', 'gulpfile.js', 'src/db', 'codeGenerate'],
    env: {
      NODE_ENV: 'development'
    },
    ext: 'js json'
  })
})

gulp.task('default', ['ESlint', 'ESlint_nodemon'], function () {
  // console.log('ESlin检查完成')
})

const nunjucksRenderConfig = {
  path: 'codeGenerate/templates',
  data: {
    model: CodeGenerateConfig.model,
    config: CodeGenerateConfig.config
  },
  envOptions: {
    tags: {
      blockStart: '<%',
      blockEnd: '%>',
      variableStart: '<$',
      variableEnd: '$>',
      commentStart: '<#',
      commentEnd: '#>'
    },
  },
  ext: '.js'
}

const ProjectRootPath = CodeGenerateConfig.config.ProjectRootPath;

gulp.task('code', function () {

  gulp.src('codeGenerate/templates/page.njk')
    .pipe(nunjucksRender(nunjucksRenderConfig))
    .pipe(rename('index.jsx'))
    .pipe(gulp.dest(ProjectRootPath + CodeGenerateConfig.config.PageRelativePath));

  return gulp.src('codeGenerate/templates/editModal.njk')
    .pipe(nunjucksRender(nunjucksRenderConfig))
    .pipe(rename('edit'+CodeGenerateConfig.model.Name+'Modal.jsx'))
    .pipe(gulp.dest(ProjectRootPath + CodeGenerateConfig.config.PageRelativePath));
});
