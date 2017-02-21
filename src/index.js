require('babel-register')({
    'presets': [
        ['es2015-node6', { 'modules': false }]
    ],
    'plugins': [
        ['transform-es2015-modules-commonjs', {
            'spec': true
        }]
    ]
});

require('./app');
