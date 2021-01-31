module.exports = function(grunt) {
  
  'use strict';
  var bowerRoot = "bower_components";
  var setupRoot = "client/lib";
  var buildFolder = "server/Manafeed/wwwroot";
  var sourceFolder = "client";

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

      bower: {
        install: { 
          options : {
            copy : false
          }
        }
      },

      copy: {
          setup: {
              files: [
                  { src: [ bowerRoot + '/requirejs/require.js'], dest : setupRoot + '/require.js', filter: 'isFile' },
                  { src: [ bowerRoot + '/klon/klon.js'], dest : setupRoot + '/klon.js', filter: 'isFile' },
                  { src: [ bowerRoot + '/backbone/backbone.js'], dest : setupRoot + '/backbone.js', filter: 'isFile' },
                  { src: [ bowerRoot + '/jquery/dist/jquery.js'], dest : setupRoot + '/jquery.js', filter: 'isFile' },
                  { src: [ bowerRoot + '/underscore/underscore.js'], dest : setupRoot + '/underscore.js', filter: 'isFile' },
                  { src: [ bowerRoot + '/ejs/ejs_production.js'], dest : setupRoot + '/ejs_production.js', filter: 'isFile' },
                  { src: [ bowerRoot + '/vcJS/vcProgressTicker.js'], dest : setupRoot + '/vcJS/vcProgressTicker.js', filter: 'isFile' }
              ]
          },
          build: {
              files: [
                  { expand: true, cwd : sourceFolder, src: ['**'], dest: buildFolder + '/' }
              ]
          }          
      },

      uglify: {
        my_target: {
          files: [
            { cwd: buildFolder + '/js', src: '**/*.js', dest:  buildFolder + '/js', expand: true },
            { cwd: buildFolder + '/lib', src: '**/*.js', dest:  buildFolder + '/lib', expand: true }
          ]
        }
      },

      cssmin: {
        minify: {
          expand: true,
          cwd: sourceFolder + '/css',
          src: ['*.css', '!*.min.css'],
          dest: buildFolder + '/css/',
          ext: '.css'
        }
      },

  });

  grunt.loadNpmTasks('grunt-bower-task');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-cssmin');

  grunt.registerTask('setup', ['bower', 'copy:setup']);
  grunt.registerTask('build', ['copy:build', 'uglify', 'cssmin']);
};