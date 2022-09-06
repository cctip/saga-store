// Generated using webpack-cli https://github.com/webpack/webpack-cli

const path = require('path');
const TypescriptDeclarationPlugin = require('typescript-declaration-webpack-plugin');

const isProduction = process.env.NODE_ENV == 'production';


const config = {
    entry: './src/index.ts',
    output: {
        filename: 'index.js',
        path: path.resolve(__dirname, 'lib'),
        clean: true,
        library: {
            type: 'module',
        },
    },
    externalsType: 'module',
    experiments: {
        outputModule: true,
    },
    externals: [
        function ({ context, request }, callback) {
            if (/^react/.test(request)) {
              return callback(null, request, 'module');
            }
            callback();
        },
        // redux-saga & redux-saga/effects & @redux-saga/core and so on...
        function ({ context, request }, callback) {
            if (/^@?redux-saga/.test(request)) {
              return callback(null, request, 'module');
            }
            callback();
        },
        // jotai & jotai/util & jotai/immer and so on...
        function ({ context, request }, callback) {
            if (/^jotai/.test(request)) {
              return callback(null, request, 'module');
            }
            callback();
        },
        function ({ context, request }, callback) {
            if (request === 'immer') {
                // 该外部化模块是一个在`@scope/library`模块里的命名导出（named export）。
                return callback(null, 'immer', 'module');
            }
            callback();
        },
    ],
    plugins: [
        new TypescriptDeclarationPlugin({}),
        // new DeclarationBundlerPlugin({
        //     moduleName: 'saga-store'
        // }),
        // Add your plugins here
        // Learn more about plugins from https://webpack.js.org/configuration/plugins/
    ],
    module: {
        rules: [
            {
                test: /\.(ts|tsx)$/i,
                loader: 'ts-loader',
                exclude: ['/node_modules/'],
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.jsx', '.js'],
    },
};

module.exports = () => {
    if (isProduction) {
        config.mode = 'production';
    } else {
        config.mode = 'development';
    }
    return config;
};
