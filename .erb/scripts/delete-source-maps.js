import fs from 'fs'
import path from 'path'
import { rimrafSync } from 'rimraf'
import webpackPaths from '../configs/webpack.paths'

export default function deleteSourceMaps() {
  if (fs.existsSync(webpackPaths.distMainPath)) {
    // Delete JavaScript source maps
    rimrafSync(path.join(webpackPaths.distMainPath, '*.js.map'), {
      glob: true,
    })
    // Delete CSS source maps
    rimrafSync(path.join(webpackPaths.distMainPath, '*.css.map'), {
      glob: true,
    })
  }
  if (fs.existsSync(webpackPaths.distRendererPath)) {
    // Delete JavaScript source maps
    rimrafSync(path.join(webpackPaths.distRendererPath, '*.js.map'), {
      glob: true,
    })
    // Delete CSS source maps
    rimrafSync(path.join(webpackPaths.distRendererPath, '*.css.map'), {
      glob: true,
    })
    // Delete nested source maps in assets directory
    rimrafSync(path.join(webpackPaths.distRendererPath, '**/*.js.map'), {
      glob: true,
    })
    rimrafSync(path.join(webpackPaths.distRendererPath, '**/*.css.map'), {
      glob: true,
    })
  }
}
