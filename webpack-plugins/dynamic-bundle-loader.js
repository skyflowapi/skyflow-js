class DynamicBundleLoaderPlugin {
  constructor(options = {}) {
    this.bundleMap = options.bundleMap || {
      'element': 'collect.js',
      'reveal': 'reveal.js',
      'reveal-composable': 'composable-reveal.js',
      'skyflow_controller': 'controller.js'
    };
  }

  apply(compiler) {
    compiler.hooks.compilation.tap('DynamicBundleLoaderPlugin', (compilation) => {
      // Hook into HtmlWebpackPlugin to modify HTML before emit
      const HtmlWebpackPlugin = compiler.options.plugins
        .map(plugin => plugin.constructor)
        .find(constructor => constructor && constructor.name === 'HtmlWebpackPlugin');

      if (HtmlWebpackPlugin) {
        HtmlWebpackPlugin.getHooks(compilation).beforeEmit.tapAsync(
          'DynamicBundleLoaderPlugin',
          (data, cb) => {
            // Only inject into iframe.html
            if (data.outputName === 'iframe.html') {
              const loaderScript = this.generateLoaderScript();
              // Inject script before closing </body> tag
              data.html = data.html.replace('</body>', `${loaderScript}</body>`);
            }
            cb(null, data);
          }
        );
      }
    });
  }

  generateLoaderScript() {
    const bundleMapJson = JSON.stringify(this.bundleMap);
    
    return `<script>
(function() {
  try {
    var frameName = window.name || '';
    if (!frameName) return;

    var frameType = frameName.split(':')[0];
    var bundleMap = ${bundleMapJson};
    var bundleFile = bundleMap[frameType];
    
    if (!bundleFile) {
      console.error('Unknown frame type:', frameType);
      return;
    }

    // Build absolute URL relative to iframe.html directory
    var basePath = window.location.pathname.replace(/[^/]*$/, '');
    var absoluteSrc = window.location.origin + basePath + bundleFile;

    var script = document.createElement('script');
    script.src = absoluteSrc;
    script.onerror = function() {
      console.error('Failed to load bundle:', absoluteSrc);
    };
    document.head.appendChild(script);
  } catch (err) {
    console.error('Error loading bundle:', err);
  }
})();
</script>`;
  }
}

module.exports = DynamicBundleLoaderPlugin;
