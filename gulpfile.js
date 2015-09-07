// Variables / Environment Setup
// ----------------------------------------------------------------------------

// gulp requires
var gulp       = require('gulp'),
	pngcrush   = require('imagemin-pngcrush'),
	secrets    = require('./secrets.json'),
	plugins    = require('gulp-load-plugins')({
		pattern: ['gulp-*', 'gulp.*'],
		replaceString: /\bgulp[\-.]/
	});

// source / destination paths
var paths = {

	haml: {
		src  : 'dev/haml/',
		dest : 'build/'
	},
	styles: {
		src  : 'dev/styles/',
		dest : 'build/assets/css/'
	},
	maps: {
		src  : 'build/assets/maps/src/'
	},
	images: {
		src  : 'dev/media/images/*.{png,jpg,gif}',
		dest : 'build/assets/img/'
	},
	svg: {
		src  : 'dev/media/svg/*.svg'
	},
	misc: {
		root : 'dev/extra/root/',
		dest : 'build/'
	},
	fonts: {
		src  : 'dev/extra/fonts/*',
		dest : 'build/assets/fonts/'
	}

};


// Compile and Output Styles
// ----------------------------------------------------------------------------
gulp.task('styles', function() {

	return plugins.rubySass(paths.styles.src + 'styles.scss', {
			sourcemap: true,
			style: 'compact'
		})
		.pipe(plugins.sourcemaps.init())
			.pipe(plugins.autoprefixer({
				browsers: ['last 3 version', 'ios 6', 'android 4']
			}))
			.pipe(plugins.minifyCss())
			.pipe(plugins.rename({
				suffix: '.min'
			}))
		.pipe(plugins.sourcemaps.write('../maps'))
		.pipe(gulp.dest(paths.styles.dest))
		.pipe(plugins.livereload());

});


// Compress (if changed) all of our images
// ----------------------------------------------------------------------------
gulp.task('images', function() {

	return gulp.src(paths.images.src)
		.pipe(plugins.changed(paths.images.dest))
		.pipe(plugins.imagemin({
			optimizationLevel: 7,
			progressive: true,
			use: [pngcrush()]
		}))
		.pipe(gulp.dest(paths.images.dest));

});


// Compress and build SVG sprite (make ready for injection)
// ----------------------------------------------------------------------------
gulp.task('svg', function() {

	return gulp.src(paths.svg.src)
		.pipe(plugins.imagemin({
			svgoPlugins: [{
				removeViewBox: false,
				removeUselessStrokeAndFill: false
			}]
		}))
		.pipe(plugins.svgstore({
			inlineSvg: true
		}))
		.pipe(gulp.dest(paths.images.dest));

});


// Compile only main HAML files (ignore partials - included via the main files), then inject SVG sprite
// ----------------------------------------------------------------------------
gulp.task('haml', function() {

	// should use an if statement to skip the injection if no SVGs are found or file does not require injection...

	var svgSource = gulp.src(paths.images.dest + 'svg.svg');

	function fileContents(filePath, file) {
		return file.contents.toString();
	}

	return gulp.src(paths.haml.src + '*.haml')
		.pipe(plugins.rubyHaml())
		.pipe(plugins.inject(svgSource, {
			transform: fileContents
		}))
		.pipe(gulp.dest(paths.haml.dest))
		.pipe(plugins.livereload());

});


// Copy (if changed) all of our miscellaneous files to the build folder
// ----------------------------------------------------------------------------
gulp.task('misc', function() {

	return gulp.src(paths.misc.root + '*') // [paths.extra.root + '*.*', paths.extra.root + '.htaccess']
		.pipe(plugins.changed(paths.misc.dest))
		.pipe(gulp.dest(paths.misc.dest));

});


// Watch over specified files and run corresponding tasks...
// ----------------------------------------------------------------------------
gulp.task('watch', function() {

	plugins.livereload.listen(); // start livereload server

	// watch dev files, rebuild when changed
	gulp.watch(paths.haml.src + '**/*.haml', ['haml']);  // watch all HAML files, including partials (recursively)
	gulp.watch(paths.styles.src + '*.scss', ['styles']); // watch all SCSS files, including partials

});


// Default gulp task
// ----------------------------------------------------------------------------
gulp.task('default', ['svg', 'styles', 'misc', 'haml']); // haml comes last so SVGs can compile | remove 'images' task as it takes LONG