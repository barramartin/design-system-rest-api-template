import 'dotenv/config'
import * as fs from 'fs'
import * as path from 'path'

import FigmaApi from './figma_api.js'

import { green } from './utils.js'
import { tokenFilesFromLocalVariables } from './token_export.js'

//TODO Replace it with the correct tokens
const personalAccessToken = '';
const fileKey = '';

async function main() {
  const figmaApi = new FigmaApi(personalAccessToken)

  console.log('Fetching Figma local variables...\n')
  try {
    const localVariables = await figmaApi.getLocalVariables(fileKey)
    
    const tokensFiles = tokenFilesFromLocalVariables(localVariables)

    let outputDir = 'tokens'
    const outputArgIdx = process.argv.indexOf('--output')
    if (outputArgIdx !== -1) {
      outputDir = process.argv[outputArgIdx + 1] ?? outputDir
    }

    // Create directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    for (const fileName in tokensFiles) {
      // Kezeljük a / vagy \ karaktert tartalmazó fájlneveket (almappákat)
      const filePath = path.join(outputDir, `${fileName}.json`)
      
      // Ellenőrizzük, hogy a szülő könyvtár létezik-e, ha nem, hozzuk létre
      const dirName = path.dirname(filePath)
      if (!fs.existsSync(dirName)) {
        fs.mkdirSync(dirName, { recursive: true })
      }
      
      const fileContent = JSON.stringify(tokensFiles[fileName], null, 2)
      
      fs.writeFileSync(filePath, fileContent)
      console.log(green(`✓ Written ${filePath}`))
    }
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

main()
