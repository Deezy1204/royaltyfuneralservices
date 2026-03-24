const { spawnSync } = require('child_process');
spawnSync('npm.cmd', ['install', '@radix-ui/react-label'], { stdio: 'inherit' });
