// bili.config.ts
import { Config } from 'bili'

const config: Config = {
  banner: true,
  input: [
    'src/index.ts',
    'src/plugins/logger.ts'
  ],
  plugins: {
    typescript2: {
      clean: true,
      // check: false,
      useTsconfigDeclarationDir: true
    }
  }
}

export default config
