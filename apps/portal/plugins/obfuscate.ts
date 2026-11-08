/**
 * Build-time obfuscation of cold-path chunks with javascript-obfuscator (control-flow flattening
 * and string-array encoding). Runs in generateBundle, so it sees the final minified code.
 * Vendor libraries, the render hot path (`scene-*` chunks), workers and the sim kernels are
 * excluded: flattening them would cost frames and add nothing.
 *
 * Client code cannot be made impossible to reverse engineer. This raises the cost of casual
 * copying, nothing more, and it deliberately avoids debugger traps and anything that would
 * hurt performance or accessibility.
 */
import JavaScriptObfuscator from 'javascript-obfuscator';
import type { Plugin } from 'vite';
import { INTEGRITY_TOKEN } from './injectChecksums';

const SKIP = /(^|\/)(vendor-|scene)/;

export function obfuscate(): Plugin {
  return {
    name: 'portal:obfuscate',
    apply: 'build',
    enforce: 'post',
    generateBundle(_options, bundle) {
      if (process.env.NO_OBFUSCATE === '1') return;
      for (const item of Object.values(bundle)) {
        if (item.type !== 'chunk' || SKIP.test(item.fileName) || item.fileName.includes('worker')) continue;
        // The entry chunk runs on the critical path to first paint, so it gets string encoding only.
        const entry = /(^|\/)index-/.test(item.fileName);
        const result = JavaScriptObfuscator.obfuscate(item.code, {
          target: 'browser',
          sourceType: 'module',
          sourceMap: false,
          compact: true,
          controlFlowFlattening: !entry,
          controlFlowFlatteningThreshold: 0.4,
          stringArray: true,
          stringArrayEncoding: ['base64'],
          stringArrayThreshold: entry ? 0.5 : 0.75,
          stringArrayRotate: true,
          stringArrayShuffle: true,
          stringArrayWrappersCount: 1,
          reservedStrings: [INTEGRITY_TOKEN],
          renameGlobals: false,
          identifierNamesGenerator: 'hexadecimal',
          splitStrings: false,
          transformObjectKeys: false,
          selfDefending: false,
          debugProtection: false,
          disableConsoleOutput: false,
          numbersToExpressions: false,
          simplify: true,
        });
        item.code = result.getObfuscatedCode();
      }
    },
  };
}
